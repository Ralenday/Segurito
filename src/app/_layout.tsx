/**
 * Layout raíz de Segurito (expo-router).
 * -------------------------------------
 * Responsabilidades:
 *  - Inicializar la carpeta segura en el sandbox de la app (FileService.init).
 *  - Envolver todo con los providers necesarios (gestos, área segura,
 *    estado de autenticación).
 *  - Decidir si se muestra la pantalla de bloqueo o el resto de la app
 *    (pestañas + vista previa modal), según `AuthContext.isUnlocked`. Este
 *    "gate" a nivel de layout raíz bloquea TODAS las rutas por igual, sin
 *    tener que proteger cada pantalla por separado.
 */
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LockScreen from '../screens/LockScreen';
import FileService from '../services/FileService';
import { COLORS } from '../utils/constants';

function Gate() {
  const { isUnlocked } = useAuth();

  useEffect(() => {
    FileService.init();
  }, []);

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="preview"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AuthProvider>
          <View style={styles.flex}>
            <StatusBar barStyle="light-content" />
            <Gate />
          </View>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
});
