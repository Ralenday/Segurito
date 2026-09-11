/**
 * Pequeños wrappers de DeviceMediaScreen para cada pestaña de la galería.
 * Se mantienen en un solo archivo porque sólo difieren en el filtro y los
 * textos del estado vacío.
 */
import React from 'react';
import DeviceMediaScreen from './DeviceMediaScreen';

export const AllMediaScreen: React.FC = () => (
  <DeviceMediaScreen
    filter="all"
    emptyTitle="No hay fotos ni videos"
    emptySubtitle="El contenido de tu galería aparecerá aquí."
  />
);

export const PhotosScreen: React.FC = () => (
  <DeviceMediaScreen
    filter="photo"
    emptyTitle="No hay fotos"
    emptySubtitle="Las fotos de tu dispositivo aparecerán aquí."
  />
);

export const VideosScreen: React.FC = () => (
  <DeviceMediaScreen
    filter="video"
    emptyTitle="No hay videos"
    emptySubtitle="Los videos de tu dispositivo aparecerán aquí."
  />
);
