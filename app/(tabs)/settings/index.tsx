import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { colors } from '@/theme';

export default function SettingsScreen() {
  return (
    <AppScreen>
      <AppText variant="title">Settings</AppText>
      <AppText color={colors.textMuted}>
        Settings persistence already uses SQLite as the canonical store.
      </AppText>
    </AppScreen>
  );
}

