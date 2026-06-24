"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import ShinyText from "@/components/ShinyText";
import GradientText from "@/components/GradientText";

export default function WelcomePage() {
  const { login, register, google, loading, error, pendingEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const { renderButton, enabled: googleEnabled } = useGoogleAuth((idToken) => {
    google(idToken);
  });

  useEffect(() => {
    if (pendingEmail) router.replace("/verify");
  }, [pendingEmail, router]);

  useEffect(() => {
    if (googleEnabled && googleBtnRef.current) renderButton(googleBtnRef.current);
  }, [googleEnabled, renderButton, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) await login({ email, password });
    else await register({ email, password, name });
  };

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Hero side */}
      <div className="relative flex flex-1 flex-col justify-center px-8 py-12 lg:px-16 xl:px-24">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full glass-chip px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-overlay1">
            <span className="dot dot-mauve" />
            flow-state
          </div>

          <div className="text-5xl font-bold tracking-tight lg:text-6xl xl:text-7xl">
            <ShinyText text="Flow-state" disabled={false} speed={4} color="#cdd6f4" shineColor="#cba6f7" />
          </div>

          <div className="text-lg text-overlay1 lg:text-xl">
            <GradientText
              colors={["#cba6f7", "#89b4fa", "#f5c2e7", "#cba6f7"]}
              animationSpeed={5}
              showBorder={false}
            >
              tu grafo de conocimiento en equipo
            </GradientText>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-overlay2">
            Captura ideas, conecta notas, mide tu progresión y comparte con tu equipo.
          </p>

          <div className="flex items-center gap-3 pt-2 font-mono text-[10px] text-overlay1">
            <span className="rounded-full bg-surface0/60 px-2 py-0.5 text-mauve">demo</span>
            <span>
              <span className="text-mauve">sofia@flowstate.app</span> · cualquier clave
            </span>
          </div>
        </div>
      </div>

      {/* Form side overlay */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-background/70 lg:block" />

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 lg:px-12 xl:px-20">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface0/85 p-6 shadow-2xl backdrop-blur-md lg:p-8">
          <div className="mb-6 flex items-center gap-6 border-b border-white/5">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                isLogin ? "text-foreground" : "text-overlay1 hover:text-overlay2"
              }`}
            >
              Sign In
              {isLogin && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-mauve" />}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                !isLogin ? "text-foreground" : "text-overlay1 hover:text-overlay2"
              }`}
            >
              Sign Up
              {!isLogin && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-mauve" />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Input
                type="text"
                value={name}
                onChange={setName}
                placeholder="nombre"
                required
                autoComplete="name"
              />
            )}
            <Input
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="email"
              required
              autoComplete="email"
            />
            <Input
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-overlay1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-overlay1/40 bg-surface1 text-mauve focus:ring-mauve"
                  />
                  keep me logged in
                </label>
                <button type="button" className="text-xs text-overlay1 hover:text-mauve transition-colors">
                  forgot?
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red/30 bg-red/10 px-3 py-2 font-mono text-xs text-red">
                <span className="opacity-60">!</span>{" "}
                {error === "invalid_credentials" ? "credenciales inválidas" : error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-mauve to-lavender px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-crust shadow-lg shadow-mauve/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "⟳ procesando..." : isLogin ? "sign in" : "sign up"}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-wider text-overlay2">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {googleEnabled ? (
            <div ref={googleBtnRef} className="mt-5 flex justify-center" />
          ) : (
            <p className="mt-5 text-center text-[10px] text-overlay2">
              Google OAuth no configurado
            </p>
          )}

          <div className="mt-6 text-center text-xs text-overlay1">
            {isLogin ? "¿no tienes cuenta?" : "¿ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-mauve transition-colors hover:underline"
            >
              {isLogin ? "registrarse →" : "login →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  type,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: {
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="w-full border-0 border-b border-overlay1/40 bg-transparent px-0 py-2.5 text-sm text-foreground placeholder:text-overlay2 transition-colors focus:border-mauve focus:outline-none"
    />
  );
}