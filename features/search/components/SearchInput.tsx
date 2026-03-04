import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

type SearchInputProps = {
  onChangeText: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  value: string;
};

export function SearchInput({ onChangeText, onClear, onSubmit, value }: SearchInputProps) {
  return (
    <View style={styles.container}>
      <Ionicons color={colors.textMuted} name="search" size={18} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Search tags and notes"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        testID="search-input"
        value={value}
      />
      {value.trim() ? (
        <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearButton} testID="search-clear-button">
          <AppText variant="caption">Clear</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    color: colors.text,
    flex: 1,
    minHeight: 36,
  },
});
