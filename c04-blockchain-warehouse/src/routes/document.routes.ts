import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { authenticate, allStaff, adminOrRM } from '../middleware/auth.middleware';
import { handleUpload } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import { validateQuery } from '../middleware/validateQuery.middleware';
import { linkDocumentSchema, documentQuerySchema } from '../utils/document.validators';
import { sendSuccess, sendCreated, AppError } from '../utils/errors';

const router = Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────

/**
 * POST /api/documents/upload
 * RM / Admin / Supervisor — upload a stock report document
 *
 * Multipart form-data:
 *   field name: "document"
 *   accepted:   PDF, JPEG, PNG, WEBP  (max 10 MB)
 *
 * Returns the SHA-256 hash. Pass this hash to
 * POST /api/documents/link to attach it to a stock event.
 * The hash is also what gets anchored on-chain in Phase 4.
 */
router.post(
  '/upload',
  allStaff,
  handleUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw AppError.badRequest('No file attached. Use field name "document".');
      }

      const result = await documentService.uploadDocument(
        {
          fieldname:    req.file.fieldname,
          originalname: req.file.originalname,
          mimetype:     req.file.mimetype,
          size:         req.file.size,
          buffer:       req.file.buffer,
        },
        req.user!
      );

      sendCreated(res, result, 'Document uploaded and hashed successfully');
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Verify
// ─────────────────────────────────────────────

/**
 * POST /api/documents/verify
 * All staff — upload a file to verify it matches a stored hash
 *
 * Auditors use this to confirm a physical document hasn't been tampered with.
 * Returns { verified: true/false, hash, storedRecord, linkedEvents }
 */
router.post(
  '/verify',
  allStaff,
  handleUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw AppError.badRequest('No file attached. Use field name "document".');
      }

      const result = await documentService.verifyDocument({
        fieldname:    req.file.fieldname,
        originalname: req.file.originalname,
        mimetype:     req.file.mimetype,
        size:         req.file.size,
        buffer:       req.file.buffer,
      });

      const message = result.verified
        ? 'Document verified — hash matches stored record'
        : 'Document NOT verified — no matching hash found in the system';

      sendSuccess(res, result, message);
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Link
// ─────────────────────────────────────────────

/**
 * POST /api/documents/link
 * RM / Admin — attach an uploaded document hash to a stock event
 *
 * Body: { documentHash, stockEventId }
 *
 * Workflow:
 *   1. POST /api/documents/upload        → get hash
 *   2. POST /api/warehouses/:id/stock-events → get stockEventId
 *   3. POST /api/documents/link          → connect them
 */
router.post(
  '/link',
  adminOrRM,
  validate(linkDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await documentService.linkToStockEvent(req.body);
      sendSuccess(res, null, 'Document linked to stock event successfully');
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

/**
 * GET /api/documents
 * RM / Admin — list all uploaded documents
 */
router.get(
  '/',
  adminOrRM,
  validateQuery(documentQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as Request & { parsedQuery: any }).parsedQuery;
      const result = await documentService.listDocuments(query.page, query.limit);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/documents/:hash
 * All staff — get metadata for a document by its SHA-256 hash
 */
router.get(
  '/:hash',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await documentService.getByHash(req.params.hash);
      sendSuccess(res, doc);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/documents/:hash/download
 * All staff — download the actual file
 */
router.get(
  '/:hash/download',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc      = await documentService.getByHash(req.params.hash);
      const filePath = documentService.getFilePath(doc.filePath);

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(doc.originalName)}"`
      );
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
);

export default router;