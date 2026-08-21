import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { PrintSettings } from '../../types/printJob';
import { PrinterCapabilities } from '../../types/printer';

interface PrintSettingsScreenProps {
  capabilities: PrinterCapabilities;
  onSettingsChange: (settings: PrintSettings) => void;
  initialSettings?: PrintSettings;
}

export const PrintSettingsScreen: React.FC<PrintSettingsScreenProps> = ({
  capabilities,
  onSettingsChange,
  initialSettings,
}) => {
  const [settings, setSettings] = useState<PrintSettings>({
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
    ...initialSettings,
  });

  const updateSetting = (updates: Partial<PrintSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Print Settings</Text>

      {/* Copies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Copies</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.numberInput}
            value={settings.copies.toString()}
            onChangeText={(val) => {
              const num = parseInt(val) || 1;
              updateSetting({ copies: Math.min(num, capabilities.maxCopies) });
            }}
            keyboardType="number-pad"
          />
          <Text style={styles.inputLabel}>
            (Max: {capabilities.maxCopies})
          </Text>
        </View>
      </View>

      {/* Paper Size */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paper Size</Text>
        {capabilities.maxPaperSizes.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.optionButton,
              settings.paperSize === size && styles.optionButtonSelected,
            ]}
            onPress={() => updateSetting({ paperSize: size as any })}
          >
            <Text
              style={[
                styles.optionText,
                settings.paperSize === size && styles.optionTextSelected,
              ]}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orientation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orientation</Text>
        {(['portrait', 'landscape'] as const).map((orient) => (
          <TouchableOpacity
            key={orient}
            style={[
              styles.optionButton,
              settings.orientation === orient && styles.optionButtonSelected,
            ]}
            onPress={() => updateSetting({ orientation: orient })}
          >
            <Text
              style={[
                styles.optionText,
                settings.orientation === orient &&
                  styles.optionTextSelected,
              ]}
            >
              {orient.charAt(0).toUpperCase() + orient.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Color Mode */}
      {capabilities.supportsColor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Mode</Text>
          {(['color', 'grayscale'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.optionButton,
                settings.colorMode === mode && styles.optionButtonSelected,
              ]}
              onPress={() => updateSetting({ colorMode: mode })}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.colorMode === mode && styles.optionTextSelected,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quality */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality</Text>
        {(['draft', 'normal', 'high'] as const).map((qual) => (
          <TouchableOpacity
            key={qual}
            style={[
              styles.optionButton,
              settings.quality === qual && styles.optionButtonSelected,
            ]}
            onPress={() => updateSetting({ quality: qual })}
          >
            <Text
              style={[
                styles.optionText,
                settings.quality === qual && styles.optionTextSelected,
              ]}
            >
              {qual.charAt(0).toUpperCase() + qual.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duplex */}
      {capabilities.supportsDuplex && (
        <View style={styles.toggleSection}>
          <Text style={styles.sectionTitle}>Duplex (Double-sided)</Text>
          <Switch
            value={settings.duplex}
            onValueChange={(val) => updateSetting({ duplex: val })}
          />
        </View>
      )}

      {/* Collate */}
      {capabilities.supportsCollation && settings.copies > 1 && (
        <View style={styles.toggleSection}>
          <Text style={styles.sectionTitle}>Collate</Text>
          <Switch
            value={settings.collate}
            onValueChange={(val) => updateSetting({ collate: val })}
          />
        </View>
      )}

      {/* Scaling */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scaling</Text>
        {(['none', 'fit-to-page', 'actual-size'] as const).map((scale) => (
          <TouchableOpacity
            key={scale}
            style={[
              styles.optionButton,
              settings.scaling === scale && styles.optionButtonSelected,
            ]}
            onPress={() => updateSetting({ scaling: scale })}
          >
            <Text
              style={[
                styles.optionText,
                settings.scaling === scale && styles.optionTextSelected,
              ]}
            >
              {scale.charAt(0).toUpperCase() + scale.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#999',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
});
