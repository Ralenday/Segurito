/**
 * LockScreen
 * ----------
 * Pantalla de bloqueo obligatoria. La app SIEMPRE arranca aquí (ver
 * `src/app/_layout.tsx`) y sólo se revela el contenido después de un
 * `authenticateAsync` biométrico exitoso, siguiendo el flujo recomendado
 * por `expo-local-authentication`:
 *   1. `hasHardwareAsync()` + `isEnrolledAsync()` → saber si hay sensor
 *      disponible y con datos biométricos registrados.
 *   2. `authenticateAsync()` → mostrar el diálogo nativo y esperar el
 *      resultado.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import BiometricService, { BiometryKind } from '../services/BiometricService';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { APP_NAME, COLORS } from '../utils/constants';

const LockScreen: React.FC = () => {
  const { unlock } = useAuth();
  const [checkingSensor, setCheckingSensor] = useState(true);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryKind | undefined>();
  const [authenticating, setAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const detectSensor = useCallback(async () => {
    setCheckingSensor(true);
    const info = await BiometricService.isSensorAvailable();
    setSensorAvailable(info.available);
    setBiometryType(info.biometryType);
    if (!info.available) {
      setErrorMessage(info.error);
    }
    setCheckingSensor(false);
  }, []);

  useEffect(() => {
    // Detección inicial del sensor al montar la pantalla de bloqueo: es
    // intencional que `detectSensor` (async) actualice el estado desde aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    detectSensor();
  }, [detectSensor]);

  const handleUnlock = useCallback(async () => {
    setErrorMessage(undefined);
    setAuthenticating(true);
    try {
      const result = await BiometricService.authenticate(`Desbloquea ${APP_NAME}`);
      if (result.success) {
        unlock();
      } else if (result.error) {
        setErrorMessage(result.error);
      }
    } finally {
      setAuthenticating(false);
    }
  }, [unlock]);

  const biometryLabel = BiometricService.labelForBiometryType(biometryType);

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🔒</Text>
        </View>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.tagline}>Tu carpeta privada de fotos, videos y documentos</Text>
      </View>

      <View style={styles.actionArea}>
        {checkingSensor ? (
          <ActivityIndicator color={COLORS.primary} size="large" />
        ) : (
          <>
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
            <PrimaryButton
              label={
                authenticating
                  ? 'Verificando…'
                  : sensorAvailable
                  ? `Desbloquear con ${biometryLabel}`
                  : 'Reintentar'
              }
              onPress={sensorAvailable ? handleUnlock : detectSensor}
              loading={authenticating}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  brand: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  actionArea: {
    alignItems: 'center',
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default LockScreen;
