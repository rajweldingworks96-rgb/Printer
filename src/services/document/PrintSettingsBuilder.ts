/**
 * Print Settings Builder
 * Builds and validates print settings
 */

import { PrintSettings } from '../../types/printJob';
import { PrinterCapabilities } from '../../types/printer';
import { PrintBridgeError, ErrorCode } from '../../types/errors';

export class PrintSettingsBuilder {
  private settings: PrintSettings;
  private capabilities: PrinterCapabilities;

  constructor(capabilities: PrinterCapabilities) {
    this.capabilities = capabilities;
    this.settings = this.getDefaults();
  }

  private getDefaults(): PrintSettings {
    return {
      copies: 1,
      paperSize: 'A4',
      orientation: 'portrait',
      colorMode: 'color',
      quality: 'normal',
      duplex: false,
      collate: false,
      scaling: 'fit-to-page',
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
      borderless: false,
    };
  }

  setCopies(copies: number): this {
    if (copies < 1 || copies > this.capabilities.maxCopies) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        `Copies must be between 1 and ${this.capabilities.maxCopies}`,
        `Invalid number of copies. Max: ${this.capabilities.maxCopies}`,
        undefined,
        false,
      );
    }
    this.settings.copies = copies;
    return this;
  }

  setPaperSize(
    size: 'A4' | 'Letter' | 'A3' | 'Legal' | 'Custom',
  ): this {
    if (!this.capabilities.maxPaperSizes.includes(size)) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        `Paper size ${size} not supported`,
        `Printer does not support ${size}. Supported: ${this.capabilities.maxPaperSizes.join(', ')}`,
        undefined,
        false,
      );
    }
    this.settings.paperSize = size;
    return this;
  }

  setOrientation(orientation: 'portrait' | 'landscape'): this {
    this.settings.orientation = orientation;
    return this;
  }

  setColorMode(mode: 'color' | 'grayscale' | 'bw'): this {
    if (mode === 'color' && !this.capabilities.supportsColor) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        'Color mode not supported',
        'Printer does not support color printing',
        undefined,
        false,
      );
    }
    this.settings.colorMode = mode;
    return this;
  }

  setQuality(quality: 'draft' | 'normal' | 'high'): this {
    this.settings.quality = quality;
    return this;
  }

  setDuplex(enabled: boolean): this {
    if (enabled && !this.capabilities.supportsDuplex) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        'Duplex not supported',
        'Printer does not support duplex printing',
        undefined,
        false,
      );
    }
    this.settings.duplex = enabled;
    return this;
  }

  setCollate(enabled: boolean): this {
    if (enabled && !this.capabilities.supportsCollation) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        'Collation not supported',
        'Printer does not support collation',
        undefined,
        false,
      );
    }
    this.settings.collate = enabled;
    return this;
  }

  setNUp(pages: number): this {
    if (!this.capabilities.supportsNUp) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        'N-up printing not supported',
        'Printer does not support multiple pages per sheet',
        undefined,
        false,
      );
    }
    if (![2, 4, 6, 9, 16].includes(pages)) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        `Invalid N-up value: ${pages}`,
        'N-up must be 2, 4, 6, 9, or 16',
        undefined,
        false,
      );
    }
    this.settings.nUp = pages;
    return this;
  }

  setScaling(scaling: 'none' | 'fit-to-page' | 'actual-size'): this {
    this.settings.scaling = scaling;
    return this;
  }

  setMargins(
    top: number,
    bottom: number,
    left: number,
    right: number,
  ): this {
    if (top < 0 || bottom < 0 || left < 0 || right < 0) {
      throw new PrintBridgeError(
        ErrorCode.INVALID_JOB_SETTINGS,
        'Margins cannot be negative',
        'Margins must be positive values',
        undefined,
        false,
      );
    }
    this.settings.margins = { top, bottom, left, right };
    return this;
  }

  setBorderless(enabled: boolean): this {
    this.settings.borderless = enabled;
    return this;
  }

  setPageRange(range: string): this {
    this.settings.pageRange = range;
    return this;
  }

  build(): PrintSettings {
    return { ...this.settings };
  }

  reset(): this {
    this.settings = this.getDefaults();
    return this;
  }
}
