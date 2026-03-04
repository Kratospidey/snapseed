import { useRouter } from 'expo-router';

import { UnsupportedPlatformScreen } from '@/components/feedback/UnsupportedPlatformScreen';

export function ImportReviewRouteScreen() {
  const router = useRouter();

  return (
    <UnsupportedPlatformScreen
      ctaLabel="Back"
      eyebrow="Import Review"
      onPressCta={() => router.back()}
      title="Import review is not supported on web"
    />
  );
}
