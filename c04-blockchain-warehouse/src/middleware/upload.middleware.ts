import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ALLOWED_TYPES, MAX_SIZE_BYTES } from '../services/document.service';

// Store files in memory so we can hash the buffer before writing to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype as typeof ALLOWED_TYPES[number])) {
      cb(null, true);
    } else {
      cb(new AppError(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, WEBP`,
        400
      ));
    }
  },
});

// Single file upload — field name must be "document"
export const uploadSingle = upload.single('document');

// Wraps multer in a promise so errors flow through Express error handler
export function handleUpload(req: Request, res: Response, next: NextFunction): void {
  uploadSingle(req, res, (err) => {
    if (!err) { next(); return; }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(AppError.badRequest(
          `File too large. Maximum size is ${MAX_SIZE_BYTES / 1024 / 1024} MB`
        ));
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        next(AppError.badRequest('Field name must be "document"'));
      } else {
        next(AppError.badRequest(err.message));
      }
    } else {
      next(err);
    }
  });
}