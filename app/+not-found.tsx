import { Link, Stack } from 'expo-router';

import { AppScreen } from '@/components/primitives/AppScreen';
import { AppText } from '@/components/primitives/AppText';
import { routes } from '@/constants/routes';
import { colors, spacing } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
      <AppScreen
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
        }}
      >
        <AppText variant="title">Route not found</AppText>
        <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
          The current screen is not implemented in this milestone.
        </AppText>
        <Link href={routes.home}>
          <AppText variant="action">Return to SnapBrain web home</AppText>
        </Link>
      </AppScreen>
    </>
  );
}
