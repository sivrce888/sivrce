#!/usr/bin/env python3
"""Sivrce Logo v5.0 — "The Spark Star, final cut".

Faithful vector rebuild of the owner-approved board (sivrce-spark-board.png):
a connected four-point star tiled by four crescent blades swirling around a
pinwheel void — the space inside the space (სივრცე). The brand gradient flows
sky-blue -> blue -> violet and lands on the orange south tip: the home inside
the space, rhyming with the wordmark's orange period.

Construction (48-unit grid, exact 90deg rotational symmetry about 24,24):
  - silhouette: needle tips at radius 20.8 (3.2 margin), concave waists
  - blades tile the star with zero gap: blade k's clockwise inner edge is
    blade k+1's counter-clockwise edge (shared curve; folds read via gradient)
  - pinwheel void at center: 4-point aperture, tips 2.9 / waist 1.55
  - three optical masters: display >32px, small <=32px, micro <=16px (solid)

One geometry source -> every asset. Colors 100% frozen BRAND.md tokens.
Wordmark = frozen Manrope 800 outlines (reused from v3, single source).
"""
import importlib.util
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets")
PNG = os.path.join(HERE, "png")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PNG, exist_ok=True)

# ---- reuse v3: tokens, wordmark, chrome pipeline (single source) -------------
spec = importlib.util.spec_from_file_location(
    "build_v3", os.path.join(HERE, "..", "v3", "build_v3.py"))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

BLUE_L = v3.BLUE_L; BLUE = v3.BLUE; VIOLET = v3.VIOLET
ORANGE = v3.ORANGE; ORANGE_DEEP = v3.ORANGE_DEEP
NAVY = v3.NAVY; INK = v3.INK; WHITE = v3.WHITE; CLOUD = v3.CLOUD
WM_VB_W = v3.WM_VB_W; WM_VB_H = v3.WM_VB_H

F = ".2f"

def fmt(x):
    return f"{x:.2f}"

# ---- geometry parameters ------------------------------------------------------
R_TIP = 20.8          # tip radius (3.2 margin)
W_OUT = 7.0           # silhouette waist radius at the diagonals
TIP_SPLAY = 14.0      # tip tangent splay, degrees (needle-sharp solid tips)
BASE_ANG = 54.0       # void-tip angular position, deg CW from blade axis
BASE_R = 2.9          # void-tip radius
VOID_R = 1.55         # void waist radius (aperture)
C_IN1 = (47.0, 5.1)   # CW inner-edge control 1 (angle deg, radius)
C_IN2 = (52.0, 3.7)   # CW inner-edge control 2

def P(ang_deg, r):
    """Polar (deg CW from up, radius) -> local cartesian (u right, v up)."""
    a = math.radians(ang_deg)
    return (r * math.sin(a), r * math.cos(a))

def bezier(p0, c1, c2, p1, n=8):
    pts = []
    for i in range(1, n + 1):
        t = i / n
        mt = 1 - t
        pts.append((
            mt**3 * p0[0] + 3 * mt**2 * t * c1[0] + 3 * mt * t**2 * c2[0] + t**3 * p1[0],
            mt**3 * p0[1] + 3 * mt**2 * t * c1[1] + 3 * mt * t**2 * c2[1] + t**3 * p1[1]))
    return pts

def quadrant(T, W, r_tip, w_out, splay, n=10):
    """Dense samples of one silhouette quadrant T -> W (splayed needle tip)."""
    th = math.radians(splay)
    d = (0.5 * r_tip - w_out / math.sqrt(2)) / 0.375
    # tip tangent: inward axis splayed by th toward the waist side
    ang_T = math.atan2(T[0], T[1])          # local polar angle of tip
    ang_W = math.atan2(W[0], W[1])
    sgn = 1.0 if ang_W > ang_T else -1.0
    t_T = (math.sin(ang_T + math.pi + sgn * th), math.cos(ang_T + math.pi + sgn * th))
    t_W = (math.sin(ang_W + math.pi - sgn * th), math.cos(ang_W + math.pi - sgn * th))
    C_T = (T[0] + t_T[0] * d, T[1] + t_T[1] * d)
    C_W = (W[0] + t_W[0] * d, W[1] + t_W[1] * d)
    return bezier(T, C_T, C_W, W, n=n)

def blade_outline(r_tip=R_TIP, w_out=W_OUT, splay=TIP_SPLAY,
                  base_ang=BASE_ANG, base_r=BASE_R, void_r=VOID_R):
    """Blade N closed outline in local coords (u right, v up), tip up.

    Tiling: blade k's CW inner edge == blade k+1's CCW inner edge (shared
    endpoints, mirrored shape) -> zero gap, zero overlap; fold reads via the
    per-blade gradients. Void: 4-point pinwheel aperture (tips base_r, waist
    void_r).
    """
    T = (0.0, r_tip)
    Wcw = P(45.0, w_out)
    Wccw = P(-45.0, w_out)
    B_cw = P(base_ang, base_r)
    B_ccw = P(base_ang - 90.0, base_r)

    pts = []
    # outer CCW side: Wccw -> T (reverse of quadrant T->Wccw)
    pts += list(reversed(quadrant(T, Wccw, r_tip, w_out, splay)))[:-1]
    # outer CW side: T -> Wcw
    pts += quadrant(T, Wcw, r_tip, w_out, splay)
    # CW inner edge: Wcw -> B_cw (spiral inward with CW drift)
    pts += bezier(Wcw, P(*C_IN1), P(*C_IN2), B_cw)
    # void edge: B_cw -> B_ccw, waist dips to void_r
    pts += bezier(B_cw, P(base_ang - 12.0, void_r),
                  P(base_ang - 78.0, void_r), B_ccw)
    # CCW inner edge: B_ccw -> Wccw (mirror of CW edge about the -45 diagonal)
    pts += bezier(B_ccw, P(-C_IN2[0], C_IN2[1]), P(-C_IN1[0], C_IN1[1]), Wccw)
    return pts

def star_outline(r_tip, w_out, splay):
    """Solid 4-point star silhouette, dense polyline, local coords."""
    pts = []
    for k in range(4):
        a = math.radians(90 * k)
        T = (r_tip * math.sin(a), r_tip * math.cos(a))
        W = P(45 + 90 * k, w_out)
        pts += quadrant(T, W, r_tip, w_out, splay)[:-1]
    return pts

def rot90(p, k):
    u, v = p
    if k == 0: return (24 + u, 24 - v)
    if k == 1: return (24 + v, 24 + u)
    if k == 2: return (24 - u, 24 + v)
    return (24 - v, 24 - u)

def _cr(pts):
    ext = [pts[0]] + list(pts) + [pts[-1]]
    segs = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = ext[i], ext[i + 1], ext[i + 2], ext[i + 3]
        segs.append(((p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6),
                     (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6),
                     p2))
    return segs

def path_from_points(local_pts, k=0, f=F):
    g = [rot90(p, k) for p in local_pts]
    d = f"M{g[0][0]:{f}} {g[0][1]:{f}}"
    for c1, c2, p in _cr(g):
        d += f"C{c1[0]:{f}} {c1[1]:{f}} {c2[0]:{f}} {c2[1]:{f}} {p[0]:{f}} {p[1]:{f}}"
    return d + "Z"

def blade_path(k, size_class="master"):
    if size_class == "small":
        return path_from_points(
            blade_outline(r_tip=21.6, w_out=8.2, base_r=3.5, void_r=2.0), k)
    return path_from_points(blade_outline(), k)

def micro_path():
    return path_from_points(star_outline(22.2, 9.6, 16.0), 0)

def gradients():
    return (
        f'<defs>'
        f'<linearGradient id="gN" x1="24" y1="3.2" x2="24" y2="24" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="{BLUE_L}"/><stop offset="1" stop-color="{BLUE}"/></linearGradient>'
        f'<linearGradient id="gE" x1="44.8" y1="24" x2="24" y2="24" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="{BLUE}"/><stop offset="1" stop-color="{VIOLET}"/></linearGradient>'
        f'<linearGradient id="gW" x1="3.2" y1="24" x2="24" y2="24" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="{BLUE}"/><stop offset="1" stop-color="{VIOLET}"/></linearGradient>'
        f'<linearGradient id="gS" x1="24" y1="44.8" x2="24" y2="24" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="{ORANGE}"/><stop offset="0.42" stop-color="{ORANGE_DEEP}"/>'
        f'<stop offset="1" stop-color="{VIOLET}"/></linearGradient>'
        f'</defs>')

def mark_gradient(size_class="master"):
    if size_class == "micro":
        # solid star, brand flow gradient top->bottom (locked stops)
        return (f'<defs><linearGradient id="gM" x1="24" y1="1.8" x2="24" y2="46.2" '
                f'gradientUnits="userSpaceOnUse">'
                f'<stop offset="0" stop-color="{BLUE_L}"/>'
                f'<stop offset=".34" stop-color="{BLUE}"/>'
                f'<stop offset=".58" stop-color="{VIOLET}"/>'
                f'<stop offset=".80" stop-color="{ORANGE_DEEP}"/>'
                f'<stop offset="1" stop-color="{ORANGE}"/></linearGradient></defs>'
                f'<path d="{micro_path()}" fill="url(#gM)"/>')
    return gradients() + "".join(
        f'<path d="{blade_path(k, size_class)}" fill="url(#g{"NESW"[k]})"/>'
        for k in range(4))

def mark_mono(color, size_class="master"):
    if size_class == "micro":
        return f'<path d="{micro_path()}" fill="{color}"/>'
    return "".join(f'<path d="{blade_path(k, size_class)}" fill="{color}"/>'
                   for k in range(4))

def svg(body, w=48, h=48):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
            f'{body}</svg>')

def write(name, content, where=OUT):
    with open(os.path.join(where, name), "w") as f:
        f.write(content)
    print("wrote", name)

def main():
    write("sivrce-v5-mark.svg", svg(mark_gradient()))
    write("sivrce-v5-mark-small.svg", svg(mark_gradient("small")))
    write("sivrce-v5-mark-micro.svg", svg(mark_gradient("micro")))
    write("sivrce-v5-mark-mono-ink.svg", svg(mark_mono(INK)))
    write("sivrce-v5-mark-mono-white.svg", svg(mark_mono(WHITE)))
    write("sivrce-v5-mark-mono-ink-small.svg", svg(mark_mono(INK, "small")))
    write("sivrce-v5-mark-mono-white-small.svg", svg(mark_mono(WHITE, "small")))
    if not os.path.exists(v3.CHROME):
        sys.exit("Chrome not found")
    for n in [256, 512]:
        v3.render_svg(f"{OUT}/sivrce-v5-mark.svg", n, n,
                      f"{PNG}/sivrce-v5-mark-{n}.png")
    v3.render_svg(f"{OUT}/sivrce-v5-mark-small.svg", 32, 32,
                  f"{PNG}/sivrce-v5-mark-32.png")
    v3.render_svg(f"{OUT}/sivrce-v5-mark-micro.svg", 16, 16,
                  f"{PNG}/sivrce-v5-mark-16.png")

if __name__ == "__main__":
    main()
