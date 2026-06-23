# FASE 5 — Alcance

<span class="chapter-marker">Fase 5 · Alcance</span>

## 5.1 Definición del alcance

### 5.1.1 Dentro del alcance (IN)

El MVP de FlowState incluye los siguientes módulos funcionales, todos
operativos en web y móvil contra el mismo backend.

#### Autenticación y cuenta

- Registro e inicio de sesión con email + contraseña.
- Verificación por código de 6 dígitos.
- Login con Google (OAuth 2.0).
- Refresh tokens con rotación.
- Edición de perfil (nombre, handle, avatar).

#### Equipos

- Crear y eliminar equipos.
- Invitar miembros por email con token de un solo uso.
- Roles: `owner`, `mentor`, `member`.
- Notas compartidas con permisos de lectura/escritura.

#### Notas y conocimiento

- CRUD de notas con markdown.
- Wikilinks `[[Título]]` con autocompletado.
- Grafo navegable (vista `Knowledge`).
- Búsqueda full-text por título y contenido.
- Tags y filtros.

#### Tareas, hábitos y metas

- CRUD de metas con `current/target/unit/deadline`.
- Registro de progreso incremental.
- CRUD de tareas con estados (`todo`, `in_progress`, `done`).
- Vínculo tarea → meta.
- Dashboard *Hoy* (tareas del día, hábitos pendientes, notas recientes).

#### Notificaciones

- Notificaciones in-app para: invitaciones, menciones, asignación de
  tareas, recordatorios de hábitos.
- Marcar individualmente o en masa como leídas.

#### IA (plan Pro)

- Resumen automático de notas largas (≥ 800 palabras).
- Sugerencia de tags basadas en contenido.
- Rate-limit: 50 llamadas/usuario/día.

#### Diseño y plataforma

- Estética Catppuccin Mocha (dark) + modo Latte (light).
- Aplicación web responsive (Next.js).
- Aplicación móvil nativa (Expo).
- API REST documentada con OpenAPI 3.1 y Swagger UI.

### 5.1.2 Fuera del alcance (OUT)

Quedan **explícitamente fuera** del MVP las siguientes funcionalidades,
que se reservan para versiones futuras:

- **Videollamadas** integradas (usar Meet/Zoom externo).
- **Marketplace de plantillas** (se valorará tras el MVP).
- **ERP / facturación** integrada (fuera del dominio de FlowState).
- **Plugin de calendario externo** (Google Calendar / iCal) → v1.1.
- **Exportación PDF** desde la app → v1.1.
- **Modo offline-first completo** (sólo lectura offline) → v2.
- **SSO / SAML** para empresas → v2 (Teams).
- **Aplicación de escritorio nativa** (Electron/Tauri) → v2.
- **API pública para terceros** → v3.
- **Reconocimiento de voz** para notas → exploratorio.

### 5.1.3 Criterios de "MVP completo"

El MVP se considera completo cuando:

1. Los 25 requisitos RF-001 a RF-025 están implementados y verificados
   en producción.
2. La app está publicada en App Store y Play Store.
3. Hay al menos 10 usuarios activos diarios durante 2 semanas
   consecutivas.
4. Latencia P95 < 500 ms sostenida durante 7 días.
5. Cobertura de pruebas ≥ 70 % en backend, ≥ 60 % en frontend.

## 5.2 Entregables

| # | Entregable | Tipo | Destinatario |
|---|---|---|---|
| **E-01** | **Aplicación web** desplegada en Vercel. | Producto | Usuarios |
| **E-02** | **App móvil** en App Store y Play Store. | Producto | Usuarios |
| **E-03** | **API REST** desplegada en Fly.io, documentada en Swagger. | Producto | Integradores |
| **E-04** | **Base de datos** PostgreSQL gestionada por Supabase. | Producto | Equipo |
| **E-05** | **Código fuente** en monorepo Git con CI. | Producto | Equipo / Mantenedores |
| **E-06** | **Manual técnico** (este documento). | Documentación | Mantenedores |
| **E-07** | **Manual de usuario** in-app + PDF corto. | Documentación | Usuarios |
| **E-08** | **Contrato OpenAPI 3.1** (`docs/api.yaml`). | Documentación | Clientes |
| **E-09** | **Plan de pruebas** y reporte de cobertura. | Documentación | QA |
| **E-10** | **Política de privacidad y términos**. | Legal | Usuarios |

## 5.3 Restricciones

### 5.3.1 Restricciones de tiempo

- **Entrega académica**: 23 de junio de 2025 (Semestre 1/2025).
- **MVP en producción**: máximo 16 semanas desde inicio.
- **Onboarding de features nuevas**: ciclo sprint de 2 semanas.

### 5.3.2 Restricciones de presupuesto

- **Presupuesto de infraestructura**: USD 107/mes en operación estable.
- **Presupuesto de marketing**: USD 0 el primer año (orgánico).
- **Sin contratar personal externo** durante el primer año.

### 5.3.3 Restricciones de recursos humanos

- **Equipo**: 2 personas a tiempo completo.
- **Sinergia de roles**: cada integrante cubre full-stack (web, mobile,
  backend, DevOps).
- **Rotación**: mínima; conocimiento embebido en el repo.

### 5.3.4 Restricciones técnicas

- Lenguaje del backend: **Go 1.22+** (decisión del equipo).
- Framework backend: **Gin** (decisión del equipo).
- Acceso a base de datos: **sqlc** exclusivamente (no ORM dinámicos).
- Documentación API: **OpenAPI 3.1 + Swagger UI**.
- No usar ORMs dinámicos (GORM, ent) por decisión técnica y pedagógica.

### 5.3.5 Restricciones de plataforma

- App Store: cumplir con [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) en su versión actual.
- Play Store: cumplir con [Play Console policies](https://support.google.com/googleplay/android-developer/answer/9888077).
- Web: WCAG 2.1 nivel AA en flujos principales.
- Privacidad: GDPR-like para usuarios europeos, LFPDPPP para México.

## 5.4 Supuestos

| # | Supuesto | Mitigación si falla |
|---|---|---|
| **S-01** | Los usuarios tienen acceso a internet. | Modo lectura offline (v2). |
| **S-02** | Los usuarios tienen email válido. | Soporte vía Discord. |
| **S-03** | Supabase mantiene su tier Pro con las prestaciones actuales. | Plan B: Postgres en Hetzner + Coolify. |
| **S-04** | Vercel sigue dando cobertura global. | Plan B: Netlify. |
| **S-05** | OpenRouter mantiene la variedad de modelos. | Plan B: OpenAI directo. |
| **S-06** | El equipo se mantiene estable durante 16 semanas. | Documentación temprana + pair programming. |
| **S-07** | Apple aprueba la app en la primera revisión. | Plan B: TestFlight público + revisión posterior. |
| **S-08** | No habrá cambios regulatorios mayores en privacidad. | Diseño privacy-by-default protege ante cambios. |