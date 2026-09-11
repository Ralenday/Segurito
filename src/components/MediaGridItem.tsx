import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, GRID_COLUMNS, GRID_GAP } from '../utils/constants';
import { formatDurationMs, getExtension } from '../utils/formatters';
import { MediaKind } from '../types';

const screenWidth = Dimensions.get('window').width;
export const CELL_SIZE = (screenWidth - GRID_GAP * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

interface Props {
  uri: string;
  kind: MediaKind;
  filename: string;
  durationMs?: number;
  selected?: boolean;
  selectionMode?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

const documentIconFor = (filename: string): string => {
  const ext = getExtension(filename);
  if (['pdf'].includes(ext)) return '📕';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📗';
  if (['ppt', 'pptx'].includes(ext)) return '📙';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  if (['txt', 'md'].includes(ext)) return '📄';
  return '📁';
};

const MediaGridItem: React.FC<Props> = ({
  uri,
  kind,
  filename,
  durationMs,
  selected,
  selectionMode,
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.cell, selected && styles.cellSelected]}>
      {kind === 'document' ? (
        <View style={styles.documentCell}>
          <Text style={styles.documentIcon}>{documentIconFor(filename)}</Text>
          <Text style={styles.documentName} numberOfLines={2}>
            {filename}
          </Text>
        </View>
      ) : (
        <Image source={{ uri }} style={styles.image} contentFit="cover" transition={100} />
      )}

      {kind === 'video' && durationMs ? (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDurationMs(durationMs)}</Text>
        </View>
      ) : null}

      {selectionMode ? (
        <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
          {selected ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: GRID_GAP / 2,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
  },
  cellSelected: {
    opacity: 0.7,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  documentCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  documentIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  documentName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  durationBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default MediaGridItem;
