#!/usr/bin/env python3
"""Sivrce v2.0 — "The Space Point, freed". One geometry source -> all assets.

v2 design decision: remove the tile. The mark must stand alone like Apple's —
no container. S path, point, symmetry: inherited 1:1 from the frozen v1
geometry contract (logo/README.md). Nothing invented, nothing recolored.
"""
import os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets")
PNG = os.path.join(HERE, "png")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PNG, exist_ok=True)

# frozen brand tokens (BRAND.md)
BLUE = "#2E6BFF"; ORANGE = "#FF6A2D"; INK = "#0A1030"; NAVY = "#050B26"; WHITE = "#FFFFFF"

# frozen v1 geometry (48-unit grid)
S_PATH = "M32.649 15.143 A9.2 6.6 0 1 0 24 24 A9.2 6.6 0 1 1 15.351 32.857"
PX, PY = 38.2, 38.2  # the point

def mark(color, small=False):
    sw = 7.0 if small else 6.4
    r = 3.3 if small else 3.0
    return (f'<path d="{S_PATH}" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round"/>'
            f'<circle cx="{PX}" cy="{PY}" r="{r}" fill="{ORANGE}"/>')

def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">{body}</svg>'

def write(name, content, where=OUT):
    with open(os.path.join(where, name), "w") as f:
        f.write(content)
    print("wrote", name)

# masters
write("sivrce-v2-mark-ink.svg", svg(mark(INK)))          # master, light surfaces
write("sivrce-v2-mark-blue.svg", svg(mark(BLUE)))        # brand-color moments
write("sivrce-v2-mark-white.svg", svg(mark(WHITE)))      # dark surfaces
write("sivrce-v2-mark-ink-small.svg", svg(mark(INK, small=True)))   # <32px
write("sivrce-v2-mark-white-small.svg", svg(mark(WHITE, small=True)))

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SIZES = [16, 32, 64, 128, 256, 512, 1024]

def render(src, n, out, w=None, h=None, page=False):
    if page:
        html = src  # full html document path
    else:
        html_path = tempfile.NamedTemporaryFile(
            "w", suffix=".html", delete=False, dir=HERE,
            prefix=".render-").name
        with open(html_path, "w") as f:
            f.write(f'<!DOCTYPE html><html><body style="margin:0">'
                    f'<img src="{os.path.abspath(src)}" width="{n}" height="{n}" '
                    f'style="display:block"></body></html>')
        html = html_path
    try:
        subprocess.run([
            CHROME, "--headless", "--disable-gpu", "--force-device-scale-factor=2",
            f"--screenshot={out}", f"--window-size={w or n},{h or n}",
            "--default-background-color=00000000",
            "--hide-scrollbars", f"file://{os.path.abspath(html)}",
        ], check=True, capture_output=True)
        print("rendered", os.path.basename(out))
    finally:
        if not page:
            os.unlink(html)

def main():
    if not os.path.exists(CHROME):
        sys.exit("Chrome not found")
    for n in SIZES:
        small = n <= 32
        ink = f"{OUT}/sivrce-v2-mark-ink{'-small' if small else ''}.svg"
        white = f"{OUT}/sivrce-v2-mark-white{'-small' if small else ''}.svg"
        render(ink, n, f"{PNG}/sivrce-v2-mark-ink-{n}.png")
        render(white, n, f"{PNG}/sivrce-v2-mark-white-{n}.png")
        if n >= 64:
            render(f"{OUT}/sivrce-v2-mark-blue.svg", n,
                   f"{PNG}/sivrce-v2-mark-blue-{n}.png")

if __name__ == "__main__":
    main()
