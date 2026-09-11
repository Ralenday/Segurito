/**
 * MediaLibraryService
 * --------------------
 * Lee fotos y videos del dispositivo (Galería / Google Photos / Fototeca)
 * usando la API moderna basada en clases de `expo-media-library` (`Query`,
 * `Asset`), y los adapta al modelo `DeviceMediaItem` que usa el resto de la
 * app.
 *
 * `Query.exeForMetadata()` devuelve campos "baratos" (nombre, dimensiones,
 * duración…) sin tocar el disco, pero NO incluye la URI del archivo — hay
 * que pedirla aparte con `Asset.getUri()`. Por eso resolvemos las URIs en
 * paralelo tras obtener la página de metadatos.
 */
import { Asset, AssetField, MediaType, Query } from 'expo-media-library';
import { DeviceMediaItem, LibraryFilter, MediaKind } from '../types';

const PAGE_SIZE = 60;

function mediaTypeFor(filter: LibraryFilter): MediaType | undefined {
  if (filter === 'photo') return MediaType.IMAGE;
  if (filter === 'video') return MediaType.VIDEO;
  return undefined;
}

function kindFor(mediaType: MediaType): MediaKind {
  return mediaType === MediaType.VIDEO ? 'video' : 'photo';
}

export interface MediaPage {
  items: DeviceMediaItem[];
  hasNextPage: boolean;
}

const MediaLibraryService = {
  /** Trae una página de fotos y/o videos del dispositivo, a partir de `offset`. */
  async getPage(filter: LibraryFilter, offset = 0): Promise<MediaPage> {
    let query = new Query()
      .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
      .offset(offset)
      .limit(PAGE_SIZE + 1); // pedimos uno de más para saber si hay página siguiente

    const type = mediaTypeFor(filter);
    if (type) {
      query = query.eq(AssetField.MEDIA_TYPE, type);
    }

    const metas = await query.exeForMetadata();
    const hasNextPage = metas.length > PAGE_SIZE;
    const page = metas.slice(0, PAGE_SIZE);

    const items = await Promise.all(
      page.map(async (meta): Promise<DeviceMediaItem> => {
        const uri = await new Asset(meta.id).getUri();
        return {
          id: meta.id,
          uri,
          kind: kindFor(meta.mediaType),
          filename: meta.filename ?? `${meta.id}`,
          width: meta.width ?? undefined,
          height: meta.height ?? undefined,
          timestamp: meta.creationTime ?? undefined,
          durationMs: meta.duration ?? undefined,
        };
      }),
    );

    return { items, hasNextPage };
  },
};

export default MediaLibraryService;
