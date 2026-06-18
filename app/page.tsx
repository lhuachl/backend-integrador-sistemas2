'use client'

import { useAuth } from "@/components/auth/auth-provider";
import { AuthPage } from "@/components/auth/auth-page";
import { AppLayout } from "@/components/layout/app-layout";
import { DailyPage } from "@/components/daily/daily-page";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppLayout>
      <DailyPage />
    </AppLayout>
  );
}
