import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { colors, spacing } from '@/theme';

type DateTimeFieldPickerProps = {
  accessibilityLabel?: string;
  label: string;
  mode: 'date' | 'time';
  onChangeValue: (value: string) => void;
  placeholder: string;
  testID?: string;
  value: string | null | undefined;
};

export function DateTimeFieldPicker({
  accessibilityLabel,
  label,
  mode,
  onChangeValue,
  placeholder,
  testID,
  value,
}: DateTimeFieldPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(resolveInitialDate(value, mode));

  useEffect(() => {
    if (isOpen) {
      setDraftDate(resolveInitialDate(value, mode));
    }
  }, [isOpen, mode, value]);

  const displayValue = formatFieldValue(value, mode);

  function openPicker() {
    setDraftDate(resolveInitialDate(value, mode));
    setIsOpen(true);
  }

  function handleChange(event: DateTimePickerEvent, nextDate?: Date) {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setIsOpen(false);
        return;
      }

      const resolved = nextDate ?? draftDate;
      setDraftDate(resolved);
      onChangeValue(formatPickerValue(resolved, mode));
      setIsOpen(false);
      return;
    }

    if (nextDate) {
      setDraftDate(nextDate);
    }
  }

  function handleConfirm() {
    onChangeValue(formatPickerValue(draftDate, mode));
    setIsOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={openPicker}
        style={styles.field}
        testID={testID}
      >
        <AppText color={colors.textMuted} variant="caption">
          {label}
        </AppText>
        <AppText>{displayValue ?? placeholder}</AppText>
      </Pressable>

      {isOpen && Platform.OS === 'android' ? (
        <DateTimePicker
          mode={mode}
          onChange={handleChange}
          testID={testID ? `${testID}-picker` : undefined}
          value={draftDate}
        />
      ) : null}

      <Modal animationType="fade" onRequestClose={() => setIsOpen(false)} transparent visible={isOpen && Platform.OS !== 'android'}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCopy}>
                <AppText variant="eyebrow">{mode === 'date' ? 'Pick a date' : 'Pick a time'}</AppText>
                <AppText variant="title">{label}</AppText>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setIsOpen(false)} style={styles.secondaryButton}>
                <AppText variant="caption">Cancel</AppText>
              </Pressable>
            </View>

            <DateTimePicker
              display={mode === 'date' ? 'inline' : 'spinner'}
              mode={mode}
              onChange={handleChange}
              style={styles.picker}
              testID={testID ? `${testID}-picker` : undefined}
              value={draftDate}
            />

            <Pressable accessibilityRole="button" onPress={handleConfirm} style={styles.primaryButton}>
              <AppText color={colors.surface} variant="action">
                Confirm
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function resolveInitialDate(value: string | null | undefined, mode: 'date' | 'time') {
  const normalized = value?.trim();

  if (normalized) {
    const parsed =
      mode === 'date'
        ? new Date(`${normalized}T12:00:00`)
        : new Date(`1970-01-01T${normalized}:00`);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const now = new Date();

  if (mode === 'date') {
    return now;
  }

  return new Date(`1970-01-01T${padTime(now.getHours())}:${padTime(now.getMinutes())}:00`);
}

function formatFieldValue(value: string | null | undefined, mode: 'date' | 'time') {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  try {
    if (mode === 'date') {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }).format(new Date(`${normalized}T12:00:00`));
    }

    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(`1970-01-01T${normalized}:00`));
  } catch {
    return normalized;
  }
}

function formatPickerValue(value: Date, mode: 'date' | 'time') {
  if (mode === 'date') {
    return `${value.getFullYear()}-${padTime(value.getMonth() + 1)}-${padTime(value.getDate())}`;
  }

  return `${padTime(value.getHours())}:${padTime(value.getMinutes())}`;
}

function padTime(value: number) {
  return String(value).padStart(2, '0');
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(32, 26, 22, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  field: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  picker: {
    alignSelf: 'stretch',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.lg,
    width: '100%',
  },
  sheetCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
});
