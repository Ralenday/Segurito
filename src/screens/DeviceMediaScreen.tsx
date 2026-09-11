/**
 * DeviceMediaScreen
 * ------------------
 * Pantalla reutilizable para las pestañas "Todos", "Fotos" y "Videos".
 * Muestra en grilla el contenido que TODAVÍA está en la galería del
 * dispositivo y permite seleccionar varios elementos para "Ocultar en
 * Segurito" (mover a la carpeta segura).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import MediaLibraryService from '../services/MediaLibraryService';
import PermissionsService from '../services/PermissionsService';
import FileService from '../services/FileService';
import { setPendingPreview } from '../services/PreviewStore';
import MediaGridItem from '../components/MediaGridItem';
import SelectionActionBar from '../components/SelectionActionBar';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../utils/constants';
import { DeviceMediaItem, LibraryFilter } from '../types';

interface Props {
  filter: LibraryFilter;
  emptyTitle: string;
  emptySubtitle: string;
}

const DeviceMediaScreen: React.FC<Props> = ({ filter, emptyTitle, emptySubtitle }) => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [items, setItems] = useState<DeviceMediaItem[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const page = await MediaLibraryService.getPage(filter, 0);
      setItems(page.items);
      setHasNextPage(page.hasNextPage);
    } catch (error) {
      Alert.alert('Error', `No se pudo cargar la galería: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const requestPermission = useCallback(async () => {
    const granted = await PermissionsService.ensureMediaLibraryPermission();
    setPermissionGranted(granted);
    if (granted) {
      loadFirstPage();
    }
  }, [loadFirstPage]);

  useEffect(() => {
    // Carga inicial disparada al montar/cambiar de pestaña: es intencional
    // que `requestPermission` (async) actualice el estado desde aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loading) return;
    setLoading(true);
    try {
      const page = await MediaLibraryService.getPage(filter, items.length);
      setItems(prev => [...prev, ...page.items]);
      setHasNextPage(page.hasNextPage);
    } finally {
      setLoading(false);
    }
  }, [filter, items.length, hasNextPage, loading]);

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

  const handlePress = (item: DeviceMediaItem) => {
    if (selected.size > 0) {
      toggleSelect(item.id);
      return;
    }
    setPendingPreview({ source: 'device', item });
    router.push('/preview');
  };

  const handleHideSelected = () => {
    const chosen = items.filter(item => selected.has(item.id));
    if (chosen.length === 0) return;
    Alert.alert(
      'Ocultar en Segurito',
      `${chosen.length} elemento(s) se moverán a tu carpeta segura y desaparecerán de la galería del dispositivo. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ocultar',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const result = await FileService.hideDeviceMedia(chosen);
              setItems(prev => prev.filter(item => !selected.has(item.id)));
              setSelected(new Set());
              const summary = `Ocultados: ${result.successCount}. Fallidos: ${result.failedCount}.`;
              Alert.alert(
                'Listo',
                result.warnings.length > 0 ? `${summary}\n\n${result.warnings.join('\n')}` : summary,
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  if (permissionGranted === false) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="🔐"
          title="Permiso necesario"
          subtitle="Segurito necesita acceso a tus fotos y videos para poder ocultarlos en tu carpeta segura."
        />
        <PrimaryButton label="Conceder permiso" onPress={requestPermission} style={styles.permissionButton} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={itm => itm.id}
        numColumns={3}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFirstPage();
            }}
            tintColor={COLORS.primary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListEmptyComponent={
          !loading ? <EmptyState icon="🖼️" title={emptyTitle} subtitle={emptySubtitle} /> : <></>
        }
        renderItem={({ item }) => (
          <MediaGridItem
            uri={item.uri}
            kind={item.kind}
            filename={item.filename}
            durationMs={item.durationMs}
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
        actions={[{ label: 'Ocultar en Segurito', icon: '🔒', onPress: handleHideSelected }]}
      />

      <LoadingOverlay visible={processing} message="Moviendo a tu carpeta segura…" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 2,
    paddingBottom: 40,
  },
  emptyContent: {
    flexGrow: 1,
  },
  permissionButton: {
    marginTop: 8,
  },
});

export default DeviceMediaScreen;
