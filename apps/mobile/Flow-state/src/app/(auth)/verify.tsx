import { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Button } from '@/components/ui';
import { catppuccin, spacing, radii, typography } from '@/theme/catppuccin';
import { useAuth } from '@/store/auth';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { verify, loading, error, setError } = useAuth();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(digits: string) {
    Haptics.selectionAsync();
    if (digits.length !== CODE_LENGTH) {
      setError('Ingresa el código completo');
      return;
    }
    setError(null);
    await verify({ email, code: digits });
  }

  const boxes = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Text variant="h1" bold>
            Verifica tu correo
          </Text>
          <Text variant="body" color="subtext0" align="center">
            Ingresa el código de 6 dígitos enviado a {email}
          </Text>
        </View>

        <View style={styles.codeBox}>
          {boxes.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.box,
                i === code.length && styles.boxActive,
              ]}
            >
              <Text variant="h2" bold color="text">
                {digit}
              </Text>
            </View>
          ))}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            value={code}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
              setCode(digits);
              setError(null);
              if (digits.length === CODE_LENGTH) {
                submit(digits);
              }
            }}
            returnKeyType="go"
            onSubmitEditing={() => submit(code)}
          />
        </View>

        {error && (
          <Text variant="small" color="red" align="center">
            {error}
          </Text>
        )}

        <Button size="lg" loading={loading} onPress={() => submit(code)}>
          Verificar
        </Button>

        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          Volver
        </Button>
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
    gap: spacing[6],
  },
  header: {
    alignItems: 'center',
    gap: spacing[3],
  },
  codeBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2.5],
  },
  box: {
    width: 44,
    height: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: catppuccin.mocha.surface1,
    backgroundColor: catppuccin.mocha.surface0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: catppuccin.mocha.lavender,
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
});
