import {
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { StyleProp } from 'react-native';
import { Text } from './Text';
import { catppuccin, radii, spacing } from '@/theme/catppuccin';

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; label: TextStyle }> = {
  default: {
    container: { backgroundColor: catppuccin.mocha.lavender },
    label: { color: catppuccin.mocha.crust },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: catppuccin.mocha.surface2 },
    label: { color: catppuccin.mocha.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: catppuccin.mocha.lavender },
  },
  danger: {
    container: { backgroundColor: catppuccin.mocha.red },
    label: { color: catppuccin.mocha.crust },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; label: TextStyle }> = {
  sm: {
    container: { height: 32, paddingHorizontal: spacing[3], borderRadius: radii.md },
    label: { fontSize: 12 },
  },
  md: {
    container: { height: 38, paddingHorizontal: spacing[4], borderRadius: radii.md },
    label: { fontSize: 13 },
  },
  lg: {
    container: { height: 44, paddingHorizontal: spacing[5], borderRadius: radii.lg },
    label: { fontSize: 14 },
  },
};

export function Button({
  variant = 'default',
  size = 'md',
  loading,
  icon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable disabled={isDisabled} {...props}>
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            v.container,
            s.container,
            pressed && styles.pressed,
            isDisabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={v.label.color} />
          ) : (
            <>
              {icon}
              <Text
                variant="small"
                medium
                style={[styles.label, s.label, v.label]}
              >
                {children}
              </Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: radii.md,
  },
  label: {
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
