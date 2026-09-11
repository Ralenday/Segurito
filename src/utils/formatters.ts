/** Formatea un tamaño en bytes a una cadena legible (KB, MB, GB). */
export function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/** Formatea una fecha epoch (ms) a un string corto legible. */
export function formatDate(epochMs?: number | null): string {
  if (!epochMs) {
    return 'Fecha desconocida';
  }
  const date = new Date(epochMs);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Formatea una duración en milisegundos a mm:ss. */
export function formatDurationMs(milliseconds?: number | null): string {
  if (!milliseconds || Number.isNaN(milliseconds)) {
    return '';
  }
  const totalSeconds = Math.round(milliseconds / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Genera un identificador simple, suficiente para archivos locales (no requiere uuid nativo). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Devuelve la extensión (sin punto) de un nombre de archivo, en minúsculas. */
export function getExtension(filename: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return match ? match[1].toLowerCase() : '';
}
