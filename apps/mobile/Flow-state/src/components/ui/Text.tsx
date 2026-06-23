import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, catppuccin } from '@/theme/catppuccin';

export type TextVariant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof typeof catppuccin.mocha;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  mono?: boolean;
  medium?: boolean;
  bold?: boolean;
}

export function Text({
  variant = 'body',
  color = 'text',
  align = 'left',
  mono,
  medium,
  bold,
  style,
  ...props
}: TextProps) {
  const base = typography[variant];
  const family = mono
    ? bold
      ? 'JetBrainsMonoBold'
      : medium
        ? 'JetBrainsMonoMedium'
        : 'JetBrainsMono'
    : bold
      ? 'InterBold'
      : medium
        ? 'InterMedium'
        : 'Inter';

  return (
    <RNText
      style={[
        styles.base,
        base,
        { color: catppuccin.mocha[color], textAlign: align, fontFamily: family },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
