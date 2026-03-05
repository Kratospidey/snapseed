import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { AnimatedSectionCard } from '@/components/primitives/AnimatedSectionCard';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import type { LibrarySmartView } from '@/modules/captures/capture.types';
import { colors, radii, spacing } from '@/theme';

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
        delayMs={0}
        description="All Captures ordered by import time."
        isActive={selectedSmartView === 'recent'}
        label="Recently Added"
        onPress={() => onSelectSmartView('recent')}
      />
      <SmartCard
        count={unsortedCount}
        delayMs={40}
        description="No tags and no note."
        isActive={selectedSmartView === 'unsorted'}
        label="Unsorted"
        onPress={() => onSelectSmartView('unsorted')}
      />
      <SmartCard
        count={activeTagCount}
        delayMs={80}
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
        delayMs={120}
        description="Pending and upcoming reminders."
        isActive={selectedSmartView === 'reminders'}
        label="Reminder Pending"
        onPress={() => onSelectSmartView('reminders')}
      />
      <SmartCard
        count={graveyardCount}
        delayMs={160}
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
  delayMs?: number;
  description: string;
  isActive: boolean;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
};

function SmartCard({
  children,
  count,
  delayMs = 0,
  description,
  isActive,
  label,
  onPress,
  tone = 'default',
}: SmartCardProps) {
  return (
    <AnimatedSectionCard
      accessibilityRole="button"
      delayMs={delayMs}
      onPress={onPress}
      style={styles.cardPressable}
    >
      <GlassSurface
        style={[styles.card, isActive ? styles.cardActive : undefined, tone === 'danger' ? styles.cardDanger : undefined]}
        useBlur={false}
        variant="card"
      >
        <View style={styles.cardContent}>
          <AppText variant="eyebrow">{label}</AppText>
          <AppText style={styles.countText} variant="display">
            {count}
          </AppText>
          <AppText color={colors.textMuted} variant="caption">
            {description}
          </AppText>
          {children}
        </View>
      </GlassSurface>
    </AnimatedSectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 170,
    width: 220,
  },
  cardActive: {
    borderColor: colors.accent,
  },
  cardDanger: {
    backgroundColor: '#FFF2F0',
  },
  cardContent: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardPressable: {
    borderRadius: radii.xl,
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
