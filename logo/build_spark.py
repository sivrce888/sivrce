#!/usr/bin/env python3
"""Sivrce Spark — AI sub-brand mark, generated from one geometry source.

Design — "The Spark" (48-unit grid, brand lock v1.3):
- Two crescent blades, exact 180-degree rotational symmetry about (24,24)
  (echoes the Space Point's symmetry — one family, two marks)
- Blade A (top-left): brand gradient #8FB4FF -> #2E6BFF -> #7A5CFF
- Blade B (bottom-right): violet -> #FF4D6D -> orange tip #FF6A2D (the point)
- Usage: AI features only (AI search, assistant, recommendations) — never
  replaces the Space Point master identity. BRAND.md §2.1.
"""
import os

OUT = "assets"
os.makedirs(OUT, exist_ok=True)

# ---------- brand tokens (BRAND.md) ----------
BLUE = "#2E6BFF"; BLUE_LIGHT = "#8FB4FF"
VIOLET = "#7A5CFF"; ORANGE = "#FF6A2D"; ORANGE_DEEP = "#FF4D6D"
NAVY = "#050B26"; INK = "#0A1030"; WHITE = "#FFFFFF"

# ---------- geometry (48-unit grid) ----------
T = (24, 3.2)        # top star point
L = (3.2, 24)        # left star point
OC = (21.4, 21.4)    # concave outer-edge control (sparkle waist)
SEAM = (25.2, 25.2)  # inner seam control (through center)

BLADE_A = (f"M{T[0]} {T[1]} Q{OC[0]} {OC[1]} {L[0]} {L[1]} "
           f"Q{SEAM[0]} {SEAM[1]} {T[0]} {T[1]} Z")
rot = lambda p: (round(48 - p[0], 2), round(48 - p[1], 2))
R_B, B_B, SEAM_B = rot(T), rot(L), rot(SEAM)   # blade B = 180° rotation
BLADE_B = (f"M{R_B[0]} {R_B[1]} Q{rot(OC)[0]} {rot(OC)[1]} {B_B[0]} {B_B[1]} "
           f"Q{SEAM_B[0]} {SEAM_B[1]} {R_B[0]} {R_B[1]} Z")

GRAD_A = (f'<linearGradient id="sparkA" x1="{T[0]}" y1="{T[1]}" '
          f'x2="{L[0]}" y2="{L[1]}" gradientUnits="userSpaceOnUse">'
          f'<stop offset="0" stop-color="{BLUE_LIGHT}"/>'
          f'<stop offset="0.55" stop-color="{BLUE}"/>'
          f'<stop offset="1" stop-color="{VIOLET}"/></linearGradient>')
GRAD_B = (f'<linearGradient id="sparkB" x1="{R_B[0]}" y1="{R_B[1]}" '
          f'x2="{B_B[0]}" y2="{B_B[1]}" gradientUnits="userSpaceOnUse">'
          f'<stop offset="0" stop-color="{VIOLET}"/>'
          f'<stop offset="0.62" stop-color="{ORANGE_DEEP}"/>'
          f'<stop offset="1" stop-color="{ORANGE}"/></linearGradient>')

def spark_body(fill_a="url(#sparkA)", fill_b="url(#sparkB)", defs=True):
    d = f"<defs>{GRAD_A}{GRAD_B}</defs>" if defs else ""
    return (d + f'<path d="{BLADE_A}" fill="{fill_a}"/>'
                f'<path d="{BLADE_B}" fill="{fill_b}"/>')

def svg(body, vb="0 0 48 48"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'

def write(name, content):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(content)
    print("wrote", name)

# ---------- 1. master mark (bare, transparent) ----------
write("sivrce-spark.svg", svg(spark_body()))

# ---------- 2. navy tile (dark surfaces, app-icon style) ----------
TILE_RX = 14  # squircle corner radius, same as Space Point tile
navy = (f'<rect width="48" height="48" rx="{TILE_RX}" fill="{NAVY}"/>'
        f'<g transform="translate(6 6) scale(0.75)">{spark_body()}</g>')
write("sivrce-spark-navy.svg", svg(navy))

# ---------- 3. mono variants (single color, tiny sizes / emboss) ----------
write("sivrce-spark-mono-white.svg", svg(spark_body(WHITE, WHITE, defs=False)))
write("sivrce-spark-mono-ink.svg", svg(spark_body(INK, INK, defs=False)))
print("done")
