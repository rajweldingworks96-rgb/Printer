import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { PrintBridgeError } from '../../types/errors';

interface ErrorDialogProps {
  error: PrintBridgeError;
  onDismiss: () => void;
  onRetry?: () => void;
  onDetails?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  error,
  onDismiss,
  onRetry,
  onDetails,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        <Text style={styles.title}>Something went wrong</Text>

        <Text style={styles.message}>{error.userMessage}</Text>

        {error.details && onDetails && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={onDetails}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttonContainer}>
          {error.recoverable && onRetry && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#2196F3',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#f5f5f5',
  },
  dismissButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});
