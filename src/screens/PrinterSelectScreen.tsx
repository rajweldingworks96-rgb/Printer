import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Printer, PrinterStatus } from '../../types/printer';
import { PrintBridgeError } from '../../types/errors';

interface PrinterSelectScreenProps {
  printers: Printer[];
  onSelectPrinter: (printer: Printer) => void;
  onAddPrinter: () => void;
  isLoading?: boolean;
  error?: PrintBridgeError;
}

export const PrinterSelectScreen: React.FC<PrinterSelectScreenProps> = ({
  printers,
  onSelectPrinter,
  onAddPrinter,
  isLoading = false,
  error,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getStatusColor = (status: PrinterStatus): string => {
    switch (status) {
      case PrinterStatus.CONNECTED:
        return '#4CAF50';
      case PrinterStatus.CONNECTING:
        return '#FFC107';
      case PrinterStatus.OFFLINE:
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: PrinterStatus): string => {
    switch (status) {
      case PrinterStatus.CONNECTED:
        return 'Ready';
      case PrinterStatus.CONNECTING:
        return 'Connecting...';
      case PrinterStatus.OFFLINE:
        return 'Offline';
      default:
        return 'Disconnected';
    }
  };

  const handleSelectPrinter = (printer: Printer) => {
    setSelectedId(printer.id);
    onSelectPrinter(printer);
  };

  const renderPrinterItem = ({ item }: { item: Printer }) => (
    <TouchableOpacity
      style={[
        styles.printerItem,
        selectedId === item.id && styles.printerItemSelected,
      ]}
      onPress={() => handleSelectPrinter(item)}
    >
      <View style={styles.printerInfo}>
        <Text style={styles.printerName}>{item.name}</Text>
        <Text style={styles.printerType}>{item.connectionType}</Text>
        {item.address && (
          <Text style={styles.printerAddress}>{item.address}</Text>
        )}
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Printer</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error.userMessage}</Text>
        </View>
      )}

      {isLoading && <ActivityIndicator size="large" color="#2196F3" />}

      {printers.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No printers added. Add a printer to get started.
          </Text>
        </View>
      )}

      {printers.length > 0 && (
        <FlatList
          data={printers}
          renderItem={renderPrinterItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={onAddPrinter}>
        <Text style={styles.addButtonText}>+ Add Printer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  printerItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  printerItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  printerType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  printerAddress: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
