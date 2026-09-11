/**
 * PermissionsService
 * -------------------
 * A diferencia de la versión bare (React Native CLI), en Expo cada módulo
 * gestiona sus propios permisos con una API unificada para Android e iOS —
 * no hace falta pedir permisos granulares por versión de Android a mano.
 * `expo-media-library` internamente resuelve READ_MEDIA_IMAGES/VIDEO en
 * Android 13+, READ_EXTERNAL_STORAGE en versiones previas, y el permiso de
 * fototeca en iOS, todo detrás de una sola llamada.
 */
import * as MediaLibrary from 'expo-media-library';

const PermissionsService = {
  /** Pide (o confirma) el permiso para leer y escribir fotos/videos de la galería. */
  async ensureMediaLibraryPermission(): Promise<boolean> {
    const current = await MediaLibrary.getPermissionsAsync();
    if (current.granted || current.accessPrivileges === 'limited') {
      return true;
    }
    const requested = await MediaLibrary.requestPermissionsAsync();
    return requested.granted || requested.accessPrivileges === 'limited';
  },
};

export default PermissionsService;
