/**
 * DocumentsScreen
 * ----------------
 * A diferencia de fotos/videos, Android e iOS NO exponen una API pública
 * para "listar todos los documentos del dispositivo" (no existe un
 * equivalente a MediaStore para archivos genéricos). Por eso esta pantalla
 * funciona como punto de entrada: el usuario elige documentos con
 * `expo-document-picker` y Segurito los oculta de inmediato en la carpeta
 * segura. Ver comentarios de limitaciones en FileService.ts.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import FileService from '../services/FileService';
import PrimaryButton from '../components/PrimaryButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS } from '../utils/constants';

const DocumentsScreen: React.FC = () => {
  const [processing, setProcessing] = useState(false);

  const handlePickDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) {
      return;
    }

    setProcessing(true);
    try {
      const outcome = await FileService.hideDocuments(result.assets);
      const summary = `Ocultados: ${outcome.successCount}. Fallidos: ${outcome.failedCount}.`;
      Alert.alert(
        'Documentos procesados',
        outcome.warnings.length > 0 ? `${summary}\n\n${outcome.warnings.join('\n\n')}` : summary,
      );
    } catch (error) {
      Alert.alert('Error', `No se pudieron procesar los documentos: ${(error as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>📄</Text>
      <Text style={styles.title}>Ocultar documentos</Text>
      <Text style={styles.subtitle}>
        Elige uno o varios documentos (PDF, Word, Excel, ZIP, etc.) desde el selector de archivos del
        sistema. Se copiarán de inmediato a tu carpeta segura dentro de Segurito.
      </Text>

      <PrimaryButton label="Seleccionar documentos" onPress={handlePickDocuments} style={styles.button} />

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>ℹ️ Nota importante</Text>
        <Text style={styles.noteText}>
          Por restricciones de seguridad de Android e iOS, la app no puede borrar automáticamente el
          documento de su ubicación original (Drive, Descargas, un gestor de archivos, iCloud, etc.).
          Una vez oculto en Segurito, puedes borrar el original manualmente si lo deseas.
        </Text>
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>📂 ¿Dónde veo mis documentos ocultos?</Text>
        <Text style={styles.noteText}>
          En la pestaña &quot;Seguros&quot; encontrarás todos los archivos —fotos, videos y documentos— que ya
          están dentro de tu carpeta segura, junto con la opción de restaurarlos.
        </Text>
      </View>

      <LoadingOverlay visible={processing} message="Ocultando documentos…" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  noteBox: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  noteTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});

export default DocumentsScreen;
