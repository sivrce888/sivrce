#!/usr/bin/env python3
"""Sivrce Logo v3.0 — "The Spark Star". One geometry source -> every asset.

The reference concept (owner-supplied render) rebuilt as exact vector
geometry: a four-point spark star, blades separated by precision light
channels, center negative space = a second tiny spark (the space inside
the space — სივრცე). Colors 100% from the frozen BRAND.md gradient stops:
#8FB4FF / #2E6BFF / #7A5CFF flow down into the orange tip #FF4D6D / #FF6A2D
— the Space Point echo, rhyming with the wordmark's orange period.

Geometry: 48-unit grid, 4-fold blade symmetry (90° rotations about 24,24),
subtle pinwheel swirl inherited from the v1.3 Spark crescent DNA.
Nothing recolored, nothing invented. Wordmark = frozen Manrope 800
outlines (same paths as app/src/components/Logo.tsx).
"""
import os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets")
PNG = os.path.join(HERE, "png")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PNG, exist_ok=True)

# ---- frozen brand tokens (BRAND.md) -----------------------------------------
BLUE_L = "#8FB4FF"; BLUE = "#2E6BFF"; VIOLET = "#7A5CFF"
ORANGE = "#FF6A2D"; ORANGE_DEEP = "#FF4D6D"
NAVY = "#050B26"; INK = "#0A1030"; WHITE = "#FFFFFF"; CLOUD = "#F6F7FB"

# ---- geometry parameters (48-unit grid) --------------------------------------
# Blade = crescent swoosh defined by a spine curve + width profile:
#   t in [0,1], base -> tip. Spine sways clockwise (pinwheel swirl, v1.3 DNA).
#   Width peaks ~40% from the tip; both ends needle-sharp. Sampled densely,
#   smoothed through Catmull-Rom -> cubic Beziers. 4-fold symmetry (90° CW).
TIP_V = 20.8          # tip radius (3.2 margin)
BASE_V = 1.9          # base radius (center void size)
W_MAX = 5.7           # max blade width
SWAY = 2.0            # spine mid-bulge toward clockwise side
U_TIP = 1.4           # tip hook offset (clockwise)
U_BASE = -0.5         # base lean (counter-clockwise)
SPLIT = 0.62          # share of width on the clockwise side

def _profile(t):
    """Asymmetric width profile: 0 at both ends, peak ~41% from the tip."""
    a, b = 1.6, 1.1
    t0 = a / (a + b)
    return (t / t0) ** a * ((1 - t) / (1 - t0)) ** b

def _spine(t, sway=SWAY, u_tip=U_TIP, u_base=U_BASE):
    import math
    return u_base + (u_tip - u_base) * t + sway * math.sin(math.pi * t)

def blade_samples(w_max=W_MAX, split=SPLIT, sway=SWAY, base_v=BASE_V,
                  tip_v=TIP_V, n=9):
    """Sample right (clockwise) edge tip->base and left edge base->tip."""
    right, left = [], []
    for i in range(n):
        t = i / (n - 1)              # 0 base .. 1 tip
        v = base_v + (tip_v - base_v) * t
        s = _spine(t, sway)
        w = w_max * _profile(t)
        right.append((s + w * split, v))
        left.append((s - w * (1 - split), v))
    right.reverse()                  # tip -> base
    return right, left               # then left base -> tip

def _cr_to_bezier(pts):
    """Uniform Catmull-Rom through pts -> list of cubic Bezier segments."""
    segs = []
    ext = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = ext[i], ext[i + 1], ext[i + 2], ext[i + 3]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        segs.append((c1, c2, p2))
    return segs

def rot(p, k):
    """Local blade coords -> global 48-grid. k: 0=N, 1=E, 2=S, 3=W (90° CW)."""
    u, v = p
    if k == 0: return (24 + u, 24 - v)
    if k == 1: return (24 + v, 24 + u)
    if k == 2: return (24 - u, 24 + v)
    return (24 - v, 24 - u)

def blade_path(k, size_class="master", f=".2f"):
    """Closed crescent blade path in global coords (no transform attr —
    gradients stay in one global user space). Three optical size masters."""
    if size_class == "micro":
        # <=16px: chunkiest blades, nearly straight, big void, tips extended
        right, left = blade_samples(w_max=W_MAX * 1.45, sway=SWAY * 0.55,
                                    base_v=3.2, tip_v=22.4)
    elif size_class == "small":
        # <=32px: fuller blades, calmer swirl, bigger void — favicon-clean
        right, left = blade_samples(w_max=W_MAX * 1.28, sway=SWAY * 0.8,
                                    base_v=2.7, tip_v=21.6)
    else:
        right, left = blade_samples()
    outline = [rot(p, k) for p in right + left]
    d = f"M{outline[0][0]:{f}} {outline[0][1]:{f}}"
    for c1, c2, p in _cr_to_bezier(outline):
        d += (f"C{c1[0]:{f}} {c1[1]:{f}} {c2[0]:{f}} {c2[1]:{f}} "
              f"{p[0]:{f}} {p[1]:{f}}")
    return d + "Z"

def gradients():
    """Per-blade userSpaceOnUse gradients along each blade axis, global coords.
    Flow: light blue at the top tip -> brand blue -> violet at the sides ->
    orange at the bottom tip (the space point). Locked stops only."""
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
    return gradients() + "".join(
        f'<path d="{blade_path(k, size_class)}" fill="url(#g{"NESW"[k]})"/>'
        for k in range(4))

def mark_mono(color, size_class="master"):
    return "".join(f'<path d="{blade_path(k, size_class)}" fill="{color}"/>'
                   for k in range(4))

def svg(body, w=48, h=48):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
            f'{body}</svg>')

def write(name, content, where=OUT):
    with open(os.path.join(where, name), "w") as f:
        f.write(content)
    print("wrote", name)

# ---- frozen Manrope 800 wordmark paths (identical to Logo.tsx / wordmark.json)
WORDMARK_PATHS = [
    ("M562.0 30Q358.0 30 232.5 -62.5Q107.0 -155 80.0 -324L358.0 -366Q375.0 -290 433.5 -247.0Q492.0 -204 582.0 -204Q656.0 -204 696.0 -232.5Q736.0 -261 736.0 -312Q736.0 -344 720.0 -363.5Q704.0 -383 648.5 -402.0Q593.0 -421 476.0 -452Q344.0 -486 265.0 -528.0Q186.0 -570 151.0 -628.5Q116.0 -687 116.0 -770Q116.0 -874 169.0 -950.5Q222.0 -1027 318.5 -1068.5Q415.0 -1110 546.0 -1110Q673.0 -1110 771.0 -1071.0Q869.0 -1032 929.5 -960.0Q990.0 -888 1004.0 -790L726.0 -740Q719.0 -800 674.0 -835.0Q629.0 -870 552.0 -876Q477.0 -881 431.5 -856.0Q386.0 -831 386.0 -784Q386.0 -756 405.5 -737.0Q425.0 -718 486.5 -698.0Q548.0 -678 674.0 -646Q797.0 -614 871.5 -571.5Q946.0 -529 980.0 -469.5Q1014.0 -410 1014.0 -326Q1014.0 -160 894.0 -65.0Q774.0 30 562.0 30Z", "letter"),
    ("M1164.0 -1230V-1470H1436.0V-1230ZM1164.0 0V-1080H1436.0V0Z", "letter"),
    ("M1938.0 0 1546.0 -1080H1818.0L2074.0 -332L2330.0 -1080H2602.0L2210.0 0Z", "letter"),
    ("M2692.0 0V-1080H2932.0V-816L2906.0 -850Q2927.0 -906 2962.0 -952.0Q2997.0 -998 3048.0 -1028Q3087.0 -1052 3133.0 -1065.5Q3179.0 -1079 3228.0 -1082.5Q3277.0 -1086 3326.0 -1080V-826Q3281.0 -840 3221.5 -835.5Q3162.0 -831 3114.0 -808Q3066.0 -786 3033.0 -749.5Q3000.0 -713 2983.0 -663.5Q2966.0 -614 2966.0 -552V0Z", "letter"),
    ("M3882.0 30Q3714.0 30 3594.0 -45.0Q3474.0 -120 3410.0 -249.0Q3346.0 -378 3346.0 -540Q3346.0 -704 3412.5 -833.0Q3479.0 -962 3600.0 -1036.0Q3721.0 -1110 3886.0 -1110Q4077.0 -1110 4206.5 -1013.5Q4336.0 -917 4372.0 -750L4100.0 -678Q4076.0 -762 4016.5 -809.0Q3957.0 -856 3882.0 -856Q3796.0 -856 3741.0 -814.5Q3686.0 -773 3660.0 -701.5Q3634.0 -630 3634.0 -540Q3634.0 -399 3696.5 -311.5Q3759.0 -224 3882.0 -224Q3974.0 -224 4022.0 -266.0Q4070.0 -308 4094.0 -386L4372.0 -328Q4326.0 -156 4198.0 -63.0Q4070.0 30 3882.0 30Z", "letter"),
    ("M4954.0 30Q4788.0 30 4661.5 -41.5Q4535.0 -113 4463.5 -238.5Q4392.0 -364 4392.0 -526Q4392.0 -703 4462.0 -834.0Q4532.0 -965 4655.0 -1037.5Q4778.0 -1110 4938.0 -1110Q5108.0 -1110 5227.0 -1030.0Q5346.0 -950 5403.0 -805.0Q5460.0 -660 5443.0 -464H5174.0V-564Q5174.0 -729 5121.5 -801.5Q5069.0 -874 4950.0 -874Q4811.0 -874 4745.5 -789.5Q4680.0 -705 4680.0 -540Q4680.0 -389 4745.5 -306.5Q4811.0 -224 4938.0 -224Q5018.0 -224 5075.0 -259.0Q5132.0 -294 5162.0 -360L5434.0 -282Q5373.0 -134 5241.5 -52.0Q5110.0 30 4954.0 30ZM4596.0 -464V-666H5312.0V-464Z", "letter"),
    ("M5582.0 0V-272H5854.0V0Z", "period"),
]
WM_VB_W = 139.77
WM_VB_H = 25.0
WM_SCALE = 0.023148

def wordmark_group(x, y_baseline, letter_color):
    """Frozen lockup wordmark at x-height 25 units, baseline y_baseline."""
    parts = []
    for d, kind in WORDMARK_PATHS:
        fill = ORANGE if kind == "period" else letter_color
        parts.append(f'<path d="{d}" fill="{fill}"/>')
    return (f'<g transform="translate({x:.3f} {y_baseline:.3f}) scale({WM_SCALE})">'
            + "".join(parts) + "</g>")

# ---- masters ------------------------------------------------------------------
def build_masters():
    write("sivrce-v3-mark.svg", svg(mark_gradient()))
    write("sivrce-v3-mark-small.svg", svg(mark_gradient("small")))
    write("sivrce-v3-mark-micro.svg", svg(mark_gradient("micro")))
    write("sivrce-v3-mark-mono-ink.svg", svg(mark_mono(INK)))
    write("sivrce-v3-mark-mono-white.svg", svg(mark_mono(WHITE)))
    write("sivrce-v3-mark-mono-ink-small.svg", svg(mark_mono(INK, "small")))
    write("sivrce-v3-mark-mono-white-small.svg", svg(mark_mono(WHITE, "small")))

    # horizontal lockups — gap 15/48, x-height 25/48, optically centered
    def horizontal(letter):
        w = 48 + 15 + WM_VB_W
        body = mark_gradient() + wordmark_group(48 + 15, (48 + WM_VB_H) / 2, letter)
        return svg(body, w=f"{w:.2f}")
    write("sivrce-v3-horizontal.svg", horizontal(INK))
    write("sivrce-v3-horizontal-white.svg", horizontal(WHITE))

    # stacked lockups — mark 48, gap 10, wordmark centered below
    def stacked(letter):
        h = 48 + 10 + WM_VB_H
        mark_x = (WM_VB_W - 48) / 2
        body = (f'<g transform="translate({mark_x:.2f} 0)">{mark_gradient()}</g>'
                + wordmark_group(0, 48 + 10 + WM_VB_H, letter))
        return svg(body, w=f"{WM_VB_W:.2f}", h=f"{h:.2f}")
    write("sivrce-v3-stacked.svg", stacked(INK))
    write("sivrce-v3-stacked-white.svg", stacked(WHITE))

    # app icon — spark on navy tile (OS applies the squircle mask on iOS)
    tile = (f'<rect width="48" height="48" fill="{NAVY}"/>'
            f'<g transform="translate(9.6 9.6) scale(0.6)">{mark_gradient()}</g>')
    write("sivrce-v3-app-icon.svg", svg(tile))
    # android adaptive: more headroom (safe zone 66%)
    tile_a = (f'<rect width="48" height="48" fill="{NAVY}"/>'
              f'<g transform="translate(12 12) scale(0.5)">{mark_gradient()}</g>')
    write("sivrce-v3-app-icon-android.svg", svg(tile_a))

    # svg favicon (small optical geometry)
    write("sivrce-v3-favicon.svg", svg(mark_gradient("small")))

# ---- chrome png pipeline (same pattern as v2) ---------------------------------
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def render_html(html, out, w, h, transparent=True):
    fd, html_path = tempfile.mkstemp(suffix=".html", dir=HERE, prefix=".render-")
    with os.fdopen(fd, "w") as f:
        f.write(html)
    try:
        cmd = [CHROME, "--headless", "--disable-gpu",
               "--force-device-scale-factor=2",
               f"--screenshot={out}", f"--window-size={w},{h}",
               "--hide-scrollbars"]
        if transparent:
            cmd.append("--default-background-color=00000000")
        cmd.append(f"file://{os.path.abspath(html_path)}")
        subprocess.run(cmd, check=True, capture_output=True)
        print("rendered", os.path.basename(out))
    finally:
        os.unlink(html_path)

def render_svg(src, w, h, out, transparent=True):
    html = (f'<!DOCTYPE html><html><body style="margin:0">'
            f'<img src="{os.path.abspath(src)}" width="{w}" height="{h}" '
            f'style="display:block"></body></html>')
    render_html(html, out, w, h, transparent)

def size_class(n):
    return "micro" if n <= 16 else ("small" if n <= 32 else "master")

def build_pngs():
    for n in [16, 32, 64, 128, 256, 512, 1024]:
        sc = size_class(n)
        suffix = "" if sc == "master" else f"-{sc}"
        render_svg(f"{OUT}/sivrce-v3-mark{suffix}.svg", n, n,
                   f"{PNG}/sivrce-v3-mark-{n}.png")
        ms = "-small" if sc != "master" else ""
        render_svg(f"{OUT}/sivrce-v3-mark-mono-ink{ms}.svg", n, n,
                   f"{PNG}/sivrce-v3-mark-mono-ink-{n}.png")
        render_svg(f"{OUT}/sivrce-v3-mark-mono-white{ms}.svg", n, n,
                   f"{PNG}/sivrce-v3-mark-mono-white-{n}.png")
    # lockups
    for name, w, h in [("horizontal", 202.77, 48), ("stacked", 139.77, 83)]:
        for variant in ["", "-white"]:
            for s in [4, 8]:
                rw, rh = round(w * s), round(h * s)
                render_svg(f"{OUT}/sivrce-v3-{name}{variant}.svg", rw, rh,
                           f"{PNG}/sivrce-v3-{name}{variant}-{rw}.png")

def build_social():
    # avatars — mark at 58%, safe inside circle crops on every platform
    for n in [512, 1024]:
        m = round(n * 0.58)
        off = (n - m) // 2
        for key, bg in [("navy", NAVY), ("cloud", CLOUD)]:
            html = (f'<!DOCTYPE html><html><body style="margin:0;width:{n}px;'
                    f'height:{n}px;background:{bg}">'
                    f'<img src="{OUT}/sivrce-v3-mark.svg" width="{m}" height="{m}" '
                    f'style="display:block;margin:{off}px"></body></html>')
            render_html(html, f"{PNG}/sivrce-v3-avatar-{key}-{n}.png", n, n,
                        transparent=False)
    # app icons (opaque navy, iOS applies its own mask)
    for n in [180, 192, 512, 1024]:
        render_svg(f"{OUT}/sivrce-v3-app-icon.svg", n, n,
                   f"{PNG}/sivrce-v3-app-icon-{n}.png", transparent=False)
    render_svg(f"{OUT}/sivrce-v3-app-icon-android.svg", 512, 512,
               f"{PNG}/sivrce-v3-app-icon-android-512.png", transparent=False)
    # favicon png fallbacks
    render_svg(f"{OUT}/sivrce-v3-mark-micro.svg", 16, 16,
               f"{PNG}/sivrce-v3-favicon-16.png")
    render_svg(f"{OUT}/sivrce-v3-mark-small.svg", 32, 32,
               f"{PNG}/sivrce-v3-favicon-32.png")
    render_svg(f"{OUT}/sivrce-v3-mark.svg", 48, 48,
               f"{PNG}/sivrce-v3-favicon-48.png")
    # multi-size .ico
    try:
        from PIL import Image
        imgs = [Image.open(f"{PNG}/sivrce-v3-favicon-{n}.png").convert("RGBA")
                for n in (16, 32, 48)]
        imgs[0].save(f"{OUT}/favicon.ico",
                     sizes=[(16, 16), (32, 32), (48, 48)],
                     append_images=imgs[1:])
        print("wrote favicon.ico")
    except Exception as e:
        print("ico skipped:", e)
    # og image 1200x630 — navy, dot grid, glow, white lockup, domain
    og = f"""<!DOCTYPE html><html><head><style>
@font-face {{ font-family: Manrope; src: url(../fonts/Manrope-Variable.ttf) format("truetype-variations"); font-weight: 200 1000; }}
body {{ margin:0; width:1200px; height:630px; background:{NAVY}; position:relative;
  font-family:Manrope, sans-serif; overflow:hidden; }}
.dots {{ position:absolute; inset:0;
  background-image:radial-gradient(rgba(143,180,255,.13) 1.3px, transparent 1.4px);
  background-size:26px 26px; }}
.glow {{ position:absolute; left:50%; top:50%; width:980px; height:520px;
  transform:translate(-50%,-52%);
  background:radial-gradient(closest-side, rgba(46,107,255,.34), rgba(46,107,255,0) 72%);
  filter:blur(10px); }}
.lock {{ position:absolute; left:50%; top:47%; transform:translate(-50%,-50%); }}
.dom {{ position:absolute; left:0; right:0; bottom:52px; text-align:center;
  color:rgba(255,255,255,.52); font-size:21px; font-weight:800;
  letter-spacing:.14em; }}
</style></head><body>
<div class="dots"></div><div class="glow"></div>
<img class="lock" src="{OUT}/sivrce-v3-horizontal-white.svg" width="560">
<div class="dom">sivrce.ge</div>
</body></html>"""
    render_html(og, f"{PNG}/sivrce-v3-og-1200x630.png", 1200, 630,
                transparent=False)

def main():
    if not os.path.exists(CHROME):
        sys.exit("Chrome not found")
    build_masters()
    build_pngs()
    build_social()

if __name__ == "__main__":
    main()
