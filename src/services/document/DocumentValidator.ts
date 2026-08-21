/**
 * Document Validator
 * Validates documents before printing
 */

import { PrintBridgeError, ErrorCode } from '../../types/errors';

export enum DocumentType {
  PDF = 'pdf',
  IMAGE = 'image',
  TEXT = 'text',
}

export interface DocumentMetadata {
  type: DocumentType;
  name: string;
  size: number;
  mimeType: string;
  pageCount?: number;
  width?: number;
  height?: number;
}

const SUPPORTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'text/plain',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_PAGE_COUNT = 1000;

export class DocumentValidator {
  async validateDocument(file: any): Promise<DocumentMetadata> {
    // Check file exists and is readable
    if (!file) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_DOCUMENT,
        'File not provided',
        'Please select a document to print',
        undefined,
        false,
      );
    }

    // Get file metadata
    const metadata = await this.getFileMetadata(file);

    // Validate MIME type
    if (!SUPPORTED_TYPES.includes(metadata.mimeType)) {
      throw new PrintBridgeError(
        ErrorCode.UNSUPPORTED_FORMAT,
        `Unsupported file type: ${metadata.mimeType}`,
        `File format not supported. Supported: PDF, JPG, PNG, TXT`,
        undefined,
        false,
      );
    }

    // Validate file size
    if (metadata.size > MAX_FILE_SIZE) {
      throw new PrintBridgeError(
        ErrorCode.DOCUMENT_TOO_LARGE,
        `File size ${metadata.size} exceeds max ${MAX_FILE_SIZE}`,
        `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB). Reduce file size.`,
        undefined,
        false,
      );
    }

    // Validate PDF page count if applicable
    if (metadata.type === DocumentType.PDF && metadata.pageCount) {
      if (metadata.pageCount > MAX_PAGE_COUNT) {
        throw new PrintBridgeError(
          ErrorCode.DOCUMENT_TOO_LARGE,
          `PDF has ${metadata.pageCount} pages, max is ${MAX_PAGE_COUNT}`,
          `Document has too many pages (${metadata.pageCount}). Max allowed: ${MAX_PAGE_COUNT}`,
          undefined,
          false,
        );
      }
    }

    return metadata;
  }

  async validatePageRange(
    pageRange: string,
    totalPages: number,
  ): Promise<number[]> {
    const pages: number[] = [];
    const ranges = pageRange.trim().split(',');

    for (const range of ranges) {
      const trimmed = range.trim();

      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((s) => parseInt(s.trim()));
        if (isNaN(start) || isNaN(end)) {
          throw new PrintBridgeError(
            ErrorCode.INVALID_JOB_SETTINGS,
            `Invalid page range: ${range}`,
            `Invalid page range format. Use: 1-5,7,9-10`,
            undefined,
            false,
          );
        }

        if (start < 1 || end > totalPages || start > end) {
          throw new PrintBridgeError(
            ErrorCode.INVALID_JOB_SETTINGS,
            `Invalid page range: ${start}-${end}`,
            `Page range out of bounds. Document has ${totalPages} pages.`,
            undefined,
            false,
          );
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      } else {
        const page = parseInt(trimmed);
        if (isNaN(page)) {
          throw new PrintBridgeError(
            ErrorCode.INVALID_JOB_SETTINGS,
            `Invalid page number: ${trimmed}`,
            `Invalid page number format. Use: 1-5,7,9-10`,
            undefined,
            false,
          );
        }

        if (page < 1 || page > totalPages) {
          throw new PrintBridgeError(
            ErrorCode.INVALID_JOB_SETTINGS,
            `Page ${page} out of range`,
            `Page ${page} is out of range. Document has ${totalPages} pages.`,
            undefined,
            false,
          );
        }

        pages.push(page);
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  }

  private async getFileMetadata(file: any): Promise<DocumentMetadata> {
    // This is a placeholder - actual implementation depends on file system access
    // In React Native, this would use document picker and file system APIs

    const name = file.name || file.uri?.split('/').pop() || 'document';
    const size = file.size || 0;
    const mimeType = file.type || this.guessMimeType(name);

    const type = this.getDocumentType(mimeType);

    return {
      type,
      name,
      size,
      mimeType,
      pageCount:
        type === DocumentType.PDF ? await this.getPageCount(file) : 1,
    };
  }

  private guessMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      txt: 'text/plain',
    };
    return mimeMap[ext || ''] || 'application/octet-stream';
  }

  private getDocumentType(mimeType: string): DocumentType {
    if (mimeType === 'application/pdf') return DocumentType.PDF;
    if (mimeType.startsWith('image/')) return DocumentType.IMAGE;
    if (mimeType.startsWith('text/')) return DocumentType.TEXT;
    return DocumentType.PDF; // default
  }

  private async getPageCount(file: any): Promise<number> {
    // Placeholder - actual implementation would parse PDF
    // For now, return 1 page estimate
    return Math.ceil(file.size / (200 * 1024)); // Rough estimate: ~200KB per page
  }
}
