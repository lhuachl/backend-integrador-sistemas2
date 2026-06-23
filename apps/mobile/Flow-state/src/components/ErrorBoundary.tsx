import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button, Icon } from '@/components/ui';
import { catppuccin, spacing, radii } from '@/theme/catppuccin';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Icon name="zap" size={48} color={catppuccin.mocha.red} />
          <Text variant="h2" bold align="center">
            Algo salió mal
          </Text>
          <Text variant="small" color="subtext0" align="center" style={styles.message}>
            {this.state.error.message}
          </Text>
          <Button size="md" onPress={this.handleReset}>
            Reintentar
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catppuccin.mocha.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[6],
  },
  message: {
    maxWidth: 280,
  },
});
