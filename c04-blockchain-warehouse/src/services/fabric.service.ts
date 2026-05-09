import * as grpc from '@grpc/grpc-js';
import {
  connect,
  Contract,
  Gateway,
  Identity,
  Signer,
  signers,
} from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/env';
import * as fabricService from './fabric.service';

// ── Singleton gateway ──────────────────────────────────────────
let gateway:    Gateway     | null = null;
let grpcClient: grpc.Client | null = null;

async function getContract(): Promise<Contract> {
  if (!gateway) {
    const tlsCert = fs.readFileSync(path.resolve(config.fabric.tlsCertPath));

    grpcClient = new grpc.Client(
      config.fabric.peerEndpoint,
      grpc.credentials.createSsl(tlsCert),
      { 'grpc.ssl_target_name_override': config.fabric.peerHostAlias }
    );

    const certPem    = fs.readFileSync(path.resolve(config.fabric.certPath));
    const keyPem     = fs.readFileSync(path.resolve(config.fabric.keyPath));
    const privateKey = crypto.createPrivateKey(keyPem);

    const identity: Identity = { mspId: config.fabric.mspId, credentials: certPem };
    const signer:   Signer   = signers.newPrivateKeySigner(privateKey);

    gateway = connect({ client: grpcClient, identity, signer });
  }

  const network = gateway.getNetwork(config.fabric.channelName);
  return network.getContract(config.fabric.chaincodeName);
}

export async function disconnectFabric(): Promise<void> {
  if (gateway)    { gateway.close();    gateway    = null; }
  if (grpcClient) { grpcClient.close(); grpcClient = null; }
}

// ── Internal helpers ───────────────────────────────────────────
async function submit(fn: string, ...args: string[]): Promise<string> {
  const contract = await getContract();
  const result   = await contract.submitTransaction(fn, ...args);
  return Buffer.from(result).toString('utf8');
}

async function evaluate(fn: string, ...args: string[]): Promise<string> {
  const contract = await getContract();
  const result   = await contract.evaluateTransaction(fn, ...args);
  return Buffer.from(result).toString('utf8');
}

// ── Write functions (change ledger state) ──────────────────────
export async function recordStockEvent(params: {
  id:           string;
  warehouseId:  string;
  eventType:    string;
  quantityTons: number;
  documentHash: string;
  reportedById: string;
  notes:        string;
}): Promise<void> {
  await submit(
    'RecordStockEvent',
    params.id,
    params.warehouseId,
    params.eventType,
    params.quantityTons.toString(),
    params.documentHash,
    params.reportedById,
    params.notes ?? '',
  );
}

export async function recordDisasterEvent(params: {
  id:                  string;
  disasterType:        string;
  affectedWarehouseId: string;
  estimatedLossTons:   number;
  description:         string;
  reportedById:        string;
  occurredAt:          string;
}): Promise<void> {
  await submit(
    'RecordDisasterEvent',
    params.id,
    params.disasterType,
    params.affectedWarehouseId,
    params.estimatedLossTons.toString(),
    params.description ?? '',
    params.reportedById,
    params.occurredAt,
  );
}

export async function issueRedistributionOrder(params: {
  id:                     string;
  disasterEventId:        string;
  sourceWarehouseId:      string;
  destinationWarehouseId: string;
  quantityTons:           number;
  compositeScore:         number;
  issuedById:             string;
}): Promise<void> {
  await submit(
    'IssueRedistributionOrder',
    params.id,
    params.disasterEventId,
    params.sourceWarehouseId,
    params.destinationWarehouseId,
    params.quantityTons.toString(),
    params.compositeScore.toString(),
    params.issuedById,
  );
}

export async function recordZKPVerification(params: {
  id:                 string;
  warehouseId:        string;
  disasterEventId:    string;
  proofJSON:          string;
  publicSignalsJSON:  string;
  verificationResult: boolean;
}): Promise<void> {
  await submit(
    'RecordZKPVerification',
    params.id,
    params.warehouseId,
    params.disasterEventId,
    params.proofJSON,
    params.publicSignalsJSON,
    params.verificationResult.toString(),
  );
}

// ── Read functions (no ledger state change) ────────────────────
export async function queryStockEvent(id: string): Promise<object> {
  const result = await evaluate('QueryStockEvent', id);
  return JSON.parse(result);
}

export async function queryDisasterEvent(id: string): Promise<object> {
  const result = await evaluate('QueryDisasterEvent', id);
  return JSON.parse(result);
}

export async function queryRedistributionOrder(id: string): Promise<object> {
  const result = await evaluate('QueryRedistributionOrder', id);
  return JSON.parse(result);
}

export async function queryWarehouseHistory(warehouseId: string): Promise<object[]> {
  const result = await evaluate('QueryWarehouseHistory', warehouseId);
  return JSON.parse(result);
}

export async function queryDisasterAuditTrail(disasterId: string): Promise<object> {
  const result = await evaluate('QueryDisasterAuditTrail', disasterId);
  return JSON.parse(result);
}