/**
 * Print Job Types
 */

export enum JobState {
  PENDING = 'pending',
  QUEUED = 'queued',
  PRINTING = 'printing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export interface PrintSettings {
  copies: number;
  paperSize: 'A4' | 'Letter' | 'A3' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  colorMode: 'color' | 'grayscale' | 'bw';
  quality: 'draft' | 'normal' | 'high';
  duplex: boolean;
  collate: boolean;
  pageRange?: string; // e.g., "1-5,7,9-10"
  nUp?: number; // pages per sheet (2, 4, 6, 9, 16)
  scaling: 'none' | 'fit-to-page' | 'actual-size';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  borderless: boolean;
  mediaType?: string;
  customPaperSize?: {
    width: number;
    height: number;
  };
}

export interface PrintJob {
  id: string;
  printerId: string;
  documentId: string;
  state: JobState;
  settings: PrintSettings;
  progress: number; // 0-100
  totalPages: number;
  printedPages: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: {
    code: string;
    message: string;
    userMessage: string;
  };
  retryCount: number;
  maxRetries: number;
}

export interface PrintJobUpdate {
  state?: JobState;
  progress?: number;
  printedPages?: number;
  error?: PrintJob['error'];
}
