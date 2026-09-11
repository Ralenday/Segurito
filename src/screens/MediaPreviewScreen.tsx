/**
 * MediaPreviewScreen
 * -------------------
 * Vista de pantalla completa para un elemento, ya sea que todavía esté en
 * el dispositivo (`source: 'device'`) o que ya viva en la carpeta segura
 * (`source: 'vault'`). Ofrece la acción principal correspondiente:
 * "Ocultar en Segurito" para los primeros, "Restaurar" / "Eliminar" para
 * los segundos.
 *
 * El objeto completo del elemento se recibe vía `PreviewStore` (dejado ahí
 * justo antes de navegar) en lugar de parámetros de ruta, porque
 * expo-router serializa los parámetros como texto en la URL.
 */
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import FileService from '../services/FileService';
import { PreviewParams, takePendingPreview } from '../services/PreviewStore';
import PrimaryButton from '../components/PrimaryButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS } from '../utils/constants';
import { formatBytes, formatDate } from '../utils/formatters';

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => {
    p.loop = false;
  });
  return <VideoView style={styles.media} player={player} nativeControls contentFit="contain" />;
}

/**
 * Vuelve a la pantalla anterior solo si expo-router tiene algo en el
 * historial. Sin esta comprobación, `router.back()` dispara el warning
 * "The action 'GO_BACK' was not handled by any navigator" cuando /preview
 * quedó como única pantalla en el stack (por ejemplo, si el usuario ya
 * presionó "atrás" del sistema mientras el Alert de confirmación seguía
 * abierto, y el callback async llega después con el stack ya vacío).
 */
function goBackSafely() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

const MediaPreviewScreen: React.FC = () => {
  const [params, setParams] = useState<PreviewParams | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Recoge el elemento dejado en PreviewStore justo antes de navegar aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams(takePendingPreview());
  }, []);

  if (!params) {
    return <View style={styles.container} />;
  }

  const { source, item } = params;
  const uri = source === 'device' ? item.uri : item.vaultPath;
  const filename = source === 'device' ? item.filename : item.originalName;
  const kind = item.kind;

  const handleHide = () => {
    if (source !== 'device') return;
    Alert.alert('Ocultar en Segurito', `"${filename}" se moverá a tu carpeta segura. ¿Continuar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ocultar',
        onPress: async () => {
          setProcessing(true);
          const result = await FileService.hideDeviceMedia([item]);
          setProcessing(false);
          goBackSafely();
          Alert.alert(
            'Listo',
            result.warnings.length > 0
              ? result.warnings.join('\n')
              : `"${filename}" se ocultó correctamente.`,
          );
        },
      },
    ]);
  };

  const handleRestore = () => {
    if (source !== 'vault') return;
    Alert.alert('Restaurar archivo', `"${filename}" volverá al dispositivo. ¿Continuar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: async () => {
          setProcessing(true);
          const outcome = await FileService.restoreItem(item);
          setProcessing(false);
          if (outcome.success) {
            goBackSafely();
          } else {
            Alert.alert('No se pudo restaurar', outcome.warning ?? 'Error desconocido');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (source !== 'vault') return;
    Alert.alert('Eliminar definitivamente', `"${filename}" se borrará para siempre. ¿Continuar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          await FileService.deletePermanently(item);
          setProcessing(false);
          goBackSafely();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mediaArea}>
        {kind === 'document' ? (
          <View style={styles.documentPreview}>
            <Text style={styles.documentIcon}>📄</Text>
            <Text style={styles.documentName}>{filename}</Text>
          </View>
        ) : kind === 'video' ? (
          <VideoPreview uri={uri} />
        ) : (
          <Image source={{ uri }} style={styles.media} contentFit="contain" />
        )}
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText} numberOfLines={1}>
          {filename}
        </Text>
        <Text style={styles.infoSubtext}>
          {source === 'vault'
            ? `Oculto el ${formatDate(item.hiddenAt)} · ${formatBytes(item.size)}`
            : formatBytes(item.size)}
        </Text>
        {source === 'vault' && !item.originalDeleted && item.kind !== 'document' ? (
          <Text style={styles.warningText}>
            ⚠️ El original podría seguir visible en la galería del dispositivo.
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {source === 'device' ? (
          <PrimaryButton label="Ocultar en Segurito" onPress={handleHide} />
        ) : (
          <>
            <PrimaryButton label="Restaurar al dispositivo" onPress={handleRestore} />
            <PrimaryButton
              label="Eliminar definitivamente"
              variant="danger"
              onPress={handleDelete}
              style={styles.secondButton}
            />
          </>
        )}
      </View>

      <LoadingOverlay visible={processing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaArea: {
    flex: 1,
  },
  media: {
    flex: 1,
  },
  documentPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  documentIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  documentName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    textAlign: 'center',
  },
  infoBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  infoText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  infoSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  warningText: {
    color: '#F5A623',
    fontSize: 12,
    marginTop: 6,
  },
  actions: {
    backgroundColor: COLORS.surface,
    padding: 20,
    paddingBottom: 32,
  },
  secondButton: {
    marginTop: 12,
  },
});

export default MediaPreviewScreen;
