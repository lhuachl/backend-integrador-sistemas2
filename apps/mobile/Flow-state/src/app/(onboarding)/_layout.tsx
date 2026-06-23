import { Stack } from 'expo-router';
import { catppuccin } from '@/theme/catppuccin';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: catppuccin.mocha.base } }} />
  );
}
