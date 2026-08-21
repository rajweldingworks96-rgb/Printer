/**
 * Printer Manager
 * Manages printer inventory, configuration, and operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Printer,
  PrinterConnectionType,
  PrinterStatus,
  PrinterCapabilities,
} from '../../types/printer';
import { PrintBridgeError, ErrorCode } from '../../types/errors';

export interface PrinterManagerConfig {
  storePersistence?: PrinterStorage;
}

export interface PrinterStorage {
  savePrinter(printer: Printer): Promise<void>;
  getPrinter(id: string): Promise<Printer | null>;
  getAllPrinters(): Promise<Printer[]>;
  deletePrinter(id: string): Promise<void>;
  setDefaultPrinter(id: string): Promise<void>;
}

export class PrinterManager {
  private printers = new Map<string, Printer>();
  private defaultPrinterId: string | null = null;
  private storage?: PrinterStorage;
  private listeners: ((printer: Printer) => void)[] = [];

  constructor(config: PrinterManagerConfig = {}) {
    this.storage = config.storePersistence;
  }

  async initialize(): Promise<void> {
    if (this.storage) {
      try {
        const printers = await this.storage.getAllPrinters();
        printers.forEach((p) => this.printers.set(p.id, p));

        // Find default printer
        const defaultPrinter = printers.find((p) => p.isDefault);
        if (defaultPrinter) {
          this.defaultPrinterId = defaultPrinter.id;
        }
      } catch (error) {
        console.error('Failed to load printers from storage:', error);
      }
    }
  }

  async addPrinter(
    name: string,
    connectionType: PrinterConnectionType,
    address?: string,
    capabilities?: Partial<PrinterCapabilities>,
  ): Promise<Printer> {
    // Validate address based on connection type
    this.validateAddress(connectionType, address);

    const printer: Printer = {
      id: uuidv4(),
      name,
      connectionType,
      status: PrinterStatus.DISCONNECTED,
      address,
      capabilities: {
        maxPaperSizes: ['A4', 'Letter', 'A3'],
        maxResolutionDpi: 300,
        supportsDuplex: true,
        supportsColor: true,
        supportsCollation: false,
        supportsNUp: false,
        maxCopies: 999,
        supportedMediaTypes: ['plain', 'glossy'],
        ...capabilities,
      },
      isDefault: this.printers.size === 0, // First printer is default
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.printers.set(printer.id, printer);

    if (printer.isDefault) {
      this.defaultPrinterId = printer.id;
    }

    await this.persistPrinter(printer);
    this.notifyListeners(printer);

    return printer;
  }

  async removePrinter(printerId: string): Promise<void> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    this.printers.delete(printerId);

    if (this.defaultPrinterId === printerId) {
      this.defaultPrinterId = this.printers.values().next().value?.id || null;
    }

    if (this.storage) {
      await this.storage.deletePrinter(printerId);
    }
  }

  async renamePrinter(printerId: string, newName: string): Promise<Printer> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    printer.name = newName;
    printer.updatedAt = new Date();

    await this.persistPrinter(printer);
    this.notifyListeners(printer);

    return printer;
  }

  async updateCapabilities(
    printerId: string,
    capabilities: Partial<PrinterCapabilities>,
  ): Promise<Printer> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    printer.capabilities = { ...printer.capabilities, ...capabilities };
    printer.updatedAt = new Date();

    await this.persistPrinter(printer);
    this.notifyListeners(printer);

    return printer;
  }

  async setDefaultPrinter(printerId: string): Promise<void> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    // Update all printers
    this.printers.forEach((p) => {
      p.isDefault = p.id === printerId;
      p.updatedAt = new Date();
    });

    this.defaultPrinterId = printerId;

    if (this.storage) {
      await this.storage.setDefaultPrinter(printerId);
    }
  }

  getDefaultPrinter(): Printer | null {
    if (!this.defaultPrinterId) return null;
    return this.printers.get(this.defaultPrinterId) || null;
  }

  getPrinter(printerId: string): Printer | null {
    return this.printers.get(printerId) || null;
  }

  getAllPrinters(): Printer[] {
    return Array.from(this.printers.values());
  }

  getPrintersByType(type: PrinterConnectionType): Printer[] {
    return Array.from(this.printers.values()).filter(
      (p) => p.connectionType === type,
    );
  }

  subscribe(listener: (printer: Printer) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private validateAddress(
    connectionType: PrinterConnectionType,
    address?: string,
  ): void {
    if (connectionType === PrinterConnectionType.NETWORK_LAN) {
      if (!address) {
        throw new PrintBridgeError(
          ErrorCode.INVALID_ADDRESS,
          'Network printers require an IP address or hostname',
          'Please provide printer IP address or hostname',
          undefined,
          false,
        );
      }

      // Validate IP or hostname
      if (!this.isValidAddress(address)) {
        throw new PrintBridgeError(
          ErrorCode.INVALID_ADDRESS,
          `Invalid address: ${address}`,
          'Please enter a valid IP address or hostname',
          undefined,
          false,
        );
      }
    }
  }

  private isValidAddress(address: string): boolean {
    // Basic IP validation (IPv4)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(address)) {
      const parts = address.split('.').map(Number);
      return parts.every((p) => p >= 0 && p <= 255);
    }

    // Hostname validation
    const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostnamePattern.test(address);
  }

  private async persistPrinter(printer: Printer): Promise<void> {
    if (this.storage) {
      try {
        await this.storage.savePrinter(printer);
      } catch (error) {
        console.error('Failed to persist printer:', error);
      }
    }
  }

  private notifyListeners(printer: Printer): void {
    this.listeners.forEach((listener) => listener(printer));
  }
}
