/**
 * Tipos compartidos por toda la aplicación Segurito.
 */

/** Tipo de contenido que maneja la app. */
export type MediaKind = 'photo' | 'video' | 'document';

/** Filtro usado en las pestañas de la pantalla principal. */
export type LibraryFilter = 'all' | 'photo' | 'video' | 'document';

/**
 * Representa un elemento tal cual vive en el dispositivo (Galería / Google Photos / Files),
 * ANTES de ser ocultado dentro de Segurito.
 */
export interface DeviceMediaItem {
  /** Id del asset en la librería de medios (MediaLibrary.Asset). */
  id: string;
  uri: string;
  kind: MediaKind;
  filename: string;
  width?: number;
  height?: number;
  size?: number;
  timestamp?: number;
  /** Duración en milisegundos, sólo para video. */
  durationMs?: number;
  mimeType?: string;
}

/**
 * Metadatos persistidos de un archivo que vive dentro de la carpeta segura de Segurito.
 * `vaultPath` es la ruta real del archivo copiado dentro del sandbox de la app.
 */
export interface VaultItemMeta {
  /** Identificador único interno (uuid simple). */
  id: string;
  /** Nombre original del archivo antes de ocultarlo. */
  originalName: string;
  /** Tipo de medio. */
  kind: MediaKind;
  /** Ruta absoluta (file://) del archivo dentro del sandbox privado de Segurito. */
  vaultPath: string;
  /** Tipo MIME (documentos) o mime inferido por extensión. */
  mimeType?: string;
  /** Tamaño del archivo en bytes. */
  size?: number;
  /** Fecha en la que se ocultó el archivo (epoch ms). */
  hiddenAt: number;
  /** Fecha de creación/captura original, si se conoce (epoch ms). */
  originalTimestamp?: number;
  /** Id/URI original en el dispositivo antes de ocultarlo (referencia informativa). */
  originalUri?: string;
  /** Ancho/alto para fotos y videos, útil para el grid. */
  width?: number;
  height?: number;
  /**
   * Indica si se pudo borrar el archivo original del dispositivo.
   * Si es `false`, el archivo sigue existiendo también fuera de Segurito
   * (ver limitaciones de plataforma documentadas en el README).
   */
  originalDeleted: boolean;
}

/** Resultado de una operación de ocultar/restaurar, para mostrar feedback al usuario. */
export interface OperationResult {
  successCount: number;
  failedCount: number;
  warnings: string[];
}
