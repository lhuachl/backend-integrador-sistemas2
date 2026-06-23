#!/usr/bin/env python3
"""
build_pdf.py — Genera el expediente técnico PDF de FlowState
con estética Catppuccin Mocha.

Pipeline:
  1. Compila *.mmd (Mermaid) → PNG (vía mmdc).
  2. Convierte source/*.md → HTML (markdown-it-py).
  3. Ensambla HTML con plantilla Jinja2 + tema CSS.
  4. Genera PDF (Playwright/Chromium).
"""

from __future__ import annotations

import argparse
import http.server
import os
import shutil
import socketserver
import subprocess
import sys
import threading
from pathlib import Path
from typing import Iterable

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markdown_it import MarkdownIt
from mdit_py_plugins.footnote import footnote_plugin
from mdit_py_plugins.deflist import deflist_plugin
from mdit_py_plugins.attrs import attrs_plugin

ROOT = Path(__file__).resolve().parent
SOURCE_DIR = ROOT / "source"
DIAGRAMS_DIR = ROOT / "diagrams"
BUILD_DIR = ROOT / "build"
THEME_DIR = ROOT / "theme"
ASSETS_DIR = SOURCE_DIR / "assets"

PDF_OUT = BUILD_DIR / "flowstate-expediente.pdf"
HTML_OUT = BUILD_DIR / "full.html"

PROJECT_META = {
    "project": "FlowState",
    "tagline": "Sistema operativo personal y de equipos",
    "subject": "Proyecto de sistemas 2",
    "docente": "Misael David Condo",
    "integrante_1": "Alex Joshua Villegas Ibáñez",
    "integrante_2": "Rodrigo Zeballos Isita",
    "gestion": "Semestre 1 / 2026",
    "fecha": "23 de junio de 2026",
    "version": "v1.0",
}


# ---------- Mermaid --------------------------------------------------------

def compile_mermaid(skip: bool = False) -> list[Path]:
    """Renderiza todos los *.mmd a PNG en build/diagrams/."""
    out_dir = BUILD_DIR / "diagrams"
    out_dir.mkdir(parents=True, exist_ok=True)

    if skip:
        print("[mermaid] skip solicitado, usando PNGs en build/diagrams/")
        return sorted(out_dir.glob("*.png"))

    if not shutil.which("mmdc"):
        print(
            "[mermaid] mmdc no encontrado en PATH. "
            "Instalá @mermaid-js/mermaid-cli: npm i -g @mermaid-js/mermaid-cli",
            file=sys.stderr,
        )
        sys.exit(1)

    mmd_files = sorted(DIAGRAMS_DIR.glob("*.mmd"))
    rendered: list[Path] = []
    for src in mmd_files:
        dst = out_dir / f"{src.stem}.png"
        print(f"[mermaid] {src.name} -> {dst.name}")
        cfg = BUILD_DIR / f".{src.stem}.mermaid-config.json"
        cfg.write_text(
            '{"theme":"dark","themeVariables":'
            '{"background":"#1e1e2e","primaryColor":"#1e1e2e",'
            '"primaryTextColor":"#cdd6f4","primaryBorderColor":"#cba6f7",'
            '"lineColor":"#89b4fa","secondaryColor":"#313244",'
            '"tertiaryColor":"#181825","fontFamily":"JetBrains Mono, monospace",'
            '"fontSize":"13px"}}'
        )
        cmd = [
            "mmdc",
            "-i", str(src),
            "-o", str(dst),
            "-b", "#1e1e2e",
            "--configFile", str(cfg),
            "-w", "1400",
            "-H", "900",
            "-s", "2",
            "--puppeteerConfigFile", "/tmp/puppeteer-config.json",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(res.stdout, file=sys.stdout)
            print(res.stderr, file=sys.stderr)
            sys.exit(f"[mermaid] falló al renderizar {src.name}")
        cfg.unlink(missing_ok=True)
        rendered.append(dst)
    return rendered


# ---------- Markdown → HTML -----------------------------------------------

def build_markdown_renderer() -> MarkdownIt:
    md = (
        MarkdownIt("commonmark", {"html": True, "linkify": True, "typographer": True})
        .enable("table")
        .enable("strikethrough")
        .enable("heading-anchors", {"prefix": ""})
        .use(footnote_plugin)
        .use(deflist_plugin)
        .use(attrs_plugin)
    )
    return md


# ---------- Image path rewriting ------------------------------------------

def rewrite_mermaid_blocks(html: str, png_map: dict[str, str]) -> str:
    """Reemplaza <pre><code class="language-mermaid"> por <figure><img/>.

    Convención: la primera línea del bloque es `%% id: <nombre>` y mapea al
    archivo de diagrama `diagrams/<nombre>.mmd` (compilado a PNG).
    """
    import re
    pat = re.compile(r'<pre><code class="language-mermaid">([\s\S]*?)</code></pre>')

    def repl(m: re.Match) -> str:
        body = m.group(1)
        body = body.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
        body = body.strip()
        first_line = body.splitlines()[0].strip()
        diag_id = None
        if first_line.startswith("%% id:"):
            diag_id = first_line.split(":", 1)[1].strip()
        elif first_line.startswith("%% @diagram"):
            diag_id = first_line.split(":", 1)[1].strip()
        if not diag_id:
            diag_id = re.sub(r"[^a-zA-Z0-9]+", "-", first_line).strip("-").lower()[:40]
        png = png_map.get(diag_id)
        if png:
            rel = Path("diagrams") / Path(png).name
            return (
                f'<figure class="mermaid-figure">'
                f'<img src="{rel.as_posix()}" alt="diagrama {diag_id}"/>'
                f'<figcaption>Figura · {diag_id}</figcaption>'
                f'</figure>'
            )
        return (
            f'<figure class="mermaid-figure">'
            f'<pre style="color:var(--red);">'
            f'<!-- diagrama no compilado: {diag_id} -->\n'
            f'{m.group(0)}'
            f'</pre></figure>'
        )

    return pat.sub(repl, html)


def html_for_md(md: MarkdownIt, md_path: Path, png_map: dict[str, str]) -> str:
    raw = md_path.read_text(encoding="utf-8")
    html = md.render(raw)
    return rewrite_mermaid_blocks(html, png_map)


# ---------- TOC extraction -------------------------------------------------

def collect_outline(md: MarkdownIt, sources: Iterable[Path]) -> list[dict]:
    """Lista plana de headings (level, text, slug, file)."""
    import re
    outline: list[dict] = []
    for md_path in sources:
        raw = md_path.read_text(encoding="utf-8")
        for line in raw.splitlines():
            m = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
            if not m:
                continue
            level = len(m.group(1))
            text = m.group(2).strip()
            slug = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
            outline.append({"level": level, "text": text, "slug": slug, "file": md_path.stem})
    return outline


# ---------- HTML assembly --------------------------------------------------

def render_html(md: MarkdownIt, sources: list[Path], png_map: dict[str, str]) -> str:
    env = Environment(
        loader=FileSystemLoader(str(ROOT)),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    tpl = env.get_template("theme/template.html.j2")

    sections: list[dict] = []
    for md_path in sources:
        body_html = html_for_md(md, md_path, png_map)
        rel = md_path.relative_to(SOURCE_DIR)
        sections.append(
            {
                "stem": md_path.stem,
                "rel_path": rel.as_posix(),
                "html": body_html,
            }
        )

    return tpl.render(
        meta=PROJECT_META,
        sections=sections,
        css_main=(THEME_DIR / "base.css").read_text(encoding="utf-8"),
        css_print=(THEME_DIR / "print.css").read_text(encoding="utf-8"),
    )


# ---------- PDF generation -------------------------------------------------

def render_pdf(html_path: Path, pdf_path: Path) -> None:
    from playwright.sync_api import sync_playwright

    def _launch(p):
        # 1) Intentar el Chromium bundled de Playwright
        try:
            return p.chromium.launch()
        except Exception:
            pass
        # 2) Fallback: Chrome del sistema (común cuando Playwright no soporta la distro)
        for exe in (
            shutil.which("google-chrome"),
            shutil.which("google-chrome-stable"),
            shutil.which("chromium"),
            shutil.which("chromium-browser"),
        ):
            if exe:
                return p.chromium.launch(executable_path=exe, args=["--no-sandbox"])
        raise RuntimeError(
            "No se encontró Chromium ni Chrome en el sistema. "
            "Ejecutá: playwright install chromium  o  instala google-chrome."
        )

    with sync_playwright() as p:
        browser = _launch(p)
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(f"file://{html_path}")
        page.wait_for_load_state("networkidle")
        page.emulate_media(media="print")
        page.pdf(
            path=str(pdf_path),
            format="A4",
            print_background=True,
            margin={"top": "22mm", "bottom": "22mm", "left": "18mm", "right": "18mm"},
            display_header_footer=True,
            header_template="<div></div>",
            footer_template=(
                '<div style="width:100%;font-family:JetBrains Mono,monospace;'
                'font-size:7.5pt;color:#7f849c;text-align:center;'
                'border-top:1px solid #585b70;padding-top:4px;">'
                'FlowState · Expediente técnico · Semestre 1/2026 · '
                '<span class="pageNumber"></span> / <span class="totalPages"></span>'
                '</div>'
            ),
        )
        browser.close()


# ---------- Dev preview ----------------------------------------------------

def serve_dev(html_path: Path, port: int = 8000) -> None:
    os.chdir(html_path.parent)

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, fmt: str, *args: object) -> None:  # noqa: D401
            print(f"[dev] {self.address_string()} - {fmt % args}")

    httpd = socketserver.TCPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    print(f"[dev] Sirviendo en http://127.0.0.1:{port}/{html_path.name}")
    print("[dev] Ctrl-C para salir")
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        httpd.shutdown()


# ---------- Main -----------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-render-mermaid", action="store_true")
    ap.add_argument("--dev", action="store_true", help="sirve el HTML sin generar PDF")
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args()

    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    if not ASSETS_DIR.exists():
        ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    png_paths = compile_mermaid(skip=args.no_render_mermaid)
    png_map = {p.stem: str(p) for p in png_paths}

    md = build_markdown_renderer()
    sources = sorted(
        [
            p
            for p in SOURCE_DIR.rglob("*.md")
            if p.is_file() and not p.name.startswith("_")
        ],
        key=lambda p: p.name,
    )
    if not sources:
        print("[main] no hay .md en source/", file=sys.stderr)
        return 1

    html = render_html(md, sources, png_map)
    HTML_OUT.write_text(html, encoding="utf-8")
    print(f"[main] HTML combinado: {HTML_OUT}")

    if args.dev:
        serve_dev(HTML_OUT, port=args.port)
        return 0

    print(f"[main] Generando PDF...")
    render_pdf(HTML_OUT, PDF_OUT)
    print(f"[main] OK → {PDF_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())