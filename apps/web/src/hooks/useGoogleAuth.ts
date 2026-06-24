"use client";

import { useCallback, useEffect, useRef } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function useGoogleAuth(onCredential: (idToken: string) => void) {
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  const init = useCallback(() => {
    if (!window.google || !CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (res) => {
        if (res.credential) cbRef.current(res.credential);
      },
    });
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) return;
    const t = setInterval(() => {
      if (window.google) {
        init();
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, [init]);

  const renderButton = useCallback((el: HTMLElement | null) => {
    if (!el || !window.google) return;
    window.google.accounts.id.renderButton(el, {
      theme: "filled_black",
      size: "large",
      width: 320,
      text: "continue_with",
    });
  }, []);

  return { renderButton, enabled: !!CLIENT_ID };
}
