import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, Button, Avatar, Icon, Chip, Input } from '@/components/ui';
import { catppuccin, spacing, radii } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';
import { useTasks } from '@/store/tasks';
import { useGoals } from '@/store/goals';
import { useNotes } from '@/store/notes';

export default function TodayScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { tasks, load: loadTasks, toggle, create: createTask } = useTasks();
  const { goals, load: loadGoals } = useGoals();
  const { notes, load: loadNotes } = useNotes();
  const [refreshing, setRefreshing] = useState(false);
  const [quickTask, setQuickTask] = useState('');

  useEffect(() => {
    if (!user) return;
    loadTasks(user.id);
    loadGoals(user.id);
    loadNotes(user.id);
  }, [user]);

  async function onRefresh() {
    if (!user) return;
    setRefreshing(true);
    loadTasks(user.id);
    loadGoals(user.id);
    loadNotes(user.id);
    setRefreshing(false);
  }

  async function addQuickTask() {
    if (!user || !quickTask.trim()) return;
    Haptics.selectionAsync();
    await createTask(user.id, { title: quickTask.trim() });
    setQuickTask('');
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const activeGoal = goals[0];
  const goalPct = activeGoal ? Math.round((activeGoal.current / activeGoal.target) * 100) : 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={catppuccin.mocha.lavender}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text variant="tiny" color="overlay1" mono>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <Text variant="h1" bold>
              Hoy
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/settings')}>
            <Avatar name={user?.name ?? 'User'} size={40} uri={user?.avatar_url} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Card padded style={styles.statCard}>
            <Text variant="h2" bold color="lavender">
              {pendingTasks.length}
            </Text>
            <Text variant="tiny" color="subtext0">
              tareas
            </Text>
          </Card>
          <Card padded style={styles.statCard}>
            <Text variant="h2" bold color="green">
              {goals.filter((g) => g.current >= g.target).length}
            </Text>
            <Text variant="tiny" color="subtext0">
              metas listas
            </Text>
          </Card>
          <Card padded style={styles.statCard}>
            <Text variant="h2" bold color="peach">
              {notes.length}
            </Text>
            <Text variant="tiny" color="subtext0">
              notas
            </Text>
          </Card>
        </View>

        {activeGoal && (
          <Card>
            <View style={styles.goalHeader}>
              <Text variant="h3" bold>
                {activeGoal.title}
              </Text>
              <Chip variant="active">
                {activeGoal.current}/{activeGoal.target} {activeGoal.unit}
              </Chip>
            </View>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, { width: `${goalPct}%` }]} />
            </View>
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text variant="label" color="overlay1">
            Tareas pendientes
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/progression')}>
            <Text variant="tiny" color="lavender">
              Ver todas
            </Text>
          </Pressable>
        </View>

        <View style={styles.quickAdd}>
          <Input
            placeholder="Agregar tarea rápida..."
            value={quickTask}
            onChangeText={setQuickTask}
            returnKeyType="done"
            onSubmitEditing={addQuickTask}
            rightElement={
              <Pressable onPress={addQuickTask} hitSlop={8}>
                <Icon name="plus" size={18} color={catppuccin.mocha.lavender} />
              </Pressable>
            }
          />
        </View>

        {pendingTasks.length === 0 ? (
          <Card padded>
            <Text variant="body" color="subtext0" align="center">
              No hay tareas pendientes.
            </Text>
          </Card>
        ) : (
          pendingTasks.slice(0, 4).map((task) => (
            <Pressable
              key={task.id}
              onPress={() => {
                Haptics.selectionAsync();
                toggle(task.id);
              }}
            >
              <Card padded style={styles.taskRow}>
                <View style={styles.taskCheck} />
                <Text variant="body" style={{ flex: 1 }}>
                  {task.title}
                </Text>
                {task.status === 'in_progress' && (
                  <Chip variant="subtle">en progreso</Chip>
                )}
              </Card>
            </Pressable>
          ))
        )}

        <Button variant="outline" size="sm" onPress={logout}>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: catppuccin.mocha.surface1,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: catppuccin.mocha.green,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: catppuccin.mocha.surface2,
  },
  quickAdd: {
    marginBottom: spacing[1],
  },
});
