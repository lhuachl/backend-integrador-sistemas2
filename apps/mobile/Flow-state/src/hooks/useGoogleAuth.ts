import { useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '@/store/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET ?? '';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function useGoogleAuth() {
  const { google, loading } = useAuth();

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'flowstate' });

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'email', 'profile'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  const exchangeCode = useCallback(
    async (code: string) => {
      const body = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      const res = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const tokens = await res.json();
      if (tokens.id_token) {
        await google(tokens.id_token);
      }
    },
    [redirectUri, google],
  );

  useEffect(() => {
    if (result?.type === 'success' && result.params.code) {
      exchangeCode(result.params.code);
    }
  }, [result, exchangeCode]);

  const signInWithGoogle = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) return false;
    await promptAsync();
    return true;
  }, [promptAsync]);

  return { signInWithGoogle, enabled: !!GOOGLE_CLIENT_ID, loading };
}
