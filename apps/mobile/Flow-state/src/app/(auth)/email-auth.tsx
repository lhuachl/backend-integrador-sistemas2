import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Button, Input, Icon } from '@/components/ui';
import { catppuccin, spacing } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';

export default function EmailAuthScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register, loading, error, setError } = useAuth();

  const isLogin = mode === 'login';

  async function submit() {
    Haptics.selectionAsync();
    setError(null);

    if (isLogin) {
      if (!password) {
        setError('Ingresa tu contraseña');
        return;
      }
      await login({ email, password });
    } else {
      if (!name || !password) {
        setError('Completa todos los campos');
        return;
      }
      await register({ email, name, password });
    }
  }

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Icon name="lock" size={40} color={catppuccin.mocha.lavender} />
          <Text variant="h1" bold style={styles.title}>
            {isLogin ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </Text>
          <Text variant="body" color="subtext0" align="center">
            {isLogin ? email : 'Completa tus datos para empezar.'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <Input
              label="Nombre"
              placeholder="Cómo te llamas"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftIcon={<Icon name="lock" size={18} color={catppuccin.mocha.overlay1} />}
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          {error && (
            <Text variant="small" color="red" align="center">
              {error}
            </Text>
          )}

          <Button size="lg" loading={loading} onPress={submit}>
            {isLogin ? 'Entrar' : 'Crear cuenta'}
          </Button>

          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            Volver
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing[5],
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[8],
  },
  header: {
    alignItems: 'center',
    gap: spacing[3],
  },
  title: {
    marginTop: spacing[2],
  },
  form: {
    gap: spacing[4],
  },
});
