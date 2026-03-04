import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import type { LibrarySmartView } from '@/modules/captures/capture.types';
import { colors, spacing } from '@/theme';

import { TagPill } from './TagPill';

type LibrarySmartSectionsProps = {
  activeTagCount: number;
  graveyardCount: number;
  onOpenTags: () => void;
  onSelectSmartView: (smartView: LibrarySmartView) => void;
  reminderCount: number;
  selectedSmartView: LibrarySmartView;
  topTags: Array<{
    captureCount: number;
    id: string;
    label: string;
  }>;
  totalCount: number;
  unsortedCount: number;
};

export function LibrarySmartSections({
  activeTagCount,
  graveyardCount,
  onOpenTags,
  onSelectSmartView,
  reminderCount,
  selectedSmartView,
  topTags,
  totalCount,
  unsortedCount,
}: LibrarySmartSectionsProps) {
  return (
    <ScrollView contentContainerStyle={styles.rail} horizontal showsHorizontalScrollIndicator={false}>
      <SmartCard
        count={totalCount}
        description="All Captures ordered by import time."
        isActive={selectedSmartView === 'recent'}
        label="Recently Added"
        onPress={() => onSelectSmartView('recent')}
      />
      <SmartCard
        count={unsortedCount}
        description="No tags and no note."
        isActive={selectedSmartView === 'unsorted'}
        label="Unsorted"
        onPress={() => onSelectSmartView('unsorted')}
      />
      <SmartCard
        count={activeTagCount}
        description="Top tag usage across the Library."
        isActive={false}
        label="Most Used Tags"
        onPress={onOpenTags}
      >
        <View style={styles.tagsPreview}>
          {topTags.length > 0 ? (
            topTags.map((tag) => <TagPill key={tag.id} label={tag.label} />)
          ) : (
            <AppText color={colors.textMuted} variant="caption">
              No tags yet
            </AppText>
          )}
        </View>
      </SmartCard>
      <SmartCard
        count={reminderCount}
        description="Pending and upcoming reminders."
        isActive={selectedSmartView === 'reminders'}
        label="Reminder Pending"
        onPress={() => onSelectSmartView('reminders')}
      />
      <SmartCard
        count={graveyardCount}
        description="Missing original files that can be relinked later."
        isActive={selectedSmartView === 'graveyard'}
        label="Graveyard"
        onPress={() => onSelectSmartView('graveyard')}
        tone="danger"
      />
    </ScrollView>
  );
}

type SmartCardProps = {
  children?: ReactNode;
  count: number;
  description: string;
  isActive: boolean;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
};

function SmartCard({
  children,
  count,
  description,
  isActive,
  label,
  onPress,
  tone = 'default',
}: SmartCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        isActive ? styles.cardActive : undefined,
        tone === 'danger' ? styles.cardDanger : undefined,
      ]}
    >
      <AppText variant="eyebrow">{label}</AppText>
      <AppText style={styles.countText} variant="display">
        {count}
      </AppText>
      <AppText color={colors.textMuted} variant="caption">
        {description}
      </AppText>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 170,
    padding: spacing.md,
    width: 220,
  },
  cardActive: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  cardDanger: {
    backgroundColor: '#FFF3EE',
  },
  countText: {
    fontSize: 32,
    lineHeight: 36,
  },
  rail: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  tagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
