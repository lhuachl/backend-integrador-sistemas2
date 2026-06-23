import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, Button, Icon, Chip, Separator, MarkdownText, Sheet } from '@/components/ui';
import { catppuccin, spacing, radii, typography } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';
import { useNotes } from '@/store/notes';
import { useTeams } from '@/store/teams';
import { client } from '@/lib/api/client';

export default function NoteEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { current, open, save, remove, create } = useNotes();
  const { teams, load: loadTeams } = useTeams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showShare, setShowShare] = useState(false);
  const [backlinkNotes, setBacklinkNotes] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (current) {
      client.getBacklinks(current.title).then((links) => {
        const notes = useNotes.getState().notes;
        const result = links
          .map((bl) => notes.find((n) => n.id === bl.source_note_id))
          .filter((n) => n !== undefined)
          .map((n) => ({ id: n!.id, title: n!.title }));
        setBacklinkNotes(result);
      });
    }
  }, [current]);

  useEffect(() => {
    open(id);
    if (user) loadTeams(user.id);
  }, [id, user]);

  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setContent(current.content);
      setTags(current.tags);
    }
  }, [current]);

  function saveNote() {
    save(id, { title: title || 'Sin título', content, tags });
  }

  async function handleWikiLink(targetTitle: string) {
    Haptics.selectionAsync();
    saveNote();
    const allNotes = useNotes.getState().notes;
    const found = allNotes.find((n) => n.title.toLowerCase() === targetTitle.toLowerCase());
    if (found) {
      router.push(`/(app)/note/${found.id}`);
    } else if (user) {
      const created = await create(user.id, { title: targetTitle, content: '' });
      if (created) router.push(`/(app)/note/${created.id}`);
    }
  }

  function deleteNote() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    remove(id);
    router.back();
  }

  if (!current) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text variant="body" color="subtext0">
            Cargando...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.toolbar}>
          <Pressable
            onPress={() => { saveNote(); router.back(); }}
            hitSlop={8}
          >
            <Icon name="chevron-left" size={24} color={catppuccin.mocha.subtext1} />
          </Pressable>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, mode === 'edit' && styles.toggleActive]}
              onPress={() => setMode('edit')}
            >
              <Icon name="edit" size={14} color={mode === 'edit' ? catppuccin.mocha.crust : catppuccin.mocha.overlay1} />
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === 'preview' && styles.toggleActive]}
              onPress={() => { saveNote(); setMode('preview'); }}
            >
              <Icon name="check" size={14} color={mode === 'preview' ? catppuccin.mocha.crust : catppuccin.mocha.overlay1} />
            </Pressable>
          </View>

          <View style={styles.toolbarActions}>
            <Pressable onPress={() => setShowShare(true)} hitSlop={8}>
              <Icon name="share" size={18} color={catppuccin.mocha.sky} />
            </Pressable>
            <Pressable onPress={saveNote} hitSlop={8}>
              <Icon name="check" size={20} color={catppuccin.mocha.green} />
            </Pressable>
            <Pressable onPress={deleteNote} hitSlop={8}>
              <Icon name="trash" size={20} color={catppuccin.mocha.red} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {mode === 'edit' ? (
            <>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Título"
                placeholderTextColor={catppuccin.mocha.overlay0}
                onBlur={saveNote}
              />

              {tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {tags.map((tag) => (
                    <Chip key={tag} variant="subtle">
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}

              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="Empieza a escribir... Usa [[títulos]] para enlazar notas."
                placeholderTextColor={catppuccin.mocha.overlay0}
                multiline
                textAlignVertical="top"
                onBlur={saveNote}
              />
            </>
          ) : (
            <>
              <Text variant="h1" bold>
                {title || 'Sin título'}
              </Text>

              {tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {tags.map((tag) => (
                    <Chip key={tag} variant="subtle">
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}

              <MarkdownText content={content} onWikiLink={handleWikiLink} />
            </>
          )}

          {backlinkNotes.length > 0 && (
            <Card>
              <Text variant="label" color="overlay1">
                Backlinks ({backlinkNotes.length})
              </Text>
              <View style={styles.linksBox}>
                {backlinkNotes.map((note) => (
                  <Pressable
                    key={note.id}
                    onPress={() => router.push(`/(app)/note/${note.id}`)}
                  >
                    <Chip variant="outline">
                      {note.title}
                    </Chip>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Sheet open={showShare} onClose={() => setShowShare(false)} title="Compartir con equipo">
        {teams.length === 0 ? (
          <Text variant="body" color="subtext0">No estás en ningún equipo. Creá uno en la pestaña Equipo.</Text>
        ) : (
          teams.map((team) => {
            const isShared = current?.shared_with.includes(team.id);
            return (
              <Pressable
                key={team.id}
                onPress={() => {
                  client.shareNoteToTeam(id, team.id);
                  open(id);
                  setShowShare(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Card padded style={isShared && styles.sharedCard}>
                  <View style={styles.shareRow}>
                    <Text variant="body" medium>{team.name}</Text>
                    {isShared ? (
                      <Chip variant="active">Compartida</Chip>
                    ) : (
                      <Chip variant="outline">Compartir</Chip>
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing[1],
    backgroundColor: catppuccin.mocha.surface0,
    borderRadius: radii.md,
    padding: 2,
  },
  toggleBtn: {
    width: 32,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: catppuccin.mocha.lavender,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  scroll: {
    padding: spacing[5],
    gap: spacing[3],
  },
  titleInput: {
    ...typography.h1,
    color: catppuccin.mocha.text,
    paddingVertical: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  contentInput: {
    ...typography.body,
    color: catppuccin.mocha.text,
    minHeight: 240,
    lineHeight: 24,
  },
  linksBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sharedCard: {
    backgroundColor: catppuccin.mocha.surface1,
  },
});
