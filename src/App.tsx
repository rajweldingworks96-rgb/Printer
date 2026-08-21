/**
 * PrintBridge Application
 * Main entry point for the React Native application
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { PrinterService } from './services/printer/PrinterService';
import { PrintQueueManager } from './services/print/PrintQueueManager';
import { JobStateManager } from './services/print/JobStateManager';
import { QueueProcessor } from './services/print/QueueProcessor';
import { ConnectionManager } from './services/connection/ConnectionManager';
import { DocumentService } from './services/document/DocumentService';
import { PrinterSelectScreen } from './screens/PrinterSelectScreen';
import { Printer } from './types/printer';
import { PrintBridgeError } from './types/errors';

type AppScreen = 'printer-select' | 'document-select' | 'print-settings' | 'print-progress';

interface AppState {
  screen: AppScreen;
  selectedPrinter: Printer | null;
  isLoading: boolean;
  error: PrintBridgeError | null;
}

const PrintBridgeApp: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    screen: 'printer-select',
    selectedPrinter: null,
    isLoading: true,
    error: null,
  });

  const [printerService, setPrinterService] = useState<PrinterService | null>(null);
  const [queueManager, setQueueManager] = useState<PrintQueueManager | null>(null);
  const [documentService] = useState(new DocumentService());

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const connectionManager = new ConnectionManager();
        const printerSvc = new PrinterService(connectionManager);
        await printerSvc.initialize();
        setPrinterService(printerSvc);

        const stateManager = new JobStateManager();
        const queueProcessor = new QueueProcessor(stateManager);
        const queueMgr = new PrintQueueManager(
          stateManager,
          queueProcessor,
        );
        await queueMgr.initialize();
        setQueueManager(queueMgr);

        setAppState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        const err =
          error instanceof PrintBridgeError
            ? error
            : new PrintBridgeError(
                'INTERNAL_ERROR' as any,
                'Failed to initialize app',
                'Could not initialize PrintBridge. Please restart the app.',
              );
        setAppState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
        }));
      }
    };

    initializeServices();
  }, []);

  const handleSelectPrinter = (printer: Printer) => {
    setAppState((prev) => ({
      ...prev,
      selectedPrinter: printer,
      screen: 'document-select',
    }));
  };

  const handleAddPrinter = () => {
    Alert.alert('Add Printer', 'Open printer discovery');
  };

  const handleError = (error: PrintBridgeError) => {
    setAppState((prev) => ({ ...prev, error }));
  };

  const handleDismissError = () => {
    setAppState((prev) => ({ ...prev, error: null }));
  };

  if (appState.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing PrintBridge...</Text>
      </View>
    );
  }

  if (appState.error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{appState.error.userMessage}</Text>
          <Text
            style={styles.retryButton}
            onPress={() => setAppState((prev) => ({ ...prev, error: null }))}
          >
            Dismiss
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {appState.screen === 'printer-select' && printerService && (
        <PrinterSelectScreen
          printers={printerService.getAllPrinters()}
          onSelectPrinter={handleSelectPrinter}
          onAddPrinter={handleAddPrinter}
          error={appState.error || undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  retryButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrintBridgeApp;
