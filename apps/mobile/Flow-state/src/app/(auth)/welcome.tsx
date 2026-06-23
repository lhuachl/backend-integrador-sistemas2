import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Button, Input, Icon, Separator, GoogleLogo } from '@/components/ui';
import { catppuccin, spacing, typography } from '@/theme/catppuccin';
import { useState } from 'react';
import { useAuth } from '@/store/auth';
import { client } from '@/lib/api/client';

export default function WelcomeScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { loading, setError } = useAuth();

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function continueWithEmail() {
    Haptics.selectionAsync();
    if (!isValidEmail(email)) {
      setError('Ingresa un correo válido');
      return;
    }
    setError(null);
    const existing = client.findUserByEmail(email);
    router.push({
      pathname: '/(auth)/email-auth',
      params: { email, mode: existing ? 'login' : 'signup' },
    });
  }

  function continueWithGoogle() {
    Haptics.selectionAsync();
    router.push({
      pathname: '/(auth)/email-auth',
      params: { email: '', mode: 'google' },
    });
  }

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.logoBox}>
          <Icon name="command" size={48} color={catppuccin.mocha.lavender} />
          <Text variant="hero" bold style={styles.title}>
            Flow-state
          </Text>
          <Text variant="body" color="subtext0" align="center">
            Pensamiento en red. Progresión diaria. Equipo enfocado.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Correo electrónico"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            leftIcon={<Icon name="mail" size={18} color={catppuccin.mocha.overlay1} />}
            returnKeyType="next"
            onSubmitEditing={continueWithEmail}
          />

          <Button size="lg" loading={loading} onPress={continueWithEmail}>
            Continuar con email
          </Button>

          <Separator />

          <Button
            variant="outline"
            size="lg"
            icon={<GoogleLogo size={18} />}
            onPress={continueWithGoogle}
          >
            Continuar con Google
          </Button>
        </View>

        <Text variant="tiny" color="overlay0" align="center" style={styles.footer}>
          Al continuar aceptas los términos y política de privacidad.
        </Text>
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
    justifyContent: 'space-between',
    paddingVertical: spacing[6],
  },
  logoBox: {
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[12],
  },
  title: {
    marginTop: spacing[2],
  },
  form: {
    gap: spacing[4],
    width: '100%',
  },
  footer: {
    marginTop: spacing[4],
  },
});
