import { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, Button, Input, Icon, Chip, Sheet, MarkdownText } from '@/components/ui';
import { GraphView } from '@/components/graph/GraphView';
import { catppuccin, spacing, radii } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';
import { useNotes } from '@/store/notes';
import { client } from '@/lib/api/client';

import type { GraphData } from '@/lib/api/client';

type ViewMode = 'list' | 'graph';

export default function KnowledgeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { notes, load, create } = useNotes();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ViewMode>('list');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) load(user.id, { q: query });
  }, [user, query]);

  async function onRefresh() {
    if (!user) return;
    setRefreshing(true);
    load(user.id, { q: query });
    setRefreshing(false);
  }

  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].slice(0, 8), [notes]);

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });

  useEffect(() => {
    if (user) client.getGraph(user.id).then(setGraphData);
  }, [user, notes]);

  const selectedNote = notes.find((n) => n.id === selectedNodeId) ?? null;

  async function newNote() {
    Haptics.selectionAsync();
    if (!user) return;
    const note = await create(user.id, { title: 'Nota sin título', content: '' });
    if (note) router.push(`/(app)/note/${note.id}`);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1" bold>
          Grafo
        </Text>
        <Button size="sm" icon={<Icon name="plus" size={16} color={catppuccin.mocha.crust} />} onPress={newNote}>
          Nueva
        </Button>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, mode === 'list' && styles.toggleActive]}
          onPress={() => { Haptics.selectionAsync(); setMode('list'); }}
        >
          <Icon name="menu" size={16} color={mode === 'list' ? catppuccin.mocha.crust : catppuccin.mocha.overlay1} />
          <Text variant="tiny" medium color={mode === 'list' ? 'crust' : 'overlay1'}>Lista</Text>
        </Pressable>
        <Pressable
          style={[styles.toggle, mode === 'graph' && styles.toggleActive]}
          onPress={() => { Haptics.selectionAsync(); setMode('graph'); }}
        >
          <Icon name="share" size={16} color={mode === 'graph' ? catppuccin.mocha.crust : catppuccin.mocha.overlay1} />
          <Text variant="tiny" medium color={mode === 'graph' ? 'crust' : 'overlay1'}>Grafo</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Input
          placeholder="Buscar notas..."
          value={query}
          onChangeText={setQuery}
          leftIcon={<Icon name="search" size={18} color={catppuccin.mocha.overlay1} />}
        />
      </View>

      {mode === 'list' ? (
        <>
          {allTags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
              {allTags.map((tag) => (
                <Chip key={tag} variant="outline">
                  {tag}
                </Chip>
              ))}
            </ScrollView>
          )}

          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={catppuccin.mocha.lavender} />
            }
          >
            {notes.length === 0 ? (
              <Card padded>
                <Text variant="body" color="subtext0" align="center">
                  {query ? 'Sin resultados.' : 'Crea tu primera nota.'}
                </Text>
              </Card>
            ) : (
              notes.map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/(app)/note/${note.id}`);
                  }}
                >
                  <Card style={styles.noteCard}>
                    <Text variant="h3" bold numberOfLines={1}>
                      {note.title}
                    </Text>
                    <Text variant="small" color="subtext0" numberOfLines={2}>
                      {note.content.replace(/\[\[|\]\]/g, '').slice(0, 120)}
                    </Text>
                    {note.tags.length > 0 && (
                      <View style={styles.noteTags}>
                        {note.tags.slice(0, 3).map((tag) => (
                          <Chip key={tag} variant="subtle">
                            {tag}
                          </Chip>
                        ))}
                      </View>
                    )}
                    <Text variant="tiny" color="overlay0" mono style={styles.noteDate}>
                      {new Date(note.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </Text>
                  </Card>
                </Pressable>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.graphContainer}>
          {graphData.nodes.length > 0 ? (
            <GraphView
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodePress={(id) => setSelectedNodeId(id)}
            />
          ) : (
            <View style={styles.emptyGraph}>
              <Text variant="body" color="subtext0" align="center">
                No hay notas para grafar todavía.
              </Text>
            </View>
          )}
        </View>
      )}

      <Sheet open={!!selectedNote} onClose={() => setSelectedNodeId(null)} title={selectedNote?.title ?? ''}>
        {selectedNote && (
          <>
            {selectedNote.tags.length > 0 && (
              <View style={styles.sheetTags}>
                {selectedNote.tags.map((tag) => (
                  <Chip key={tag} variant="subtle">{tag}</Chip>
                ))}
              </View>
            )}
            <MarkdownText content={selectedNote.content.slice(0, 600)} />
            <Button
              size="lg"
              onPress={() => {
                setSelectedNodeId(null);
                router.push(`/(app)/note/${selectedNote.id}`);
              }}
            >
              Abrir nota completa
            </Button>
          </>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radii.md,
    backgroundColor: catppuccin.mocha.surface0,
  },
  toggleActive: {
    backgroundColor: catppuccin.mocha.lavender,
  },
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  tagsRow: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    paddingBottom: spacing[2],
  },
  list: {
    padding: spacing[5],
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  noteCard: {
    gap: spacing[2],
  },
  noteTags: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  noteDate: {
    marginTop: spacing[1],
  },
  graphContainer: {
    flex: 1,
    alignItems: 'center',
  },
  emptyGraph: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
