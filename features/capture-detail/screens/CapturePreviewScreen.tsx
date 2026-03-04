import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { CaptureService } from '@/modules/captures/capture.service';
import { colors, spacing } from '@/theme';

import { CapturePreviewImage } from '../../library/components/CapturePreviewImage';

export function CapturePreviewScreen() {
  const { captureId } = useLocalSearchParams<{ captureId?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const captureService = useMemo(() => new CaptureService(db), [db]);
  const [capture, setCapture] = useState<Awaited<ReturnType<CaptureService['getCaptureDetail']>> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!captureId) {
        if (isMounted) {
          setCapture(null);
        }

        return;
      }

      const nextCapture = await captureService.getCaptureDetail(captureId);

      if (isMounted) {
        setCapture(nextCapture);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [captureId, captureService]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.closeButton}>
        <Ionicons color={colors.surface} name="close" size={24} />
      </Pressable>

      <View style={styles.content}>
        {capture ? (
          <>
            <View style={styles.previewFrame}>
              <CapturePreviewImage isMissing={capture.isMissing} sourceUri={capture.sourceUri} />
            </View>
            <AppText color={colors.surface} style={styles.caption} variant="caption">
              {capture.sourceFilename ?? 'Capture preview'}
            </AppText>
          </>
        ) : (
          <AppText color={colors.surface}>Preview unavailable for this Capture.</AppText>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  caption: {
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 253, 248, 0.18)',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    marginRight: spacing.lg,
    marginTop: spacing.sm,
    width: 42,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  previewFrame: {
    borderRadius: 28,
    flex: 1,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  safeArea: {
    backgroundColor: colors.text,
    flex: 1,
  },
});
