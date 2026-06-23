# FASE 1 — Inicio del proyecto

<span class="chapter-marker">Fase 1 · Inicio</span>

## 1.1 Resumen ejecutivo

**FlowState** es una plataforma integral de productividad personal y
colaborativa que unifica en un solo producto la gestión de conocimiento
(notas con wikilinks y grafo), tareas, hábitos, metas y trabajo en equipo.
La aplicación se distribuye en tres superficies: una webapp (Next.js), una
app móvil nativa (Expo/React Native) y una API HTTP en Go, todas contra el
mismo contrato OpenAPI.

**Problema que resuelve.** Estudiantes, profesionales independientes y
equipos pequeños reparten su trabajo entre cinco o seis herramientas
separadas (notas, lista de tareas, calendario, gestor de hábitos, chat del
equipo, almacenamiento de archivos). El costo del cambio constante de
contexto y la falta de visibilidad del progreso se traducen en pérdida de
tiempo, duplicación de información y desorganización estructural.

**Público objetivo.** Estudiantes universitarios, profesionales
freelancers, equipos de hasta diez personas y startups en etapa temprana que
buscan un único sistema operativo personal sin pagar licencias enterprise.

**Tecnologías clave.**

| Capa | Tecnología |
|---|---|
| Frontend web | Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui |
| App móvil | Expo SDK 56, React Native 0.85, Reanimated 4 |
| Backend | **Go 1.22, Gin, sqlc, golang-migrate** |
| Documentación API | **OpenAPI 3.1 + Swagger UI** |
| Base de datos | PostgreSQL 16 (gestionado vía Supabase) |
| Auth | JWT (access + refresh) + Google OAuth 2.0 |
| IA | OpenRouter (multi-modelo, resúmenes y sugerencias) |
| Diseño | Sistema propio inspirado en **Catppuccin Mocha** |

**Beneficios esperados.**

- Reducción del 30 % en tiempo medio de búsqueda de información al unificar
  notas, tareas y referencias en un grafo navegable.
- Visibilidad inmediata del progreso individual y del equipo mediante
  dashboards por rol.
- Coste operativo inferior a USD 50 /mes en los primeros 1 000 usuarios.
- Aplicación de extremo a extremo de los conceptos de la materia:
  análisis, diseño, implementación, calidad, pruebas y aceptación.

## 1.2 Planteamiento del problema

### Situación actual

El flujo de trabajo de un profesional o estudiante contemporáneo combina al
menos cinco clases de herramientas:

1. **Notas**: Notion, Obsidian, Apple Notes, Google Keep.
2. **Tareas**: Todoist, TickTick, Trello, Linear.
3. **Hábitos y metas**: Habitica, Streaks, Way of Life.
4. **Documentación compartida**: Google Drive, Dropbox, Confluence.
5. **Comunicación de equipo**: Slack, Discord, Microsoft Teams.

Cada herramienta almacena una parte del conocimiento y del estado del
trabajo. La consecuencia directa es que **una idea vive en cuatro
aplicaciones distintas** y reconstruir el contexto para empezar una tarea
cuesta entre cinco y quince minutos según el estudio de RescueTime
(2023) sobre fragmentación digital.

### Problemas detectados

| # | Problema | Impacto |
|---|---|---|
| P-01 | **Fragmentación de información.** | La misma idea aparece duplicada en notas, chats y documentos. |
| P-02 | **Cambio constante de contexto.** | Cambio de pestaña 40–80 veces al día. |
| P-03 | **Baja productividad.** | Hasta 23 minutos para retomar una tarea interrumpida. |
| P-04 | **Mala visibilidad del progreso.** | Equipos pequeños no saben qué hace cada miembro. |
| P-05 | **Sincronización deficiente.** | Versiones desactualizadas entre dispositivos. |

### Consecuencias

- Pérdida de tiempo: **1,5 h/día** en tareas relacionadas con el cambio de
  herramienta (Newport, *Deep Work*, 2016).
- Duplicación de trabajo: hasta un 12 % de tareas se reescriben por
  pérdida de contexto.
- Desorganización: la información crítica se diluye en archivos
  inencontrables.
- Fatiga por decisión: elegir *en qué herramienta trabajar* consume
  energía cognitiva que debería invertirse en la tarea en sí.

### Árbol de problemas (resumen)

```
PROBLEMA CENTRAL
└── Fragmentación del trabajo personal y de equipos en múltiples
    herramientas heterogéneas.

CAUSAS                              CONSECUENCIAS
├── Falta de plataforma única       ├── Pérdida de tiempo
├── Notas sin relación semántica    ├── Duplicación de tareas
├── Tareas desconectadas de metas   ├── Fatiga por decisión
└── Equipos sin visibilidad         └── Baja satisfacción
```

## 1.3 Justificación

### Justificación técnica

El proyecto es **técnicamente viable**. El equipo domina los lenguajes y
frameworks requeridos (TypeScript/React, Go, SQL, Postgres) o tiene
capacidad de aprendizaje documentada en menos de tres semanas por
tecnología (ver FASE 2, factibilidad técnica). El stack propuesto se apoya
en bibliotecas con mantenimiento activo y comunidades amplias (Gin,
sqlc, Next.js, Expo).

La arquitectura basada en tres aplicaciones con un único contrato OpenAPI
es un patrón probado (modelo Spotify, modelo Netflix) y reduce
significativamente el riesgo de inconsistencias entre plataformas.

### Justificación económica

El coste de operación es bajo: una instancia de Postgres gestionada por
Supabase en tier gratuito cubre los primeros 50 000 registros mensuales.
El hosting del backend Go en Fly.io o Railway cuesta menos de USD 10/mes
para 100 usuarios concurrentes. La webapp se sirve desde Vercel en tier
gratuito hasta 100 GB de transferencia.

**Comparación de coste mensual (1000 usuarios activos):**

| Servicio | Coste estimado /mes |
|---|---|
| Supabase Pro | USD 25 |
| Vercel Pro | USD 20 |
| Fly.io (API) | USD 12 |
| OpenRouter (IA) | USD 30 |
| EAS Build (mobile) | USD 10 |
| Dominio + DNS | USD 2 |
| **Total** | **USD 99 /mes** |

A un precio de **USD 4,99/mes** para el plan Pro, el ingreso mensual con
una tasa de conversión del 5 % sobre 1 000 usuarios activos (50 pagos)
asciende a USD 249,50, con margen bruto positivo desde el primer mes.

### Justificación estratégica

FlowState se diferencia de Notion y Obsidian en tres ejes:

1. **Primer móvil de verdad**: las apps nativas de Notion y Obsidian son
   aceptables pero no excelentes; FlowState invierte el 40 % del esfuerzo
   de UX en móvil.
2. **Grafo de conocimiento integrado**: la mayoría de las apps de notas
   ofrecen enlaces pero no grafo navegable.
3. **Onboarding en menos de 60 segundos**: un único campo de email y un
   código de 6 dígitos (no password, no verificación lenta).

### Justificación académica

El proyecto aplica de manera integrada todos los temas de la materia:

- **Unidad 1**: análisis de requisitos, modelado de negocio, arquitectura
  de software.
- **Unidad 2**: patrones de diseño, principios SOLID, estrategia de
  implementación.
- **Unidad 3**: planificación de calidad, estrategias de prueba, criterios
  de aceptación, métricas ISO/IEC 25010.

La entrega de un expediente técnico profesional, en lugar de un informe
narrativo, refleja el estándar de la industria y permite la evaluación
objetiva de cada fase.

## 1.4 Objetivos

### Objetivo general

Desarrollar una plataforma integral de productividad personal y
colaborativa, llamada **FlowState**, que unifique notas, tareas, hábitos,
metas y trabajo en equipo, accesible desde web y móvil, con un backend en
Go y base de datos PostgreSQL.

### Objetivos específicos

| Código | Objetivo | Métrica de éxito |
|---|---|---|
| **OE-01** | **Gestionar conocimiento personal.** Implementar notas con markdown, tags, búsqueda full-text y enlaces `[[wikilink]]` que generen automáticamente un grafo navegable. | Latencia de búsqueda ≤ 300 ms en 10 000 notas; 100 % de wikilinks resueltos en ≤ 100 ms. |
| **OE-02** | **Gestionar tareas.** Ofrecer un CRUD de tareas con estados `todo`, `in_progress`, `done`, fechas de vencimiento, prioridades y vínculo opcional a una meta. | Filtros por `goal_id`, `due_date`, `status` operativos; tiempo de creación ≤ 200 ms. |
| **OE-03** | **Gestionar hábitos y metas.** Permitir crear metas con `current/target/unit/deadline` y registrar progreso incremental; derivar indicadores como % de avance y días restantes. | Actualización de progreso ≤ 150 ms; cálculo de % en cliente sin recarga. |
| **OE-04** | **Gestionar equipos.** CRUD de equipos, invitaciones por email con token, roles `owner / mentor / member` y notas compartidas con permisos `read / write / owner`. | Invitación entregable ≤ 5 s; revocación de acceso efectiva en ≤ 30 s. |
| **OE-05** | **Generar métricas e indicadores.** Dashboard individual con tareas del día, hábitos pendientes y notas recientes; dashboard de equipo con miembros activos, notas de la semana y progreso de metas colectivas. | Carga del dashboard ≤ 800 ms en 2G simulada. |
| **OE-06** | **Integrar IA de manera opcional.** Resúmenes automáticos de notas largas, sugerencias de tags y preguntas en lenguaje natural sobre el grafo de conocimiento, vía OpenRouter multi-modelo. | Costo medio por consulta ≤ USD 0,005; respuesta streaming inicial ≤ 2 s. |