/**
 * Queue Processor
 * Processes print jobs from queue with proper ordering and state management
 */

import { PrintJob, JobState } from '../../types/printJob';
import { JobStateManager } from './JobStateManager';
import { PrintBridgeError } from '../../types/errors';

export interface ProcessorConfig {
  maxConcurrentJobs: number;
  jobTimeoutMs: number;
  enableAutoStart: boolean;
}

export type JobProcessor = (
  job: PrintJob,
) => Promise<void> | void;

export class QueueProcessor {
  private stateManager: JobStateManager;
  private config: ProcessorConfig;
  private processingJobs = new Map<string, Promise<void>>();
  private isRunning = false;
  private jobProcessor?: JobProcessor;
  private listeners: ((job: PrintJob) => void)[] = [];

  constructor(stateManager: JobStateManager, config: Partial<ProcessorConfig> = {}) {
    this.stateManager = stateManager;
    this.config = {
      maxConcurrentJobs: 1,
      jobTimeoutMs: 300000, // 5 minutes
      enableAutoStart: true,
      ...config,
    };
  }

  setJobProcessor(processor: JobProcessor): void {
    this.jobProcessor = processor;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.processQueue();
  }

  stop(): void {
    this.isRunning = false;
  }

  private async processQueue(): Promise<void> {
    while (this.isRunning) {
      try {
        const queuedJobs = this.stateManager.getJobsByState(JobState.QUEUED);
        const availableSlots =
          this.config.maxConcurrentJobs - this.processingJobs.size;

        for (let i = 0; i < Math.min(availableSlots, queuedJobs.length); i++) {
          const job = queuedJobs[i];
          this.processJob(job);
        }

        // Check every 100ms for new jobs
        await this.sleep(100);
      } catch (error) {
        console.error('Error in queue processor:', error);
        await this.sleep(1000);
      }
    }
  }

  private async processJob(job: PrintJob): Promise<void> {
    if (this.processingJobs.has(job.id)) return;

    const processingPromise = (async () => {
      try {
        this.stateManager.transitionState(job.id, JobState.PRINTING);
        this.notifyListeners(job);

        if (!this.jobProcessor) {
          throw new Error('No job processor configured');
        }

        await Promise.race([
          this.jobProcessor(job),
          this.createTimeoutPromise(job.id),
        ]);

        // Job completed successfully
        this.stateManager.transitionState(job.id, JobState.COMPLETED);
        this.notifyListeners(this.stateManager.getJob(job.id)!);
      } catch (error) {
        const printError =
          error instanceof PrintBridgeError
            ? error
            : new PrintBridgeError(
                'PRINT_JOB_FAILED' as any,
                'Print job failed',
                'Failed to print document. Please try again.',
                { originalError: error },
                true,
              );

        this.stateManager.setError(job.id, printError);
        this.notifyListeners(this.stateManager.getJob(job.id)!);
      } finally {
        this.processingJobs.delete(job.id);
      }
    })();

    this.processingJobs.set(job.id, processingPromise);
  }

  private createTimeoutPromise(jobId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Job ${jobId} timeout after ${this.config.jobTimeoutMs}ms`,
          ),
        );
      }, this.config.jobTimeoutMs);
    });
  }

  getQueuedCount(): number {
    return this.stateManager.getJobsByState(JobState.QUEUED).length;
  }

  getProcessingCount(): number {
    return this.processingJobs.size;
  }

  getQueueStatus() {
    return {
      queued: this.getQueuedCount(),
      processing: this.getProcessingCount(),
      available: this.config.maxConcurrentJobs - this.getProcessingCount(),
    };
  }

  subscribe(listener: (job: PrintJob) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(job: PrintJob | undefined): void {
    if (!job) return;
    this.listeners.forEach((listener) => listener(job));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
