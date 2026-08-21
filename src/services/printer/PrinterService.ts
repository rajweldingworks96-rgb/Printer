/**
 * Printer Service (Main)
 * Orchestrates all printer-related operations
 */

import {
  Printer,
  PrinterConnectionType,
  PrinterCapabilities,
} from '../../types/printer';
import { PrinterManager, PrinterStorage } from './PrinterManager';
import { PrinterDiscoveryService } from './PrinterDiscoveryService';
import { PrinterOperationsService } from './PrinterOperationsService';
import { ConnectionManager } from '../connection/ConnectionManager';

export class PrinterService {
  private printerManager: PrinterManager;
  private discoveryService: PrinterDiscoveryService;
  private operationsService: PrinterOperationsService;
  private connectionManager: ConnectionManager;

  constructor(
    connectionManager: ConnectionManager,
    storage?: PrinterStorage,
  ) {
    this.connectionManager = connectionManager;
    this.printerManager = new PrinterManager({ storePersistence: storage });
    this.discoveryService = new PrinterDiscoveryService();
    this.operationsService = new PrinterOperationsService(connectionManager);
  }

  async initialize(): Promise<void> {
    await this.printerManager.initialize();
  }

  // Printer Management
  async addPrinter(
    name: string,
    connectionType: PrinterConnectionType,
    address?: string,
    capabilities?: Partial<PrinterCapabilities>,
  ): Promise<Printer> {
    return this.printerManager.addPrinter(
      name,
      connectionType,
      address,
      capabilities,
    );
  }

  async removePrinter(printerId: string): Promise<void> {
    await this.connectionManager.disconnect(printerId);
    await this.printerManager.removePrinter(printerId);
  }

  async renamePrinter(printerId: string, newName: string): Promise<Printer> {
    return this.printerManager.renamePrinter(printerId, newName);
  }

  async setDefaultPrinter(printerId: string): Promise<void> {
    await this.printerManager.setDefaultPrinter(printerId);
  }

  getDefaultPrinter(): Printer | null {
    return this.printerManager.getDefaultPrinter();
  }

  getPrinter(printerId: string): Printer | null {
    return this.printerManager.getPrinter(printerId);
  }

  getAllPrinters(): Printer[] {
    return this.printerManager.getAllPrinters();
  }

  getPrintersByType(type: PrinterConnectionType): Printer[] {
    return this.printerManager.getPrintersByType(type);
  }

  // Discovery
  discoverNetworkPrinters(timeout?: number) {
    return this.discoveryService.discoverNetworkPrinters({ timeout });
  }

  discoverBluetoothPrinters(timeout?: number) {
    return this.discoveryService.discoverBluetoothPrinters({ timeout });
  }

  discoverUSBPrinters() {
    return this.discoveryService.discoverUSBPrinters();
  }

  discoverAllPrinters(timeout?: number) {
    return this.discoveryService.discoverAllPrinters({ timeout });
  }

  // Operations
  async testConnection(printer: Printer): Promise<boolean> {
    return this.operationsService.testConnection(printer);
  }

  async printTestPage(printer: Printer): Promise<void> {
    return this.operationsService.printTestPage(printer);
  }

  async queryCapabilities(printer: Printer): Promise<any> {
    return this.operationsService.queryCapabilities(printer);
  }

  async getPrinterStatus(printer: Printer): Promise<any> {
    return this.operationsService.getPrinterStatus(printer);
  }

  // Connection
  async connectPrinter(printer: Printer): Promise<boolean> {
    return this.connectionManager.connect(printer);
  }

  async disconnectPrinter(printerId: string): Promise<void> {
    return this.connectionManager.disconnect(printerId);
  }

  async reconnectPrinter(printer: Printer): Promise<boolean> {
    return this.connectionManager.reconnect(printer);
  }

  getPrinterConnectionState(printerId: string) {
    return this.connectionManager.getState(printerId);
  }

  isPrinterConnected(printerId: string): boolean {
    return this.connectionManager.isConnected(printerId);
  }

  onPrinterChange(listener: (printer: Printer) => void): () => void {
    return () => {}; // Would connect to printerManager listener
  }

  onConnectionStateChange(
    listener: (state: any) => void,
  ): () => void {
    return this.connectionManager.onStateChange(listener);
  }

  dispose(): void {
    this.connectionManager.dispose();
  }
}
