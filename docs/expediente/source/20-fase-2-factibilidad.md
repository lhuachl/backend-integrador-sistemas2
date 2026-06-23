# FASE 2 — Factibilidad y viabilidad

<span class="chapter-marker">Fase 2 · Factibilidad</span>

## 2.1 Análisis de factibilidad

La factibilidad se evalúa en cinco dimensiones según lo establecido en el
proceso de análisis de la Unidad 1.

### 2.1.1 Factibilidad técnica

**Stack propuesto (definitivo tras la iteración del equipo):**

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Backend | Go | 1.22+ | Tipado fuerte, binario único, alto rendimiento. |
| Framework HTTP | Gin | 1.10+ | Router maduro, comunidad amplia, middlewares listos. |
| ORM tipado | sqlc | 1.27+ | Genera código Go a partir de SQL puro: cero magic strings. |
| Migraciones | golang-migrate | 4.17+ | Estándar de facto en Go. |
| Documentación | OpenAPI 3.1 + Swagger UI | — | Fuente de verdad para clientes web/móvil. |
| DB | PostgreSQL | 16+ | Características modernas: `gen_random_uuid()`, JSONB. |
| Cache | Redis (opcional) | 7+ | Sólo si métricas lo justifican. |

**Evaluación:**

- **Conocimientos del equipo.** El equipo declara experiencia
  intermedia-alta en TypeScript/React (3 años) y nivel básico en Go (3
  meses). El plan de nivelación (ver 8.4) cubre los gaps.
- **Infraestructura.** Acceso a Supabase (Postgres gestionado), Vercel
  (frontend), Fly.io (backend) y EAS (builds móviles) sin coste inicial.
- **Hosting.** Suficiente para una primera versión con 1 000 usuarios.
- **Dispositivos.** Tres dispositivos físicos para QA: 1 Android (Pixel
  7), 1 iOS (iPhone 12), 1 Windows 11 + navegador Chromium.

**Riesgo técnico principal:** la curva de aprendizaje de sqlc para el
equipo (mitigada con un spike de 2 semanas y plantillas internas).

### 2.1.2 Factibilidad operativa

Los usuarios podrán adoptar FlowState en menos de 60 segundos:

1. Ingresan su email en la pantalla de bienvenida.
2. Reciben un código de 6 dígitos (mock-first; real en producción).
3. Caen directamente en la pantalla *Hoy*.

No se requiere configuración inicial. El equipo se crea in-app en
cualquier momento. La curva de aprendizaje se mitiga con:

- **Onboarding tooltips** en la primera visita a cada sección.
- **Plantillas de notas y metas** preconfiguradas (Universidad, Freelance,
  Startup).
- **Búsqueda global** (atajo `Cmd/Ctrl + K`) desde cualquier pantalla.

### 2.1.3 Factibilidad económica

#### Costos directos (mensuales, en USD)

| Servicio | Tier | Coste /mes | Notas |
|---|---|---|---|
| Dominio `flowstate.app` | — | 2 | Registro anual prorrateado. |
| Supabase Pro | Pro | 25 | 8 GB Postgres, 100 GB transferencia. |
| Vercel Pro | Pro | 20 | Builds ilimitadas, edge functions. |
| Fly.io | Hobby | 12 | 1 máquina shared-cpu-1x, 1 GB RAM. |
| EAS Build | Free / Pay-as-you-go | 10 | ~ 30 builds/mes. |
| OpenRouter | Pay-as-you-go | 30 | ~ 6 000 consultas/mes. |
| Apple Developer Program | Anual | 8 | Prorrateado (necesario para TestFlight). |
| **Total** | | **107** | |

#### Costos directos (puntuales, una vez)

| Concepto | Coste |
|---|---|
| Diseño de marca y logo | 0 (realizado por el equipo) |
| Set de dispositivos de QA | 0 (equipos personales) |
| Cuentas de email corporativo | 0 (Google Workspace free) |
| Certificados de firma | 0 (Apple Developer cubre) |

#### Costos indirectos (horas-hombre)

Total estimado: **480 horas-hombre** distribuidas en 16 semanas
(≈ 60 h/semana para dos personas).

#### Ingresos esperados

Con 1 000 usuarios activos y tasa de conversión del 5 % al plan Pro (USD
4,99/mes):

```
Ingreso mensual = 1 000 × 0,05 × 4,99 = 249,50 USD
Margen bruto    = 249,50 − 107      = 142,50 USD
```

Margen bruto positivo desde el primer mes. A 5 000 usuarios activos el
margen escala a USD 1 140/mes.

### 2.1.4 Factibilidad legal

- **Protección de datos.** El proyecto cumple con los principios de
  *privacy by design*: la contraseña nunca se almacena en claro (bcrypt
  cost 12), el refresh token se almacena hasheado, los emails
  invitaciones se eliminan a las 72 h, y el usuario puede exportar y
  borrar todos sus datos en cualquier momento.
- **Términos de uso y privacidad.** Publicados antes del lanzamiento
  público (ver FASE 11).
- **Cumplimiento de propiedad intelectual.** Stack, fuentes y dependencias
  externas se declaran en `THIRD_PARTY.md`; todas las dependencias son
  MIT/Apache-2.0/BSD.
- **OAuth de Google.** Se respeta la `Google API Services User Data
  Policy`: sólo se solicita el perfil básico, no se comparte con terceros.

### 2.1.5 Factibilidad de cronograma

**Duración total:** 16 semanas (Semestre 1/2025).

```
Semana  1─2   FASE 1   Inicio y justificación
Semana  3─4   FASE 2   Factibilidad
Semana  5     FASE 3   Modelo de negocio
Semana  6─7   FASE 4   Requisitos
Semana  8     FASE 5   Alcance
Semana  9─10  FASE 6   Arquitectura
Semana 11     FASE 7   Diseño detallado
Semana 12─13  FASE 8   Implementación
Semana 14     FASE 9   Calidad
Semana 15     FASE 10  Pruebas
Semana 16     FASE 11  Aceptación y entrega
```

La duración total encaja en el semestre y deja una semana de holgura
antes de la fecha de entrega final (23 de junio de 2025).

## 2.2 Análisis de viabilidad

A diferencia de la factibilidad (¿se puede construir?), la viabilidad
evalúa **¿se debe construir?, ¿alguien lo pagaría?, ¿cuál es la
probabilidad de éxito?**.

### 2.2.1 Mercado objetivo

- **Mercado primario.** Estudiantes universitarios hispanohablantes
  (≈ 24 M en Iberoamérica) que gestionan apuntes, tareas y hábitos.
- **Mercado secundario.** Profesionales independientes y freelancers
  hispanohablantes (≈ 12 M).
- **Mercado terciario.** Equipos pequeños (startups, agencias, ONGs)
  hasta 10 personas que hoy combinan Notion + Todoist + Slack.

Tamaño de mercado anual estimado (SAM):

```
SAM = 36 M usuarios potenciales × 5 % capturables × USD 4,99/mes × 12
    = USD 107,7 M /año
```

### 2.2.2 Competencia

| Producto | Notas | Tareas | Hábitos | Equipos | Móvil | IA | Precio |
|---|---|---|---|---|---|---|---|
| Notion | Excelente | Sí | No | Sí | Aceptable | Sí (extra) | USD 10/mes |
| Obsidian | Local-first | No | No | No | Buena | Vía plugin | USD 8/mes |
| Todoist | Tareas | Sí | No | Limitado | Excelente | No | USD 4/mes |
| ClickUp | Polivalente | Sí | No | Sí | Aceptable | Sí | USD 7/mes |
| Tana | Grafo | Sí | No | Sí | Limitado | Sí | USD 14/mes |
| **FlowState** | **Grafo + tareas + hábitos** | **Sí** | **Sí** | **Sí** | **Excelente** | **Sí (incluido)** | **USD 4,99** |

**Ventaja diferencial.** FlowState es el único producto en el cuadrante
*grafo + tareas + hábitos + excelente móvil + IA incluida*, a precio
inferior al promedio.

### 2.2.3 Riesgos y mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-01 | Curva de aprendizaje de Go/sqlc retrasa el backend. | Media | Alto | Spike de 2 semanas en semana 3-4; plantillas internas. |
| R-02 | App móvil rechazada en App Store por guidelines. | Baja | Medio | Revisión previa con TestFlight interno; checklist UI 2.4. |
| R-03 | Costes de IA superiores al estimado. | Media | Medio | Límite duro de USD 50/mes; caché de resúmenes. |
| R-04 | Competidor grande copia la propuesta en 6 meses. | Alta | Medio | Diferenciarse por calidad móvil + comunidad hispanohablante. |
| R-05 | Baja tasa de conversión al plan Pro. | Media | Alto | Onboarding y trial de 14 días sin coste. |
| R-06 | Pérdida de datos por error humano. | Baja | Crítico | Backups diarios en Supabase + WAL archiving. |

### 2.2.4 Retorno esperado

**Horizonte de retorno:** 18 meses.

- **Mes 6**: 200 usuarios activos, 10 pagos.
- **Mes 12**: 1 000 usuarios activos, 50 pagos (USD 250/mes).
- **Mes 18**: 5 000 usuarios activos, 250 pagos (USD 1 250/mes).

El retorno se evalúa también en términos académicos: el equipo domina un
stack de alta demanda laboral (Go + React Native + Postgres + OpenAPI) y
produce un expediente técnico publicable como portafolio profesional.

### 2.2.5 Posibilidad real de éxito

Aplicando una matriz ponderada simple:

| Criterio | Peso | Puntuación (1–5) | Ponderado |
|---|---|---|---|
| Demanda de mercado | 25 % | 4 | 1,00 |
| Diferenciación técnica | 20 % | 4 | 0,80 |
| Capacidad del equipo | 20 % | 4 | 0,80 |
| Viabilidad económica | 15 % | 5 | 0,75 |
| Riesgos legales | 10 % | 5 | 0,50 |
| Cronograma | 10 % | 4 | 0,40 |
| **Total** | **100 %** | | **4,25 / 5** |

> **Veredicto**: el proyecto es **viable**. Puntuación 4,25/5 indica alta
> probabilidad de alcanzar los objetivos propuestos.