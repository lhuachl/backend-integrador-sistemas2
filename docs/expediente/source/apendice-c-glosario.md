# Apéndice C — Glosario y acrónimos

## C.1 Términos de producto

| Término | Definición |
|---|---|
| **FlowState** | Plataforma de productividad personal y de equipos. |
| **Nota** | Unidad de conocimiento en markdown, con tags y opcional wikilinks. |
| **Wikilink** | Sintaxis `[[Título]]` que crea un enlace a otra nota del mismo autor o equipo. |
| **Grafo** | Visualización de notas y sus enlaces como nodos y aristas. |
| **Meta** | Objetivo cuantificable con `current/target/unit`. |
| **Tarea** | Acción concreta con estado y opcional fecha de vencimiento. |
| **Hábito** | (En roadmap) Acción recurrente que se quiere跟踪. |
| **Equipo** | Grupo de usuarios con notas y metas compartidas. |
| **Pro** | Plan de pago que incluye IA y elimina límites del Free. |
| **Free** | Plan gratuito con notas, tareas y hábitos básicos. |

## C.2 Términos técnicos

| Término | Definición |
|---|---|
| **ADR** | Architecture Decision Record. Documento que captura una decisión técnica. |
| **API** | Application Programming Interface. |
| **Backend** | Lógica de negocio y persistencia, expuesta como HTTP. |
| **bcrypt** | Algoritmo de hash de contraseñas con salt y costo configurable. |
| **CORS** | Cross-Origin Resource Sharing. Política de origen cruzado. |
| **DoD** | Definition of Done. Criterios para considerar una historia terminada. |
| **DER** | Diagrama Entidad-Relación. |
| **DTO** | Data Transfer Object. Tipo que cruza una capa. |
| **E2E** | End-to-End. Pruebas que cubren un flujo completo del usuario. |
| **Grafo de conocimiento** | Red de notas conectadas por wikilinks. |
| **HSTS** | HTTP Strict Transport Security. Header de seguridad. |
| **IA** | Inteligencia Artificial. En FlowState, modelos vía OpenRouter. |
| **ISO/IEC 25010** | Estándar de calidad de software. |
| **JWT** | JSON Web Token. Formato compacto de token firmado. |
| **k6** | Herramienta de pruebas de carga. |
| **MoSCoW** | Técnica de priorización: Must, Should, Could, Won't. |
| **NPS** | Net Promoter Score. Métrica de satisfacción. |
| **OAuth** | Protocolo de autorización delegada. |
| **OpenAPI** | Especificación estándar para describir APIs HTTP. |
| **OpenRouter** | Proveedor multi-modelo de IA. |
| **OWASP** | Open Web Application Security Project. |
| **PII** | Personally Identifiable Information. |
| **PRD** | Product Requirements Document. |
| **RBAC** | Role-Based Access Control. |
| **RNF** | Requisito no funcional. |
| **RF** | Requisito funcional. |
| **RPS** | Requests per second. |
| **SaaS** | Software as a Service. |
| **SAM** | Serviceable Available Market. |
| **slug** | Versión URL-friendly de un nombre. |
| **SOLID** | Cinco principios de diseño orientado a objetos. |
| **sqlc** | Generador de código Go a partir de SQL. |
| **Swagger** | Herramientas para diseñar, construir y documentar APIs. |
| **UUID** | Identificador único universal (RFC 4122). |
| **WCAG** | Web Content Accessibility Guidelines. |
| **Wikilink** | Enlace interno entre notas. |

## C.3 Acrónimos del proceso

| Acrónimo | Significado |
|---|---|
| **CI** | Continuous Integration. |
| **CD** | Continuous Delivery / Deployment. |
| **DAU** | Daily Active Users. |
| **MAU** | Monthly Active Users. |
| **MTTR** | Mean Time To Recovery. |
| **P95** | Percentil 95 de una distribución de latencia. |
| **PR** | Pull Request. |
| **RUM** | Real User Monitoring. |
| **SLA** | Service Level Agreement. |
| **SLO** | Service Level Objective. |
| **SLA** | Service Level Agreement. |
| **WCAG** | Web Content Accessibility Guidelines. |

## C.4 Stack resumido

| Capa | Tecnología |
|---|---|
| Backend | Go 1.22 + Gin + sqlc |
| DB | PostgreSQL 16 (Supabase) |
| Auth | JWT (access + refresh) + Google OAuth |
| Frontend web | Next.js 16 + React 19 + Tailwind 4 |
| Móvil | Expo SDK 56 + React Native 0.85 |
| IA | OpenRouter (multi-modelo) |
| Diseño | Sistema propio inspirado en Catppuccin Mocha |
| Pagos | Stripe |
| Hosting backend | Fly.io |
| Hosting web | Vercel |
| Build móvil | EAS (Expo Application Services) |

## C.5 Referencias

- Bass, L., Clements, P., & Kazman, R. (2021). *Software Architecture in
  Practice* (4th ed.). Addison-Wesley.
- Fowler, M. (2002). *Patterns of Enterprise Application Architecture*.
  Addison-Wesley.
- Gamma, E., et al. (1994). *Design Patterns*. Addison-Wesley.
- ISO/IEC 25010:2011. *Systems and software engineering — Systems and
  software Quality Requirements and Evaluation (SQuaRE) — System and
  software quality models*.
- Martin, R. C. (2003). *Agile Software Development: Principles,
  Patterns, and Practices*. Prentice Hall.
- Newman, S. (2021). *Building Microservices* (2nd ed.). O'Reilly.
- Osterwalder, A., & Pigneur, Y. (2010). *Business Model Generation*.
  Wiley.
- Pressman, R. S., & Maxim, B. R. (2020). *Software Engineering: A
  Practitioner's Approach* (9th ed.). McGraw-Hill.
- Sommerville, I. (2015). *Software Engineering* (10th ed.). Pearson.
- The Catppuccin project. https://github.com/catppuccin

## C.6 Índice de figuras

| Figura | Sección | Descripción |
|---|---|---|
| 3.1 | FASE 3 | Lienzo de modelo de negocio (4 segmentos). |
| 6.1 | FASE 6 | Stack backend Go. |
| 6.2 | FASE 6 | Contexto C1. |
| 6.3 | FASE 6 | Contenedores C2. |
| 6.4 | FASE 6 | Componentes C3 — Notas. |
| 6.5 | FASE 6 | Despliegue. |
| 7.1 | FASE 7 | Diagrama entidad-relación. |
| 7.2 | FASE 7 | Flujo de tokens JWT. |