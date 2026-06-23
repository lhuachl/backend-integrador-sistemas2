import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Button, Icon } from '@/components/ui';
import { catppuccin, spacing, radii } from '@/theme/catppuccin';
import { useOnboarding } from '@/store/onboarding';

const SLIDES = [
  {
    icon: 'command' as const,
    color: catppuccin.mocha.lavender,
    title: 'Flow-state',
    subtitle: 'Pensamiento en red. Progresión diaria. Equipo enfocado.',
  },
  {
    icon: 'brain' as const,
    color: catppuccin.mocha.mauve,
    title: 'Grafo de conocimiento',
    subtitle: 'Conectá tus ideas con [[wikilinks]]. Navegá tu pensamiento como una red, no como carpetas.',
  },
  {
    icon: 'target' as const,
    color: catppuccin.mocha.green,
    title: 'Progresión diaria',
    subtitle: 'Definí metas, completá tareas y mantené tu racha. Cada día suma.',
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const router = useRouter();
  const { finish } = useOnboarding();

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== page) {
      setPage(idx);
      Haptics.selectionAsync();
    }
  }

  function next() {
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
    } else {
      finish();
      router.replace('/(auth)/welcome');
    }
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.iconBox}>
              <Icon name={slide.icon} size={80} color={slide.color} />
            </View>
            <Text variant="hero" bold align="center">
              {slide.title}
            </Text>
            <Text variant="body" color="subtext0" align="center" style={styles.subtitle}>
              {slide.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === page && styles.dotActive]}
            />
          ))}
        </View>
        <Button size="lg" onPress={next}>
          {page === SLIDES.length - 1 ? 'Empezar' : 'Siguiente'}
        </Button>
        {page < SLIDES.length - 1 && (
          <Button variant="ghost" size="sm" onPress={() => { finish(); router.replace('/(auth)/welcome'); }}>
            Saltar
          </Button>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  scroll: {
    flex: 0,
    height: 420,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    gap: spacing[5],
    paddingTop: spacing[12],
  },
  iconBox: {
    marginBottom: spacing[4],
  },
  subtitle: {
    maxWidth: 280,
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    gap: spacing[4],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: catppuccin.mocha.surface1,
  },
  dotActive: {
    backgroundColor: catppuccin.mocha.lavender,
    width: 24,
  },
});
