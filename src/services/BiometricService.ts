/**
 * BiometricService
 * -----------------
 * Envuelve `expo-local-authentication`, el módulo del SDK de Expo para
 * biometría (equivalente Expo de `react-native-biometrics`):
 *   - `hasHardwareAsync()` + `supportedAuthenticationTypesAsync()` para
 *     detectar si hay sensor y de qué tipo (huella / reconocimiento facial).
 *   - `authenticateAsync()` para mostrar el diálogo nativo y autenticar.
 *
 * API verificada contra expo-local-authentication@57 (ver node_modules) tal
 * como pide AGENTS.md del proyecto ("Expo HAS CHANGED").
 */
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometryKind = 'facial' | 'fingerprint' | 'iris' | 'unknown';

export interface SensorInfo {
  available: boolean;
  biometryType?: BiometryKind;
  error?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

function mapAuthenticationType(types: LocalAuthentication.AuthenticationType[]): BiometryKind {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'unknown';
}

const BiometricService = {
  /**
   * Detecta si el dispositivo tiene un sensor biométrico disponible, si el
   * usuario tiene datos biométricos registrados, y de qué tipo es el sensor.
   */
  async isSensorAvailable(): Promise<SensorInfo> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { available: false, error: 'Este dispositivo no tiene sensor biométrico.' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return {
          available: false,
          error: 'No hay huellas ni Face ID configurados. Actívalos en Ajustes del sistema.',
        };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return { available: true, biometryType: mapAuthenticationType(types) };
    } catch (error) {
      return { available: false, error: (error as Error).message };
    }
  },

  /** Etiqueta legible del tipo de sensor, para mostrar en la UI de la pantalla de bloqueo. */
  labelForBiometryType(biometryType?: BiometryKind): string {
    switch (biometryType) {
      case 'facial':
        return 'Face ID';
      case 'fingerprint':
        return 'huella digital';
      case 'iris':
        return 'reconocimiento de iris';
      default:
        return 'biometría';
    }
  },

  /**
   * Lanza el prompt nativo de biometría. Devuelve success=true sólo si el
   * usuario se autenticó correctamente; success=false con un código de error
   * si canceló o falló (huella no reconocida, bloqueo por intentos, etc.).
   */
  async authenticate(promptMessage = 'Desbloquea la app'): Promise<AuthResult> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  },
};

export default BiometricService;
