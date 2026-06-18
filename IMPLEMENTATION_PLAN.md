# FlowState — Plan KISS + InsForge + shadcn/ui

## Filosofia

- **KISS**: Lo mas simple que funcione. 3 tablas, 1 SDK, 0 ORMs.
- **InsForge**: BaaS (DB Postgres + Auth + RLS). Cero infraestructura propia.
- **shadcn/ui**: Componentes Radix + Tailwind. Personalizado al tema estoico.
- **React Flow**: Diagramas para visualizar tu LifeOS (flujo de vida).
- **Auth**: Solo email/password. Sin OAuth. Sin distracciones sociales.
- **Sin Server Actions**: SDK llama directo desde el cliente. RLS protege los datos.
- **Sin Zustand/Redux**: `useState` + `useEffect` + re-fetch al mutar.

---

## El concepto LifeOS

FlowState no es un productividad tracker. Es un **LifeOS**: un sistema operativo para tu vida.
Donde otras apps te dicen "completaste 7/10 tasks", FlowState te muestra **lo que elegiste hacer con tu tiempo**.

### Pilares de la visualizacion

1. **Kanban diario**: Lo inmediato. Tus slots hoy, ahora, pausado, hecho, pendiente.
2. **Grafo de vida** (React Flow): Lo estructural. Como se conectan tus rituales, proyectos, areas. El "sistema" detras del dia a dia.
3. **Espejo semanal**: La retrospectiva. Sin juicio, solo datos.

### React Flow: El mapa de tu vida

Un grafo interactivo donde:
- **Nodos** = Areas de vida (Salud, Trabajo, Creatividad), Proyectos, Rituales
- **Aristas** = Conexiones (un ritual alimenta un proyecto, un proyecto pertenece a un area)
- **Layout**: Dagre para auto-posicionamiento jerarquico
- **Interaccion**: Click en nodo → expande a slots/detalle, drag para reorganizar

No es un diagrama estatico. Es tu cerebro externo, vivo, que evoluciona con tus elecciones.

---

## Stack real

| Capa | Tecnologia | Por que |
|------|-----------|---------|
| Framework | Next.js 16 App Router | Ya configurado |
| UI | React 19 + Tailwind v4 | Ya configurado |
| Componentes | **shadcn/ui** (Radix + Tailwind) | 15 componentes, personalizables |
| Diagramas | **@xyflow/react** (React Flow) | Grafos interactivos para LifeOS |
| Backend | InsForge (Postgres) | Managed DB, auth, RLS |
| SDK | `@insforge/sdk` | CRUD directo, sin ORM |
| Auth | InsForge Auth (**solo email/pass**) | Sin OAuth, sin Google, sin GitHub |
| Validacion | Zod | Tipado en runtime |
| Drag & Drop | `@dnd-kit/core` | Kanban + nodos del grafo |
| Fechas | `date-fns` | Formateo y calculos |
| Rich text | `@tiptap/react` | Notas "durante" |
| Iconos | `lucide-react` | Iconos consistentes con shadcn |
| Utilidades | `clsx` + `tailwind-merge` + `class-variance-authority` | Clases condicionales |
| Animaciones | `motion` (Framer Motion) + `gsap` + `three.js` + `lenis` | React Bits peer deps |

**Lo que NO usamos** (KISS):
- Sin Drizzle/Prisma → InsForge SDK directo
- Sin OAuth → solo email/password
- Sin Server Actions para CRUD → SDK desde cliente
- Sin API routes → SDK es la API
- Sin tabla `days` → campo `date` en slots
- Sin tabla `notes` → campos inline en slots
- Sin chart libraries → barras CSS + nodos React Flow

---

## Schema (3 tablas, KISS)

```
slots ──────────────── rituals
  id (PK)              id (PK)
  user_id (FK auth)    user_id (FK auth)
  date                 title
  ritual_id (FK)       type (commitment|aspiration)
  title                active
  duration_planned     + timestamps
  duration_real
  status
  started_at           mirrors
  completed_at          id (PK)
  closed_at             user_id (FK auth)
  friction_reason       week_start
  friction_note         data (JSONB)
  before_note           viewed_at
  during_note (JSONB)   created_at
  after_note
  sort_order
  + timestamps
```

**KISS simplifications vs spec original:**
- `days` → campo `date` en slots (sin tabla extra)
- `notes` → campos `before_note`, `during_note`, `after_note` en slots (sin tabla extra)
- `users` → `auth.users` de InsForge (sin tabla propia)

---

## Componentes shadcn/ui instalados (15)

| Componente | Archivo | Uso en FlowState |
|-----------|---------|-----------------|
| Button | `components/ui/button.tsx` | Acciones de slot, forms |
| Input | `components/ui/input.tsx` | Forms de creacion |
| Card | `components/ui/card.tsx` | Slot cards, mirror stats |
| Dialog | `components/ui/dialog.tsx` | Friction dialog, slot detail |
| Select | `components/ui/select.tsx` | Friction reasons, ritual type |
| Badge | `components/ui/badge.tsx` | Status indicators, friction tags |
| Textarea | `components/ui/textarea.tsx` | Notas before/after |
| Separator | `components/ui/separator.tsx` | Divisores en panel |
| Tooltip | `components/ui/tooltip.tsx` | Info hover en badges |
| Label | `components/ui/label.tsx` | Labels en forms |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | Menu de slot, user menu |
| Tabs | `components/ui/tabs.tsx` | Mirror tabs, notas antes/durante/despues |
| ScrollArea | `components/ui/scroll-area.tsx` | Kanban scroll horizontal |
| Popover | `components/ui/popover.tsx` | Quick actions, info popups |
| Form | `components/ui/form.tsx` | React Hook Form integration |

## Componentes React Bits instalados (8)

Componentes visuales avanzados con animaciones fluidas para la experiencia LifeOS.

| Componente | Dependencia | Uso en FlowState |
|-----------|------------|-----------------|
| **BorderGlow** | CSS | Bordes con glow animado en cards de slot activos |
| **Dock** | `motion` | Barra de navegacion inferior/superior estilo macOS |
| **MagicBento** | `gsap` | Grid bento con efectos (stars, spotlight, tilt, magnetism) para dashboard |
| **LaserFlow** | `three.js` | Background animado con rayos laser para el LifeOS graph |
| **AnimatedList** | `motion` | Listas con animaciones de entrada stagger (friction reasons, ritual list) |
| **AnimatedContent** | `gsap` + ScrollTrigger | Contenido que se anima al hacer scroll (mirror semanal) |
| **ScrollStack** | `lenis` | Stack de cards con parallax (slot detail en movil) |
| **Stepper** | `motion` | Wizard paso a paso (onboarding inicial, friction dialog multi-step) |

---

## Fases (8 fases, ~23 dias)

### Fase 0: Foundation — DONE

- [x] Schema en InsForge (3 tablas + RLS)
- [x] SDK instalado (`bun add @insforge/sdk`)
- [x] `.env.local` configurado
- [x] shadcn/ui instalado (15 componentes)
- [x] React Bits instalado (8 componentes: BorderGlow, Dock, MagicBento, LaserFlow, AnimatedList, AnimatedContent, ScrollStack, Stepper)
- [x] React Flow instalado (`@xyflow/react` + `@dagrejs/dagre`)
- [x] Dependencias de animacion: `motion`, `gsap`, `three`, `lenis`
- [x] Dependencias core instaladas

**Archivos creados:**
- `migrations/20260618084905_create-core-tables.sql`
- `.env.local`
- `components.json`
- `lib/utils.ts` (cn helper)
- `components/ui/*.tsx` (15 componentes)
- `app/globals.css` (CSS variables + dark mode, compatible con shadcn)

### Fase 1: Auth (solo email/password) + InsForge Client (1 dia)

**Archivos:**
- `lib/insforge.ts` — Singleton del cliente SDK
- `lib/types.ts` — Interfaces TypeScript para slots, rituals, mirrors
- `components/auth/sign-in-form.tsx` — Login (email + password, sin OAuth)
- `components/auth/sign-up-form.tsx` — Registro (email + password, sin OAuth)
- `components/auth/auth-provider.tsx` — Contexto de auth (user + loading)
- `app/layout.tsx` — Envolver con AuthProvider
- `app/page.tsx` — Gate: si no autenticado → login, si autenticado → dashboard

**Sin OAuth:** Nada de Google, GitHub, ni providers sociales. Solo email/password.
Estoico: una cuenta, un proposito, sin distracciones.

**Patron clave:**
```typescript
// lib/insforge.ts
import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!
})

// Auth: solo email/password
const { data } = await insforge.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123'
})
```

### Fase 2: Slot Lifecycle + Friction Journal (2 dias)

**Archivos:**
- `lib/constants.ts` — Enums de status, friction reasons, limites
- `lib/validations/slot.ts` — Zod schemas
- `lib/services/slot-lifecycle.ts` — Motor de transiciones (puro, sin DB)
- `lib/services/slots.ts` — Funciones que llaman al SDK
- `lib/services/notes.ts` — Time-lock enforcement

**Motor de transiciones:**
```
plan → now (start)
plan → reprogrammed (friction required)
now → paused (friction required)
now → done
now → not_done (friction required)
paused → now (resume)
paused → not_done (friction required)
paused → reprogrammed (friction required)
done/not_done/reprogrammed → NADA (terminal)
```

**Time-lock:**
- `before_note`: editable solo antes de `started_at`
- `during_note`: editable solo en `now` o `paused`
- `after_note`: editable solo despues de `closed_at`

### Fase 3: UI — Kanban + Slots (4 dias)

**Archivos nuevos:**

**Kanban** (`components/kanban/`):
- `kanban-board.tsx` — 5 columnas (Plan, Now, Paused, Done, Open)
- `kanban-column.tsx` — Columna droppable via @dnd-kit
- `slot-card.tsx` — Tarjeta arrastrable (Card de shadcn + badge de status)
- `slot-create-form.tsx` — Form inline en Plan (Input + Button shadcn)

**Slot detail** (`components/slots/`):
- `slot-detail.tsx` — Dialog/modal (Dialog de shadcn)
- `slot-actions.tsx` — Botones de transicion (Button variants)
- `slot-notes.tsx` — Editor con Tabs (antes/durante/despues), TipTap en "durante"

**Friction** (`components/friction/`):
- `friction-dialog.tsx` — Dialog (Select para razon + Textarea para nota)
- `friction-badge.tsx` — Badge con tooltip mostrando razon

**Dashboard layout:**
- `app/page.tsx` → Layout principal: sidebar izquierda (rituales + mirror link) + kanban central
- Los componentes usan shadcn/ui para consistencia visual

### Fase 4: LifeOS Graph — React Flow (3 dias)

**Archivos:**
- `components/graph/life-graph.tsx` — Componente React Flow principal
- `components/graph/life-node.tsx` — Nodo personalizado (area, proyecto, ritual)
- `components/graph/life-edge.tsx` — Arista personalizada (conexion)
- `app/graph/page.tsx` — Pagina del grafo de vida
- `lib/services/graph-data.ts` — Transforma slots/rituals en nodos/aristas

**Tipos de nodos:**
| Tipo | Color | Descripcion |
|------|-------|-------------|
| Area | Purple | Salud, Trabajo, Creatividad, Relaciones |
| Proyecto | Blue | Agrupacion de slots relacionados |
| Ritual | Amber | Compromiso recurrente |

**Layout:** Dagre para posicionamiento automatico jerarquico.

**Interaccion:**
- Click en nodo → navega a detalle (slots del proyecto, historial del ritual)
- Drag de nodo → reposiciona manual
- Zoom/Pan → navegacion libre por el grafo
- Vista general (minimap) → orientacion en grafos grandes

**Datos:**
- Los proyectos se infieren de slots con nombre recurrente
- Los rituales son nodos directos
- Las areas son definidas por el usuario (max 5, para mantener foco)

**Dependencia extra:**
```bash
bun add @xyflow/react @dagrejs/dagre
```

### Fase 5: Rituals System (2 dias)

**Archivos:**
- `components/rituals/ritual-create-form.tsx` — Dialog (shadcn) con toggle commitment/aspiration
- `components/rituals/ritual-card.tsx` — Card con badge de tipo
- `lib/services/rituals.ts` — CRUD via SDK
- `lib/services/ritual-scheduler.ts` — Logica de sugerencias diarias

**Reglas:**
- Max 3 compromisos activos
- Compromisos NO pueden reprogramarse
- Aspiraciones: 2/dia, descartables sin registro
- Compromisos aparecen cada dia automaticamente

### Fase 6: Weekly Mirror (2 dias)

**Archivos:**
- `lib/services/mirror-engine.ts` — Computo de estadisticas semanales
- `components/mirror/mirror-summary.tsx` — Cards (shadcn) con stats
- `components/mirror/mirror-patterns.tsx` — Tabs con patrones detectados
- `app/mirror/page.tsx` — Pagina del espejo semanal

**Patrones detectados:**
1. Friction cluster: misma razon para mismo ritual >50%
2. Ritual struggle: ritual con tasa not_done >60%
3. Time accuracy: planned vs real con desviacion >50%

### Fase 7: Midnight Processing (1 dia)

**Archivos:**
- `lib/services/midnight-processor.ts` — Deteccion de slots abiertos
- `components/midnight/open-slots-resolver.tsx` — Dialog bloqueante (sin boton de cierre)

### Fase 8: Polish + Integracion (2 dias)

- Dark mode refinado (ya tiene variables CSS)
- Animaciones CSS (`transition-all duration-200`)
- Responsive: kanban scroll horizontal en movil, grafo full-screen
- Estados vacios con frases estoicas
- Skeleton loading (shadcn no incluye, usamos custom)
- Accesibilidad (focus, keyboard nav, screen readers)

---

## Estructura final de archivos

```
flowstate/
├── app/
│   ├── layout.tsx              # AuthProvider + metadata
│   ├── page.tsx                # Dashboard (sidebar + kanban)
│   ├── mirror/
│   │   └── page.tsx            # Espejo semanal
│   ├── graph/
│   │   └── page.tsx            # LifeOS grafo
│   └── globals.css             # Tailwind v4 + CSS variables + dark mode
├── components/
│   ├── ui/                     # shadcn/ui (15 componentes)
│   ├── auth/                   # SignInForm, SignUpForm, AuthProvider
│   ├── kanban/                 # Board, Column, SlotCard, CreateForm
│   ├── slots/                  # SlotDetail, SlotActions, SlotNotes
│   ├── friction/               # FrictionDialog, FrictionBadge
│   ├── graph/                  # LifeGraph, LifeNode, LifeEdge
│   ├── rituals/                # RitualCreateForm, RitualCard
│   ├── mirror/                 # MirrorSummary, MirrorPatterns
│   ├── midnight/               # OpenSlotsResolver
│   ├── BorderGlow.tsx          # React Bits: glow borders
│   ├── Dock.tsx                # React Bits: macOS-style dock nav
│   ├── MagicBento.tsx          # React Bits: bento grid effects
│   ├── LaserFlow.tsx           # React Bits: three.js laser background
│   ├── AnimatedList.tsx        # React Bits: stagger list animations
│   ├── AnimatedContent.tsx     # React Bits: scroll-triggered content
│   ├── ScrollStack.tsx         # React Bits: parallax card stack
│   └── Stepper.tsx             # React Bits: step wizard
├── lib/
│   ├── insforge.ts             # SDK client singleton
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Enums, limites
│   ├── utils.ts                # cn(), formatDuration(), date helpers
│   ├── validations/            # Zod schemas
│   └── services/               # Logica pura (no DB)
│       ├── slot-lifecycle.ts
│       ├── slots.ts
│       ├── rituals.ts
│       ├── ritual-scheduler.ts
│       ├── notes.ts
│       ├── mirror-engine.ts
│       ├── midnight-processor.ts
│       └── graph-data.ts
├── hooks/                      # React hooks (shadcn)
├── migrations/                 # InsForge SQL migrations
├── components.json             # shadcn/ui config
├── .env.local
├── next.config.ts
└── package.json
```

---

## Dependencias totales

### Produccion
```bash
bun add @insforge/sdk @xyflow/react @dagrejs/dagre \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  @tiptap/react @tiptap/starter-kit @tiptap/pm \
  @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-select \
  @radix-ui/react-tooltip @radix-ui/react-label @radix-ui/react-separator \
  @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tabs \
  @radix-ui/react-scroll-area @radix-ui/react-dropdown-menu @radix-ui/react-popover \
  clsx tailwind-merge class-variance-authority lucide-react date-fns zod
```

### Desarrollo
```bash
bun add -D shadcn vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## Resumen KISS

| Viejo plan (SQLite) | Plan actual (InsForge + shadcn) |
|---------------------|-------------------------------|
| 6 tablas | 3 tablas |
| Drizzle ORM | SDK directo |
| Server Actions | SDK desde cliente |
| SQLite local | Postgres managed |
| Sin auth | Auth nativo InsForge (solo email/pass) |
| UI custom desde cero | shadcn/ui (15 componentes listos) |
| Sin visualizacion | React Flow (LifeOS graph) |
| API Routes | Sin API routes |
| 15+ dependencias | ~25 dependencias (con mas funcionalidad) |

Lo unico que el SDK no maneja: la logica de negocio (transiciones, time-lock, espejo, medianoche, grafo). Eso vive en `lib/services/` como funciones puras, facilmente testeables sin DB.
