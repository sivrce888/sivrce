#!/usr/bin/env python3
"""Sivrce Logo v4.0 — three directions, one winner.

A "Aurora Spark"  — dimensional 4-point sparkle, star void, liquid-glass
                    sheen in pure vector (flat masters for small sizes).
B "Space Frame"   — corner brackets framing a spark: window / plan / focus.
C "Star Point"    — asymmetric sparkle, elongated south tip = the map pin.

All geometry on the 48-grid, colors 100% frozen BRAND.md tokens, wordmark
= frozen Manrope 800 outlines reused from v3 (import, no duplication).
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

# ---- generic 4-point sparkle --------------------------------------------------
def star_path(cx=24, cy=24, rn=20.8, re=20.8, rs=20.8, rw=20.8,
              w_ne=6.4, w_es=6.4, w_sw=6.4, w_wn=6.4):
    """Closed 4-point sparkle. Cubic segments with axis-aligned cusp tangents
    at every tip (perfectly clean needles); each concave side's midpoint lands
    exactly at the given waist radius on the 45° diagonals.
    waist = (±(0.5*r_tip - 0.375*d)) => d = (0.5*r - w/sqrt(2)) / 0.375."""
    N = (cx, cy - rn); E = (cx + re, cy); S = (cx, cy + rs); W = (cx - rw, cy)
    tips = [N, E, S, W]
    radii = [rn, re, rs, rw]
    waists = [w_ne, w_es, w_sw, w_wn]
    d = f"M{fmt(N[0])} {fmt(N[1])}"
    for i in range(4):
        P0 = tips[i]; P1 = tips[(i + 1) % 4]
        r0 = radii[i]; r1 = radii[(i + 1) % 4]
        w = waists[i]
        d0 = (0.5 * r0 - w / math.sqrt(2)) / 0.375
        d1 = (0.5 * r1 - w / math.sqrt(2)) / 0.375
        # control 1 slides from tip0 toward center along tip0's axis,
        # control 2 from tip1 toward center along tip1's axis
        ax0 = (P0[0] - cx, P0[1] - cy)
        ax1 = (P1[0] - cx, P1[1] - cy)
        u0 = (ax0[0] / r0, ax0[1] / r0)
        u1 = (ax1[0] / r1, ax1[1] / r1)
        C1 = (P0[0] - u0[0] * d0, P0[1] - u0[1] * d0)
        C2 = (P1[0] - u1[0] * d1, P1[1] - u1[1] * d1)
        d += (f"C{fmt(C1[0])} {fmt(C1[1])} {fmt(C2[0])} {fmt(C2[1])} "
              f"{fmt(P1[0])} {fmt(P1[1])}")
    return d + "Z"

# vertical brand-flow gradient, locked stops only
def flow_grad(gid, y_top, y_bot, orange_tip=True):
    stops = [(0.0, BLUE_L), (0.30, BLUE), (0.60, VIOLET)]
    if orange_tip:
        stops += [(0.80, ORANGE_DEEP), (1.0, ORANGE)]
    else:
        stops += [(1.0, VIOLET)]
    s = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return (f'<linearGradient id="{gid}" x1="24" y1="{fmt(y_top)}" x2="24" '
            f'y2="{fmt(y_bot)}" gradientUnits="userSpaceOnUse">{s}'
            f'</linearGradient>')

def svg(body, w=48, h=48):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
            f'{body}</svg>')

def write(name, content, where=OUT):
    with open(os.path.join(where, name), "w") as f:
        f.write(content)
    print("wrote", name)

# ===============================================================================
# OPTION A — AURORA SPARK
# ===============================================================================
A_TIP = 20.8
A_WAIST = 6.4

def a_silhouette(tip=A_TIP, waist=A_WAIST):
    return star_path(rn=tip, re=tip, rs=tip, rw=tip,
                     w_ne=waist, w_es=waist, w_sw=waist, w_wn=waist)

def a_void(vtip=4.6, vwaist=1.9):
    return star_path(rn=vtip, re=vtip, rs=vtip, rw=vtip,
                     w_ne=vwaist, w_es=vwaist, w_sw=vwaist, w_wn=vwaist)

def a_defs(tip=A_TIP, dimensional=True, uid=""):
    d = "<defs>" + flow_grad(f"gA{uid}", 24 - A_TIP, 24 + A_TIP)
    if dimensional:
        sil = a_silhouette()
        d += (f'<clipPath id="clipA{uid}">'
              f'<path d="{sil}{a_void()}" clip-rule="evenodd"/></clipPath>')
        # sheen: top-left light, brand 120° feel
        d += (f'<linearGradient id="sheen{uid}" x1="14" y1="4" x2="34" '
              f'y2="40" gradientUnits="userSpaceOnUse">'
              f'<stop offset="0" stop-color="#fff" stop-opacity=".55"/>'
              f'<stop offset=".38" stop-color="#fff" stop-opacity=".16"/>'
              f'<stop offset=".58" stop-color="#fff" stop-opacity="0"/>'
              f'</linearGradient>')
        # shade: bottom-right depth
        d += (f'<linearGradient id="shade{uid}" x1="36" y1="40" x2="20" '
              f'y2="14" gradientUnits="userSpaceOnUse">'
              f'<stop offset="0" stop-color="{NAVY}" stop-opacity=".30"/>'
              f'<stop offset=".5" stop-color="{NAVY}" stop-opacity="0"/>'
              f'</linearGradient>')
    return d + "</defs>"

def a_mark(dimensional=True, size_class="master", mono=None, uid=""):
    if size_class == "micro":
        tip, waist, vtip, vw = 22.2, 9.6, 0, 0      # solid fat sparkle @16px
    elif size_class == "small":
        tip, waist, vtip, vw = 21.4, 8.0, 3.6, 1.5
    else:
        tip, waist, vtip, vw = A_TIP, A_WAIST, 4.6, 1.9
    sil = star_path(rn=tip, re=tip, rs=tip, rw=tip,
                    w_ne=waist, w_es=waist, w_sw=waist, w_wn=waist)
    void = "" if vtip == 0 else star_path(
        rn=vtip, re=vtip, rs=vtip, rw=vtip,
        w_ne=vw, w_es=vw, w_sw=vw, w_wn=vw)
    if mono:
        return f'<path d="{sil}{void}" fill="{mono}" fill-rule="evenodd"/>'
    body = a_defs(dimensional=dimensional and size_class == "master", uid=uid)
    body += (f'<path d="{sil}{void}" fill="url(#gA{uid})" fill-rule="evenodd"/>')
    if dimensional and size_class == "master":
        body += (f'<g clip-path="url(#clipA{uid})">'
                 f'<rect width="48" height="48" fill="url(#sheen{uid})"/>'
                 f'<rect width="48" height="48" fill="url(#shade{uid})"/>'
                 f'<path d="{sil}" fill="none" stroke="#fff" '
                 f'stroke-opacity=".45" stroke-width=".55"/></g>')
        # blade separation channels (45° necks), display-size detail
        ch = ""
        for k in range(4):
            a = math.radians(45 + 90 * k)
            x1 = 24 + 1.6 * math.cos(a); y1 = 24 + 1.6 * math.sin(a)
            x2 = 24 + 6.6 * math.cos(a); y2 = 24 + 6.6 * math.sin(a)
            ch += (f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" x2="{fmt(x2)}" '
                   f'y2="{fmt(y2)}" stroke="{NAVY}" stroke-opacity=".16" '
                   f'stroke-width=".5" stroke-linecap="round"/>')
        body += f'<g clip-path="url(#clipA{uid})">{ch}</g>'
    return body

# ===============================================================================
# OPTION B — SPACE FRAME
# ===============================================================================
def b_brackets(color, arm=7.0, corner=14.5, width=2.6):
    for (x, y, sx, sy) in [(24 - c, 24 - c, -1, -1), (24 + c, 24 - c, 1, -1),
                           (24 + c, 24 + c, 1, 1), (24 - c, 24 + c, -1, 1)]:
        d += (f'M{fmt(x + sx * arm)} {fmt(y)}L{fmt(x)} {fmt(y)}'
              f'L{fmt(x)} {fmt(y + sy * arm)}')
    return (f'<path d="{d}" fill="none" stroke="{color}" '
            f'stroke-width="{width}" stroke-linecap="round" '
            f'stroke-linejoin="round"/>')

def b_star(tip=11.5, waist=4.6, uid=""):
    return star_path(rn=tip, re=tip, rs=tip, rw=tip,
                     w_ne=waist, w_es=waist, w_sw=waist, w_wn=waist)

def b_mark(size_class="master", mono=None, uid="", on_dark=False):
    # small/micro: brackets retire, star carries the identity (responsive)
    if size_class == "micro":
        tip, waist = 22.2, 9.6
    elif size_class == "small":
        tip, waist = 20.6, 7.6
    else:
        tip, waist = 11.5, 4.6
    star = star_path(rn=tip, re=tip, rs=tip, rw=tip,
                     w_ne=waist, w_es=waist, w_sw=waist, w_wn=waist)
    if mono:
        frame = "" if size_class != "master" else b_brackets(mono)
        return frame + f'<path d="{star}" fill="{mono}"/>'
    body = "<defs>" + flow_grad(f"gB{uid}", 24 - tip, 24 + tip) + "</defs>"
    if size_class == "master":
        body += b_brackets(WHITE if on_dark else INK)
    body += f'<path d="{star}" fill="url(#gB{uid})"/>'
    return body

# ===============================================================================
# OPTION C — STAR POINT
# ===============================================================================
def c_mark(size_class="master", mono=None, uid=""):
    if size_class == "micro":
        args = dict(rn=17.0, re=17.0, rs=23.0, rw=17.0,
                    w_ne=8.6, w_es=7.4, w_sw=7.4, w_wn=8.6)
    elif size_class == "small":
        args = dict(rn=15.6, re=15.6, rs=22.4, rw=15.6,
                    w_ne=7.4, w_es=6.2, w_sw=6.2, w_wn=7.4)
    else:
        args = dict(rn=14.8, re=14.8, rs=21.6, rw=14.8,
                    w_ne=6.4, w_es=5.2, w_sw=5.2, w_wn=6.4)
    sil = star_path(**args)
    if mono:
        return f'<path d="{sil}" fill="{mono}"/>'
    body = "<defs>" + flow_grad(f"gC{uid}", 24 - args["rn"], 24 + args["rs"]) + "</defs>"
    body += f'<path d="{sil}" fill="url(#gC{uid})"/>'
    return body

# ===============================================================================
# shared builders
# ===============================================================================
MARKS = {
    "a": ("aurora", a_mark),
    "b": ("frame", b_mark),
    "c": ("point", c_mark),
}

def mark_svg(key, size_class="master", mono=None, dimensional=True,
             on_dark=False):
    _, fn = MARKS[key]
    if key == "a":
        return svg(fn(dimensional=dimensional, size_class=size_class,
                      mono=mono, uid=size_class + (mono or "")))
    if key == "b":
        return svg(fn(size_class=size_class, mono=mono,
                      uid=size_class + (mono or ""), on_dark=on_dark))
    return svg(fn(size_class=size_class, mono=mono,
                  uid=size_class + (mono or "")))

def build_masters():
    for key in MARKS:
        tag = MARKS[key][0]
        write(f"sivrce-v4{key}-mark.svg",
              mark_svg(key, "master"))
        write(f"sivrce-v4{key}-mark-small.svg",
              mark_svg(key, "small", dimensional=False))
        write(f"sivrce-v4{key}-mark-micro.svg",
              mark_svg(key, "micro", dimensional=False))
        write(f"sivrce-v4{key}-mark-mono-ink.svg",
              mark_svg(key, "master", mono=INK))
        write(f"sivrce-v4{key}-mark-mono-white.svg",
              mark_svg(key, "master", mono=WHITE, on_dark=True))
        write(f"sivrce-v4{key}-mark-mono-ink-small.svg",
              mark_svg(key, "small", mono=INK))
        write(f"sivrce-v4{key}-mark-mono-white-small.svg",
              mark_svg(key, "small", mono=WHITE))

        # horizontal lockup — gap 15/48, frozen wordmark
        def horizontal(letter, on_dark=False):
            w = 48 + 15 + WM_VB_W
            body = mark_svg(key, "master", on_dark=on_dark)[len(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'):-6]
            body += v3.wordmark_group(48 + 15, (48 + WM_VB_H) / 2, letter)
            return svg(body, w=f"{w:.2f}")
        write(f"sivrce-v4{key}-horizontal.svg", horizontal(INK))
        write(f"sivrce-v4{key}-horizontal-white.svg",
              horizontal(WHITE, on_dark=True))

        # app icon — mark on navy tile
        inner = mark_svg(key, "master", on_dark=True)[len(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'):-6]
        tile = (f'<rect width="48" height="48" fill="{NAVY}"/>'
                f'<g transform="translate(9.6 9.6) scale(0.6)">{inner}</g>')
        write(f"sivrce-v4{key}-app-icon.svg", svg(tile))

def build_pngs():
    for key in MARKS:
        tag = MARKS[key][0]
        for n in [16, 32, 64, 128, 256, 512]:
            sc = "micro" if n <= 16 else ("small" if n <= 32 else "master")
            suf = "" if sc == "master" else f"-{sc}"
            v3.render_svg(f"{OUT}/sivrce-v4{key}-mark{suf}.svg", n, n,
                          f"{PNG}/sivrce-v4{key}-mark-{n}.png")
        v3.render_svg(f"{OUT}/sivrce-v4{key}-mark-mono-ink.svg", 64, 64,
                      f"{PNG}/sivrce-v4{key}-mark-mono-ink-64.png")
        v3.render_svg(f"{OUT}/sivrce-v4{key}-mark-mono-white.svg", 64, 64,
                      f"{PNG}/sivrce-v4{key}-mark-mono-white-64.png")
        v3.render_svg(f"{OUT}/sivrce-v4{key}-horizontal.svg", 811, 192,
                      f"{PNG}/sivrce-v4{key}-horizontal.png")
        v3.render_svg(f"{OUT}/sivrce-v4{key}-app-icon.svg", 512, 512,
                      f"{PNG}/sivrce-v4{key}-app-icon-512.png",
                      transparent=False)

if __name__ == "__main__":
    if not os.path.exists(v3.CHROME):
        sys.exit("Chrome not found")
    build_masters()
    build_pngs()
