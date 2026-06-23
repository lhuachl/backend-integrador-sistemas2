import React from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  type ModalProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Icon } from './Icon';
import { catppuccin, radii, spacing } from '@/theme/catppuccin';

export interface SheetProps extends Omit<ModalProps, 'visible' | 'children'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, children, ...props }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      {...props}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing[4]) },
          ]}
        >
          <View style={styles.handleRow}>
            {title ? (
              <Text variant="h3" medium>
                {title}
              </Text>
            ) : (
              <View />
            )}
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="x" size={20} color={catppuccin.mocha.subtext1} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,17,27,0.7)',
  },
  sheet: {
    backgroundColor: catppuccin.mocha.surface0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[4],
    borderTopWidth: 1,
    borderColor: catppuccin.mocha.surface1,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
