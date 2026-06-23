"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import ShinyText from "@/components/ShinyText";
import GradientText from "@/components/GradientText";

export default function VerifyPage() {
  const { pendingEmail, verify, loading, error, clearPending } = useAuth();
  const [code, setCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!pendingEmail) router.replace("/welcome");
  }, [pendingEmail, router]);

  if (!pendingEmail) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail) return;
    await verify({ email: pendingEmail, code });
  };

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Hero side */}
      <div className="relative flex flex-1 flex-col justify-center px-8 py-12 lg:px-16 xl:px-24">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full glass-chip px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-overlay1">
            <span className="dot dot-warning" />
            verify
          </div>

          <div className="text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl">
            <ShinyText text="Verifica" disabled={false} speed={4} color="#cdd6f4" shineColor="#f9e2af" />
          </div>

          <div className="text-lg text-overlay1 lg:text-xl">
            <GradientText
              colors={["#f9e2af", "#cba6f7", "#89b4fa", "#f9e2af"]}
              animationSpeed={5}
              showBorder={false}
            >
              tu código de acceso
            </GradientText>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-overlay2">
            Revisa tu bandeja de entrada. Ingresa los 6 dígitos que enviamos a{" "}
            <span className="text-mauve">{pendingEmail}</span>.
          </p>
        </div>
      </div>

      {/* Form side overlay */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-background/70 lg:block" />

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 lg:px-12 xl:px-20">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface0/85 p-6 shadow-2xl backdrop-blur-md lg:p-8">
          <h2 className="mb-1 text-lg font-semibold text-foreground">código de verificación</h2>
          <p className="mb-6 text-xs text-overlay1">
            enviado a <span className="text-mauve">{pendingEmail}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              pattern="[0-9]{6}"
              autoFocus
              autoComplete="one-time-code"
              required
              placeholder="000000"
              className="w-full border-0 border-b border-overlay1/40 bg-transparent px-0 py-3 text-center text-2xl font-medium tracking-[0.5em] text-foreground placeholder:text-overlay2 transition-colors focus:border-mauve focus:outline-none"
            />

            {error && (
              <div className="rounded-md border border-red/30 bg-red/10 px-3 py-2 font-mono text-xs text-red">
                <span className="opacity-60">!</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-xl bg-gradient-to-r from-mauve to-lavender px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-crust shadow-lg shadow-mauve/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "⟳ verificando..." : "verificar"}
            </button>

            <button
              type="button"
              onClick={clearPending}
              className="w-full text-xs text-overlay1 transition-colors hover:text-foreground"
            >
              ← volver al login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}