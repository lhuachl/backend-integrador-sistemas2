import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button, Separator, Switch } from '@/components/ui';
import { catppuccin, spacing } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';
import { useState } from 'react';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="h1" bold>
          Ajustes
        </Text>

        <Card>
          <Text variant="h3" bold>
            {user?.name ?? 'Usuario'}
          </Text>
          <Text variant="body" color="subtext0">
            {user?.email ?? ''}
          </Text>
        </Card>

        <Card padded>
          <View style={styles.row}>
            <Text variant="body" medium>
              Notificaciones
            </Text>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </View>
          <Separator />
          <View style={styles.row}>
            <Text variant="body" medium>
              Tema oscuro
            </Text>
            <Switch checked disabled />
          </View>
        </Card>

        <Button variant="danger" size="lg" onPress={logout}>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
