import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { colors } from '@/theme';

export default function TagsScreen() {
  return (
    <AppScreen>
      <AppText variant="title">Tags</AppText>
      <AppText color={colors.textMuted}>Tag management will build on the repository layer added here.</AppText>
    </AppScreen>
  );
}

