# Flow-state Web Architecture

## Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind 4 + shadcn/ui + reactbits.dev components
- **State**: Zustand
- **API Client**: `fetch` native + localStorage (same `ApiClient` interface as mobile)
- **Data viz**: d3-force + d3-selection (knowledge graph)
- **Markdown**: markdown-it
- **Fonts**: JetBrainsMono + Inter via next/font
- **Theme**: Catppuccin-adapted via shadcn CSS variables (owner: globals.css)

## Project Structure

```
apps/web/
├── docs/
│   ├── api.md              # API reference
│   ├── api.yaml            # OpenAPI 3.1 contract (source: mobile)
│   └── architecture.md     # This file
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout (providers, fonts, route guard)
│   │   ├── (auth)/         # Auth flow (welcome, email-auth, verify)
│   │   └── (app)/          # Authenticated routes
│   │       ├── layout.tsx  # AppShell (ActivityBar + SidePanel + TopBar + Main)
│   │       ├── today/      # Daily view
│   │       ├── knowledge/  # Graph view
│   │       ├── progression/# Goals & Tasks
│   │       ├── team/       # Team management
│   │       ├── profile/    # User profile
│   │       ├── settings/   # App settings
│   │       └── note/[id]/  # Note detail
│   ├── components/
│   │   ├── ui/             # shadcn primitives + reactbits components
│   │   └── shell/          # AppShell, ActivityBar, SidePanel, TopBar
│   ├── lib/
│   │   ├── api/            # API client (same interface as mobile)
│   │   │   ├── types.ts    # OpenAPI-generated types
│   │   │   ├── client/     # Client implementation
│   │   │   │   ├── types.ts    # ApiClient interface
│   │   │   │   ├── mock.ts     # Mock implementation
│   │   │   │   ├── real.ts     # Real HTTP implementation
│   │   │   │   └── index.ts    # Client selector (mock vs real)
│   │   │   └── mock/       # In-memory mock data
│   │   │       ├── data.ts     # Seed data + types
│   │   │       └── api.ts      # Mock API logic
│   │   └── utils.ts        # cn() + uuid()
│   ├── store/              # Zustand stores
│   │   ├── auth.ts
│   │   └── onboarding.ts
│   └── hooks/              # Custom hooks
├── .env.example
├── .env.local              # gitignored
└── components.json         # shadcn configuration
```

## API Client Design

### Shared interface
The `ApiClient` interface (in `src/lib/api/client/types.ts`) is **identical** to the mobile app's interface. This ensures contract parity across web and mobile.

### Mock mode (default)
- `NEXT_PUBLIC_USE_REAL_API=false`
- Uses in-memory data store (`src/lib/api/mock/data.ts`)
- Same seed data as mobile (Sofia Chen + Marcus Vega + demo team)
- Wikilinks in note content (`[[title]]`) auto-create NoteLinks

### Real mode
- `NEXT_PUBLIC_USE_REAL_API=true`
- Uses `fetch` native (no axios dependency)
- Tokens stored in `localStorage` (web) vs `expo-secure-store` (mobile)
- Automatic token refresh on 401 responses
- Same request shapes and response parsing as mobile's axios client

### Type generation
```bash
bunx openapi-typescript docs/api.yaml -o src/lib/api/types.ts
```

## Layout Architecture

### Obsidian/VSCode-inspired shell

```
┌──────────────────────────────────────────────┐
│ TopBar (48px)  team · search · avatar        │
├────┬────────────┬────────────────────────────┤
│Act │SidePanel   │  Main Content              │
│Bar │(260px)     │  (scrollable)              │
│56px│collapsible │                             │
│    │Cmd/Ctrl+B  │                             │
│    │            │                             │
│    │            │                             │
├────┴────────────┴────────────────────────────┤
└──────────────────────────────────────────────┘
```

- **ActivityBar**: Vertical icon bar (56px) with 5 tab icons + settings
- **SidePanel**: Context-sensitive panel, collapsible via Cmd/Ctrl+B (state persisted in localStorage)
- **TopBar**: Team switcher dropdown, global search, user avatar/notifications
- **Main**: Adaptive grid/content area, max-w-[1400px] on 2xl

### Responsive behavior
- `<768px`: out of scope (mobile app handles this)
- `768-1023px` (md): ActivityBar without labels, SidePanel hidden by default
- `1024-1279px` (lg): SidePanel visible (220px), collapsible
- `≥1280px` (xl): Full layout (ActivityBar 56px, SidePanel 260px)
- `≥1536px` (2xl): Main centered with max-w-[1400px]

## ReactBits Integration

Components are installed via shadcn CLI in TS-TW variant:
```bash
npx shadcn@latest add @react-bits/ComponentName-TS-TW
```

Components live in `src/components/ui/` (shadcn target directory).

See the main project README for the full component-to-screen mapping.
