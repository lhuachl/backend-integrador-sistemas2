import { useEffect, useState } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { catppuccin, radii, spacing } from '@/theme/catppuccin';

export type ToastType = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type?: ToastType;
}

export function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const hide = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(onDone);
    }, 3000);

    return () => clearTimeout(hide);
  }, []);

  const icon: import('./Icon').IconName = toast.type === 'error' ? 'x' : toast.type === 'success' ? 'check' : 'bell';
  const color = toast.type === 'error' ? catppuccin.mocha.red : toast.type === 'success' ? catppuccin.mocha.green : catppuccin.mocha.blue;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Icon name={icon} size={18} color={color} />
      <Text variant="small" color="text" style={styles.message}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: catppuccin.mocha.surface0,
    borderWidth: 1,
    borderColor: catppuccin.mocha.surface1,
    marginBottom: spacing[2],
    minWidth: 260,
    maxWidth: '90%',
    alignSelf: 'center',
  },
  message: {
    flexShrink: 1,
  },
});
