import { formatBytes, formatDurationMs, getExtension } from '../src/utils/formatters';

describe('formatBytes', () => {
  it('formatea bytes pequeños tal cual', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formatea kilobytes y megabytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('devuelve un guion para valores desconocidos', () => {
    expect(formatBytes(undefined)).toBe('—');
  });
});

describe('formatDurationMs', () => {
  it('formatea milisegundos a mm:ss', () => {
    expect(formatDurationMs(65_000)).toBe('1:05');
    expect(formatDurationMs(5_000)).toBe('0:05');
  });
});

describe('getExtension', () => {
  it('extrae la extensión en minúsculas', () => {
    expect(getExtension('Foto.JPG')).toBe('jpg');
    expect(getExtension('documento.pdf')).toBe('pdf');
  });

  it('devuelve cadena vacía si no hay extensión', () => {
    expect(getExtension('archivo-sin-extension')).toBe('');
  });
});
