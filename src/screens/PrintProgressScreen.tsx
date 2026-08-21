import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { PrintJob } from '../../types/printJob';

interface PrintProgressScreenProps {
  job: PrintJob;
  onCancel: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export const PrintProgressScreen: React.FC<PrintProgressScreenProps> = ({
  job,
  onCancel,
  onPause,
  onResume,
}) => {
  const progressPercent = Math.round(job.progress);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Printing...</Text>

      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>{progressPercent}%</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${job.progress}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusValue}>{job.state}</Text>
      </View>

      <View style={styles.detailsSection}>
        <DetailRow
          label="Printed Pages"
          value={`${job.printedPages} / ${job.totalPages}`}
        />
        <DetailRow label="Copies" value={job.settings.copies.toString()} />
        <DetailRow label="Quality" value={job.settings.quality} />
        {job.settings.duplex && (
          <DetailRow label="Duplex" value="Yes" />
        )}
      </View>

      <View style={styles.buttonSection}>
        {onPause && (
          <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
            <Text style={styles.pauseButtonText}>Pause</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  statusSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  detailsSection: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonSection: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFC107',
    borderRadius: 8,
    alignItems: 'center',
  },
  pauseButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
