"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/store/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, initialized, init } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuth = pathname.startsWith("/welcome") || pathname.startsWith("/email-auth") || pathname.startsWith("/verify");
    const inApp = pathname.startsWith("/today") || pathname.startsWith("/knowledge") || pathname.startsWith("/progression") || pathname.startsWith("/team") || pathname.startsWith("/profile") || pathname.startsWith("/settings") || pathname.startsWith("/note");

    if (!user && inApp) {
      router.replace("/welcome");
    } else if (user && (inAuth || pathname === "/")) {
      router.replace("/today");
    }
  }, [user, initialized, pathname, router]);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
