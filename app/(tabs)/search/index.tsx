import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { colors } from '@/theme';

export default function SearchScreen() {
  return (
    <AppScreen>
      <AppText variant="title">Search</AppText>
      <AppText color={colors.textMuted}>Search UI starts in a later phase.</AppText>
    </AppScreen>
  );
}

