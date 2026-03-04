import { UnsupportedPlatformScreen } from '@/components/feedback/UnsupportedPlatformScreen';
import { routes } from '@/constants/routes';

export default function ImportReviewWebScreen() {
  return (
    <UnsupportedPlatformScreen
      ctaHref={routes.home}
      ctaLabel="Back to Home"
      eyebrow="Import Review"
      title="Import review is not supported on web"
    />
  );
}
