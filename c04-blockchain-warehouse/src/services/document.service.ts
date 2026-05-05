import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { LinkDocumentInput } from '../utils/document.validators';
import { JwtPayload } from '../types';

// ── Constants ──────────────────────────────────────────────────
const UPLOAD_DIR     = path.resolve(process.cwd(), 'uploads');
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES  = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedMimeType = typeof ALLOWED_TYPES[number];

// Ensure upload directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Types ──────────────────────────────────────────────────────
export interface UploadedFile {
  fieldname:    string;
  originalname: string;
  mimetype:     string;
  size:         number;
  buffer:       Buffer;
}

export interface DocumentRecord {
  id:           string;
  hash:         string;
  originalName: string;
  mimeType:     string;
  sizeBytes:    number;
  filePath:     string;
  uploadedById: string;
  createdAt:    Date;
}

// ── Service ────────────────────────────────────────────────────
export class DocumentService {

  // ── Upload + hash a document ────────────────────────────────
  async uploadDocument(
    file: UploadedFile,
    caller: JwtPayload
  ): Promise<{ hash: string; id: string; originalName: string; sizeBytes: number }> {

    this.validateFile(file);

    // 1. Compute SHA-256 hash of the raw file buffer
    const hash = this.hashBuffer(file.buffer);

    // 2. Check for duplicate — same file already uploaded
    const existing = await prisma.documentStore.findUnique({ where: { hash } });
    if (existing) {
      return {
        hash:         existing.hash,
        id:           existing.id,
        originalName: existing.originalName,
        sizeBytes:    existing.sizeBytes,
      };
    }

    // 3. Persist to disk using hash as filename (content-addressed)
    const ext      = path.extname(file.originalname).toLowerCase() || this.extFromMime(file.mimetype);
    const fileName = `${hash}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, file.buffer);

    // 4. Record metadata in DB
    const doc = await prisma.documentStore.create({
      data: {
        hash,
        originalName:  file.originalname,
        mimeType:      file.mimetype,
        sizeBytes:     file.size,
        filePath:      fileName,  // store relative path only
        uploadedById:  caller.sub,
      },
    });

    return {
      hash:         doc.hash,
      id:           doc.id,
      originalName: doc.originalName,
      sizeBytes:    doc.sizeBytes,
    };
  }

  // ── Link a document hash to a stock event ──────────────────
  async linkToStockEvent(dto: LinkDocumentInput): Promise<void> {
    // Verify document exists
    const doc = await prisma.documentStore.findUnique({
      where: { hash: dto.documentHash },
    });
    if (!doc) {
      throw AppError.notFound(
        `No document found with hash ${dto.documentHash}. Upload the file first.`
      );
    }

    // Verify stock event exists
    const event = await prisma.stockEvent.findUnique({
      where: { id: dto.stockEventId },
    });
    if (!event) {
      throw AppError.notFound('Stock event not found');
    }

    // Update the stock event with the document hash and path
    await prisma.stockEvent.update({
      where: { id: dto.stockEventId },
      data:  {
        documentHash: dto.documentHash,
        documentPath: doc.filePath,
      },
    });
  }

  // ── Verify a document hash ──────────────────────────────────
  // Given a file buffer, confirms it matches a stored hash.
  // Used by auditors to verify a physical document hasn't been tampered with.
  async verifyDocument(
    file: UploadedFile
  ): Promise<{
    verified:      boolean;
    hash:          string;
    storedRecord:  DocumentRecord | null;
    linkedEvents:  Array<{ id: string; eventType: string; timestamp: Date; warehouseId: string }>;
  }> {
    this.validateFile(file);

    const hash   = this.hashBuffer(file.buffer);
    const stored = await prisma.documentStore.findUnique({ where: { hash } });

    if (!stored) {
      return { verified: false, hash, storedRecord: null, linkedEvents: [] };
    }

    // Find all stock events linked to this hash
    const linkedEvents = await prisma.stockEvent.findMany({
      where:  { documentHash: hash },
      select: { id: true, eventType: true, timestamp: true, warehouseId: true },
      orderBy: { timestamp: 'desc' },
    });

    return {
      verified:     true,
      hash,
      storedRecord: stored as DocumentRecord,
      linkedEvents,
    };
  }

  // ── Get document metadata by hash ──────────────────────────
  async getByHash(hash: string) {
    const doc = await prisma.documentStore.findUnique({
      where:   { hash },
      include: {
        uploadedBy: { select: { id: true, fullName: true, role: true } },
      },
    });
    if (!doc) throw AppError.notFound('Document not found');
    return doc;
  }

  // ── Serve a document file ───────────────────────────────────
  getFilePath(fileName: string): string {
    const filePath = path.join(UPLOAD_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      throw AppError.notFound('File not found on disk');
    }
    // Security: prevent path traversal
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(UPLOAD_DIR)) {
      throw AppError.forbidden('Invalid file path');
    }
    return resolved;
  }

  // ── List documents ──────────────────────────────────────────
  async listDocuments(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      prisma.documentStore.findMany({
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, fullName: true, role: true } },
        },
      }),
      prisma.documentStore.count(),
    ]);

    return {
      items:      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Hash a buffer (static utility used elsewhere too) ───────
  static hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  hashBuffer(buffer: Buffer): string {
    return DocumentService.hashBuffer(buffer);
  }

  // ── Hash a string (used for stock event data placeholder) ───
  static hashString(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  // ── Private helpers ─────────────────────────────────────────
  private validateFile(file: UploadedFile): void {
    if (!file || !file.buffer) {
      throw AppError.badRequest('No file provided');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw AppError.badRequest(
        `File too large. Maximum size is ${MAX_SIZE_BYTES / 1024 / 1024} MB, received ${(file.size / 1024 / 1024).toFixed(2)} MB`
      );
    }
    if (!ALLOWED_TYPES.includes(file.mimetype as AllowedMimeType)) {
      throw AppError.badRequest(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, WEBP`
      );
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg':      '.jpg',
      'image/png':       '.png',
      'image/webp':      '.webp',
    };
    return map[mime] || '';
  }
}

export const documentService = new DocumentService();
export { ALLOWED_TYPES, MAX_SIZE_BYTES };