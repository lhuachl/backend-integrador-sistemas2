# Expediente técnico — FlowState

Documento profesional (~100 páginas) que recorre el proyecto desde la idea
hasta la aceptación final, en estética Catppuccin Mocha.

## Regenerar el PDF

Requisitos:

- Python 3.10+
- Node 18+ con `@mermaid-js/mermaid-cli` global:
  `npm i -g @mermaid-js/mermaid-cli`
- Chromium para Playwright: `playwright install chromium`

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python build_pdf.py
```

Salida: `build/flowstate-expediente.pdf`.

## Modo desarrollo

`python build_pdf.py --dev` levanta el HTML en `http://localhost:8000` para
previsualizar sin generar PDF.

## Estructura

- `source/` — Markdown del documento (un archivo por fase + apéndices).
- `diagrams/` — Fuentes Mermaid (`*.mmd`), compiladas a PNG por el script.
- `theme/` — CSS Catppuccin Mocha (base + print).
- `build/` — Artefactos intermedios y PDF final.