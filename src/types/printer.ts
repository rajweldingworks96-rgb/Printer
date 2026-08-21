/**
 * Printer Types & Definitions
 */

export enum PrinterConnectionType {
  USB_OTG = 'usb_otg',
  BLUETOOTH = 'bluetooth',
  WIFI = 'wifi',
  WIFI_DIRECT = 'wifi_direct',
  NETWORK_LAN = 'network_lan',
}

export enum PrinterStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export interface PrinterCapabilities {
  maxPaperSizes: string[];
  maxResolutionDpi: number;
  supportsDuplex: boolean;
  supportsColor: boolean;
  supportsCollation: boolean;
  supportsNUp: boolean;
  maxCopies: number;
  supportedMediaTypes: string[];
}

export interface Printer {
  id: string;
  name: string;
  connectionType: PrinterConnectionType;
  status: PrinterStatus;
  address?: string; // IP, hostname, or device address
  port?: number;
  bluetoothAddress?: string;
  usbDeviceId?: string;
  capabilities: PrinterCapabilities;
  lastConnected?: Date;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrinterConnection {
  printer: Printer;
  isConnected: boolean;
  connectionAttempts: number;
  lastError?: Error;
  lastErrorTime?: Date;
}
