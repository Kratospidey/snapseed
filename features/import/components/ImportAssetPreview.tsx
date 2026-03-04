import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { AppText } from '@/components/primitives/AppText';
import {
  getInitialCapturePreviewSource,
  resolveCapturePreviewSource,
  shouldRefreshPreviewSource,
  type CapturePreviewResolution,
} from '@/modules/media/media-preview';
import { colors } from '@/theme';
import { getSourceScheme } from '@/utils/strings';

type ImportAssetPreviewProps = {
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackLabel?: string;
  fallbackTestID?: string;
  imageTestID?: string;
  mediaAssetId?: string | null;
  onPress?: () => void;
  previewUri: string | null;
  pressable?: boolean;
  sourceScheme?: 'content' | 'file' | 'ph' | 'unknown';
  sourceUri?: string | null;
};

export function ImportAssetPreview({
  accessibilityLabel,
  containerStyle,
  fallbackLabel = 'Preview unavailable',
  fallbackTestID,
  imageTestID,
  mediaAssetId = null,
  onPress,
  previewUri,
  pressable = false,
  sourceScheme,
  sourceUri,
}: ImportAssetPreviewProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const normalizedSourceUri = normalizeUri(sourceUri) ?? normalizeUri(previewUri);
  const normalizedSourceScheme = useMemo(
    () => sourceScheme ?? (normalizedSourceUri ? getSourceScheme(normalizedSourceUri) : 'unknown'),
    [normalizedSourceUri, sourceScheme],
  );
  const previewSourceInput = useMemo(
    () => ({
      mediaAssetId,
      sourceScheme: normalizedSourceScheme,
      sourceUri: normalizedSourceUri ?? '',
    }),
    [mediaAssetId, normalizedSourceScheme, normalizedSourceUri],
  );
  const [previewSource, setPreviewSource] = useState<CapturePreviewResolution>(() =>
    getInitialCapturePreviewSource(previewSourceInput),
  );

  useEffect(() => {
    setPreviewSource(getInitialCapturePreviewSource(previewSourceInput));
    setHasLoadError(false);
  }, [previewSourceInput]);

  useEffect(() => {
    if (!shouldRefreshPreviewSource(previewSourceInput)) {
      return;
    }

    if (previewSource.kind === 'renderable' && normalizedSourceScheme !== 'ph') {
      return;
    }

    let isMounted = true;

    void resolveCapturePreviewSource(previewSourceInput).then((nextPreviewSource) => {
      if (!isMounted) {
        return;
      }

      setPreviewSource((currentPreviewSource) => {
        if (isSamePreviewSource(currentPreviewSource, nextPreviewSource)) {
          return currentPreviewSource;
        }

        return nextPreviewSource;
      });

      if (nextPreviewSource.kind === 'renderable') {
        setHasLoadError(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [normalizedSourceScheme, previewSource.kind, previewSourceInput]);

  const content = (
    <View style={[styles.container, containerStyle]}>
      {previewSource.kind === 'renderable' && !hasLoadError ? (
        <ExpoImage
          contentFit="cover"
          onError={() => setHasLoadError(true)}
          source={{ uri: previewSource.uri }}
          style={styles.image}
          testID={imageTestID}
        />
      ) : (
        <View style={styles.fallback} testID={fallbackTestID}>
          <AppText color={colors.textMuted} variant="caption">
            {fallbackLabel}
          </AppText>
        </View>
      )}
    </View>
  );

  if (!pressable || !onPress) {
    return content;
  }

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  image: {
    height: '100%',
    width: '100%',
  },
});

function normalizeUri(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isSamePreviewSource(currentSource: CapturePreviewResolution, nextSource: CapturePreviewResolution) {
  if (currentSource.kind !== nextSource.kind) {
    return false;
  }

  if (currentSource.kind === 'renderable' && nextSource.kind === 'renderable') {
    return currentSource.renderer === nextSource.renderer && currentSource.uri === nextSource.uri;
  }

  if (currentSource.kind === 'unrenderable' && nextSource.kind === 'unrenderable') {
    return currentSource.reason === nextSource.reason;
  }

  return false;
}
