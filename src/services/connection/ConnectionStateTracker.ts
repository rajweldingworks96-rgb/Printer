/**
 * Connection State Tracker
 * Tracks real-time printer connection status
 */

import { Printer, PrinterStatus } from '../../types/printer';
import { PrintBridgeError, ErrorCode } from '../../types/errors';

export interface ConnectionState {
  printer: Printer;
  status: PrinterStatus;
  isConnected: boolean;
  connectionAttempts: number;
  maxAttempts: number;
  lastError?: PrintBridgeError;
  lastErrorTime?: Date;
  lastSuccessfulConnection?: Date;
  connectionDuration?: number; // milliseconds
  responseTime?: number; // milliseconds
}

export class ConnectionStateTracker {
  private states = new Map<string, ConnectionState>();
  private listeners: ((state: ConnectionState) => void)[] = [];
  private pingIntervals = new Map<string, NodeJS.Timeout>();

  createState(printer: Printer): ConnectionState {
    const state: ConnectionState = {
      printer,
      status: PrinterStatus.DISCONNECTED,
      isConnected: false,
      connectionAttempts: 0,
      maxAttempts: 5,
    };
    this.states.set(printer.id, state);
    return state;
  }

  getState(printerId: string): ConnectionState | undefined {
    return this.states.get(printerId);
  }

  updateState(printerId: string, updates: Partial<ConnectionState>) {
    const state = this.states.get(printerId);
    if (!state) return;

    Object.assign(state, updates);
    this.notifyListeners(state);
  }

  setConnecting(printerId: string) {
    this.updateState(printerId, {
      status: PrinterStatus.CONNECTING,
      isConnected: false,
    });
  }

  setConnected(printerId: string) {
    const state = this.states.get(printerId);
    if (!state) return;

    this.updateState(printerId, {
      status: PrinterStatus.CONNECTED,
      isConnected: true,
      connectionAttempts: 0,
      lastSuccessfulConnection: new Date(),
      lastError: undefined,
    });
  }

  setDisconnected(printerId: string) {
    this.updateState(printerId, {
      status: PrinterStatus.DISCONNECTED,
      isConnected: false,
    });
  }

  setError(printerId: string, error: PrintBridgeError) {
    const state = this.states.get(printerId);
    if (!state) return;

    state.connectionAttempts++;

    if (error.code === ErrorCode.PRINTER_OFFLINE) {
      this.updateState(printerId, {
        status: PrinterStatus.OFFLINE,
        isConnected: false,
        lastError: error,
        lastErrorTime: new Date(),
      });
    } else {
      this.updateState(printerId, {
        status: PrinterStatus.ERROR,
        isConnected: false,
        lastError: error,
        lastErrorTime: new Date(),
      });
    }
  }

  canRetry(printerId: string): boolean {
    const state = this.states.get(printerId);
    if (!state) return false;
    return state.connectionAttempts < state.maxAttempts;
  }

  resetAttempts(printerId: string) {
    this.updateState(printerId, { connectionAttempts: 0 });
  }

  subscribe(listener: (state: ConnectionState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(state: ConnectionState) {
    this.listeners.forEach((listener) => listener(state));
  }

  startPingCheck(printerId: string, interval: number = 5000) {
    if (this.pingIntervals.has(printerId)) {
      clearInterval(this.pingIntervals.get(printerId));
    }

    const intervalId = setInterval(() => {
      const state = this.states.get(printerId);
      if (state && state.isConnected) {
        // Ping logic would go here
        // For now, just a placeholder
      }
    }, interval);

    this.pingIntervals.set(printerId, intervalId);
  }

  stopPingCheck(printerId: string) {
    const intervalId = this.pingIntervals.get(printerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pingIntervals.delete(printerId);
    }
  }

  dispose() {
    this.pingIntervals.forEach((interval) => clearInterval(interval));
    this.pingIntervals.clear();
    this.states.clear();
    this.listeners = [];
  }
}
