/**
 * Connection Manager
 * Orchestrates printer connections with state tracking and retry logic
 */

import { Printer, PrinterStatus } from '../../types/printer';
import { PrintBridgeError, ErrorCode } from '../../types/errors';
import { ConnectionStateTracker, ConnectionState } from './ConnectionStateTracker';
import { RetryHandler } from './RetryHandler';

export interface ConnectionConfig {
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  pingIntervalMs: number;
  enableAutoReconnect: boolean;
}

export class ConnectionManager {
  private stateTracker: ConnectionStateTracker;
  private retryHandler: RetryHandler;
  private config: ConnectionConfig;
  private transportMap = new Map<string, any>();
  private activeConnections = new Map<string, any>();

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = {
      connectionTimeoutMs: 10000,
      maxRetryAttempts: 5,
      pingIntervalMs: 5000,
      enableAutoReconnect: true,
      ...config,
    };

    this.stateTracker = new ConnectionStateTracker();
    this.retryHandler = new RetryHandler({
      maxAttempts: this.config.maxRetryAttempts,
    });
  }

  registerTransport(type: string, transport: any) {
    this.transportMap.set(type, transport);
  }

  async connect(printer: Printer): Promise<boolean> {
    const state = this.stateTracker.getState(printer.id);
    if (!state) {
      this.stateTracker.createState(printer);
    }

    this.stateTracker.setConnecting(printer.id);

    try {
      await this.retryHandler.executeWithRetry(
        `connect-${printer.id}`,
        () => this._attemptConnection(printer),
        (attempt, delay) => {
          console.log(
            `Connection attempt ${attempt} failed. Retrying in ${delay}ms...`,
          );
        },
      );

      this.stateTracker.setConnected(printer.id);
      this.stateTracker.startPingCheck(printer.id, this.config.pingIntervalMs);
      return true;
    } catch (error) {
      const printBridgeError =
        error instanceof PrintBridgeError
          ? error
          : PrintBridgeError.CONNECTION_FAILED({ originalError: error });

      this.stateTracker.setError(printer.id, printBridgeError);
      return false;
    }
  }

  async disconnect(printerId: string): Promise<void> {
    this.stateTracker.stopPingCheck(printerId);

    const connection = this.activeConnections.get(printerId);
    if (connection) {
      try {
        await connection.close?.();
      } catch (error) {
        console.error(`Error closing connection: ${error}`);
      }
      this.activeConnections.delete(printerId);
    }

    this.stateTracker.setDisconnected(printerId);
  }

  async reconnect(printer: Printer): Promise<boolean> {
    await this.disconnect(printer.id);
    this.stateTracker.resetAttempts(printer.id);
    return this.connect(printer);
  }

  getState(printerId: string): ConnectionState | undefined {
    return this.stateTracker.getState(printerId);
  }

  isConnected(printerId: string): boolean {
    const state = this.stateTracker.getState(printerId);
    return state?.isConnected ?? false;
  }

  onStateChange(listener: (state: ConnectionState) => void) {
    return this.stateTracker.subscribe(listener);
  }

  private async _attemptConnection(printer: Printer): Promise<void> {
    const transport = this.transportMap.get(printer.connectionType);
    if (!transport) {
      throw PrintBridgeError.CONNECTION_FAILED({
        reason: `No transport for ${printer.connectionType}`,
      });
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(PrintBridgeError.CONNECTION_FAILED({ reason: 'Timeout' })),
        this.config.connectionTimeoutMs,
      );
    });

    try {
      const connection = await Promise.race([
        transport.connect(printer),
        timeoutPromise,
      ]);

      this.activeConnections.set(printer.id, connection);
    } catch (error) {
      if (error instanceof PrintBridgeError) throw error;
      throw PrintBridgeError.CONNECTION_FAILED({ originalError: error });
    }
  }

  dispose() {
    this.activeConnections.forEach((conn) => {
      try {
        conn.close?.();
      } catch (error) {
        console.error(`Error disposing connection: ${error}`);
      }
    });
    this.activeConnections.clear();
    this.stateTracker.dispose();
  }
}
