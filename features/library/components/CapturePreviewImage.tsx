import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { AppText } from '@/components/primitives/AppText';
import {
  getInitialCapturePreviewSource,
  resolveCapturePreviewSource,
  shouldRefreshPreviewSource,
  type CapturePreviewResolution,
} from '@/modules/media/media-preview';
import { colors, spacing } from '@/theme';

type CapturePreviewImageProps = {
  fit?: 'contain' | 'cover';
  isMissing: boolean;
  mediaAssetId?: string | null;
  sourceScheme?: 'content' | 'file' | 'ph' | 'unknown';
  sourceUri: string;
};

export function CapturePreviewImage({
  fit = 'cover',
  isMissing,
  mediaAssetId = null,
  sourceScheme = 'unknown',
  sourceUri,
}: CapturePreviewImageProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const [previewSource, setPreviewSource] = useState<CapturePreviewResolution>(() =>
    getInitialCapturePreviewSource({
      mediaAssetId,
      sourceScheme,
      sourceUri,
    }),
  );

  useEffect(() => {
    setPreviewSource(
      getInitialCapturePreviewSource({
        mediaAssetId,
        sourceScheme,
        sourceUri,
      }),
    );
    setHasLoadError(false);
  }, [mediaAssetId, sourceScheme, sourceUri]);

  useEffect(() => {
    if (!shouldRefreshPreviewSource({ mediaAssetId, sourceScheme, sourceUri })) {
      return;
    }

    let isMounted = true;

    void resolveCapturePreviewSource({
      mediaAssetId,
      sourceScheme,
      sourceUri,
    }).then((nextSource) => {
      if (!isMounted) {
        return;
      }

      setPreviewSource((currentSource) => {
        if (isSamePreviewSource(currentSource, nextSource)) {
          return currentSource;
        }

        return nextSource;
      });

      if (nextSource.kind === 'renderable') {
        setHasLoadError(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [mediaAssetId, sourceScheme, sourceUri]);

  if (isMissing) {
    return (
      <View style={[styles.imageBase, styles.missingState]}>
        <AppText color={colors.textMuted}>Original file missing</AppText>
      </View>
    );
  }

  if (previewSource.kind !== 'renderable' || hasLoadError) {
    return (
      <View style={[styles.imageBase, styles.missingState]}>
        <AppText color={colors.textMuted}>Preview unavailable</AppText>
      </View>
    );
  }

  return (
    <ExpoImage
      contentFit={fit}
      onError={() => setHasLoadError(true)}
      source={{ uri: previewSource.uri }}
      style={styles.imageBase}
    />
  );
}

function isSamePreviewSource(currentSource: CapturePreviewResolution, nextSource: CapturePreviewResolution) {
  if (currentSource.kind !== nextSource.kind) {
    return false;
  }

  if (currentSource.kind === 'renderable' && nextSource.kind === 'renderable') {
    return currentSource.uri === nextSource.uri && currentSource.renderer === nextSource.renderer;
  }

  if (currentSource.kind === 'unrenderable' && nextSource.kind === 'unrenderable') {
    return currentSource.reason === nextSource.reason;
  }

  return false;
}

const styles = StyleSheet.create({
  imageBase: {
    backgroundColor: colors.surfaceInset,
    height: '100%',
    width: '100%',
  },
  missingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
});
