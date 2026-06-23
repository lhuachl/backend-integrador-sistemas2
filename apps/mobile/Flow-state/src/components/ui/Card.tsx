import { View, type ViewProps, StyleSheet } from 'react-native';
import { catppuccin, radii, spacing, shadows } from '@/theme/catppuccin';

export interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ padded = true, style, children, ...props }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: catppuccin.mocha.surface0,
    borderWidth: 1,
    borderColor: catppuccin.mocha.surface1,
    ...shadows.sm,
  },
  padded: {
    padding: spacing[4],
  },
});
