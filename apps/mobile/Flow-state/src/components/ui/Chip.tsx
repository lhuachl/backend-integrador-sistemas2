import {
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
  StyleSheet,
} from 'react-native';
import type { StyleProp } from 'react-native';
import { Text } from './Text';
import { catppuccin, radii, spacing } from '@/theme/catppuccin';

export type ChipVariant = 'default' | 'active' | 'outline' | 'subtle';

export interface ChipProps extends Omit<PressableProps, 'style'> {
  variant?: ChipVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const variants: Record<ChipVariant, { bg: string; border: string; color: keyof typeof catppuccin.mocha }> = {
  default: { bg: catppuccin.mocha.surface0, border: catppuccin.mocha.surface0, color: 'subtext1' },
  active: { bg: catppuccin.mocha.lavender, border: catppuccin.mocha.lavender, color: 'crust' },
  outline: { bg: 'transparent', border: catppuccin.mocha.surface2, color: 'subtext1' },
  subtle: { bg: catppuccin.mocha.surface1, border: catppuccin.mocha.surface1, color: 'text' },
};

export function Chip({ variant = 'default', children, disabled, style, ...props }: ChipProps) {
  const v = variants[variant];

  return (
    <Pressable disabled={disabled} {...props}>
      {({ pressed }) => (
        <View
          style={[
            styles.chip,
            { backgroundColor: v.bg, borderColor: v.border },
            pressed && styles.pressed,
            disabled && styles.disabled,
            style,
          ]}
        >
          <Text variant="tiny" medium color={v.color}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
