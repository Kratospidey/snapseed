import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppChip } from '@/components/primitives/AppChip';
import { AppInput } from '@/components/primitives/AppInput';
import { colors, radii, spacing } from '@/theme';

type SearchInputProps = {
  onChangeText: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  value: string;
};

export function SearchInput({ onChangeText, onClear, onSubmit, value }: SearchInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchIcon}>
        <Ionicons color={colors.textSecondary} name="search" size={18} />
      </View>
      <View style={styles.inputWrap}>
        <AppInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Search tags and notes"
          returnKeyType="search"
          style={styles.input}
          testID="search-input"
          value={value}
        />
      </View>
      {value.trim() ? (
        <AppChip label="Clear" onPress={onClear} testID="search-clear-button" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  input: {
    minHeight: 36,
  },
  inputWrap: {
    flex: 1,
  },
  searchIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
});
