import { useRouter } from 'expo-router';

import { UnsupportedPlatformScreen } from '@/components/feedback/UnsupportedPlatformScreen';

export default function ImportPickerWebScreen() {
  const router = useRouter();

  return (
    <UnsupportedPlatformScreen
      ctaLabel="Back"
      eyebrow="Add Capture"
      onPressCta={() => router.back()}
      title="Import is not supported on web"
    />
  );
}
