import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

SplashScreen.preventAutoHideAsync().catch(() => {});

export function useFonts() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await Font.loadAsync({
          Inter: Inter_400Regular,
          InterMedium: Inter_500Medium,
          InterSemiBold: Inter_600SemiBold,
          InterBold: Inter_700Bold,
          JetBrainsMono: JetBrainsMono_400Regular,
          JetBrainsMonoMedium: JetBrainsMono_500Medium,
          JetBrainsMonoBold: JetBrainsMono_700Bold,
        });
      } catch (e) {
        console.error('Font load failed', e);
      } finally {
        if (!cancelled) {
          setReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
