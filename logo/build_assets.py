#!/usr/bin/env python3
"""Generate the complete Sivrce logo SVG system from one geometry source.

Design — "The Space Point" (48-unit grid):
- Blue squircle tile, r=14/48 (brand lock)
- White infinite-S: two tangent elliptical arcs (rx=9.2, ry=6.6), 240 deg each,
  perfect 180-degree rotational symmetry around (24,24), stroke 6.4, round caps
- Orange space point at bottom-right, d ~= stroke width (the home in the space)
"""
import json, math, os

OUT = "assets"
os.makedirs(OUT, exist_ok=True)

# ---------- brand tokens (BRAND.md / src/index.css) ----------
BLUE = "#2E6BFF"; BLUE_LIGHT = "#8FB4FF"; BLUE_DEEP = "#1A3FC0"
VIOLET = "#7A5CFF"; ORANGE = "#FF6A2D"; ORANGE_LIGHT = "#FFB25E"
ORANGE_DEEP = "#FF4D6D"; NAVY = "#050B26"; INK = "#0A1030"; CLOUD = "#F6F7FB"
WHITE = "#FFFFFF"

# ---------- mark geometry ----------
RX, RY = 9.2, 6.6          # ellipse radii of the two S bowls
STROKE = 6.4               # S stroke width
T1 = (32.649, 15.143)      # upper terminal, clock-angle 70 deg on upper ellipse
T2 = (15.351, 32.857)      # lower terminal, 180-deg rotation of T1 (symmetry)
J = (24.0, 24.0)           # tangent junction of the two bowls
DOT = (38.2, 38.2, 3.0)    # orange space point cx, cy, r
TILE_RX = 14               # squircle corner radius (r=14/48 brand lock)

S_PATH = (f"M{T1[0]} {T1[1]} "
          f"A{RX} {RY} 0 1 0 {J[0]} {J[1]} "
          f"A{RX} {RY} 0 1 1 {T2[0]} {T2[1]}")

def s_stroke(color=WHITE, w=STROKE):
    return (f'<path d="{S_PATH}" fill="none" stroke="{color}" '
            f'stroke-width="{w}" stroke-linecap="round"/>')

def dot(color=ORANGE, c=DOT):
    return f'<circle cx="{c[0]}" cy="{c[1]}" r="{c[2]}" fill="{color}"/>'

def svg(body, wpx=None, hpx=None, vb="0 0 48 48", extra=""):
    size = f' width="{wpx}" height="{hpx}"' if wpx else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{size}>{extra}'
            f'{body}</svg>')

def write(name, content):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(content)
    print("wrote", name)

# ---------- 1. primary mark ----------
mark = svg(f'<rect width="48" height="48" rx="{TILE_RX}" fill="{BLUE}"/>'
           + s_stroke() + dot())
write("sivrce-mark.svg", mark)

# ---------- 2. small-size optical variant (favicon, <=32px) ----------
S_PATH_SM = S_PATH  # same path, heavier stroke + larger point
small = svg(f'<rect width="48" height="48" rx="{TILE_RX}" fill="{BLUE}"/>'
            + s_stroke(WHITE, 7.0) + dot(ORANGE, (38.2, 38.2, 3.3)))
write("sivrce-mark-small.svg", small)

# ---------- 3. premium display variant (showcase / award contexts) ----------
grad = (f'<defs><linearGradient id="svtile" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{BLUE}"/>'
        f'<stop offset="0.55" stop-color="{BLUE}"/>'
        f'<stop offset="1" stop-color="{BLUE_DEEP}"/></linearGradient></defs>')
disp = svg(grad + f'<rect width="48" height="48" rx="{TILE_RX}" fill="url(#svtile)"/>'
           + s_stroke() + dot())
write("sivrce-mark-display.svg", disp)

# ---------- 4. mono variants (single color, S + point knocked out) ----------
def mono(color):
    mask = (f'<mask id="kvm"><rect width="48" height="48" fill="#fff"/>'
            + s_stroke("#000") + dot("#000") + '</mask>')
    return svg(mask + f'<rect width="48" height="48" rx="{TILE_RX}" '
                      f'fill="{color}" mask="url(#kvm)"/>')
write("sivrce-mark-mono-white.svg", mono(WHITE))
write("sivrce-mark-mono-ink.svg", mono(INK))

# ---------- wordmark ----------
wm = json.load(open("wordmark.json"))
UPMXH = wm["metrics"]["xHeight"]            # 1080 font units
XH = 25.0                                   # target x-height on the 48 grid
S = XH / UPMXH                              # scale font units -> grid units
letters = "".join(
    f'<path d="{g["path"]}" fill="{INK}"/>' if g["char"] != "."
    else f'<path d="{g["path"]}" fill="{ORANGE}"/>'
    for g in wm["glyphs"])
letters_w = "".join(
    f'<path d="{g["path"]}" fill="{WHITE}"/>' if g["char"] != "."
    else f'<path d="{g["path"]}" fill="{ORANGE}"/>'
    for g in wm["glyphs"])
WM_W = wm["totalWidthUnits"] * S            # wordmark width on grid
print(f"wordmark: scale={S:.6f} width={WM_W:.2f} x-height={XH}")

def wordmark_group(tx, ty, white=False):
    return (f'<g transform="translate({tx:.3f} {ty:.3f}) scale({S:.6f})">'
            f'{letters_w if white else letters}</g>')

# ---------- 5. wordmark alone ----------
wm_svg = svg(wordmark_group(0, XH), vb=f"0 0 {WM_W:.2f} {XH}")
write("sivrce-wordmark.svg", wm_svg)
wm_svg_w = svg(wordmark_group(0, XH, white=True), vb=f"0 0 {WM_W:.2f} {XH}")
write("sivrce-wordmark-white.svg", wm_svg_w)

# ---------- 6. horizontal lockup ----------
GAP_H = 15.0
TX = 48 + GAP_H
BASE = 24 + XH / 2                          # baseline: x-height band centered on 24
TOTW = TX + WM_W
tile = f'<rect width="48" height="48" rx="{TILE_RX}" fill="{BLUE}"/>'
horiz = svg(tile + s_stroke() + dot() + wordmark_group(TX, BASE),
            vb=f"0 0 {TOTW:.2f} 48")
write("sivrce-logo-horizontal.svg", horiz)
horiz_w = svg(tile + s_stroke() + dot() + wordmark_group(TX, BASE, white=True),
              vb=f"0 0 {TOTW:.2f} 48")
write("sivrce-logo-horizontal-white.svg", horiz_w)

# ---------- 7. stacked lockup ----------
TOTW_S = WM_W
MARK_X = (TOTW_S - 48) / 2
GAP_V = 14.0
BASE_S = 48 + GAP_V + XH
stacked = svg(f'<g transform="translate({MARK_X:.3f} 0)">'
              + tile + s_stroke() + dot() + '</g>'
              + wordmark_group(0, BASE_S),
              vb=f"0 0 {TOTW_S:.2f} {BASE_S:.2f}")
write("sivrce-logo-stacked.svg", stacked)
stacked_w = svg(f'<g transform="translate({MARK_X:.3f} 0)">'
                + tile + s_stroke() + dot() + '</g>'
                + wordmark_group(0, BASE_S, white=True),
                vb=f"0 0 {TOTW_S:.2f} {BASE_S:.2f}")
write("sivrce-logo-stacked-white.svg", stacked_w)

# ---------- 8. app icon (iOS full-bleed square; Apple applies its mask) ----------
app = svg(f'<rect width="48" height="48" fill="{BLUE}"/>'
          f'<g transform="translate(4.8 4.8) scale(0.8)">'
          + s_stroke() + dot() + '</g>')
write("sivrce-app-icon.svg", app)

# ---------- 9. Android adaptive icon (108 grid, 66 safe circle) ----------
adp = svg(f'<rect width="108" height="108" fill="{NAVY}"/>'
          f'<g transform="translate(30 30)">'
          f'<rect width="48" height="48" rx="{TILE_RX}" fill="{BLUE}"/>'
          + s_stroke() + dot() + '</g>', vb="0 0 108 108")
write("sivrce-app-icon-android.svg", adp)

# ---------- 10. favicon ----------
write("sivrce-favicon.svg", small)
print("done")
