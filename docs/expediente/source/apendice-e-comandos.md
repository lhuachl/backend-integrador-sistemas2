# Apéndice E — Comandos y scripts de operación

Este apéndice reúne los comandos más usados durante el desarrollo, el
despliegue y la operación de FlowState. Cada bloque está listo para
copiar-pegar.

## E.1 Backend (Go)

### E.1.1 Instalación inicial

```bash
# Clonar
git clone https://github.com/flowstate/flowstate.git
cd flowstate/apps/api

# Dependencias
go mod download

# Generar código sqlc
sqlc generate

# Variables de entorno
cp .env.example .env
$EDITOR .env

# Levantar Postgres local
docker compose up -d postgres
sleep 5

# Aplicar migraciones
migrate -path migrations -database "$DATABASE_URL" up
```

### E.1.2 Desarrollo

```bash
# Arrancar API con hot reload
air

# O directamente
go run ./cmd/server

# Compilar binario
go build -o bin/flowstate-api ./cmd/server
```

### E.1.3 Tests

```bash
# Unit + integración
go test ./...

# Con cobertura
go test -cover -coverprofile=cover.out ./...
go tool cover -html=cover.out -o cover.html

# Solo un paquete
go test ./internal/service/...

# Verbose + filtro
go test -v -run TestNoteService ./internal/service
```

### E.1.4 Linting

```bash
golangci-lint run
golangci-lint run --fix
```

### E.1.5 Generar documentación Swagger

```bash
swag init -g cmd/server/main.go -o docs/
```

## E.2 Frontend web (Next.js)

### E.2.1 Instalación

```bash
cd apps/web
bun install
cp .env.example .env.local
```

### E.2.2 Desarrollo

```bash
bun dev
# http://localhost:3000
```

### E.2.3 Generar tipos desde OpenAPI

```bash
bunx openapi-typescript docs/api.yaml -o src/lib/api/types.ts
```

### E.2.4 Build y deploy

```bash
bun run build
# Vercel detecta el cambio y despliega
```

### E.2.5 Lint + type-check

```bash
bun run lint
bun run typecheck   # si está en package.json
```

## E.3 Mobile (Expo)

### E.3.1 Instalación

```bash
cd apps/mobile/Flow-state
pnpm install
```

### E.3.2 Desarrollo

```bash
pnpm start          # abre Expo Dev Tools
pnpm android        # sólo Android
pnpm ios            # sólo iOS
```

### E.3.3 Build de producción

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### E.3.4 Submit a tiendas

```bash
eas submit --platform android --latest
eas submit --platform ios --latest
```

### E.3.5 Over-the-air updates

```bash
eas update --branch production --message "Hotfix"
```

## E.4 Despliegue backend (Fly.io)

```bash
# Login
fly auth login

# Crear app (sólo la primera vez)
fly launch --no-deploy

# Configurar secrets
fly secrets set JWT_SECRET=$(openssl rand -base64 32)
fly secrets set DATABASE_URL=postgres://...
fly secrets set OPENROUTER_API_KEY=...
fly secrets set GOOGLE_CLIENT_ID=...

# Deploy
fly deploy

# Logs
fly logs

# SSH a la instancia
fly ssh console

# Escalar
fly scale count 2

# Rollback
fly releases
fly releases rollback <version>
```

## E.5 Base de datos

### E.5.1 Crear migración

```bash
migrate create -ext sql -dir migrations -seq nombre_corto
# edita migrations/NNN_nombre_corto.up.sql y .down.sql
```

### E.5.2 Aplicar / revertir

```bash
migrate -path migrations -database "$DATABASE_URL" up
migrate -path migrations -database "$DATABASE_URL" down 1
```

### E.5.3 Backup

```bash
# Vía Supabase dashboard, o:
pg_dump "$DATABASE_URL" --no-owner --clean -Fc -f backup.dump

# Restaurar
pg_restore -d "$DATABASE_URL" --no-owner --clean backup.dump
```

## E.6 CI local (antes de push)

```bash
# Backend
cd apps/api
golangci-lint run
go test ./...
go build ./...

# Web
cd apps/web
bun run lint
bun run typecheck
bun run build

# Mobile (sólo type-check)
cd apps/mobile/Flow-state
pnpm types
```

## E.7 Inspección de logs y métricas

```bash
# Fly logs en vivo
fly logs --follow

# Grafana (si está configurado)
open https://grafana.example.com/d/flowstate-overview

# Endpoint de salud
curl https://api.flowstate.app/healthz

# Métricas Prometheus
curl https://api.flowstate.app/metrics
```

## E.8 Reset completo (entorno dev)

```bash
# Backend
cd apps/api
docker compose down -v
docker compose up -d postgres
sleep 5
migrate -path migrations -database "$DATABASE_URL" up
psql "$DATABASE_URL" -f ../seed/dev_seed.sql

# Web
cd apps/web
rm -rf .next
bun dev

# Mobile
cd apps/mobile/Flow-state
pnpm start --clear
```

## E.9 Generación del PDF del expediente

```bash
cd docs/expediente
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium  # o usa google-chrome del sistema

# Build completo
python build_pdf.py

# Solo HTML (vista previa)
python build_pdf.py --dev
# Abre http://localhost:8000/full.html

# Build sin recompilar diagramas
python build_pdf.py --no-render-mermaid
```

## E.10 Scripts útiles

### E.10.1 Resetear BD local

```bash
#!/usr/bin/env bash
# scripts/db-reset.sh
set -e
docker compose down -v
docker compose up -d postgres
sleep 5
migrate -path migrations -database "$DATABASE_URL" up
psql "$DATABASE_URL" -c "SELECT 'OK';"
```

### E.10.2 Generar release notes

```bash
#!/usr/bin/env bash
# scripts/release-notes.sh
set -e
LAST_TAG=$(git describe --tags --abbrev=0)
echo "## Cambios desde $LAST_TAG"
git log $LAST_TAG..HEAD --oneline
```

### E.10.3 Backup automático semanal

```cron
0 3 * * 0 pg_dump "$DATABASE_URL" --no-owner -Fc -f /backups/flowstate-$(date +\%Y\%m\%d).dump
```

## E.11 Troubleshooting frecuente

| Síntoma | Causa probable | Solución |
|---|---|---|
| `pq: relation does not exist` | Migraciones no aplicadas | `migrate up` |
| `401 unauthorized` con token válido | Reloj desincronizado | Verificar NTP en el server |
| Latencia alta en `/notes` | Falta índice trigram | `CREATE EXTENSION pg_trgm;` + índice |
| `mmdc: Chrome not found` | Playwright no soporta la distro | Usar `google-chrome` del sistema con `--puppeteerConfigFile` |
| App Store: rechazado por Guideline 2.1 | Faltan capturas de uso real | Capturar flujo completo con TestFlight |
| Tests de integración lentos | Postgres no persistido | Usar testcontainers con `-reuse` |

## E.12 Glosario de comandos rápidos

| Comando | Qué hace |
|---|---|
| `go test ./...` | Tests recursivos. |
| `golangci-lint run` | Lint completo. |
| `sqlc generate` | Genera código Go desde SQL. |
| `swag init` | Genera Swagger desde comentarios. |
| `migrate up` | Aplica migraciones. |
| `fly deploy` | Despliega a Fly.io. |
| `bun dev` | Servidor de desarrollo web. |
| `eas build` | Build de la app móvil. |
| `bunx openapi-typescript ...` | Regenera tipos TS desde OpenAPI. |
| `mmdc -i X.mmd -o X.png` | Renderiza un diagrama Mermaid. |
| `python build_pdf.py` | Regenera el PDF del expediente. |