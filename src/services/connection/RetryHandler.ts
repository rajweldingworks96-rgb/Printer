/**
 * Retry Handler with Exponential Backoff
 * Handles connection retry logic with intelligent backoff
 */

import { PrintBridgeError } from '../../types/errors';

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1
}

export interface RetryResult {
  attempt: number;
  delay: number;
  shouldRetry: boolean;
}

export class RetryHandler {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  };

  private config: RetryConfig;
  private attempts = new Map<string, number>();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...RetryHandler.DEFAULT_CONFIG, ...config };
  }

  async executeWithRetry<T>(
    key: string,
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number, error: Error) => void,
  ): Promise<T> {
    let lastError: Error | undefined;
    const attempts = this.getAttempts(key);

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await fn();
        this.resetAttempts(key);
        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.maxAttempts) {
          const delay = this.calculateDelay(attempt);
          onRetry?.(attempt, delay, lastError);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Max retry attempts reached');
  }

  calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1),
      this.config.maxDelayMs,
    );

    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * this.config.jitterFactor * Math.random();
    return Math.round(exponentialDelay + jitter);
  }

  shouldRetry(attempt: number, error?: Error): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Don't retry on permanent errors
    if (error instanceof PrintBridgeError && !error.recoverable) {
      return false;
    }

    return true;
  }

  getAttempts(key: string): number {
    return this.attempts.get(key) || 0;
  }

  incrementAttempts(key: string): number {
    const current = this.getAttempts(key);
    const next = current + 1;
    this.attempts.set(key, next);
    return next;
  }

  resetAttempts(key: string) {
    this.attempts.delete(key);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
