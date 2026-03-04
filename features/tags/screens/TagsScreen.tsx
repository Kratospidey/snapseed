import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/primitives/AppText';
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
            <View style={styles.emptyCard}>
              <AppText color={colors.textMuted}>Loading tag library...</AppText>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <AppText variant="title">No tags yet</AppText>
              <AppText color={colors.textMuted}>
                Create canonical tags here, then apply them from Capture detail or batch import.
              </AppText>
            </View>
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

            <View style={styles.createCard}>
              <View style={styles.inputWrap}>
                <AppText variant="eyebrow">Create tag</AppText>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setCreateLabel}
                  placeholder="study, receipts, 🧾"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                  value={createLabel}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!createLabel.trim() || pendingAction === 'create'}
                onPress={() => void handleCreate()}
                style={[
                  styles.primaryButton,
                  (!createLabel.trim() || pendingAction === 'create') && styles.buttonDisabled,
                ]}
              >
                <AppText color={colors.surface} variant="action">
                  Add tag
                </AppText>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isEditing = editingTagId === item.id;
          const isBusy =
            pendingAction === `delete:${item.id}` || pendingAction === `rename:${item.id}` || pendingAction === 'create';

          return (
            <View style={styles.tagCard}>
              {isEditing ? (
                <View style={styles.editorBlock}>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setEditingLabel}
                    placeholder="Rename or merge tag"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    value={editingLabel}
                  />

                  <View style={styles.inlineActions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={!editingLabel.trim() || isBusy}
                      onPress={() => void handleRename(item.id)}
                      style={[styles.primaryButton, (!editingLabel.trim() || isBusy) && styles.buttonDisabled]}
                    >
                      <AppText color={colors.surface} variant="action">
                        Save
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy}
                      onPress={() => {
                        setEditingTagId(null);
                        setEditingLabel('');
                      }}
                      style={styles.secondaryButton}
                    >
                      <AppText variant="action">Cancel</AppText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(routes.tagDetail(item.id))}
                  style={styles.tagMain}
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
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy}
                      onPress={() => {
                        setEditingTagId(item.id);
                        setEditingLabel(item.label);
                      }}
                      style={styles.iconButton}
                    >
                      <Ionicons color={colors.text} name="create-outline" size={18} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy}
                      onPress={() => handleDelete(item)}
                      style={styles.iconButton}
                    >
                      <Ionicons color={colors.danger} name="trash-outline" size={18} />
                    </Pressable>
                  </View>
                </Pressable>
              )}
            </View>
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
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  createCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  editorBlock: {
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
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
  iconButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputWrap: {
    gap: spacing.xs,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.md,
  },
  tagCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  tagMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  textInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
