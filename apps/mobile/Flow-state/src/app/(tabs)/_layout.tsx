import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui';
import { catppuccin } from '@/theme/catppuccin';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: catppuccin.mocha.mantle,
          borderTopWidth: 1,
          borderTopColor: catppuccin.mocha.surface0,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: catppuccin.mocha.lavender,
        tabBarInactiveTintColor: catppuccin.mocha.overlay0,
        tabBarLabelStyle: {
          fontFamily: 'JetBrainsMono',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: 'Grafo',
          tabBarIcon: ({ color, size }) => <Icon name="brain" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progression"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size }) => <Icon name="target" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Equipo',
          tabBarIcon: ({ color, size }) => <Icon name="users" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
