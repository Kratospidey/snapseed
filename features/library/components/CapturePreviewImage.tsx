import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

type CapturePreviewImageProps = {
  isMissing: boolean;
  sourceUri: string;
};

export function CapturePreviewImage({ isMissing, sourceUri }: CapturePreviewImageProps) {
  if (isMissing) {
    return (
      <View style={[styles.imageBase, styles.missingState]}>
        <AppText color={colors.textMuted}>Original file missing</AppText>
      </View>
    );
  }

  return <Image source={{ uri: sourceUri }} style={styles.imageBase} />;
}

const styles = StyleSheet.create({
  imageBase: {
    backgroundColor: colors.accentSoft,
    height: '100%',
    width: '100%',
  },
  missingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
});
