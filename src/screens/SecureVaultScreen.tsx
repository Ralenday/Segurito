/**
 * SecureVaultScreen
 * ------------------
 * Muestra todo lo que vive dentro de la carpeta segura de Segurito (fotos,
 * videos y documentos ocultados). Desde aquí se puede ver cada archivo,
 * restaurarlo al dispositivo o borrarlo definitivamente.
 */
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import StorageService from '../services/StorageService';
import FileService from '../services/FileService';
import { setPendingPreview } from '../services/PreviewStore';
import MediaGridItem from '../components/MediaGridItem';
import SelectionActionBar from '../components/SelectionActionBar';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS } from '../utils/constants';
import { VaultItemMeta } from '../types';

const SecureVaultScreen: React.FC = () => {
  const [items, setItems] = useState<VaultItemMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await StorageService.getAll();
      setItems(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePress = (item: VaultItemMeta) => {
    if (selected.size > 0) {
      toggleSelect(item.id);
      return;
    }
    setPendingPreview({ source: 'vault', item });
    router.push('/preview');
  };

  const restoreSelected = () => {
    const chosen = items.filter(item => selected.has(item.id));
    if (chosen.length === 0) return;
    Alert.alert(
      'Restaurar archivos',
      `${chosen.length} elemento(s) volverán a la galería/archivos del dispositivo y dejarán de estar en Segurito. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          onPress: async () => {
            setProcessingMessage('Restaurando…');
            setProcessing(true);
            const warnings: string[] = [];
            let successCount = 0;
            for (const item of chosen) {
              const outcome = await FileService.restoreItem(item);
              if (outcome.success) {
                successCount += 1;
              } else {
                warnings.push(`No se pudo restaurar "${item.originalName}": ${outcome.warning}`);
              }
            }
            setSelected(new Set());
            await load();
            setProcessing(false);
            Alert.alert(
              'Listo',
              warnings.length > 0
                ? `Restaurados: ${successCount}.\n\n${warnings.join('\n')}`
                : `Restaurados: ${successCount}.`,
            );
          },
        },
      ],
    );
  };

  const deleteSelected = () => {
    const chosen = items.filter(item => selected.has(item.id));
    if (chosen.length === 0) return;
    Alert.alert(
      'Eliminar definitivamente',
      `${chosen.length} elemento(s) se borrarán para siempre de Segurito. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setProcessingMessage('Eliminando…');
            setProcessing(true);
            for (const item of chosen) {
              await FileService.deletePermanently(item);
            }
            setSelected(new Set());
            await load();
            setProcessing(false);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        numColumns={3}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🔐"
              title="Tu carpeta segura está vacía"
              subtitle='Oculta fotos, videos o documentos desde las otras pestañas usando "Ocultar en Segurito".'
            />
          ) : (
            <></>
          )
        }
        renderItem={({ item }) => (
          <MediaGridItem
            uri={item.vaultPath}
            kind={item.kind}
            filename={item.originalName}
            selectionMode={selected.size > 0}
            selected={selected.has(item.id)}
            onPress={() => handlePress(item)}
            onLongPress={() => toggleSelect(item.id)}
          />
        )}
      />

      <SelectionActionBar
        selectedCount={selected.size}
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: 'Restaurar', icon: '↩️', onPress: restoreSelected },
          { label: 'Eliminar', icon: '🗑️', onPress: deleteSelected, destructive: true },
        ]}
      />

      <LoadingOverlay visible={processing} message={processingMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 2,
    paddingBottom: 40,
  },
  emptyContent: {
    flexGrow: 1,
  },
});

export default SecureVaultScreen;
