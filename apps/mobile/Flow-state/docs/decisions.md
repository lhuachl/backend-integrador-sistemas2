# Decisiones de arquitectura

## ADR-1: Mock-first, backend después
- No hay servidor en Fase 0.
- La capa de datos vive en `src/lib/api/mock/`.
- El contrato OpenAPI (`docs/api.yaml`) es la fuente de verdad; cuando exista backend se conecta el mismo cliente.

## ADR-2: Mock en memoria JS unificado
- Se unificó el mock a un solo store en memoria (`src/lib/api/mock/data.ts`) que funciona en web, iOS y Android.
- Se descartó la dual implementación SQLite/web porque duplicaba cada query para un mock que será reemplazado por axios cuando exista backend.
- El schema SQL (`schema.sql`) y `db.ts` se mantienen como referencia del modelo de datos para el backend futuro.

## ADR-3: Tipos generados desde OpenAPI
- `npm run gen:api` genera `src/lib/api/types.ts` con `openapi-typescript`.
- Los stores y handlers usan los tipos de `paths` y `components/schemas`.

## ADR-4: Sistema de diseño propio, sin NativeWind
- Se descartó NativeWind/Tailwind por incompatibilidades con Expo SDK 56 + RN 0.85 + Reanimated 4.
- Todos los componentes usan `StyleSheet`, tokens de `src/theme/catppuccin.ts` y tipografía cargada con `expo-font`.

## ADR-5: Auth unificado (login/signup inferido)
- El usuario solo ingresa email en `welcome.tsx`.
- La app detecta si el email existe y deriva a login o signup.
- En mock: cualquier código de 6 dígitos verifica la cuenta.

## ADR-6: Wikilinks colapsan multiplicidad
- La tabla `note_links` tiene `UNIQUE(source_note_id, target_title)`.
- Si se menciona el mismo título varias veces en una nota, solo existe un enlace.

## ADR-7: Notas compartidas: autor edita, equipo lee
- El autor mantiene edición.
- Miembros del equipo tienen permiso de lectura.
- El owner del equipo puede eliminar notas de moderación.

## ADR-8: Metas personales en MVP
- Las metas (`goals`) pertenecen a un usuario, no a un equipo.
- Las tareas pueden vincularse a una meta para traccionar progreso.
