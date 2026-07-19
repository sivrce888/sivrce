#!/usr/bin/env python3
"""Ship Aurora Spark (v4a) — board-faithful mark → app favicon/icons/logo.

ponytail: reuse existing v4a SVGs + v3 Chrome render. No new geometry.
"""
import importlib.util
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "assets")
PNG = os.path.join(HERE, "png")
APP = os.path.join(ROOT, "app")
os.makedirs(PNG, exist_ok=True)

spec = importlib.util.spec_from_file_location(
    "build_v3", os.path.join(HERE, "..", "v3", "build_v3.py"))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

MARK = f"{OUT}/sivrce-v4a-mark.svg"
MARK_S = f"{OUT}/sivrce-v4a-mark-small.svg"
MARK_M = f"{OUT}/sivrce-v4a-mark-micro.svg"
APP_ICON = f"{OUT}/sivrce-v4a-app-icon.svg"
H_WHITE = f"{OUT}/sivrce-v4a-horizontal-white.svg"
H_INK = f"{OUT}/sivrce-v4a-horizontal.svg"
NAVY = v3.NAVY


def render(src, n, out, opaque=False):
    """Chrome @2x → downscale to exact n×n."""
    tmp = out + ".@2x.png"
    v3.render_svg(src, n, n, tmp, transparent=not opaque)
    from PIL import Image
    im = Image.open(tmp).convert("RGBA")
    if im.size != (n, n):
        im = im.resize((n, n), Image.Resampling.LANCZOS)
    if opaque:
        rgb = tuple(int(NAVY[i:i + 2], 16) for i in (1, 3, 5))
        bg = Image.new("RGBA", (n, n), (*rgb, 255))
        bg.alpha_composite(im)
        bg.convert("RGB").save(out)
    else:
        im.save(out)
    os.unlink(tmp)


def to_webp(src, dest, size=None):
    from PIL import Image
    im = Image.open(src).convert("RGBA")
    if size and im.size != (size, size):
        im = im.resize((size, size), Image.Resampling.LANCZOS)
    rgb = tuple(int(NAVY[i:i + 2], 16) for i in (1, 3, 5))
    bg = Image.new("RGBA", im.size, (*rgb, 255))
    bg.alpha_composite(im)
    bg.convert("RGB").save(dest, "WEBP", quality=90)
    print("webp", os.path.basename(dest))


def main():
    if not os.path.exists(v3.CHROME):
        sys.exit("Chrome not found")
    for p in (MARK, MARK_S, MARK_M, APP_ICON, H_WHITE, H_INK):
        if not os.path.exists(p):
            sys.exit(f"missing {p} — run build_v4.py first")

    # mark sizes
    for n, src in [(16, MARK_M), (32, MARK_S), (48, MARK_S),
                   (64, MARK), (128, MARK), (256, MARK),
                   (512, MARK), (1024, MARK)]:
        render(src, n, f"{PNG}/sivrce-v4a-mark-{n}.png")

    # favicon pngs + ico
    from PIL import Image
    render(MARK_M, 16, f"{PNG}/sivrce-v4a-favicon-16.png")
    render(MARK_S, 32, f"{PNG}/sivrce-v4a-favicon-32.png")
    render(MARK_S, 48, f"{PNG}/sivrce-v4a-favicon-48.png")
    # multi-size .ico (hand-rolled — Pillow ICO multi-size is flaky)
    def png_bytes(im):
        from io import BytesIO
        buf = BytesIO()
        im.save(buf, format="PNG")
        return buf.getvalue()

    import struct
    entries = []
    for n in (16, 32, 48):
        im = Image.open(f"{PNG}/sivrce-v4a-favicon-{n}.png").convert("RGBA")
        if im.size != (n, n):
            im = im.resize((n, n), Image.Resampling.LANCZOS)
        entries.append((n, png_bytes(im)))
    header = struct.pack("<HHH", 0, 1, len(entries))
    offset = 6 + 16 * len(entries)
    dire = b""
    blobs = b""
    for n, data in entries:
        w = 0 if n >= 256 else n
        dire += struct.pack("<BBBBHHII", w, w, 0, 0, 1, 32, len(data), offset)
        blobs += data
        offset += len(data)
    ico = f"{OUT}/favicon.ico"
    with open(ico, "wb") as f:
        f.write(header + dire + blobs)
    print("wrote favicon.ico")

    # app icons (opaque navy)
    for n in [180, 192, 512, 1024]:
        render(APP_ICON, n, f"{PNG}/sivrce-v4a-app-icon-{n}.png", opaque=True)

    # OG 1200×630
    og_html = f"""<!DOCTYPE html><html><head><style>
body{{margin:0;width:1200px;height:630px;background:{NAVY};position:relative;overflow:hidden}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(rgba(143,180,255,.13) 1.3px,transparent 1.4px);background-size:26px 26px}}
.glow{{position:absolute;left:50%;top:50%;width:980px;height:520px;transform:translate(-50%,-52%);
background:radial-gradient(closest-side,rgba(46,107,255,.34),rgba(46,107,255,0) 72%);filter:blur(10px)}}
.lock{{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%)}}
.dom{{position:absolute;left:0;right:0;bottom:52px;text-align:center;color:rgba(255,255,255,.52);
font:800 21px/1 Manrope,system-ui,sans-serif;letter-spacing:.14em}}
</style></head><body>
<div class="dots"></div><div class="glow"></div>
<img class="lock" src="{H_WHITE}" width="560">
<div class="dom">sivrce.ge</div>
</body></html>"""
    v3.render_html(og_html, f"{PNG}/sivrce-v4a-og-1200x630.@2x.png", 1200, 630,
                   transparent=False)
    from PIL import Image as _I
    _I.open(f"{PNG}/sivrce-v4a-og-1200x630.@2x.png").convert("RGB").resize(
        (1200, 630), _I.Resampling.LANCZOS).save(
        f"{PNG}/sivrce-v4a-og-1200x630.png")
    os.unlink(f"{PNG}/sivrce-v4a-og-1200x630.@2x.png")

    # ---- copy into Next app ----
    shutil.copy2(MARK_S, f"{APP}/src/app/icon.svg")
    shutil.copy2(f"{PNG}/sivrce-v4a-app-icon-180.png",
                 f"{APP}/src/app/apple-icon.png")
    shutil.copy2(ico, f"{APP}/src/app/favicon.ico")

    icons = f"{APP}/public/icons"
    os.makedirs(icons, exist_ok=True)
    shutil.copy2(f"{PNG}/sivrce-v4a-app-icon-192.png",
                 f"{icons}/icon-192.png")
    shutil.copy2(f"{PNG}/sivrce-v4a-app-icon-512.png",
                 f"{icons}/icon-512.png")
    for n in (48, 72, 96, 128, 192, 256, 512):
        tmp = f"{PNG}/_tmp-{n}.png"
        render(APP_ICON, n, tmp, opaque=True)
        to_webp(tmp, f"{icons}/icon-{n}.webp", size=n)
        os.unlink(tmp)

    pub = f"{APP}/public/logo"
    os.makedirs(pub, exist_ok=True)
    shutil.copy2(MARK, f"{pub}/sivrce-mark.svg")
    shutil.copy2(MARK, f"{pub}/sivrce-mark-display.svg")
    shutil.copy2(H_INK, f"{pub}/sivrce-logo-horizontal.svg")
    shutil.copy2(H_WHITE, f"{pub}/sivrce-logo-horizontal-white.svg")
    # keep wordmarks; stacked not in v4a — skip overwrite of stacked if absent
    if os.path.exists(f"{OUT}/sivrce-v4a-stacked.svg"):
        shutil.copy2(f"{OUT}/sivrce-v4a-stacked.svg",
                     f"{pub}/sivrce-logo-stacked.svg")

    # OG — brand lockup (keep photo as og.jpg backup path unused)
    og_dir = f"{APP}/public/images"
    shutil.copy2(f"{PNG}/sivrce-v4a-og-1200x630.png",
                 f"{og_dir}/og-brand.png")
    # also refresh og.jpg to brand lockup for share cards
    Image.open(f"{PNG}/sivrce-v4a-og-1200x630.png").convert("RGB").save(
        f"{og_dir}/og.jpg", "JPEG", quality=92, optimize=True)
    print("shipped → app/")

if __name__ == "__main__":
    main()
