import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/store/auth';
import { useOnboarding } from '@/store/onboarding';
import { useFonts } from '@/hooks/useFonts';
import { Screen } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { catppuccin } from '@/theme/catppuccin';

export default function RootLayout() {
  const fontsReady = useFonts();
  const { user, initialized, init } = useAuth();
  const { completed: onboardingDone, check: checkOnboarding } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
    checkOnboarding().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!fontsReady || !ready) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inAuth = segments[0] === '(auth)';
    const inApp = segments[0] === '(tabs)' || segments[0] === '(app)';

    if (!onboardingDone && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (onboardingDone && inOnboarding) {
      router.replace('/(auth)/welcome');
    } else if (user && (inAuth || inOnboarding)) {
      router.replace('/(tabs)/today');
    } else if (!user && !inAuth && !inOnboarding && onboardingDone) {
      router.replace('/(auth)/welcome');
    }
  }, [fontsReady, ready, onboardingDone, initialized, user, segments, router]);

  if (!fontsReady || !ready) {
    return (
      <Screen style={{ backgroundColor: catppuccin.mocha.base }}>
        <StatusBar style="light" />
      </Screen>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <Slot />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
