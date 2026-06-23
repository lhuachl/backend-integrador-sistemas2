import { View, Image, type ViewProps, StyleSheet } from 'react-native';
import { Text } from './Text';
import { catppuccin } from '@/theme/catppuccin';

export interface AvatarProps extends ViewProps {
  name: string;
  size?: number;
  color?: keyof typeof catppuccin.mocha;
  uri?: string | null;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const palette: Array<keyof typeof catppuccin.mocha> = [
  'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon',
  'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender',
];

function colorFor(name: string): keyof typeof catppuccin.mocha {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, size = 36, color, style, uri, ...props }: AvatarProps) {
  const bg = color ?? colorFor(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: catppuccin.mocha[bg],
        },
        style,
      ]}
      {...props}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text
          variant="tiny"
          bold
          color="crust"
          style={{ fontSize: size * 0.38, lineHeight: size * 0.42 }}
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
