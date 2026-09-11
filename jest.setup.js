/**
 * Setup de Jest: mockea los módulos nativos de Expo que no existen en el
 * entorno de pruebas (no hay dispositivo/simulador real corriendo durante
 * `npm test`). `jest-expo` ya trae mocks genéricos para varios módulos del
 * SDK, pero los módulos más nuevos basados en clases (File/Directory de
 * expo-file-system, Query/Asset de expo-media-library) no encajan en ese
 * mecanismo genérico, así que se mockean aquí explícitamente.
 */
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

jest.mock('expo-file-system', () => {
  class MockDirectory {
    uri = 'file:///mock/dir';
    exists = true;
    create = jest.fn();
  }
  class MockFile {
    uri = 'file:///mock/file';
    size = 0;
    exists = true;
    copy = jest.fn().mockResolvedValue(undefined);
    delete = jest.fn();
  }
  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { document: new MockDirectory(), cache: new MockDirectory() },
  };
});

jest.mock('expo-media-library', () => ({
  Query: jest.fn().mockImplementation(() => ({
    eq: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exe: jest.fn().mockResolvedValue([]),
    exeForMetadata: jest.fn().mockResolvedValue([]),
  })),
  Asset: Object.assign(
    jest.fn().mockImplementation((id) => ({ id, getUri: jest.fn().mockResolvedValue('file:///mock/asset') })),
    { create: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue(undefined) },
  ),
  AssetField: {
    CREATION_TIME: 'creationTime',
    MEDIA_TYPE: 'mediaType',
  },
  MediaType: { IMAGE: 'image', VIDEO: 'video' },
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: null }),
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn().mockReturnValue({}),
  VideoView: 'VideoView',
}));

jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return { Image };
});
