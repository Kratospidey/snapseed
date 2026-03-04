import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { colors } from '@/theme';

export default function RemindersScreen() {
  return (
    <AppScreen>
      <AppText variant="title">Reminders</AppText>
      <AppText color={colors.textMuted}>Reminder workflows start after the data layer is in place.</AppText>
    </AppScreen>
  );
}

