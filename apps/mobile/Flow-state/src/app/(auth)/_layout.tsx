import { Stack } from 'expo-router';
import { catppuccin } from '@/theme/catppuccin';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: catppuccin.mocha.base },
      }}
    />
  );
}
