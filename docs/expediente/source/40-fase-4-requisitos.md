# FASE 4 — Requisitos

<span class="chapter-marker">Fase 4 · Requisitos</span>

## 4.1 Stakeholders

Los stakeholders se clasifican en tres niveles según su nivel de
involucramiento y poder de decisión.

### 4.1.1 Stakeholders primarios

| ID | Stakeholder | Rol | Necesidad principal |
|---|---|---|---|
| **STK-P1** | **Usuario final individual** | Crea notas, tareas, hábitos. | Productividad personal con fricción mínima. |
| **STK-P2** | **Miembro de equipo** | Comparte notas y tareas con otros. | Visibilidad y coordinación. |
| **STK-P3** | **Owner de equipo** | Administra miembros y permisos. | Control y gobierno. |

### 4.1.2 Stakeholders secundarios

| ID | Stakeholder | Rol | Necesidad |
|---|---|---|---|
| **STK-S1** | **Administrador del sistema** | Soporte, métricas globales. | Operación y monitoreo. |
| **STK-S2** | **Equipo de desarrollo** | Construye y mantiene el producto. | Código limpio, herramientas estables. |
| **STK-S3** | **Mesa de ayuda / soporte** | Atiende tickets de usuarios. | Información de cuenta accesible. |

### 4.1.3 Stakeholders terciarios

| ID | Stakeholder | Tipo | Relación |
|---|---|---|---|
| **STK-T1** | **Supabase** | Proveedor de Postgres y Auth. | Contrato de servicio + SLA. |
| **STK-T2** | **OpenRouter** | Proveedor de IA. | API contract + límites. |
| **STK-T3** | **Vercel / Fly.io** | Proveedor de hosting. | SLA de uptime. |
| **STK-T4** | **Stripe** | Procesador de pagos. | Cumplimiento PCI. |
| **STK-T5** | **Apple / Google** | Tiendas de aplicaciones. | Compliance con guidelines. |

### 4.1.4 Matriz de poder / interés

```
                  INTERÉS BAJO        INTERÉS ALTO
        ┌──────────────────────┬──────────────────────┐
 PODER   │  STK-T1..T5          │  STK-S1..S3          │
 ALTO    │  (mantener informados)│  (gestionar de cerca)│
        ├──────────────────────┼──────────────────────┤
 PODER   │  —                   │  STK-P1..P3          │
 BAJO    │                      │  (mantener satisfechos)│
        └──────────────────────┴──────────────────────┘
```

## 4.2 Requisitos funcionales (RF)

Se enumeran a continuación **25 requisitos funcionales**. Cada uno
incluye: identificador, nombre, descripción, prioridad (MoSCoW) y RF/RNF
relacionados.

### 4.2.1 Autenticación y cuenta

| ID | Nombre | Prioridad |
|---|---|---|
| **RF-001** | **Registro de usuario** | <span class="badge b-mauve">Must</span> |
| **RF-002** | **Inicio de sesión con email** | <span class="badge b-mauve">Must</span> |
| **RF-003** | **Verificación de email (código 6 dígitos)** | <span class="badge b-mauve">Must</span> |
| **RF-004** | **Inicio de sesión con Google OAuth** | <span class="badge b-blue">Should</span> |
| **RF-005** | **Cierre de sesión** | <span class="badge b-mauve">Must</span> |
| **RF-006** | **Refresh automático de tokens** | <span class="badge b-mauve">Must</span> |
| **RF-007** | **Edición de perfil** (nombre, handle, avatar) | <span class="badge b-blue">Should</span> |

#### RF-001 · Registro de usuario

- **Descripción**: el usuario ingresa email y contraseña; el sistema crea
  la cuenta, envía código de verificación y devuelve tokens.
- **Precondiciones**: el email no está registrado.
- **Postcondiciones**: usuario creado, `verified=false`, requiere RF-003.
- **Criterios de aceptación**:
  - Email válido y único.
  - Contraseña ≥ 8 caracteres, hash bcrypt cost 12.
  - Tokens `access` (15 min) y `refresh` (7 días) emitidos.
- **Errores**: `409 Conflict` si email duplicado.

#### RF-002 · Inicio de sesión con email

- **Descripción**: el usuario ingresa email y contraseña; el sistema
  valida credenciales y emite tokens.
- **Criterios de aceptación**:
  - `200 OK` con `{ user, tokens }` si credenciales válidas.
  - `401 Unauthorized` si contraseña incorrecta (mensaje genérico).
  - `403 Forbidden` si email no verificado (con `requires_verification`).

#### RF-003 · Verificación de email

- **Descripción**: el usuario ingresa el código de 6 dígitos recibido por
  email; el sistema marca la cuenta como verificada.
- **Criterios de aceptación**:
  - Código expira en 10 minutos.
  - Máximo 5 intentos; bloqueo de 1 h tras exceder.
  - `200 OK` + tokens nuevos si el código es correcto.

#### RF-004 · Inicio de sesión con Google

- **Descripción**: el usuario autentica con Google One-Tap o credential
  exchange; el sistema crea o vincula la cuenta y emite tokens.
- **Criterios de aceptación**:
  - `id_token` validado contra Google JWKS.
  - Si el email ya existe, se vincula automáticamente.

#### RF-005 a RF-007**: descripciones análogas en el apéndice B del
contrato OpenAPI (`apps/web/docs/api.yaml`).

### 4.2.2 Equipos

| ID | Nombre | Prioridad |
|---|---|---|
| **RF-008** | **Crear equipo** | <span class="badge b-mauve">Must</span> |
| **RF-009** | **Listar equipos del usuario** | <span class="badge b-mauve">Must</span> |
| **RF-010** | **Invitar miembro por email** | <span class="badge b-mauve">Must</span> |
| **RF-011** | **Unirse a equipo con token** | <span class="badge b-blue">Should</span> |
| **RF-012** | **Listar miembros de un equipo** | <span class="badge b-blue">Should</span> |

### 4.2.3 Notas

| ID | Nombre | Prioridad |
|---|---|---|
| **RF-013** | **Crear nota** | <span class="badge b-mauve">Must</span> |
| **RF-014** | **Editar nota** | <span class="badge b-mauve">Must</span> |
| **RF-015** | **Eliminar nota** | <span class="badge b-blue">Should</span> |
| **RF-016** | **Listar notas con filtros** | <span class="badge b-mauve">Must</span> |
| **RF-017** | **Buscar notas full-text** | <span class="badge b-blue">Should</span> |
| **RF-018** | **Compartir nota con equipo** | <span class="badge b-blue">Should</span> |
| **RF-019** | **Wikilinks `[[título]]`** | <span class="badge b-blue">Should</span> |
| **RF-020** | **Grafo de conocimiento navegable** | <span class="badge b-blue">Should</span> |

#### RF-013 · Crear nota

- **Descripción**: el usuario autenticado crea una nota con título,
  contenido markdown, tags y opcionalmente `team_id`.
- **Body**:
  ```json
  {
    "title": "Apuntes de cálculo",
    "content": "# Derivadas\n[[Regla de la cadena]] ...",
    "tags": ["calculo", "semestre-1"],
    "team_id": null
  }
  ```
- **Respuesta `201`**: objeto `Note` con `id`, `created_at`, `updated_at`.

#### RF-019 · Wikilinks

- **Descripción**: al guardar una nota, el sistema parsea el contenido en
  busca de `[[Título]]` y crea filas en `note_links`
  (`source_note_id`, `target_title`) que luego se resuelven a
  `target_note_id` cuando la nota destino exista.
- **Restricción**: `UNIQUE(source_note_id, target_title)` (ADR-6).

### 4.2.4 Metas y tareas

| ID | Nombre | Prioridad |
|---|---|---|
| **RF-021** | **Crear meta** (`current/target/unit`) | <span class="badge b-mauve">Must</span> |
| **RF-022** | **Registrar progreso de meta** | <span class="badge b-mauve">Must</span> |
| **RF-023** | **Crear tarea vinculada a meta** | <span class="badge b-mauve">Must</span> |
| **RF-024** | **Cambiar estado de tarea** | <span class="badge b-mauve">Must</span> |
| **RF-025** | **Listar tareas filtradas** | <span class="badge b-blue">Should</span> |

### 4.2.5 Notificaciones e IA

| ID | Nombre | Prioridad |
|---|---|---|
| **RF-026** | **Listar notificaciones** | <span class="badge b-blue">Should</span> |
| **RF-027** | **Marcar notificaciones como leídas** | <span class="badge b-blue">Should</span> |
| **RF-028** | **Generar resumen de nota con IA** | <span class="badge b-peach">Could</span> |
| **RF-029** | **Sugerir tags con IA** | <span class="badge b-peach">Could</span> |
| **RF-030** | **Chat con IA sobre el grafo** | <span class="badge b-peach">Won't (MVP)</span> |

## 4.3 Requisitos no funcionales (RNF)

| ID | Categoría | Requisito | Métrica | Prioridad |
|---|---|---|---|---|
| **RNF-001** | Disponibilidad | Uptime del servicio | ≥ 99 % mensual | <span class="badge b-mauve">Must</span> |
| **RNF-002** | Rendimiento | Latencia P95 de endpoints `/api/*` | < 500 ms | <span class="badge b-mauve">Must</span> |
| **RNF-003** | Rendimiento | Tiempo de respuesta de búsqueda | < 300 ms en 10 k notas | <span class="badge b-blue">Should</span> |
| **RNF-004** | Seguridad | Todas las comunicaciones cifradas | HTTPS forzado; HSTS 1 año | <span class="badge b-mauve">Must</span> |
| **RNF-005** | Seguridad | Autenticación por JWT | Access 15 min, refresh 7 días | <span class="badge b-mauve">Must</span> |
| **RNF-006** | Seguridad | Contraseñas hasheadas | bcrypt cost ≥ 12 | <span class="badge b-mauve">Must</span> |
| **RNF-007** | Usabilidad | Onboarding | ≤ 60 s hasta la primera nota | <span class="badge b-blue">Should</span> |
| **RNF-008** | Compatibilidad | Plataformas soportadas | iOS 15+, Android 8+, Chromium/Safari/Firefox últimas 2 versiones | <span class="badge b-blue">Should</span> |
| **RNF-009** | Escalabilidad | Usuarios concurrentes | ≥ 500 sin degradación | <span class="badge b-peach">Could</span> |
| **RNF-010** | Mantenibilidad | Cobertura de pruebas | ≥ 70 % backend, ≥ 60 % frontend | <span class="badge b-blue">Should</span> |
| **RNF-011** | Accesibilidad | Cumplimiento WCAG | Nivel AA en flujos principales | <span class="badge b-peach">Could</span> |
| **RNF-012** | Respaldo | Backups automatizados | Diario, retención 30 días | <span class="badge b-blue">Should</span> |
| **RNF-013** | Observabilidad | Logs estructurados | JSON + correlación de request-id | <span class="badge b-blue">Should</span> |
| **RNF-014** | Localización | Idioma | Español (es-ES, es-MX, es-AR) + inglés | <span class="badge b-blue">Should</span> |
| **RNF-015** | Internacionalización | Formato de fechas | ISO 8601 en API; locale en UI | <span class="badge b-blue">Should</span> |

## 4.4 Matriz de trazabilidad

La siguiente tabla enlaza cada requisito con su **módulo de
implementación** y los **casos de prueba** que lo validan. Los códigos
`CP-XXX` corresponden al plan de pruebas (FASE 10).

| ID Requisito | Módulo | Componente | Caso de prueba |
|---|---|---|---|
| RF-001 Registro | `auth` | `POST /auth/register` | CP-001, CP-002 |
| RF-002 Login email | `auth` | `POST /auth/login` | CP-003, CP-004 |
| RF-003 Verificación email | `auth` | `POST /auth/verify-email` | CP-005, CP-006 |
| RF-004 Google OAuth | `auth` | `POST /auth/google` | CP-007, CP-008 |
| RF-005 Logout | `auth` | `POST /auth/logout` | CP-009 |
| RF-006 Refresh tokens | `auth` | `POST /auth/refresh` | CP-010, CP-011 |
| RF-007 Editar perfil | `users` | `PATCH /users/me/profile` | CP-012 |
| RF-008 Crear equipo | `teams` | `POST /teams` | CP-013 |
| RF-009 Listar equipos | `teams` | `GET /teams` | CP-014 |
| RF-010 Invitar miembro | `teams` | `POST /teams/{id}/members` | CP-015 |
| RF-011 Unirse por token | `teams` | `POST /teams/{id}/join` | CP-016 |
| RF-012 Listar miembros | `teams` | `GET /teams/{id}/members` | CP-017 |
| RF-013 Crear nota | `notes` | `POST /notes` | CP-018, CP-019 |
| RF-014 Editar nota | `notes` | `PATCH /notes/{id}` | CP-020 |
| RF-015 Eliminar nota | `notes` | `DELETE /notes/{id}` | CP-021 |
| RF-016 Listar notas | `notes` | `GET /notes` | CP-022, CP-023 |
| RF-017 Buscar notas | `notes` | `GET /notes?q=...` | CP-024 |
| RF-018 Compartir nota | `notes` | `POST /notes/{id}/share` | CP-025 |
| RF-019 Wikilinks | `notes` | `note_links` (sqlc trigger) | CP-026, CP-027 |
| RF-020 Grafo | `graph` | `GET /graph` | CP-028 |
| RF-021 Crear meta | `goals` | `POST /goals` | CP-029 |
| RF-022 Progreso meta | `goals` | `POST /goals/{id}/progress` | CP-030 |
| RF-023 Crear tarea | `tasks` | `POST /tasks` | CP-031 |
| RF-024 Cambiar estado | `tasks` | `PATCH /tasks/{id}` | CP-032 |
| RF-025 Filtrar tareas | `tasks` | `GET /tasks` | CP-033 |
| RF-026 Listar notif. | `notifications` | `GET /notifications` | CP-034 |
| RF-027 Marcar leídas | `notifications` | `PATCH /notifications` | CP-035 |
| RF-028 Resumen IA | `ai` | `POST /ai/summarize` | CP-036 |
| RF-029 Tags IA | `ai` | `POST /ai/tags` | CP-037 |
| RNF-001 Disponibilidad | infra | health checks | CP-038 |
| RNF-002 Latencia | infra | k6 scripts | CP-039 |
| RNF-003 Búsqueda | `notes` | índice trigram | CP-040 |
| RNF-004 HTTPS | infra | TLS terminator | CP-041 |
| RNF-005 JWT | `auth` | middleware | CP-042 |
| RNF-006 bcrypt | `auth` | sqlc `users.password_hash` | CP-043 |
| RNF-007 Onboarding | web/mobile | e2e Playwright | CP-044 |
| RNF-008 Compatibilidad | mobile | EAS matrix | CP-045 |
| RNF-010 Cobertura | CI | coverage report | CP-046 |
| RNF-013 Logs | infra | pino / zap | CP-047 |