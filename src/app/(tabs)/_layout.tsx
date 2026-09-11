import React from 'react';
import { Tabs } from 'expo-router';
import HeaderLockButton from '../../components/HeaderLockButton';
import { APP_NAME, COLORS } from '../../utils/constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerRight: () => <HeaderLockButton />,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}>
      <Tabs.Screen name="index" options={{ title: APP_NAME, tabBarLabel: '✨ Todos' }} />
      <Tabs.Screen name="fotos" options={{ title: 'Fotos', tabBarLabel: '🖼️ Fotos' }} />
      <Tabs.Screen name="videos" options={{ title: 'Videos', tabBarLabel: '🎬 Videos' }} />
      <Tabs.Screen name="documentos" options={{ title: 'Documentos', tabBarLabel: '📄 Documentos' }} />
      <Tabs.Screen name="seguros" options={{ title: 'Carpeta segura', tabBarLabel: '🔐 Seguros' }} />
    </Tabs>
  );
}
