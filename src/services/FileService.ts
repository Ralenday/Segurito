/**
 * FileService
 * -----------
 * Contiene TODA la lógica crítica de "ocultar" y "restaurar" archivos, que es
 * el corazón de Segurito. Usa la API moderna basada en clases de
 * `expo-file-system` (`File`, `Directory`, `Paths`) y `expo-media-library`
 * (`Asset`) — verificadas contra las versiones instaladas (ver node_modules)
 * tal como pide `AGENTS.md` del proyecto.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LIMITACIONES DE PLATAFORMA (leer antes de modificar esta lógica)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Fotos y videos (MediaStore / Photos framework):
 *    - `Asset.delete()` sí borra el original de la galería del dispositivo.
 *      En Android 11+ y en iOS, el sistema muestra su propio diálogo de
 *      confirmación antes de borrar; si el usuario lo cancela, la promesa
 *      se rechaza. Como la copia a la carpeta segura ya se hizo ANTES de
 *      intentar borrar, el archivo queda igualmente oculto y accesible
 *      dentro de Segurito aunque el borrado del original falle; sólo se
 *      marca `originalDeleted: false` y se avisa al usuario.
 *
 * 2. Documentos (selector de documentos del sistema):
 *    - `expo-document-picker` sólo entrega una URI de LECTURA (normalmente
 *      ya copiada al caché de la app). Ni Android (Storage Access
 *      Framework) ni iOS exponen una forma pública y confiable de borrar
 *      ese archivo de su ubicación original (Drive, Descargas, iCloud, un
 *      gestor de archivos de terceros) con ese permiso transitorio.
 *    - Por eso, para documentos, Segurito SIEMPRE copia el archivo a la
 *      carpeta segura, pero marca `originalDeleted: false` y avisa al
 *      usuario para que lo borre manualmente si quiere.
 *
 * 3. Restaurar documentos no vuelve "en silencio" a la ruta original: se
 *    usa `Directory.pickDirectoryAsync()` para que el usuario elija dónde
 *    guardar el archivo (Descargas, una carpeta, etc.), ya que nunca se
 *    tuvo permiso de escritura sobre la ubicación original.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Asset } from 'expo-media-library';
import StorageService from './StorageService';
import { DeviceMediaItem, MediaKind, OperationResult, VaultItemMeta } from '../types';
import { VAULT_DIR_NAME } from '../utils/constants';
import { generateId, getExtension } from '../utils/formatters';

const vaultDir = new Directory(Paths.document, VAULT_DIR_NAME);

function defaultExtensionFor(kind: MediaKind): string {
  if (kind === 'video') return 'mp4';
  if (kind === 'photo') return 'jpg';
  return 'bin';
}

/** Documento mínimo que necesitamos de `expo-document-picker` (evita acoplar el tipo completo). */
export interface PickedDocument {
  uri: string;
  name: string;
  size?: number | null;
  mimeType?: string | null;
}

const FileService = {
  /** Ruta de la carpeta segura, expuesta para depuración/tests. */
  vaultDir,

  /** Crea la carpeta segura si todavía no existe. Debe llamarse al iniciar la app. */
  init(): void {
    if (!vaultDir.exists) {
      vaultDir.create({ intermediates: true });
    }
  },

  /**
   * Oculta uno o varios elementos de fotos/videos que vienen de la galería
   * del dispositivo:
   *  1) copia los bytes reales al sandbox privado de Segurito,
   *  2) intenta borrar el original de la galería (`Asset.delete`),
   *  3) guarda los metadatos.
   */
  async hideDeviceMedia(items: DeviceMediaItem[]): Promise<OperationResult> {
    const result: OperationResult = { successCount: 0, failedCount: 0, warnings: [] };

    for (const item of items) {
      try {
        const extension = getExtension(item.filename) || defaultExtensionFor(item.kind);
        const sourceFile = new File(item.uri);
        const destFile = new File(vaultDir, `${generateId()}.${extension}`);
        await sourceFile.copy(destFile);

        let originalDeleted = false;
        try {
          await Asset.delete([new Asset(item.id)]);
          originalDeleted = true;
        } catch (deleteError) {
          result.warnings.push(
            `"${item.filename}" se ocultó, pero no se pudo borrar el original de la galería (${
              (deleteError as Error).message
            }).`,
          );
        }

        const meta: VaultItemMeta = {
          id: generateId(),
          originalName: item.filename,
          kind: item.kind,
          vaultPath: destFile.uri,
          size: destFile.size,
          hiddenAt: Date.now(),
          originalTimestamp: item.timestamp,
          originalUri: item.id,
          width: item.width,
          height: item.height,
          originalDeleted,
        };
        await StorageService.add(meta);
        result.successCount += 1;
      } catch (error) {
        result.failedCount += 1;
        result.warnings.push(`No se pudo ocultar "${item.filename}": ${(error as Error).message}`);
      }
    }

    return result;
  },

  /**
   * Oculta uno o varios documentos elegidos con el selector de documentos
   * del sistema. Ver la nota de limitaciones sobre por qué el original casi
   * nunca puede borrarse automáticamente.
   */
  async hideDocuments(docs: PickedDocument[]): Promise<OperationResult> {
    const result: OperationResult = { successCount: 0, failedCount: 0, warnings: [] };

    for (const doc of docs) {
      const displayName = doc.name ?? 'documento';
      try {
        const extension = getExtension(displayName) || 'bin';
        const sourceFile = new File(doc.uri);
        const destFile = new File(vaultDir, `${generateId()}.${extension}`);
        await sourceFile.copy(destFile);

        const meta: VaultItemMeta = {
          id: generateId(),
          originalName: displayName,
          kind: 'document',
          vaultPath: destFile.uri,
          mimeType: doc.mimeType ?? undefined,
          size: doc.size ?? destFile.size,
          hiddenAt: Date.now(),
          originalUri: doc.uri,
          // Los documentos elegidos vía el selector del sistema no se pueden
          // borrar de su origen de forma confiable (ver cabecera del archivo).
          originalDeleted: false,
        };
        await StorageService.add(meta);
        result.warnings.push(
          `"${displayName}" se guardó en Segurito. Bórralo manualmente de su ubicación original si lo deseas (no es posible hacerlo automáticamente por restricciones del sistema).`,
        );
        result.successCount += 1;
      } catch (error) {
        result.failedCount += 1;
        result.warnings.push(`No se pudo ocultar "${displayName}": ${(error as Error).message}`);
      }
    }

    return result;
  },

  /**
   * Restaura un archivo de la carpeta segura de vuelta al dispositivo:
   *  - Fotos/Videos → se guardan en la galería (`Asset.create`).
   *  - Documentos → se abre el selector de carpetas del sistema
   *    (`Directory.pickDirectoryAsync`) para que el usuario elija dónde
   *    guardarlo.
   * Si la restauración tiene éxito, el archivo se borra de la carpeta
   * segura y se elimina su metadato.
   */
  async restoreItem(item: VaultItemMeta): Promise<{ success: boolean; warning?: string }> {
    try {
      const vaultFile = new File(item.vaultPath);

      if (item.kind === 'photo' || item.kind === 'video') {
        await Asset.create(item.vaultPath);
      } else {
        const targetDirectory = await Directory.pickDirectoryAsync();
        const destination = new File(targetDirectory, item.originalName);
        await vaultFile.copy(destination);
      }

      vaultFile.delete();
      await StorageService.remove(item.id);
      return { success: true };
    } catch (error) {
      return { success: false, warning: (error as Error).message };
    }
  },

  /** Elimina definitivamente un archivo de la carpeta segura (sin restaurarlo). */
  async deletePermanently(item: VaultItemMeta): Promise<void> {
    try {
      new File(item.vaultPath).delete();
    } catch {
      // El archivo ya no existe: no pasa nada, igual limpiamos el metadato.
    }
    await StorageService.remove(item.id);
  },
};

export default FileService;
