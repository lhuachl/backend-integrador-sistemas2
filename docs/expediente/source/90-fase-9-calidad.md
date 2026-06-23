# FASE 9 — Calidad

<span class="chapter-marker">Fase 9 · Calidad</span>

## 9.1 Estándar ISO/IEC 25010

FlowState adopta el modelo de calidad de software definido por
**ISO/IEC 25010** (2011) como marco de referencia para evaluar la
calidad del producto. Las ocho características principales se adaptan a
los objetivos del proyecto.

### 9.1.1 Adecuación funcional

| Subcaracterística | Cómo se mide | Meta |
|---|---|---|
| Completitud funcional | Cobertura de RFs (matriz §4.4). | 100 % de los RF Must. |
| Corrección funcional | Tests de aceptación. | 0 defectos P0 en producción. |
| Idoneidad | Encuesta NPS a usuarios. | NPS ≥ 40. |

### 9.1.2 Eficiencia de desempeño

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Latencia P95 endpoints `/api/v1/*` | < 500 ms | k6 scripts en CI semanal. |
| Tiempo de búsqueda full-text | < 300 ms (10 k notas) | Bench local + k6. |
| First Contentful Paint web | < 1.5 s | Lighthouse CI. |
| Cold start app móvil | < 2 s | Test en Pixel 7 + iPhone 12. |

### 9.1.3 Compatibilidad

- Cobertura de navegadores: Chromium, Safari, Firefox (2 últimas
  versiones).
- Cobertura móvil: iOS 15+, Android 8+.
- Pruebas de regresión visual con Percy (snapshots en PRs).

### 9.1.4 Usabilidad

- Onboarding medido con `Datadog RUM` desde el primer evento.
- Flujos evaluados con heurísticas de Nielsen (5 evaluadores externos).
- Accesibilidad: AA en flujos principales (RNF-011).

### 9.1.5 Fiabilidad

- Uptime mensual ≥ 99 % (RNF-001).
- MTTR < 30 min para P0.
- Backups diarios verificados (RNF-012).

### 9.1.6 Seguridad

- Auditoría OWASP Top 10 antes del lanzamiento.
- Pentesting externo anual.
- Programa de bug bounty desde el día 1 (mínimo USD 50 por hallazgo).
- SAST (CodeQL) + DAST (OWASP ZAP) en CI.

### 9.1.7 Mantenibilidad

- Cobertura de pruebas ≥ 70 % en backend, ≥ 60 % en frontend (RNF-010).
- Complejidad ciclomática media ≤ 10 por función (golangci-lint).
- Modularidad medida por *afferent / efferent coupling* ≤ 20 por paquete.
- Tiempo medio para entender un módulo nuevo ≤ 30 min (medición con
  *feedback de nuevos contribuidores*).

### 9.1.8 Portabilidad

- Docker images multi-arch (`linux/amd64`, `linux/arm64`).
- Migraciones de schema compatibles desde PostgreSQL 14 en adelante.
- App móvil bundlea assets; no requiere red para UI básica.

## 9.2 Estrategia de revisión

### 9.2.1 Niveles de revisión

| Nivel | Cuándo | Quién | Salida |
|---|---|---|---|
| **Local** | Antes de abrir PR. | El autor. | Self-review + tests locales. |
| **PR** | Cada cambio. | 1–2 revisores según impacto. | Aprobación o cambios. |
| **Code review asistido** | PRs > 300 LOC. | Revisor senior + CodeQL. | Reporte automático. |
| **Auditoría mensual** | Fin de mes. | Todo el equipo. | Retrospectiva + métricas. |

### 9.2.2 Plantilla de PR

```markdown
## Contexto
- ¿Qué problema resuelve?
- ¿A qué RF/RNF apunta?

## Cambios
- Lista breve de cambios.

## Pruebas
- [ ] Tests unitarios añadidos/actualizados.
- [ ] Tests de integración pasan.
- [ ] E2E afectados verificados manualmente.
- [ ] Cobertura no bajó.

## Riesgos
- ¿Algo que pueda romper?
- ¿Migraciones? ¿Rollback plan?

## Screenshots / logs
- (si aplica)
```

### 9.2.3 Definition of Done (DoD)

Una historia está *hecha* sólo si:

- [ ] Implementada según el contrato OpenAPI.
- [ ] Tests unitarios + integración pasan.
- [ ] Cobertura del módulo ≥ 70 %.
- [ ] Lint y type-check pasan.
- [ ] Sin `console.log` / `fmt.Println` de debug.
- [ ] Sin secrets en código.
- [ ] Documentación actualizada (godoc / JSDoc / README).
- [ ] Revisor aprueba.
- [ ] CI pasa en `main`.

## 9.3 Linting y análisis estático

### 9.3.1 Backend Go

```yaml
# .golangci.yml
run:
  timeout: 5m
linters:
  enable:
    - govet
    - staticcheck
    - errcheck
    - gosimple
    - ineffassign
    - unused
    - gocritic
    - revive
    - gocyclo
    - gofmt
    - goimports
    - bodyclose
    - nilerr
    - exportloopref
    - prealloc

linters-settings:
  gocyclo:
    min-complexity: 15
  revive:
    rules:
      - name: exported
      - name: package-comments
      - name: var-naming

issues:
  exclude-rules:
    - path: _test\.go
      linters: [gocyclo, errcheck]
```

### 9.3.2 Frontend web y móvil (TypeScript)

- **Biome** (lint + format): reglas de import order, no unused vars,
  consistent type imports.
- **TypeScript**: `strict: true`, `noUncheckedIndexedAccess: true`,
  `exactOptionalPropertyTypes: true`.

### 9.3.3 Análisis de seguridad

- **CodeQL** weekly + en cada PR (GitHub Actions).
- **Gosec** weekly.
- **npm audit** weekly; renovate bot abre PRs de upgrade.
- **Trivy** sobre imágenes Docker.

### 9.3.4 Pre-commit hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
  - repo: https://github.com/dnephin/pre-commit-golang
    rev: v0.5.0
    hooks:
      - id: go-fmt
      - id: go-vet-mod
      - id: go-mod-tidy
  - repo: https://github.com/biomejs/pre-commit
    rev: v1.9.0
    hooks:
      - id: biome-check
        additional_dependencies: ['@biomejs/biome']
```

## 9.4 Métricas y umbrales

### 9.4.1 Métricas de código

| Métrica | Herramienta | Umbral |
|---|---|---|
| Líneas por función | `gocyclo`, linters | ≤ 50 |
| Complejidad ciclomática | `gocyclo` | ≤ 15 |
| Cobertura backend | `go test -cover` | ≥ 70 % |
| Cobertura web | Vitest + c8 | ≥ 60 % |
| Duplicación | jscpd | ≤ 3 % |
| Deuda técnica (SonarQube) | sonarqube | ≤ 5 días |
| Comentarios TODO/FIXME | grep + CI | ≤ 10 en `main` |

### 9.4.2 Métricas de proceso

| Métrica | Meta |
|---|---|
| Lead time (PR → merge) | ≤ 2 días hábiles. |
| Cycle time (issue → PR) | ≤ 5 días hábiles. |
| Frecuencia de deploy | ≥ 5 / semana. |
| Change failure rate | ≤ 10 %. |
| MTTR | ≤ 30 min. |

### 9.4.3 Métricas de producto

| Métrica | Meta |
|---|---|
| DAU/MAU | ≥ 30 % |
| Retención D7 | ≥ 25 % |
| Conversión Free → Pro | ≥ 5 % |
| NPS | ≥ 40 |
| Tiempo a la primera nota | ≤ 60 s |