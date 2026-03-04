import { UnsupportedPlatformScreen } from '@/components/feedback/UnsupportedPlatformScreen';
import { routes } from '@/constants/routes';

export function ImportPickerRouteScreen() {
  return (
    <UnsupportedPlatformScreen
      ctaHref={routes.home}
      ctaLabel="Back to Home"
      eyebrow="Add Capture"
      title="Import is not supported on web"
    />
  );
}
