import { Router, Request, Response, NextFunction } from 'express';
import { zkpService } from '../services/zkp.service';
import { authenticate, allStaff, rmOrSupervisor } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { submitProofSchema, generateProofSchema } from '../utils/zkp.validators';
import { sendSuccess, sendCreated } from '../utils/errors';

const router = Router();

router.use(authenticate);

/**
 * GET /api/zkp/circuit-params
 * All staff — returns WASM and zkey URLs for browser-side proof generation.
 * The frontend loads these files and calls snarkjs.groth16.fullProve() locally.
 */
router.get(
  '/circuit-params',
  allStaff,
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      const params = zkpService.getCircuitParams();
      sendSuccess(res, params);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/zkp/generate
 * RM / Supervisor — generate a proof server-side (for testing without frontend).
 *
 * In production this runs in the BROWSER using snarkjs WASM — the private
 * input (availableCapacity) never leaves the warehouse supervisor's device.
 *
 * Body: { warehouseId, disasterEventId, availableCapacity, threshold }
 *
 * Returns: { proof, publicSignals, commitment }
 * Then pass proof + publicSignals to POST /api/zkp/submit
 */
router.post(
  '/generate',
  rmOrSupervisor,
  validate(generateProofSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await zkpService.generateProof(req.body);
      sendSuccess(res, result, 'Proof generated successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/zkp/submit
 * RM / Supervisor — submit a proof for on-chain verification.
 *
 * Body: { disasterEventId, warehouseId, proof, publicSignals }
 *
 * What happens:
 *   1. Verifies proof cryptographically using the verification key
 *   2. Stores result in MySQL zkp_proofs table
 *   3. Anchors result on Hyperledger Fabric ledger
 *   4. Valid proofs allow the warehouse into the redistribution ranking
 */
router.post(
  '/submit',
  rmOrSupervisor,
  validate(submitProofSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await zkpService.submitAndVerifyProof(req.body, req.user!);
      sendCreated(res, result,
        result.verificationResult
          ? 'Proof verified successfully — warehouse is eligible for redistribution'
          : 'Proof verification FAILED — warehouse capacity claim is invalid'
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/zkp/disasters/:disasterId/proofs
 * All staff — list all ZKP proofs submitted for a disaster.
 * Shows which warehouses have proven their capacity and whether they passed.
 */
router.get(
  '/disasters/:disasterId/proofs',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proofs = await zkpService.getProofsForDisaster(req.params.disasterId);
      sendSuccess(res, proofs);
    } catch (err) {
      next(err);
    }
  }
);

export default router;