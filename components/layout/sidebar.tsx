'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { usePathname } from 'next/navigation'
import { Zap, Brain, Briefcase, Heart, Wallet, Home, BookOpen, GitGraph, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
  section: 'main' | 'module' | 'system'
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', icon: Zap, href: '/', section: 'main' },
  { id: 'body', label: 'Body', icon: Zap, href: '/module/body', section: 'module' },
  { id: 'mind', label: 'Mind', icon: Brain, href: '/module/mind', section: 'module' },
  { id: 'work', label: 'Work', icon: Briefcase, href: '/module/work', section: 'module' },
  { id: 'relate', label: 'Relate', icon: Heart, href: '/module/relate', section: 'module' },
  { id: 'wealth', label: 'Wealth', icon: Wallet, href: '/module/wealth', section: 'module' },
  { id: 'space', label: 'Space', icon: Home, href: '/module/space', section: 'module' },
  { id: 'mirror', label: 'Mirror', icon: BookOpen, href: '/mirror', section: 'system' },
  { id: 'graph', label: 'Graph', icon: GitGraph, href: '/graph', section: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', section: 'system' },
]

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const modules = NAV_ITEMS.filter((i) => i.section === 'module')
  const systemItems = NAV_ITEMS.filter((i) => i.section === 'system')

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-zinc-800/20 px-5 py-5">
        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        <span className="text-xs font-light tracking-[0.18em] text-zinc-400 uppercase">
          flowstate
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        <NavLink item={NAV_ITEMS[0]} pathname={pathname} onClick={onNavClick} />

        <div className="my-3 border-t border-zinc-800/20" />

        <span className="mb-1 px-3 text-[9px] font-medium tracking-widest text-zinc-600 uppercase">
          Modules
        </span>
        {modules.map((item) => (
          <NavLink key={item.id} item={item} pathname={pathname} onClick={onNavClick} />
        ))}

        <div className="my-3 border-t border-zinc-800/20" />

        <span className="mb-1 px-3 text-[9px] font-medium tracking-widest text-zinc-600 uppercase">
          System
        </span>
        {systemItems.map((item) => (
          <NavLink key={item.id} item={item} pathname={pathname} onClick={onNavClick} />
        ))}
      </nav>

      <div className="border-t border-zinc-800/20 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600/20">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-medium text-indigo-400">
                {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col truncate">
            <span className="truncate text-xs text-zinc-400">{user?.name ?? user?.email}</span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:bg-zinc-800/40 hover:text-zinc-400"
        >
          Sign out
        </button>
      </div>
    </>
  )
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem
  pathname: string
  onClick?: () => void
}) {
  const active = pathname === item.href
  return (
    <a
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-zinc-800/60 text-zinc-200'
          : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300'
      }`}
    >
      <span className="w-4 text-center">{item.icon && <item.icon className="mx-auto h-4 w-4" />}</span>
      <span>{item.label}</span>
    </a>
  )
}
