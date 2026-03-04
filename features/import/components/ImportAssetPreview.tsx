import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { AppText } from '@/components/primitives/AppText';
import { colors } from '@/theme';

type ImportAssetPreviewProps = {
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackLabel?: string;
  fallbackTestID?: string;
  imageTestID?: string;
  onPress?: () => void;
  previewUri: string | null;
  pressable?: boolean;
};

export function ImportAssetPreview({
  accessibilityLabel,
  containerStyle,
  fallbackLabel = 'Preview unavailable',
  fallbackTestID,
  imageTestID,
  onPress,
  previewUri,
  pressable = false,
}: ImportAssetPreviewProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const normalizedUri = typeof previewUri === 'string' && previewUri.trim().length > 0 ? previewUri.trim() : null;

  useEffect(() => {
    setHasLoadError(false);
  }, [normalizedUri]);

  const content = (
    <View style={[styles.container, containerStyle]}>
      {normalizedUri && !hasLoadError ? (
        <Image
          contentFit="cover"
          onError={() => setHasLoadError(true)}
          source={{ uri: normalizedUri }}
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
