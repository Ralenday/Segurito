/**
 * StorageService
 * --------------
 * Persiste los metadatos de los archivos guardados en la carpeta segura
 * (nombre original, tipo, fecha, ruta original, etc.) usando AsyncStorage.
 * El contenido binario de los archivos NUNCA se guarda aquí: sólo vive en
 * el sistema de archivos (ver FileService). Esto mantiene AsyncStorage
 * liviano y rápido.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VaultItemMeta } from '../types';

const VAULT_INDEX_KEY = '@segurito/vault_index_v1';

async function readAll(): Promise<VaultItemMeta[]> {
  const raw = await AsyncStorage.getItem(VAULT_INDEX_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: VaultItemMeta[]): Promise<void> {
  await AsyncStorage.setItem(VAULT_INDEX_KEY, JSON.stringify(items));
}

const StorageService = {
  /** Devuelve todos los metadatos de archivos ocultos, más recientes primero. */
  async getAll(): Promise<VaultItemMeta[]> {
    const items = await readAll();
    return items.sort((a, b) => b.hiddenAt - a.hiddenAt);
  },

  /** Agrega un nuevo elemento al índice de la carpeta segura. */
  async add(item: VaultItemMeta): Promise<void> {
    const items = await readAll();
    items.push(item);
    await writeAll(items);
  },

  /** Elimina un elemento del índice (se usa tras restaurar o borrar definitivamente). */
  async remove(id: string): Promise<void> {
    const items = await readAll();
    await writeAll(items.filter(item => item.id !== id));
  },

  /** Actualiza parcialmente un elemento existente. */
  async update(id: string, patch: Partial<VaultItemMeta>): Promise<void> {
    const items = await readAll();
    const next = items.map(item => (item.id === id ? { ...item, ...patch } : item));
    await writeAll(next);
  },
};

export default StorageService;
