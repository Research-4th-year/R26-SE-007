import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-ignore — snarkjs has no official TS types
import * as snarkjs from 'snarkjs';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import { JwtPayload } from '../types';
import { SubmitProofInput, GenerateProofInput } from '../utils/zkp.validators';
import * as fabricService from './fabric.service';

// Load verification key once at startup
let verificationKey: object | null = null;

function getVerificationKey(): object {
  if (!verificationKey) {
    const vkeyPath = path.resolve(config.zkp.vkeyPath);
    verificationKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
  }
  return verificationKey!;
}

// ── Derive a numeric commitment from a warehouse UUID ──────────
// Converts the UUID to a number that fits in the circuit's 32-bit field.
// This binds the proof to a specific warehouse without revealing the UUID.
function warehouseToCommitment(warehouseId: string): string {
  const hash  = crypto.createHash('sha256').update(warehouseId).digest('hex');
  const bigNum = BigInt('0x' + hash.slice(0, 15)); // first 60 bits — fits in 32-bit field
  return bigNum.toString();
}

export class ZKPService {

  // ── Generate a proof (server-side, for testing) ───────────────
  // In production this runs in the browser via snarkjs WASM.
  // This endpoint lets you test the full flow without a frontend.
  async generateProof(dto: GenerateProofInput): Promise<{
    proof:         object;
    publicSignals: string[];
    commitment:    string;
  }> {
    const wasmPath = path.resolve(config.zkp.wasmPath);
    const zkeyPath = path.resolve(config.zkp.zkeyPath);

    if (!fs.existsSync(wasmPath)) throw AppError.internal('ZKP WASM file not found');
    if (!fs.existsSync(zkeyPath)) throw AppError.internal('ZKP zkey file not found');

    const commitment = warehouseToCommitment(dto.warehouseId);

    // The private input — only the warehouse knows this
    const input = {
      availableCapacity: dto.availableCapacity,
      threshold:         dto.threshold,
      warehouseCommitment: parseInt(commitment) % (2 ** 32),
    };

    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath,
      );

      return { proof, publicSignals, commitment };
    } catch (err: any) {
      // Most common error: availableCapacity < threshold fails the constraint
      if (err?.message?.includes('Error in template')) {
        throw AppError.badRequest(
          `Proof generation failed: availableCapacity (${dto.availableCapacity}) ` +
          `is less than threshold (${dto.threshold}). The circuit constraint was not satisfied.`
        );
      }
      throw AppError.internal(`Proof generation failed: ${err?.message}`);
    }
  }

  // ── Verify a submitted proof ──────────────────────────────────
  async submitAndVerifyProof(dto: SubmitProofInput, caller: JwtPayload): Promise<{
    proofId:            string;
    verificationResult: boolean;
    warehouseId:        string;
    disasterEventId:    string;
    blockchainTxId:     string | null;
  }> {
    // 1. Verify the disaster exists and is active
    const disaster = await prisma.disasterEvent.findUnique({
      where: { id: dto.disasterEventId },
    });
    if (!disaster) throw AppError.notFound('Disaster event not found');
    if (disaster.status === 'RESOLVED') {
      throw AppError.badRequest('Cannot submit a ZKP proof for a resolved disaster');
    }

    // 2. Verify the warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) throw AppError.notFound('Warehouse not found');

    // 3. Check for duplicate proof submission
    const existingProof = await prisma.zKPProof.findFirst({
      where: {
        warehouseId:     dto.warehouseId,
        disasterEventId: dto.disasterEventId,
      },
    });
    if (existingProof) {
      throw AppError.conflict(
        `Warehouse has already submitted a proof for this disaster. ` +
        `Result: ${existingProof.verificationResult ? 'VALID' : 'INVALID'}`
      );
    }

    // 4. Verify the proof cryptographically using the verification key
    const vKey = getVerificationKey();
    let verificationResult = false;

    try {
      verificationResult = await snarkjs.groth16.verify(
        vKey,
        dto.publicSignals,
        dto.proof,
      );
    } catch (err: any) {
      // Invalid proof format — treat as failed verification
      verificationResult = false;
    }

    // 5. Store result in MySQL
    const proofJson    = JSON.stringify(dto.proof);
    const signalsJson  = JSON.stringify(dto.publicSignals);

    const zkpRecord = await prisma.zKPProof.create({
      data: {
        warehouseId:        dto.warehouseId,
        disasterEventId:    dto.disasterEventId,
        proofJson:          dto.proof as object,
        publicSignals:      dto.publicSignals as unknown as object,
        verificationResult,
        verifiedAt:         new Date(),
      },
    });

    // 6. Anchor the verification result on Fabric ledger
    let blockchainTxId: string | null = null;
    try {
      await fabricService.recordZKPVerification({
        id:                 zkpRecord.id,
        warehouseId:        dto.warehouseId,
        disasterEventId:    dto.disasterEventId,
        proofJSON:          proofJson,
        publicSignalsJSON:  signalsJson,
        verificationResult,
      });
      blockchainTxId = `fabric:${zkpRecord.id}`;
      await prisma.zKPProof.update({
        where: { id: zkpRecord.id },
        data:  { blockchainTxId },
      });
      console.log(`[Fabric] ZKP proof anchored: ${zkpRecord.id} — result: ${verificationResult}`);
    } catch (fabricErr) {
      console.error('[Fabric] Failed to anchor ZKP proof:', fabricErr);
    }

    return {
      proofId:            zkpRecord.id,
      verificationResult,
      warehouseId:        dto.warehouseId,
      disasterEventId:    dto.disasterEventId,
      blockchainTxId,
    };
  }

  // ── Get all ZKP proofs for a disaster ────────────────────────
  async getProofsForDisaster(disasterEventId: string) {
    const disaster = await prisma.disasterEvent.findUnique({
      where: { id: disasterEventId },
    });
    if (!disaster) throw AppError.notFound('Disaster event not found');

    const proofs = await prisma.zKPProof.findMany({
      where:   { disasterEventId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id:                 true,
        warehouseId:        true,
        verificationResult: true,
        publicSignals:      true,
        blockchainTxId:     true,
        submittedAt:        true,
        verifiedAt:         true,
      },
    });

    // Attach warehouse names
    const warehouseIds = [...new Set(proofs.map(p => p.warehouseId))];
    const warehouses   = await prisma.warehouse.findMany({
      where:  { id: { in: warehouseIds } },
      select: { id: true, name: true, code: true, district: true },
    });
    const warehouseMap = Object.fromEntries(warehouses.map(w => [w.id, w]));

    return proofs.map(p => ({
      ...p,
      warehouse: warehouseMap[p.warehouseId] ?? null,
    }));
  }

  // ── Get circuit parameters (for frontend proof generation) ───
  getCircuitParams() {
    return {
      wasmUrl:  '/zkp/capacity_range.wasm',
      zkeyUrl:  '/zkp/capacity_range_final.zkey',
      protocol: 'groth16',
      curve:    'bn128',
      nPublic:  3,
      publicInputs: [
        { index: 0, name: 'threshold',            description: 'Minimum required capacity in tons' },
        { index: 1, name: 'warehouseCommitment',  description: 'Numeric commitment derived from warehouseId' },
        { index: 2, name: 'valid',                description: '1 if proof is valid, 0 if not' },
      ],
      instructions: 'Generate proof using snarkjs.groth16.fullProve() with availableCapacity as private input',
    };
  }
}

export const zkpService = new ZKPService();