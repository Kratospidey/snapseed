import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

export default function LibraryScreen() {
  return (
    <AppScreen
      contentContainerStyle={{
        gap: spacing.md,
        justifyContent: 'center',
      }}
    >
      <AppText variant="eyebrow">SnapBrain</AppText>
      <AppText variant="display">Library foundation</AppText>
      <AppText color={colors.textMuted}>
        Phase 0 establishes the Expo Router shell. Phase 1 wires the database, migrations, and
        domain modules behind it.
      </AppText>
    </AppScreen>
  );
}

