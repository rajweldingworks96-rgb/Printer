/**
 * Print Queue Manager
 * Manages the complete print queue lifecycle
 */

import { v4 as uuidv4 } from 'uuid';
import { PrintJob, JobState, PrintSettings } from '../../types/printJob';
import { JobStateManager } from './JobStateManager';
import { QueueProcessor, JobProcessor } from './QueueProcessor';
import { PrintBridgeError } from '../../types/errors';

export interface QueuePersistence {
  save(jobs: PrintJob[]): Promise<void>;
  load(): Promise<PrintJob[]>;
  clear(): Promise<void>;
}

export class PrintQueueManager {
  private stateManager: JobStateManager;
  private queueProcessor: QueueProcessor;
  private persistence?: QueuePersistence;
  private jobProcessor?: JobProcessor;

  constructor(
    stateManager: JobStateManager,
    queueProcessor: QueueProcessor,
    persistence?: QueuePersistence,
  ) {
    this.stateManager = stateManager;
    this.queueProcessor = queueProcessor;
    this.persistence = persistence;
  }

  setPersistence(persistence: QueuePersistence): void {
    this.persistence = persistence;
  }

  setJobProcessor(processor: JobProcessor): void {
    this.jobProcessor = processor;
    this.queueProcessor.setJobProcessor(processor);
  }

  async initialize(): Promise<void> {
    // Load persisted jobs if available
    if (this.persistence) {
      try {
        const savedJobs = await this.persistence.load();
        savedJobs.forEach((job) => {
          this.stateManager.createJob(job);
        });
      } catch (error) {
        console.error('Failed to load persisted jobs:', error);
      }
    }

    // Start processing queue
    await this.queueProcessor.start();
  }

  async addJob(
    printerId: string,
    documentId: string,
    settings: PrintSettings,
  ): Promise<PrintJob> {
    const job: PrintJob = {
      id: uuidv4(),
      printerId,
      documentId,
      state: JobState.PENDING,
      settings,
      progress: 0,
      totalPages: 0, // Will be set when document is loaded
      printedPages: 0,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.stateManager.createJob(job);
    this.stateManager.transitionState(job.id, JobState.QUEUED);

    await this.persistQueue();
    return this.stateManager.getJob(job.id)!;
  }

  async cancelJob(jobId: string): Promise<void> {
    this.stateManager.cancelJob(jobId);
    await this.persistQueue();
  }

  async retryJob(jobId: string): Promise<void> {
    if (!this.stateManager.canRetry(jobId)) {
      throw new Error(`Job ${jobId} cannot be retried`);
    }
    this.stateManager.retryJob(jobId);
    await this.persistQueue();
  }

  async pauseJob(jobId: string): Promise<void> {
    const job = this.stateManager.getJob(jobId);
    if (!job || job.state !== JobState.PRINTING) {
      throw new Error(`Cannot pause job in state ${job?.state}`);
    }
    this.stateManager.transitionState(jobId, JobState.PAUSED);
    await this.persistQueue();
  }

  async resumeJob(jobId: string): Promise<void> {
    const job = this.stateManager.getJob(jobId);
    if (!job || job.state !== JobState.PAUSED) {
      throw new Error(`Cannot resume job in state ${job?.state}`);
    }
    this.stateManager.transitionState(jobId, JobState.PRINTING);
    await this.persistQueue();
  }

  getJob(jobId: string): PrintJob | undefined {
    return this.stateManager.getJob(jobId);
  }

  getAllJobs(): PrintJob[] {
    return this.stateManager.getAllJobs();
  }

  getJobsByPrinter(printerId: string): PrintJob[] {
    return this.stateManager.getJobsByPrinter(printerId);
  }

  getQueueStatus() {
    return this.queueProcessor.getQueueStatus();
  }

  subscribe(listener: (job: PrintJob) => void): () => void {
    this.stateManager.subscribe(listener);
    return this.queueProcessor.subscribe(listener);
  }

  private async persistQueue(): Promise<void> {
    if (!this.persistence) return;
    try {
      await this.persistence.save(this.stateManager.getAllJobs());
    } catch (error) {
      console.error('Failed to persist queue:', error);
    }
  }

  async shutdown(): Promise<void> {
    this.queueProcessor.stop();
    await this.persistQueue();
  }
}
