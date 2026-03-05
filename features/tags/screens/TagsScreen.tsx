import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/primitives/AppButton';
import { AppIconButton } from '@/components/primitives/AppIconButton';
import { AppInput } from '@/components/primitives/AppInput';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { routes } from '@/constants/routes';
import { TagService } from '@/modules/tags/tag.service';
import { colors, spacing } from '@/theme';

type TagListItem = Awaited<ReturnType<TagService['listAll']>>[number];

export function TagsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const tagService = useMemo(() => new TagService(db), [db]);
  const [tags, setTags] = useState<TagListItem[]>([]);
  const [createLabel, setCreateLabel] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    const nextTags = await tagService.listAll();
    setTags(nextTags);
    setIsLoading(false);
  }, [tagService]);

  useFocusEffect(
    useCallback(() => {
      void loadTags();
    }, [loadTags]),
  );

  const handleCreate = useCallback(async () => {
    const label = createLabel.trim();

    if (!label) {
      return;
    }

    setPendingAction('create');

    try {
      await tagService.createTag(label);
      setCreateLabel('');
      await loadTags();
    } catch (error) {
      Alert.alert('Tag not saved', error instanceof Error ? error.message : 'Unable to create this tag.');
    } finally {
      setPendingAction(null);
    }
  }, [createLabel, loadTags, tagService]);

  const handleDelete = useCallback(
    (tag: TagListItem) => {
      Alert.alert(
        `Delete #${tag.label}?`,
        tag.captureCount > 0
          ? 'This removes the tag from linked Captures but does not delete any original screenshots.'
          : 'This removes the empty tag from SnapBrain.',
        [
          { style: 'cancel', text: 'Cancel' },
          {
            style: 'destructive',
            text: 'Delete',
            onPress: () => {
              void (async () => {
                setPendingAction(`delete:${tag.id}`);

                try {
                  await tagService.deleteTag(tag.id);
                  if (editingTagId === tag.id) {
                    setEditingTagId(null);
                    setEditingLabel('');
                  }
                  await loadTags();
                } catch (error) {
                  Alert.alert(
                    'Tag not deleted',
                    error instanceof Error ? error.message : 'Unable to delete this tag.',
                  );
                } finally {
                  setPendingAction(null);
                }
              })();
            },
          },
        ],
      );
    },
    [editingTagId, loadTags, tagService],
  );

  const handleRename = useCallback(
    async (tagId: string) => {
      const nextLabel = editingLabel.trim();

      if (!nextLabel) {
        Alert.alert('Tag label required', 'Enter a tag label before saving.');
        return;
      }

      setPendingAction(`rename:${tagId}`);

      try {
        await tagService.renameOrMergeTag(tagId, nextLabel);
        setEditingTagId(null);
        setEditingLabel('');
        await loadTags();
      } catch (error) {
        Alert.alert('Tag not updated', error instanceof Error ? error.message : 'Unable to update this tag.');
      } finally {
        setPendingAction(null);
      }
    },
    [editingLabel, loadTags, tagService],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={tags}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? (
            <GlassSurface style={styles.emptyCard} useBlur={false}>
              <AppText color={colors.textMuted}>Loading tag library...</AppText>
            </GlassSurface>
          ) : (
            <GlassSurface style={styles.emptyCard} useBlur={false}>
              <AppText variant="title">No tags yet</AppText>
              <AppText color={colors.textMuted}>
                Create canonical tags here, then apply them from Capture detail or batch import.
              </AppText>
            </GlassSurface>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.heroCopy}>
              <AppText variant="eyebrow">Tags</AppText>
              <AppText variant="display">Canonical library</AppText>
              <AppText color={colors.textMuted}>
                Tags stay lowercase, case-insensitive, and emoji-safe across every Capture.
              </AppText>
            </View>

            <GlassSurface style={styles.createCard} useBlur={false}>
              <View style={styles.inputWrap} testID="create-tag-input-wrap">
                <AppText variant="eyebrow">Create tag</AppText>
                <AppInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setCreateLabel}
                  placeholder="study, receipts, 🧾"
                  style={styles.textInput}
                  value={createLabel}
                />
              </View>

              <View style={styles.createActions} testID="create-tag-actions-wrap">
                <AppButton
                  disabled={!createLabel.trim() || pendingAction === 'create'}
                  onPress={() => void handleCreate()}
                  style={styles.createActionButton}
                >
                  Add tag
                </AppButton>
              </View>
            </GlassSurface>
          </View>
        }
        renderItem={({ item }) => {
          const isEditing = editingTagId === item.id;
          const isBusy =
            pendingAction === `delete:${item.id}` || pendingAction === `rename:${item.id}` || pendingAction === 'create';

          return (
            <GlassSurface style={styles.tagCard} useBlur={false}>
              {isEditing ? (
                <View style={styles.editorBlock}>
                  <AppInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setEditingLabel}
                    placeholder="Rename or merge tag"
                    style={styles.textInput}
                    value={editingLabel}
                  />

                  <View style={styles.inlineActions}>
                    <AppButton
                      disabled={!editingLabel.trim() || isBusy}
                      onPress={() => void handleRename(item.id)}
                      style={styles.primaryButton}
                    >
                      Save
                    </AppButton>
                    <AppButton
                      disabled={isBusy}
                      onPress={() => {
                        setEditingTagId(null);
                        setEditingLabel('');
                      }}
                      style={styles.secondaryButton}
                      tone="secondary"
                    >
                      Cancel
                    </AppButton>
                  </View>
                </View>
              ) : (
                <AppButton
                  onPress={() => router.push(routes.tagDetail(item.id))}
                  style={styles.tagMain}
                  tone="secondary"
                >
                  <View style={styles.tagCopy}>
                    <AppText variant="title">#{item.label}</AppText>
                    <AppText color={colors.textMuted}>
                      {item.captureCount} Capture{item.captureCount === 1 ? '' : 's'}
                    </AppText>
                    <AppText color={colors.textMuted} variant="caption">
                      Last used {formatLastUsed(item.lastUsedAt)}
                    </AppText>
                  </View>

                  <View style={styles.rowActions}>
                    <AppIconButton
                      onPress={() => {
                        setEditingTagId(item.id);
                        setEditingLabel(item.label);
                      }}
                      size="md"
                      testID={`tag-edit-${item.id}`}
                    >
                      <Ionicons color={colors.text} name="create-outline" size={18} />
                    </AppIconButton>
                    <AppIconButton onPress={() => handleDelete(item)} size="md" testID={`tag-delete-${item.id}`}>
                      <Ionicons color={colors.danger} name="trash-outline" size={18} />
                    </AppIconButton>
                  </View>
                </AppButton>
              )}
            </GlassSurface>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function formatLastUsed(timestamp: number | null) {
  if (!timestamp) {
    return 'not used yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(timestamp);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  createCard: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  createActionButton: {
    alignSelf: 'flex-start',
    minWidth: 136,
  },
  createActions: {
    marginTop: spacing.sm,
  },
  editorBlock: {
    gap: spacing.sm,
  },
  emptyCard: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  heroCopy: {
    gap: spacing.xs,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputWrap: {
    gap: spacing.sm,
  },
  primaryButton: {
    minWidth: 120,
  },
  rowActions: {
    alignItems: 'center',
    flexShrink: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    minWidth: 120,
  },
  tagCard: {
    padding: spacing.md,
  },
  tagCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  tagMain: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  textInput: {
    minHeight: 48,
  },
});
