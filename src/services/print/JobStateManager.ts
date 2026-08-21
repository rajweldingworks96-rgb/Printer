/**
 * Print Job State Manager
 * Manages state transitions for print jobs
 */

import { PrintJob, JobState, PrintJobUpdate } from '../../types/printJob';
import { PrintBridgeError } from '../../types/errors';

export type JobStateListener = (job: PrintJob) => void;

export class JobStateManager {
  private jobs = new Map<string, PrintJob>();
  private listeners: JobStateListener[] = [];
  private stateTransitions: Map<JobState, JobState[]> = new Map([
    [JobState.PENDING, [JobState.QUEUED, JobState.CANCELLED]],
    [JobState.QUEUED, [JobState.PRINTING, JobState.CANCELLED]],
    [JobState.PRINTING, [JobState.COMPLETED, JobState.FAILED, JobState.PAUSED]],
    [JobState.PAUSED, [JobState.PRINTING, JobState.CANCELLED]],
    [JobState.FAILED, [JobState.QUEUED, JobState.CANCELLED]], // Retry
    [JobState.COMPLETED, []],
    [JobState.CANCELLED, []],
  ]);

  createJob(job: PrintJob): void {
    if (this.jobs.has(job.id)) {
      throw new Error(`Job ${job.id} already exists`);
    }
    this.jobs.set(job.id, { ...job });
    this.notify(job);
  }

  getJob(jobId: string): PrintJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  getAllJobs(): PrintJob[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }));
  }

  getJobsByState(state: JobState): PrintJob[] {
    return this.getAllJobs().filter((j) => j.state === state);
  }

  getJobsByPrinter(printerId: string): PrintJob[] {
    return this.getAllJobs().filter((j) => j.printerId === printerId);
  }

  updateJob(jobId: string, updates: PrintJobUpdate): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Validate state transition if state is being changed
    if (updates.state && !this.canTransitionTo(job.state, updates.state)) {
      throw new Error(
        `Cannot transition from ${job.state} to ${updates.state}`,
      );
    }

    // Update timestamps based on state changes
    if (updates.state === JobState.PRINTING && !job.startedAt) {
      (updates as any).startedAt = new Date();
    }

    if (
      (updates.state === JobState.COMPLETED ||
        updates.state === JobState.FAILED ||
        updates.state === JobState.CANCELLED) &&
      !job.completedAt
    ) {
      (updates as any).completedAt = new Date();
    }

    Object.assign(job, updates);
    this.notify(job);
  }

  canTransitionTo(fromState: JobState, toState: JobState): boolean {
    const allowedTransitions = this.stateTransitions.get(fromState);
    return allowedTransitions?.includes(toState) ?? false;
  }

  transitionState(jobId: string, newState: JobState): void {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (!this.canTransitionTo(job.state, newState)) {
      throw new Error(`Cannot transition from ${job.state} to ${newState}`);
    }

    this.updateJob(jobId, { state: newState });
  }

  setProgress(jobId: string, progress: number, printedPages?: number): void {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    this.updateJob(jobId, {
      progress: Math.min(100, progress),
      printedPages: printedPages ?? job.printedPages,
    });
  }

  setError(jobId: string, error: PrintBridgeError): void {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    this.updateJob(jobId, {
      state: JobState.FAILED,
      error: {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
      },
    });
  }

  canRetry(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    return (
      job.state === JobState.FAILED && job.retryCount < job.maxRetries
    );
  }

  retryJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (!this.canRetry(jobId)) {
      throw new Error(`Job ${jobId} cannot be retried`);
    }

    this.updateJob(jobId, {
      state: JobState.QUEUED,
      retryCount: job.retryCount + 1,
      error: undefined,
      progress: 0,
      printedPages: 0,
    });
  }

  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (job.state === JobState.COMPLETED || job.state === JobState.CANCELLED) {
      throw new Error(`Cannot cancel job in state ${job.state}`);
    }

    this.updateJob(jobId, {
      state: JobState.CANCELLED,
      completedAt: new Date(),
    });
  }

  deleteJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  subscribe(listener: JobStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(job: PrintJob): void {
    this.listeners.forEach((listener) => listener({ ...job }));
  }

  clear(): void {
    this.jobs.clear();
  }
}
