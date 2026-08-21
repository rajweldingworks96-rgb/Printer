/**
 * PrintBridge Error Types
 * User-friendly error messages for all scenarios
 */

export enum ErrorCode {
  // Connection errors
  PRINTER_NOT_FOUND = 'PRINTER_NOT_FOUND',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  PRINTER_OFFLINE = 'PRINTER_OFFLINE',
  PRINTER_DISCONNECTED = 'PRINTER_DISCONNECTED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  
  // USB errors
  USB_PERMISSION_DENIED = 'USB_PERMISSION_DENIED',
  USB_DEVICE_REMOVED = 'USB_DEVICE_REMOVED',
  USB_NOT_SUPPORTED = 'USB_NOT_SUPPORTED',
  
  // Bluetooth errors
  BLUETOOTH_DISABLED = 'BLUETOOTH_DISABLED',
  BLUETOOTH_NOT_PAIRED = 'BLUETOOTH_NOT_PAIRED',
  BLUETOOTH_CONNECTION_FAILED = 'BLUETOOTH_CONNECTION_FAILED',
  
  // Wi-Fi errors
  WIFI_NOT_AVAILABLE = 'WIFI_NOT_AVAILABLE',
  WIFI_TIMEOUT = 'WIFI_TIMEOUT',
  
  // Printer state errors
  PRINTER_BUSY = 'PRINTER_BUSY',
  OUT_OF_PAPER = 'OUT_OF_PAPER',
  LOW_INK = 'LOW_INK',
  OUT_OF_INK = 'OUT_OF_INK',
  PAPER_JAM = 'PAPER_JAM',
  PRINTER_ERROR = 'PRINTER_ERROR',
  
  // Document errors
  INVALID_DOCUMENT = 'INVALID_DOCUMENT',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  DOCUMENT_TOO_LARGE = 'DOCUMENT_TOO_LARGE',
  CORRUPTED_DOCUMENT = 'CORRUPTED_DOCUMENT',
  
  // Job errors
  JOB_CANCELLED = 'JOB_CANCELLED',
  JOB_FAILED = 'JOB_FAILED',
  INVALID_JOB_SETTINGS = 'INVALID_JOB_SETTINGS',
  
  // System errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class PrintBridgeError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage: string,
    public details?: Record<string, any>,
    public recoverable: boolean = false,
  ) {
    super(message);
    this.name = 'PrintBridgeError';
  }

  static CONNECTION_FAILED(details?: any) {
    return new PrintBridgeError(
      ErrorCode.CONNECTION_FAILED,
      'Failed to connect to printer',
      'Printer connection failed. Check printer is powered on and in range.',
      details,
      true,
    );
  }

  static PRINTER_OFFLINE() {
    return new PrintBridgeError(
      ErrorCode.PRINTER_OFFLINE,
      'Printer is offline',
      'Printer is offline. Please turn on the printer and try again.',
      undefined,
      true,
    );
  }

  static USB_PERMISSION_DENIED() {
    return new PrintBridgeError(
      ErrorCode.USB_PERMISSION_DENIED,
      'USB permission denied',
      'USB permission denied. Please grant USB access permission.',
      undefined,
      true,
    );
  }

  static OUT_OF_PAPER() {
    return new PrintBridgeError(
      ErrorCode.OUT_OF_PAPER,
      'Printer out of paper',
      'Printer is out of paper. Add paper and try again.',
      undefined,
      true,
    );
  }

  static INVALID_DOCUMENT() {
    return new PrintBridgeError(
      ErrorCode.INVALID_DOCUMENT,
      'Invalid document',
      'Document format not supported or file is corrupted.',
      undefined,
      false,
    );
  }
}
