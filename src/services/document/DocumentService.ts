/**
 * Document Service
 * Manages document loading and metadata
 */

import { v4 as uuidv4 } from 'uuid';
import { DocumentValidator, DocumentMetadata } from './DocumentValidator';
import { PrintBridgeError, ErrorCode } from '../../types/errors';

export interface Document {
  id: string;
  name: string;
  path: string;
  metadata: DocumentMetadata;
  loadedAt: Date;
}

export class DocumentService {
  private documents = new Map<string, Document>();
  private validator: DocumentValidator;

  constructor() {
    this.validator = new DocumentValidator();
  }

  async loadDocument(file: any): Promise<Document> {
    try {
      // Validate document
      const metadata = await this.validator.validateDocument(file);

      // Create document entry
      const document: Document = {
        id: uuidv4(),
        name: metadata.name,
        path: file.uri || file.path || '',
        metadata,
        loadedAt: new Date(),
      };

      this.documents.set(document.id, document);
      return document;
    } catch (error) {
      if (error instanceof PrintBridgeError) throw error;
      throw new PrintBridgeError(
        ErrorCode.INVALID_DOCUMENT,
        'Failed to load document',
        'Could not load the selected document. Please try another file.',
        { originalError: error },
        false,
      );
    }
  }

  getDocument(documentId: string): Document | undefined {
    return this.documents.get(documentId);
  }

  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  removeDocument(documentId: string): void {
    this.documents.delete(documentId);
  }

  async getDocumentPreview(documentId: string): Promise<string> {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    // Placeholder - actual preview generation depends on document type
    // Would generate thumbnail or preview image
    return '';
  }

  clear(): void {
    this.documents.clear();
  }
}
