import { Stack } from 'expo-router';
import { catppuccin } from '@/theme/catppuccin';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: catppuccin.mocha.mantle },
        headerTintColor: catppuccin.mocha.text,
        headerTitleStyle: { fontFamily: 'InterSemiBold', fontSize: 17 },
        contentStyle: { backgroundColor: catppuccin.mocha.base },
      }}
    >
      <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
      <Stack.Screen name="note/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
