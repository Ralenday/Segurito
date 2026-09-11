import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

/** Botón de header que permite bloquear la app manualmente en cualquier momento. */
const HeaderLockButton: React.FC = () => {
  const { lock } = useAuth();
  return (
    <TouchableOpacity onPress={lock} style={styles.button} hitSlop={{ top: 8, bottom: 8, left: 8, right: 12 }}>
      <Text style={styles.icon}>🔒</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginRight: 16,
    padding: 4,
  },
  icon: {
    fontSize: 20,
    color: COLORS.textPrimary,
  },
});

export default HeaderLockButton;
