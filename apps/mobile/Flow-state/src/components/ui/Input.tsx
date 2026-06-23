import { useState } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { catppuccin, radii, spacing, typography } from '@/theme/catppuccin';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text variant="label" color="subtext1" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          focused && styles.focused,
          error && styles.error,
        ]}
      >
        {leftIcon}
        <TextInput
          {...props}
          secureTextEntry={hidden}
          placeholderTextColor={catppuccin.mocha.overlay0}
          style={[styles.input, typography.body]}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <Icon
              name={hidden ? 'command' : 'command'}
              size={18}
              color={catppuccin.mocha.overlay1}
            />
          </Pressable>
        )}
        {rightElement}
      </View>
      {error ? (
        <Text variant="tiny" color="red" style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="tiny" color="overlay1" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[1.5],
  },
  label: {
    marginBottom: spacing[0.5],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    height: 44,
    paddingHorizontal: spacing[3.5],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: catppuccin.mocha.surface0,
    backgroundColor: catppuccin.mocha.surface0,
  },
  focused: {
    borderColor: catppuccin.mocha.lavender,
  },
  error: {
    borderColor: catppuccin.mocha.red,
  },
  input: {
    flex: 1,
    color: catppuccin.mocha.text,
    paddingVertical: 0,
    minHeight: 44,
  },
  message: {
    marginTop: spacing[0.5],
  },
});
