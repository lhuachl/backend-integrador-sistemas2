import { View, type ViewProps, StyleSheet } from 'react-native';
import { catppuccin, spacing } from '@/theme/catppuccin';

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ orientation = 'horizontal', style, ...props }: SeparatorProps) {
  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: catppuccin.mocha.surface0,
    marginVertical: spacing[2],
    width: '100%',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: catppuccin.mocha.surface0,
    marginHorizontal: spacing[2],
    height: '100%',
  },
});
