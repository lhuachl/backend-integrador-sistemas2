import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Card,
  Button,
  Input,
  Icon,
  Chip,
  Sheet,
  Separator,
} from '@/components/ui';
import { catppuccin, spacing, radii } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';
import { useGoals } from '@/store/goals';
import { useTasks } from '@/store/tasks';
import { useActivity } from '@/store/activity';

type TaskFilter = 'all' | 'todo' | 'done';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function ProgressionScreen() {
  const { user } = useAuth();
  const { goals, load: loadGoals, create: createGoal, addProgress } = useGoals();
  const { tasks, load: loadTasks, toggle: toggleTask, create: createTask, remove: removeTask } = useTasks();
  const { streak, week, tasksDone, tasksTotal, goalsCompleted, load: loadActivity } = useActivity();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [showTaskSheet, setShowTaskSheet] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskGoalId, setTaskGoalId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadGoals(user.id);
      loadTasks(user.id);
      loadActivity(user.id);
    }
  }, [user]);

  async function onRefresh() {
    if (!user) return;
    setRefreshing(true);
    loadGoals(user.id);
    loadTasks(user.id);
    loadActivity(user.id);
    setRefreshing(false);
  }

  function submitGoal() {
    if (!user || !title || !target || !unit) return;
    createGoal(user.id, { title, target: Number(target), unit });
    setTitle('');
    setTarget('');
    setUnit('');
    setShowNew(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function submitTask() {
    if (!user || !taskTitle.trim()) return;
    createTask(user.id, { title: taskTitle.trim(), goal_id: taskGoalId });
    setTaskTitle('');
    setTaskGoalId(null);
    setShowTaskSheet(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'todo') return t.status !== 'done';
    if (taskFilter === 'done') return t.status === 'done';
    return true;
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={catppuccin.mocha.lavender} />
        }
      >
        <View style={styles.header}>
          <Text variant="h1" bold>
            Progresión
          </Text>
          <Button
            size="sm"
            icon={<Icon name="plus" size={16} color={catppuccin.mocha.crust} />}
            onPress={() => setShowNew(true)}
          >
            Meta
          </Button>
        </View>

        <Card padded>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="zap" size={20} color={catppuccin.mocha.peach} />
              <Text variant="h2" bold color="peach">
                {streak}
              </Text>
              <Text variant="tiny" color="overlay1">
                {streak === 1 ? 'día' : 'días'} seguidos
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="check" size={20} color={catppuccin.mocha.green} />
              <Text variant="h2" bold color="green">
                {tasksDone}
              </Text>
              <Text variant="tiny" color="overlay1">
                de {tasksTotal} tareas
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="target" size={20} color={catppuccin.mocha.lavender} />
              <Text variant="h2" bold color="lavender">
                {goalsCompleted}
              </Text>
              <Text variant="tiny" color="overlay1">
                metas listas
              </Text>
            </View>
          </View>
        </Card>

        <Card padded>
          <Text variant="label" color="overlay1" style={styles.heatmapLabel}>
            Esta semana
          </Text>
          <View style={styles.heatmap}>
            {week.map((day, i) => (
              <View key={day.date} style={styles.heatColumn}>
                <Text variant="tiny" color="overlay0" align="center">
                  {WEEK_DAYS[i]}
                </Text>
                <View
                  style={[
                    styles.heatBlock,
                    { backgroundColor: day.active ? catppuccin.mocha.green : catppuccin.mocha.surface1 },
                    day.date === week[week.length - 1].date && styles.heatToday,
                  ]}
                />
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text variant="label" color="overlay1">
            Metas
          </Text>
        </View>

        {goals.length === 0 ? (
          <Card padded>
            <Text variant="body" color="subtext0" align="center">
              Crea tu primera meta para empezar.
            </Text>
          </Card>
        ) : (
          goals.map((goal) => {
            const pct = Math.round((goal.current / goal.target) * 100);
            const done = goal.current >= goal.target;
            const goalTasks = tasks.filter((t) => t.goal_id === goal.id);

            return (
              <Card key={goal.id}>
                <View style={styles.goalHeader}>
                  <Text variant="h3" bold>
                    {goal.title}
                  </Text>
                  <Chip variant={done ? 'active' : 'subtle'}>
                    {goal.current}/{goal.target} {goal.unit}
                  </Chip>
                </View>
                {goal.description && (
                  <Text variant="small" color="subtext0">
                    {goal.description}
                  </Text>
                )}
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: done ? catppuccin.mocha.green : catppuccin.mocha.lavender,
                      },
                    ]}
                  />
                </View>
                <View style={styles.goalActions}>
                  <Text variant="tiny" color="overlay1" mono>
                    {pct}%{goalTasks.length > 0 ? ` · ${goalTasks.filter((t) => t.status === 'done').length}/${goalTasks.length} tareas` : ''}
                  </Text>
                  {!done && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        addProgress(goal.id, 1);
                        loadActivity(user!.id);
                      }}
                    >
                      <Chip variant="outline">
                        +1 {goal.unit}
                      </Chip>
                    </Pressable>
                  )}
                </View>

                {goalTasks.length > 0 && (
                  <View style={styles.tasksSection}>
                    <Separator />
                    {goalTasks.map((task) => (
                      <Pressable
                        key={task.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleTask(task.id);
                          loadActivity(user!.id);
                        }}
                        style={styles.taskRow}
                      >
                        <View
                          style={[
                            styles.taskCheck,
                            task.status === 'in_progress' && styles.taskInProgress,
                            task.status === 'done' && styles.taskDone,
                          ]}
                        >
                          {task.status === 'in_progress' && (
                            <View style={styles.progressDot} />
                          )}
                          {task.status === 'done' && (
                            <Icon name="check" size={12} color={catppuccin.mocha.crust} />
                          )}
                        </View>
                        <Text
                          variant="small"
                          color={task.status === 'done' ? 'overlay0' : 'text'}
                          style={task.status === 'done' && styles.taskDoneText}
                        >
                          {task.title}
                        </Text>
                        {task.status === 'in_progress' && (
                          <Chip variant="outline">en curso</Chip>
                        )}
                        {task.status === 'done' && (
                          <Chip variant="active">hecha</Chip>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </Card>
            );
          })
        )}

        <View style={styles.sectionHeader}>
          <Text variant="label" color="overlay1">
            Tareas
          </Text>
          <Pressable onPress={() => setShowTaskSheet(true)}>
            <Icon name="plus" size={18} color={catppuccin.mocha.lavender} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'todo', 'done'] as TaskFilter[]).map((f) => (
            <Chip
              key={f}
              variant={taskFilter === f ? 'active' : 'outline'}
              onPress={() => { Haptics.selectionAsync(); setTaskFilter(f); }}
            >
              {f === 'all' ? 'Todas' : f === 'todo' ? 'Pendientes' : 'Hechas'}
            </Chip>
          ))}
        </View>

        {filteredTasks.length === 0 ? (
          <Card padded>
            <Text variant="body" color="subtext0" align="center">
              Sin tareas aquí.
            </Text>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card padded style={styles.taskCard} key={task.id}>
              <View style={styles.taskRow}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleTask(task.id);
                    loadActivity(user!.id);
                  }}
                  style={styles.flexGrow}
                >
                  <View style={styles.taskRow}>
                    <View
                      style={[
                        styles.taskCheck,
                        task.status === 'in_progress' && styles.taskInProgress,
                        task.status === 'done' && styles.taskDone,
                      ]}
                    >
                      {task.status === 'in_progress' && (
                        <View style={styles.progressDot} />
                      )}
                      {task.status === 'done' && (
                        <Icon name="check" size={12} color={catppuccin.mocha.crust} />
                      )}
                    </View>
                    <Text
                      variant="body"
                      color={task.status === 'done' ? 'overlay0' : 'text'}
                      style={[task.status === 'done' && styles.taskDoneText]}
                    >
                      {task.title}
                    </Text>
                  </View>
                </Pressable>
                <Chip
                  variant={
                    task.status === 'done' ? 'active'
                    : task.status === 'in_progress' ? 'outline'
                    : 'subtle'
                  }
                >
                  {task.status === 'todo' ? 'pendiente' : task.status === 'in_progress' ? 'en curso' : 'hecha'}
                </Chip>
                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    removeTask(task.id);
                  }}
                  hitSlop={8}
                >
                  <Icon name="trash" size={16} color={catppuccin.mocha.overlay0} />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Sheet open={showNew} onClose={() => setShowNew(false)} title="Nueva meta">
        <Input label="Título" placeholder="Ej: Leer 10 papers" value={title} onChangeText={setTitle} />
        <View style={styles.formRow}>
          <Input label="Objetivo" placeholder="10" keyboardType="numeric" value={target} onChangeText={setTarget} style={{ flex: 1 }} />
          <Input label="Unidad" placeholder="papers" value={unit} onChangeText={setUnit} style={{ flex: 1 }} />
        </View>
        <Button size="lg" onPress={submitGoal}>
          Crear meta
        </Button>
      </Sheet>

      <Sheet open={showTaskSheet} onClose={() => setShowTaskSheet(false)} title="Nueva tarea">
        <Input label="Título" placeholder="Ej: Resumir paper #5" value={taskTitle} onChangeText={setTaskTitle} />
        <Text variant="label" color="overlay1">
          Vincular a meta (opcional)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalPicker}>
          <Chip variant={taskGoalId === null ? 'active' : 'outline'} onPress={() => setTaskGoalId(null)}>Ninguna</Chip>
          {goals.map((g) => (
            <Chip key={g.id} variant={taskGoalId === g.id ? 'active' : 'outline'} onPress={() => setTaskGoalId(g.id)}>{g.title}</Chip>
          ))}
        </ScrollView>
        <Button size="lg" onPress={submitTask}>
          Crear tarea
        </Button>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[12],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: catppuccin.mocha.surface1,
  },
  heatmapLabel: {
    marginBottom: spacing[2],
  },
  heatmap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[1],
  },
  heatColumn: {
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  heatBlock: {
    width: 36,
    height: 30,
    borderRadius: radii.sm,
  },
  heatToday: {
    borderWidth: 2,
    borderColor: catppuccin.mocha.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[0],
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: catppuccin.mocha.surface1,
    overflow: 'hidden',
    marginVertical: spacing[2],
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasksSection: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: catppuccin.mocha.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDone: {
    backgroundColor: catppuccin.mocha.green,
    borderColor: catppuccin.mocha.green,
  },
  taskInProgress: {
    backgroundColor: catppuccin.mocha.peach,
    borderColor: catppuccin.mocha.peach,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: catppuccin.mocha.crust,
  },
  taskDoneText: {
    textDecorationLine: 'line-through',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  taskCard: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  flexGrow: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  goalPicker: {
    gap: spacing[2],
  },
});
