import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Card,
  Button,
  Input,
  Avatar,
  Icon,
  Chip,
  Separator,
  Sheet,
} from '@/components/ui';
import { catppuccin, spacing } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';
import { useTeams } from '@/store/teams';

export default function TeamScreen() {
  const { user } = useAuth();
  const { teams, members, load, loadMembers, create: createTeam, invite, error } = useTeams();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'mentor'>('member');

  useEffect(() => {
    if (user) load(user.id);
  }, [user]);

  useEffect(() => {
    teams.forEach((t) => loadMembers(t.id));
  }, [teams]);

  function submitTeam() {
    if (!user || !teamName.trim()) return;
    createTeam(user.id, { name: teamName.trim(), description: teamDesc.trim() || undefined });
    setTeamName('');
    setTeamDesc('');
    setShowCreate(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function submitInvite() {
    if (!inviteTeamId || !inviteEmail.trim()) return;
    invite(inviteTeamId, { email: inviteEmail.trim(), role: inviteRole });
    setInviteEmail('');
    setInviteTeamId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text variant="h1" bold>
            Equipo
          </Text>
          <Button
            size="sm"
            icon={<Icon name="plus" size={16} color={catppuccin.mocha.crust} />}
            onPress={() => setShowCreate(true)}
          >
            Crear
          </Button>
        </View>

        {teams.length === 0 ? (
          <Card padded>
            <Text variant="body" color="subtext0" align="center">
              No estás en ningún equipo. Crea uno o pedí que te inviten.
            </Text>
          </Card>
        ) : (
          teams.map((team) => {
            const teamMembers = members[team.id] ?? [];
            return (
              <Card key={team.id}>
                <View style={styles.teamHeader}>
                  <View style={styles.teamIcon}>
                    <Icon name="users" size={20} color={catppuccin.mocha.lavender} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="h3" bold>
                      {team.name}
                    </Text>
                    <Text variant="tiny" color="overlay1" mono>
                      {team.slug}
                    </Text>
                  </View>
                </View>

                {team.description && (
                  <Text variant="small" color="subtext0">
                    {team.description}
                  </Text>
                )}

                <Separator />

                <Text variant="label" color="overlay1">
                  Miembros ({teamMembers.length})
                </Text>
                {teamMembers.map((m) => (
                  <View key={m.id} style={styles.memberRow}>
                    <Avatar name={m.name} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text variant="body" medium>
                        {m.name}
                      </Text>
                      <Text variant="tiny" color="overlay1">
                        {m.email}
                      </Text>
                    </View>
                    <Chip variant={m.role === 'owner' ? 'active' : m.role === 'mentor' ? 'subtle' : 'outline'}>
                      {m.role}
                    </Chip>
                  </View>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  icon={<Icon name="plus" size={16} color={catppuccin.mocha.text} />}
                  onPress={() => setInviteTeamId(team.id)}
                >
                  Invitar miembro
                </Button>
              </Card>
            );
          })
        )}
      </ScrollView>

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Crear equipo">
        <Input label="Nombre" placeholder="Mi equipo" value={teamName} onChangeText={setTeamName} />
        <Input label="Descripción (opcional)" placeholder="¿De qué trata?" value={teamDesc} onChangeText={setTeamDesc} />
        <Button size="lg" onPress={submitTeam}>
          Crear equipo
        </Button>
      </Sheet>

      <Sheet open={inviteTeamId !== null} onClose={() => setInviteTeamId(null)} title="Invitar miembro">
        <Input
          label="Correo electrónico"
          placeholder="miembro@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={inviteEmail}
          onChangeText={setInviteEmail}
        />
        <Text variant="label" color="overlay1">
          Rol
        </Text>
        <View style={styles.roleRow}>
          <Chip
            variant={inviteRole === 'member' ? 'active' : 'outline'}
            onPress={() => setInviteRole('member')}
          >
            Miembro
          </Chip>
          <Chip
            variant={inviteRole === 'mentor' ? 'active' : 'outline'}
            onPress={() => setInviteRole('mentor')}
          >
            Mentor
          </Chip>
        </View>
        {error && <Text variant="tiny" color="red">{error}</Text>}
        <Button size="lg" onPress={submitInvite}>
          Invitar
        </Button>
      </Sheet>
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
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: catppuccin.mocha.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[1.5],
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});
