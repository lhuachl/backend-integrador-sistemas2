# Apéndice D — Plan de pruebas detallado

Este apéndice lista los **47 casos de prueba** referenciados en la
matriz de trazabilidad (FASE 4, §4.4) y los criterios de aceptación
ejecutables. Cada CP incluye precondiciones, pasos y resultado
esperado.

## D.1 Auth (CP-001 a CP-012)

### CP-001 · Registro con email nuevo

- **Pre**: email `nuevo@flowstate.app` no registrado.
- **Pasos**: `POST /auth/register { email, password }`.
- **Esperado**: `201` con `{ user, tokens }`; `user.verified = false`.

### CP-002 · Registro con email duplicado

- **Pre**: email ya existe.
- **Pasos**: `POST /auth/register` con mismo email.
- **Esperado**: `409` con `code = conflict`.

### CP-003 · Login con credenciales válidas

- **Pre**: usuario `verified = true`.
- **Pasos**: `POST /auth/login { email, password }`.
- **Esperado**: `200` con tokens.

### CP-004 · Login con password incorrecto

- **Pasos**: `POST /auth/login` con password inválido.
- **Esperado**: `401` con `code = unauthorized`.

### CP-005 · Verificar email con código correcto

- **Pre**: usuario con código `123456` activo.
- **Pasos**: `POST /auth/verify-email { code: "123456" }`.
- **Esperado**: `200` con `{ user.verified: true, tokens }`.

### CP-006 · Verificar email con código expirado

- **Pre**: código emitido hace > 10 min.
- **Pasos**: `POST /auth/verify-email { code }`.
- **Esperado**: `401` con mensaje genérico.

### CP-007 · Google OAuth con id_token válido

- **Pre**: id_token de Google para `g@flowstate.app`.
- **Pasos**: `POST /auth/google { id_token }`.
- **Esperado**: `200` con `{ user, tokens }`; rol `user`.

### CP-008 · Google OAuth con id_token expirado

- **Pasos**: `POST /auth/google { id_token_expirado }`.
- **Esperado**: `401` con `code = unauthorized`.

### CP-009 · Logout con token válido

- **Pasos**: `POST /auth/logout`.
- **Esperado**: `204`; refresh token revocado.

### CP-010 · Refresh con token válido

- **Pre**: refresh token activo.
- **Pasos**: `POST /auth/refresh { refresh_token }`.
- **Esperado**: `200` con nuevos tokens; el viejo refresh revocado.

### CP-011 · Refresh con token revocado

- **Pre**: refresh token ya usado.
- **Pasos**: `POST /auth/refresh` con el viejo token.
- **Esperado**: `401`; intento se loguea.

### CP-012 · Editar perfil propio

- **Pasos**: `PATCH /users/me/profile { name, handle }`.
- **Esperado**: `200` con usuario actualizado.

## D.2 Teams (CP-013 a CP-017)

### CP-013 · Crear equipo

- **Pasos**: `POST /teams { name: "Mi equipo", slug: "mi-equipo" }`.
- **Esperado**: `201` con team; el owner se añade como `team_members.owner`.

### CP-014 · Listar equipos del usuario

- **Pasos**: `GET /teams`.
- **Esperado**: `200` con array; sólo equipos donde el usuario es miembro.

### CP-015 · Invitar miembro por email

- **Pasos**: `POST /teams/{id}/members { email: "otro@..." }`.
- **Esperado**: `200` con `{ pending: true }`; se envía invitación.

### CP-016 · Unirse a equipo con token

- **Pasos**: `POST /teams/{id}/join { token: "..." }`.
- **Esperado**: `200` con team; el usuario queda como `member`.

### CP-017 · Listar miembros de un equipo

- **Pasos**: `GET /teams/{id}/members`.
- **Esperado**: `200` con array de TeamMember; ordenados por `joined_at`.

## D.3 Notes (CP-018 a CP-028)

### CP-018 · Crear nota simple

- **Pasos**: `POST /notes { title: "X", content: "Y", tags: [] }`.
- **Esperado**: `201` con nota + UUID.

### CP-019 · Crear nota con tags

- **Pasos**: `POST /notes { title: "X", content: "Y", tags: ["a", "b"] }`.
- **Esperado**: `201`; tags almacenados como JSON.

### CP-020 · Editar nota propia

- **Pasos**: `PATCH /notes/{id} { content: "nuevo" }`.
- **Esperado**: `200`; `updated_at` cambia.

### CP-021 · Eliminar nota

- **Pasos**: `DELETE /notes/{id}`.
- **Esperado**: `204`.

### CP-022 · Listar notas sin filtros

- **Pasos**: `GET /notes`.
- **Esperado**: `200` con array; orden `updated_at DESC`.

### CP-023 · Filtrar por team_id

- **Pasos**: `GET /notes?team_id=...`.
- **Esperado**: sólo notas del equipo.

### CP-024 · Búsqueda full-text

- **Pre**: hay 10 k notas; query `cálculo`.
- **Pasos**: `GET /notes?q=cálculo`.
- **Esperado**: `200` con resultados relevantes en < 300 ms.

### CP-025 · Compartir nota con equipo

- **Pasos**: `POST /notes/{id}/share { team_id }`.
- **Esperado**: `200`; la nota se marca como compartida.

### CP-026 · Wikilink en contenido

- **Pre**: nota A con `"Ver [[Cálculo]]"`.
- **Pasos**: `POST /notes { title: "A", content: "Ver [[Cálculo]]" }`.
- **Esperado**: `note_links` tiene 1 fila con `target_title = "Cálculo"`.

### CP-027 · Wikilink colapsado

- **Pre**: nota con `"[[X]] y [[X]]"`.
- **Pasos**: guardar nota.
- **Esperado**: 1 sola fila en `note_links`.

### CP-028 · Obtener grafo

- **Pasos**: `GET /graph?team_id=...`.
- **Esperado**: nodos y aristas consistentes.

## D.4 Goals y tasks (CP-029 a CP-033)

### CP-029 · Crear meta

- **Pasos**: `POST /goals { title, target: 100, unit: "páginas" }`.
- **Esperado**: `201` con meta + `current = 0`.

### CP-030 · Sumar progreso sin exceder

- **Pre**: meta con `current = 30, target = 100`.
- **Pasos**: `POST /goals/{id}/progress { amount: 50 }`.
- **Esperado**: `current = 80`.

### CP-031 · Crear tarea

- **Pasos**: `POST /tasks { title: "leer cap 1", goal_id: ... }`.
- **Esperado**: `201` con status `todo`.

### CP-032 · Cambiar estado de tarea

- **Pre**: tarea en `todo`.
- **Pasos**: `PATCH /tasks/{id} { status: "in_progress" }`.
- **Esperado**: `200`; status actualizado.

### CP-033 · Filtrar tareas por estado

- **Pasos**: `GET /tasks?status=done`.
- **Esperado**: sólo tareas en `done`.

## D.5 Notifications (CP-034, CP-035)

### CP-034 · Listar notificaciones

- **Pasos**: `GET /notifications`.
- **Esperado**: array; las leídas al final.

### CP-035 · Marcar como leídas

- **Pasos**: `PATCH /notifications { ids: ["n1", "n2"] }`.
- **Esperado**: `200`; ambas marcadas.

## D.6 AI (CP-036, CP-037)

### CP-036 · Resumir nota corta

- **Pre**: nota con 200 palabras.
- **Pasos**: `POST /ai/summarize { note_id }`.
- **Esperado**: `200` con `summary = "nota corta"`.

### CP-037 · Sugerir tags

- **Pasos**: `POST /ai/tags { note_id }`.
- **Esperado**: `200` con array de 3-5 tags.

## D.7 No funcionales (CP-038 a CP-047)

### CP-038 · Health check

- **Pasos**: `GET /healthz`.
- **Esperado**: `200` con `{ status: "ok" }`.

### CP-039 · Latencia P95

- **Pasos**: k6 con 100 VU durante 60 s sobre `/notes`.
- **Esperado**: P95 < 500 ms.

### CP-040 · Búsqueda en 10k notas

- **Pre**: seed de 10 000 notas.
- **Pasos**: `GET /notes?q=keyword` 100 veces.
- **Esperado**: P95 < 300 ms.

### CP-041 · HTTPS forzado

- **Pasos**: `http://api.flowstate.app/healthz`.
- **Esperado**: `301` a `https://`.

### CP-042 · JWT inválido

- **Pasos**: `GET /auth/me` con token mal formado.
- **Esperado**: `401`.

### CP-043 · Password almacenada

- **Pre**: registro de usuario.
- **Pasos**: `SELECT password_hash FROM users WHERE email = ?`.
- **Esperado**: hash bcrypt (no plain text).

### CP-044 · Onboarding ≤ 60s

- **Pasos**: Playwright `E2E-01` mide tiempo desde welcome hasta primera nota.
- **Esperado**: ≤ 60 000 ms.

### CP-045 · Compatibilidad iOS

- **Pasos**: EAS build para iOS 15, 16, 17.
- **Esperado**: instalación y arranque en simulador sin warnings.

### CP-046 · Cobertura backend

- **Pasos**: `go test -cover ./...`.
- **Esperado**: ≥ 70 %.

### CP-047 · Logs estructurados

- **Pasos**: trigger de request; leer stdout.
- **Esperado**: una línea JSON con `request_id`, `latency_ms`, `status`.