"use client";

import { memo } from "react";
import Galaxy from "@/components/Galaxy";

const GalaxyBackground = memo(function GalaxyBackground() {
  return (
    <div className="absolute inset-0 bg-background">
      <Galaxy
        hueShift={0}
        saturation={0.7}
        glowIntensity={0.55}
        density={0.85}
        starSpeed={0.3}
        twinkleIntensity={0.45}
        rotationSpeed={0.08}
        mouseRepulsion={false}
        mouseInteraction={false}
      />
    </div>
  );
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <GalaxyBackground />
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}