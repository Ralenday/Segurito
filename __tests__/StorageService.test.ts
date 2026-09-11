import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from '../src/services/StorageService';
import { VaultItemMeta } from '../src/types';

function makeItem(overrides: Partial<VaultItemMeta> = {}): VaultItemMeta {
  return {
    id: 'id-1',
    originalName: 'foto.jpg',
    kind: 'photo',
    vaultPath: 'file:///mock/vault/id-1.jpg',
    hiddenAt: Date.now(),
    originalDeleted: true,
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('StorageService', () => {
  it('empieza vacío', async () => {
    const items = await StorageService.getAll();
    expect(items).toEqual([]);
  });

  it('agrega y lista elementos ocultos, más recientes primero', async () => {
    const older = makeItem({ id: 'a', hiddenAt: 1000 });
    const newer = makeItem({ id: 'b', hiddenAt: 2000 });
    await StorageService.add(older);
    await StorageService.add(newer);

    const items = await StorageService.getAll();
    expect(items.map(i => i.id)).toEqual(['b', 'a']);
  });

  it('elimina un elemento por id', async () => {
    await StorageService.add(makeItem({ id: 'to-remove' }));
    await StorageService.remove('to-remove');
    const items = await StorageService.getAll();
    expect(items.find(i => i.id === 'to-remove')).toBeUndefined();
  });

  it('actualiza parcialmente un elemento existente', async () => {
    await StorageService.add(makeItem({ id: 'to-update', originalDeleted: false }));
    await StorageService.update('to-update', { originalDeleted: true });
    const items = await StorageService.getAll();
    expect(items.find(i => i.id === 'to-update')?.originalDeleted).toBe(true);
  });
});
