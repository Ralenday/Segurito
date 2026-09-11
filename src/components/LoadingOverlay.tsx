import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

interface Props {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<Props> = ({ visible, message }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 160,
  },
  message: {
    marginTop: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
