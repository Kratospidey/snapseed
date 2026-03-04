import { UnsupportedPlatformScreen } from '@/components/feedback/UnsupportedPlatformScreen';

export default function WebHomeScreen() {
  return (
    <UnsupportedPlatformScreen
      eyebrow="SnapBrain"
      message="SnapBrain currently supports Android and iPhone. The web shell is intentionally limited in this pass so route validation stays healthy while Capture workflows remain native-first."
      title="Use SnapBrain on mobile"
    />
  );
}
