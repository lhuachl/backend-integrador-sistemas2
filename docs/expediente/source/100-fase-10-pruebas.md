# FASE 10 — Pruebas

<span class="chapter-marker">Fase 10 · Pruebas</span>

## 10.1 Pirámide de pruebas

FlowState adopta la **pirámide de pruebas** clásica, con énfasis fuerte
en unit tests y un número acotado de E2E.

```
        ╱╲
       ╱  ╲         E2E (Playwright)
      ╱ 10 ╲        ~ 15 escenarios críticos
     ╱──────╲
    ╱        ╲      Integración (httptest + Postgres test)
   ╱   60     ╲     ~ 80 casos
  ╱────────────╲
 ╱              ╲   Unit (Go testify, Vitest)
╱      250       ╲  ~ 250 funciones testeadas
──────────────────
```

| Nivel | Velocidad | Aislamiento | Cobertura objetivo |
|---|---|---|---|
| Unit | < 10 ms | Total | ≥ 70 % líneas |
| Integración | 100–500 ms | DB en container | ≥ 50 % ramas |
| E2E | 5–30 s | Browser real | 100 % flujos Must |

## 10.2 Pruebas unitarias

### 10.2.1 Backend Go

- **Framework**: `testify` (`assert`, `require`, `mock`).
- **Cobertura**: `go test -cover -coverprofile=c.out ./...`.
- **Convención**: archivo `*_test.go` junto al código; paquete `*_test`
  para tests de caja negra.

```go
// service/note_service_test.go
func TestNoteService_Create_GeneratesUUID(t *testing.T) {
    repo := &mockNoteRepo{
        CreateFn: func(ctx context.Context, p model.CreateNoteParams) (model.Note, error) {
            assert.NotEmpty(t, p.ID)
            return model.Note{ID: p.ID, Title: p.Title}, nil
        },
    }
    svc := service.NewNoteService(repo)
    n, err := svc.Create(ctx, model.CreateNoteRequest{Title: "x"}, "user-1")
    require.NoError(t, err)
    assert.NotEmpty(t, n.ID)
}

func TestNoteService_Create_RejectsEmptyTitle(t *testing.T) {
    svc := service.NewNoteService(&mockNoteRepo{})
    _, err := svc.Create(ctx, model.CreateNoteRequest{Title: ""}, "user-1")
    require.Error(t, err)
    assert.ErrorIs(t, err, model.ErrValidation)
}
```

### 10.2.2 Frontend web (Next.js + TypeScript)

```ts
// lib/api/client/mock.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createMockApiClient } from './mock'

describe('MockApiClient.notes.create', () => {
  it('returns the new note with an id and timestamps', async () => {
    const client = createMockApiClient()
    const note = await client.notes.create({
      title: 'Test',
      content: 'Body',
      tags: [],
    })
    expect(note.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(note.created_at).toBeDefined()
    expect(note.updated_at).toBeDefined()
  })
})
```

### 10.2.3 App móvil (RN)

- **Framework**: Jest + `@testing-library/react-native`.
- **Cobertura objetivo**: ≥ 60 % en stores y servicios (no en
  componentes de presentación).

## 10.3 Pruebas de integración

### 10.3.1 Stack de pruebas Go

- **Testcontainers**: levanta un Postgres efímero por paquete de tests.
- **goose / migrations**: se aplican al inicio del test suite.
- **net/http/httptest**: dispara requests reales al handler con un
  router de Gin real.

```go
// handler/notes_integration_test.go
func TestNotesAPI_CreateAndList(t *testing.T) {
    pool := testutil.NewPool(t)
    q := db.New(pool)
    repo := repository.NewNoteRepository(q)
    svc  := service.NewNoteService(repo)
    hnd  := handler.NewNoteHandler(svc)

    r := gin.New()
    handler.RegisterNoteRoutes(r, hnd)

    user := testutil.SeedUser(t, q, "alice@example.com")
    token := testutil.IssueAccessToken(t, user.ID)

    // Create
    body := `{"title":"hola","content":"x","tags":["a"]}`
    req := httptest.NewRequest("POST", "/notes", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+token)
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)
    require.Equal(t, 201, w.Code)

    // List
    req = httptest.NewRequest("GET", "/notes", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    w = httptest.NewRecorder()
    r.ServeHTTP(w, req)
    require.Equal(t, 200, w.Code)
    assert.Contains(t, w.Body.String(), "hola")
}
```

### 10.3.2 Aislamiento

- Cada test crea su propio schema (`notes_test_<random>`) o usa
  transacciones con rollback al final.
- `testutil.TruncateAll(t, pool)` entre tests para empezar limpio.

### 10.3.3 Datos de prueba

- Fixtures en `apps/api/testdata/`:
  - `users.json`, `teams.json`, `notes.json`.
- Helper: `testutil.SeedUser(t, q, email)` crea un usuario y devuelve el
  token.

## 10.4 Pruebas E2E (Playwright)

### 10.4.1 Escenarios cubiertos

| # | Escenario | Prioridad |
|---|---|---|
| E2E-01 | Registro y verificación → primera nota. | P0 |
| E2E-02 | Login con email. | P0 |
| E2E-03 | Login con Google. | P1 |
| E2E-04 | Crear equipo + invitar miembro. | P0 |
| E2E-05 | Crear nota con wikilink y navegar el grafo. | P0 |
| E2E-06 | Crear meta y registrar progreso. | P0 |
| E2E-07 | Crear tarea, marcarla done, verla en dashboard. | P0 |
| E2E-08 | Búsqueda full-text. | P1 |
| E2E-09 | Compartir nota con equipo. | P1 |
| E2E-10 | Resumen IA de una nota larga. | P2 |
| E2E-11 | Logout + token revocado. | P0 |
| E2E-12 | Refresh token expirado → re-login. | P0 |
| E2E-13 | Modo oscuro y modo claro. | P2 |
| E2E-14 | Cambiar entre equipos. | P1 |
| E2E-15 | Eliminar cuenta y verificar borrado de datos. | P1 |

### 10.4.2 Page Object Model

```ts
// e2e/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async loginWithEmail(email: string, code: string) {
    await this.page.goto('/welcome')
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByRole('button', { name: 'Continuar' }).click()
    await this.page.getByLabel('Código').fill(code)
    await this.page.getByRole('button', { name: 'Verificar' }).click()
    await this.page.waitForURL('**/today')
  }
}
```

### 10.4.3 Ejecución

```bash
# Local
bunx playwright test

# CI
- run: bunx playwright test --reporter=github
- uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## 10.5 Criterios de aceptación por RF

A continuación se listan los criterios de aceptación **medibles** para
los RFs prioritarios. Cada criterio es ejecutable como un test.

### RF-001 · Registro de usuario

```gherkin
Feature: Registro de usuario
  Scenario: Registro exitoso
    Given un email no registrado
    When el usuario envía POST /auth/register con email válido y password ≥ 8
    Then la respuesta es 201 con { user, tokens }
    And el usuario tiene verified=false

  Scenario: Email duplicado
    Given un email ya registrado
    When el usuario intenta registrarse
    Then la respuesta es 409 con code=conflict

  Scenario: Password débil
    When el usuario envía password de 6 caracteres
    Then la respuesta es 400 con code=validation_error
```

### RF-013 · Crear nota

```gherkin
Feature: Crear nota
  Scenario: Crear nota con tags
    Given un usuario autenticado
    When crea una nota con título y 2 tags
    Then la nota se persiste con id UUID
    And los tags se almacenan como JSON

  Scenario: Wikilink en el contenido
    Given una nota con "[[Regla de la cadena]]" en el contenido
    When se guarda
    Then se crea un note_links con target_title="Regla de la cadena"
    And no se duplica si aparece varias veces
```

### RF-019 · Wikilinks colapsados

```gherkin
Feature: Wikilinks
  Scenario: Mismo target varias veces
    Given una nota con "[[Cálculo]] ... [[Cálculo]]"
    When se guarda
    Then existe exactamente 1 fila en note_links con target_title="Cálculo"

  Scenario: Resolver wikilink al crear nota destino
    Given una nota A con link a "Cálculo"
    When se crea la nota B con título "Cálculo"
    Then el note_links de A se actualiza con target_note_id=B.id
```

### RF-022 · Progreso de meta

```gherkin
Feature: Progreso de meta
  Scenario: Sumar progreso sin exceder target
    Given una meta con current=30, target=100
    When el usuario registra +50
    Then current=80
    And el % se calcula como 80%

  Scenario: No se permite negativo
    Given una meta con current=10
    When intenta registrar -20
    Then la respuesta es 400
```

### RF-024 · Cambiar estado de tarea

```gherkin
Feature: Cambiar estado
  Scenario: todo → in_progress
    Given una tarea en "todo"
    When PATCH /tasks/{id} { status: "in_progress" }
    Then el estado cambia
    And updated_at se actualiza

  Scenario: Transición inválida
    Given una tarea en "done"
    When intenta pasar a "in_progress"
    Then se permite (no hay restricción de orden en MVP)
```

### 10.5.1 Matriz RF → Test

Esta matriz resume la cobertura; los detalles de cada test están en
`apps/api/test/integration/` y `apps/web/e2e/`.

| RF | Unit | Integración | E2E |
|---|---|---|---|
| RF-001 | 3 | 2 | E2E-01 |
| RF-002 | 2 | 1 | E2E-02 |
| RF-003 | 2 | 1 | E2E-01 |
| RF-004 | 1 | 1 | E2E-03 |
| RF-005 | 1 | 1 | E2E-11 |
| RF-006 | 2 | 2 | E2E-12 |
| RF-007 | 1 | 1 | — |
| RF-008 | 2 | 1 | E2E-04 |
| RF-009 | 1 | 1 | E2E-04 |
| RF-010 | 2 | 1 | E2E-04 |
| RF-011 | 1 | 1 | E2E-04 |
| RF-012 | 1 | 1 | E2E-04 |
| RF-013 | 3 | 2 | E2E-05 |
| RF-014 | 2 | 1 | E2E-05 |
| RF-015 | 1 | 1 | — |
| RF-016 | 2 | 2 | E2E-05 |
| RF-017 | 2 | 1 | E2E-08 |
| RF-018 | 1 | 1 | E2E-09 |
| RF-019 | 4 | 2 | E2E-05 |
| RF-020 | 1 | 1 | E2E-05 |
| RF-021 | 2 | 1 | E2E-06 |
| RF-022 | 3 | 1 | E2E-06 |
| RF-023 | 2 | 1 | E2E-07 |
| RF-024 | 2 | 1 | E2E-07 |
| RF-025 | 2 | 1 | E2E-07 |

## 10.6 Pruebas no funcionales

### 10.6.1 Rendimiento (k6)

```js
// perf/api-smoke.js
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:notes_list}': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
}

export default function () {
  const res = http.get('https://api.flowstate.app/api/v1/notes', {
    headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
  })
  check(res, { '200': r => r.status === 200 })
}
```

### 10.6.2 Seguridad (OWASP ZAP)

- Escaneo baseline semanal contra staging.
- Reporte en `/security/zap-report.html`.
- Severidad ≥ Medium genera ticket automático.

### 10.6.3 Accesibilidad (axe-core)

```ts
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('home page should have no a11y violations', async ({ page }) => {
  await page.goto('/welcome')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

## 10.7 Plan de ejecución de pruebas

| Semana | Actividad | Entregable |
|---|---|---|
| 12 | Setup de testify + testify mocks + testcontainers. | CI corriendo unit tests. |
| 13 | Tests de integración de auth y notas. | Cobertura ≥ 60 % en backend. |
| 14 | Setup de Playwright; primeros 5 escenarios E2E. | Pipeline E2E en CI. |
| 15 | Carga (k6), seguridad (ZAP), a11y (axe). | Reportes firmados. |
| 16 | Cierre de bugs + reporte final. | Test summary ejecutivo. |