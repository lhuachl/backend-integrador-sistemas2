import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Text, Card, Button, Avatar, Icon, Chip, Separator } from '@/components/ui';
import { catppuccin, spacing, radii, typography } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';
import { useNotes } from '@/store/notes';
import { useGoals } from '@/store/goals';
import { useTasks } from '@/store/tasks';
import { useTeams } from '@/store/teams';
import { useActivity } from '@/store/activity';
import { client } from '@/lib/api/client';

export default function ProfileScreen() {
  const { user, logout, setError } = useAuth();
  const { notes } = useNotes();
  const { goals } = useGoals();
  const { tasks } = useTasks();
  const { teams } = useTeams();
  const { streak, tasksDone, goalsCompleted } = useActivity();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [handle, setHandle] = useState(user?.handle ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setHandle(user.handle ?? '');
    }
  }, [user]);

  async function pickImage() {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = await client.updateProfile(user.id, { avatar_url: result.assets[0].uri });
      useAuth.setState({ user: updated });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async function saveProfile() {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await client.updateProfile(user.id, { name: name.trim(), handle: handle.trim() || undefined });
      useAuth.setState({ user: updated });
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <Pressable onPress={pickImage}>
            <Avatar name={name || user?.name || '?'} size={80} uri={user?.avatar_url} />
            <View style={styles.cameraBadge}>
              <Icon name="edit" size={12} color={catppuccin.mocha.crust} />
            </View>
          </Pressable>
          {editing ? (
            <View style={styles.editFields}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Nombre"
                placeholderTextColor={catppuccin.mocha.overlay0}
              />
              <TextInput
                style={styles.handleInput}
                value={handle}
                onChangeText={setHandle}
                placeholder="@handle"
                placeholderTextColor={catppuccin.mocha.overlay0}
                autoCapitalize="none"
              />
              <View style={styles.editActions}>
                <Button size="sm" onPress={saveProfile} loading={saving}>
                  Guardar
                </Button>
                <Button variant="ghost" size="sm" onPress={() => { setName(user?.name ?? ''); setHandle(user?.handle ?? ''); setEditing(false); }}>
                  Cancelar
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text variant="h2" bold>
                {user?.name ?? 'Usuario'}
              </Text>
              {user?.handle && (
                <Text variant="small" color="subtext0" mono>
                  @{user.handle}
                </Text>
              )}
              <Text variant="tiny" color="overlay1">
                {user?.email}
              </Text>
              <Button variant="outline" size="sm" onPress={() => setEditing(true)}>
                Editar perfil
              </Button>
            </View>
          )}
        </View>

        <Card padded>
          <View style={styles.statsGrid}>
            <View style={styles.stat}>
              <Text variant="h2" bold color="lavender">{notes.length}</Text>
              <Text variant="tiny" color="overlay1">notas</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="h2" bold color="green">{goals.length}</Text>
              <Text variant="tiny" color="overlay1">metas</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="h2" bold color="peach">{streak}</Text>
              <Text variant="tiny" color="overlay1">días racha</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="h2" bold color="sky">{tasksDone}</Text>
              <Text variant="tiny" color="overlay1">tareas hechas</Text>
            </View>
          </View>
        </Card>

        {teams.length > 0 && (
          <>
            <Text variant="label" color="overlay1">
              Equipos
            </Text>
            {teams.map((team) => (
              <Pressable key={team.id} onPress={() => router.push('/(tabs)/team')}>
                <Card style={styles.teamRow}>
                  <Icon name="users" size={18} color={catppuccin.mocha.lavender} />
                  <Text variant="body">{team.name}</Text>
                </Card>
              </Pressable>
            ))}
          </>
        )}

        <Separator />

        <Pressable onPress={() => router.push('/(app)/settings')}>
          <Card padded style={styles.menuRow}>
            <Icon name="settings" size={18} color={catppuccin.mocha.subtext1} />
            <Text variant="body">Ajustes</Text>
            <View style={{ flex: 1 }} />
            <Icon name="chevron-right" size={16} color={catppuccin.mocha.overlay0} />
          </Card>
        </Pressable>

        <Button variant="danger" size="lg" onPress={logout} style={styles.logoutBtn}>
          Cerrar sesión
        </Button>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[12],
  },
  profileHeader: {
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[4],
  },
  profileInfo: {
    alignItems: 'center',
    gap: spacing[1],
  },
  editFields: {
    width: '100%',
    gap: spacing[3],
    alignItems: 'center',
  },
  nameInput: {
    ...typography.h2,
    color: catppuccin.mocha.text,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderColor: catppuccin.mocha.surface1,
    minWidth: 200,
  },
  handleInput: {
    ...typography.small,
    color: catppuccin.mocha.subtext0,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderColor: catppuccin.mocha.surface1,
    minWidth: 160,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing[2],
    gap: spacing[0.5],
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  logoutBtn: {
    marginTop: spacing[4],
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: catppuccin.mocha.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: catppuccin.mocha.base,
  },
});
