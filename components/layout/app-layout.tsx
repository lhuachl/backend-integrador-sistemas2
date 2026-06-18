'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import FloatingLines from '@/components/FloatingLines'
import { Sidebar } from './sidebar'
import { Menu, X } from 'lucide-react'

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 opacity-15">
        <FloatingLines
          linesGradient={['#6366f1', '#818cf8', '#a5b4fc']}
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[3, 5, 3]}
          lineDistance={[12, 10, 14]}
          animationSpeed={0.5}
          interactive={true}
          bendRadius={8}
          bendStrength={-0.4}
          mouseDamping={0.05}
          parallax={true}
          parallaxStrength={0.2}
          mixBlendMode="screen"
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed left-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400 md:hidden"
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <div className="relative z-10 flex h-dvh">
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-0 left-0 z-20 transition-transform duration-200 md:static md:translate-x-0`}
        >
          <aside className="flex h-dvh w-64 flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80">
            <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
            <div className="absolute -right-4 top-0 h-full w-8 bg-gradient-to-r from-indigo-500/5 to-transparent blur-xl" />
            <Sidebar onNavClick={() => setSidebarOpen(false)} />
          </aside>
        </div>

        <main className="flex flex-1 flex-col overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
