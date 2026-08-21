import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Document } from '../../services/document/DocumentService';
import { PrintBridgeError } from '../../types/errors';

interface DocumentSelectScreenProps {
  documents: Document[];
  onSelectDocument: (document: Document) => void;
  onPickDocument: () => void;
  isLoading?: boolean;
  error?: PrintBridgeError;
}

export const DocumentSelectScreen: React.FC<DocumentSelectScreenProps> = ({
  documents,
  onSelectDocument,
  onPickDocument,
  isLoading = false,
  error,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectDocument = (doc: Document) => {
    setSelectedId(doc.id);
    onSelectDocument(doc);
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[
        styles.docItem,
        selectedId === item.id && styles.docItemSelected,
      ]}
      onPress={() => handleSelectDocument(item)}
    >
      <View style={styles.docInfo}>
        <Text style={styles.docName}>{item.name}</Text>
        <View style={styles.docMeta}>
          <Text style={styles.docType}>{item.metadata.type}</Text>
          <Text style={styles.docSize}>
            {(item.metadata.size / 1024 / 1024).toFixed(2)}MB
          </Text>
          {item.metadata.pageCount && (
            <Text style={styles.docPages}>
              {item.metadata.pageCount} pages
            </Text>
          )}
        </View>
      </View>
      {selectedId === item.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Document</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error.userMessage}</Text>
        </View>
      )}

      {isLoading && <ActivityIndicator size="large" color="#2196F3" />}

      {documents.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No documents selected. Pick a document to print.
          </Text>
        </View>
      )}

      {documents.length > 0 && (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}

      <TouchableOpacity style={styles.pickButton} onPress={onPickDocument}>
        <Text style={styles.pickButtonText}>
          {documents.length === 0 ? 'Pick Document' : '+ Add More'}
        </Text>
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
  docItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docItemSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  docType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  docSize: {
    fontSize: 12,
    color: '#999',
  },
  docPages: {
    fontSize: 12,
    color: '#999',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  pickButtonText: {
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
