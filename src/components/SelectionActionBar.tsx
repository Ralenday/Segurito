import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../utils/constants';

interface Action {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  selectedCount: number;
  onCancel: () => void;
  actions: Action[];
}

const SelectionActionBar: React.FC<Props> = ({ selectedCount, onCancel, actions }) => {
  if (selectedCount === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.count}>{selectedCount} seleccionado(s)</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.actions}>
        {actions.map(action => (
          <TouchableOpacity key={action.label} style={styles.actionButton} onPress={action.onPress}>
            {action.icon ? <Text style={styles.actionIcon}>{action.icon}</Text> : null}
            <Text style={[styles.actionLabel, action.destructive && styles.destructive]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 24,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  cancel: {
    color: COLORS.primary,
    fontSize: 15,
    width: 64,
  },
  spacer: {
    width: 64,
  },
  count: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  destructive: {
    color: COLORS.danger,
  },
});

export default SelectionActionBar;
