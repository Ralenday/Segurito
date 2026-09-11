/**
 * PreviewStore
 * ------------
 * expo-router pasa parámetros de ruta como strings (para que la URL sea
 * serializable), lo cual es incómodo para objetos completos como
 * `DeviceMediaItem`/`VaultItemMeta`. Como sólo hay una vista previa activa
 * a la vez, basta con "dejar" el objeto aquí justo antes de navegar y
 * "recogerlo" en la pantalla de destino.
 */
import { DeviceMediaItem, VaultItemMeta } from '../types';

export type PreviewParams =
  | { source: 'device'; item: DeviceMediaItem }
  | { source: 'vault'; item: VaultItemMeta };

let pending: PreviewParams | null = null;

export function setPendingPreview(params: PreviewParams): void {
  pending = params;
}

export function takePendingPreview(): PreviewParams | null {
  const current = pending;
  pending = null;
  return current;
}
