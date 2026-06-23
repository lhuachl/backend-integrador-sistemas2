import { useState } from 'react';
import {
  Pressable,
  Animated,
  type PressableProps,
  StyleSheet,
} from 'react-native';
import { catppuccin, radii, spacing } from '@/theme/catppuccin';

export interface SwitchProps extends Omit<PressableProps, 'onPress'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const WIDTH = 48;
const HEIGHT = 26;
const KNOB = 22;
const PADDING = 2;

export function Switch({ checked, onCheckedChange, disabled, ...props }: SwitchProps) {
  const [internal, setInternal] = useState(false);
  const isOn = checked ?? internal;
  const translate = new Animated.Value(isOn ? WIDTH - KNOB - PADDING * 2 : PADDING);

  Animated.spring(translate, {
    toValue: isOn ? WIDTH - KNOB - PADDING * 2 : PADDING,
    useNativeDriver: true,
    friction: 8,
    tension: 120,
  }).start();

  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  };

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOn, disabled: disabled ?? undefined }}
      {...props}
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: isOn ? catppuccin.mocha.lavender : catppuccin.mocha.surface1 },
          disabled && styles.disabled,
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            { transform: [{ translateX: translate }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: radii.full,
    justifyContent: 'center',
    padding: PADDING,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: catppuccin.mocha.text,
  },
  disabled: {
    opacity: 0.5,
  },
});
