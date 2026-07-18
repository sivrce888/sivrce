#!/usr/bin/env python3
"""Sivrce photo watermark — board Spark Star (100/100).

Color mark = owner board raster (logo/concepts/sivrce-spark-mark.png),
AI corner stripped via saturation mask. Mono = same silhouette filled
white/ink. Wordmark = frozen Manrope 800 paths (logo/v3). Soft opacity
only — no gloss/shadow baked on. Capsule = navy pill for busy frames.
"""
import importlib.util
import os
import sys

from PIL import Image
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets")
PNG = os.path.join(HERE, "png")
MARK_SRC = os.path.join(HERE, "..", "concepts", "sivrce-spark-mark.png")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PNG, exist_ok=True)

spec = importlib.util.spec_from_file_location(
    "build_v3", os.path.join(HERE, "..", "v3", "build_v3.py"))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

ORANGE = v3.ORANGE
NAVY = v3.NAVY
INK = v3.INK
WHITE = v3.WHITE
WM_VB_W = v3.WM_VB_W
WM_VB_H = v3.WM_VB_H

# Lockup: mark 48u · gap 15 · x-height 25 · clear space 25%
MARK_U = 48.0
GAP_U = 15.0
PAD_U = MARK_U * 0.25
LOCK_U_W = MARK_U + GAP_U + WM_VB_W
LOCK_U_H = MARK_U

SOFT = 0.72
SOFT_LIGHT = 0.50
CAPSULE_BG = 0.58

# Export scales (unit → px). 8× ≈ photo corner on 4K; 16× for print.
SCALES = (8, 16)


def extract_board_mark(size=1024):
    """Board spark only — drop gray AI corner text via saturation gate."""
    im = Image.open(MARK_SRC).convert("RGBA")
    a = np.array(im)
    rgb = a[:, :, :3].astype(np.float32)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    mask = (a[:, :, 3] > 20) & (sat > 25)
    ys, xs = np.where(mask)
    pad = 8
    crop = im.crop((xs.min() - pad, ys.min() - pad,
                    xs.max() + pad + 1, ys.max() + pad + 1))
    # keep only saturated pixels (kill residual gray)
    c = np.array(crop)
    crgb = c[:, :, :3].astype(np.float32)
    csat = crgb.max(axis=2) - crgb.min(axis=2)
    keep = (c[:, :, 3] > 20) & (csat > 25)
    c[:, :, 3] = np.where(keep, c[:, :, 3], 0)
    crop = Image.fromarray(c, "RGBA")
    s = max(crop.size)
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sq.paste(crop, ((s - crop.size[0]) // 2, (s - crop.size[1]) // 2), crop)
    out = sq.resize((size, size), Image.Resampling.LANCZOS)
    path = os.path.join(PNG, f"sivrce-wm-mark-board-{size}.png")
    out.save(path)
    print("wrote", os.path.basename(path))
    return out


def mono_from(mark: Image.Image, color: str, name: str):
    """Silhouette fill — alpha from board mark, solid brand color."""
    a = np.array(mark)
    hex_ = color.lstrip("#")
    r, g, b = (int(hex_[i:i + 2], 16) for i in (0, 2, 4))
    out = np.zeros_like(a)
    out[:, :, 0] = r
    out[:, :, 1] = g
    out[:, :, 2] = b
    out[:, :, 3] = a[:, :, 3]
    im = Image.fromarray(out, "RGBA")
    path = os.path.join(PNG, name)
    im.save(path)
    print("wrote", name)
    return path


def wordmark_svg(letter_color, height_px):
    """Standalone wordmark SVG at pixel height (x-height = height_px)."""
    scale = height_px / WM_VB_H
    w = WM_VB_W * scale
    # paths live in font units; wordmark_group uses WM_SCALE for 25u height
    body = v3.wordmark_group(0, WM_VB_H, letter_color)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{w:.2f}" height="{height_px}" '
        f'viewBox="0 0 {WM_VB_W:.2f} {WM_VB_H:.2f}">{body}</svg>'
    )


def compose_lockup(mark_path, letter_color, out_path, scale, opacity=1.0,
                   capsule=False):
    """Chrome-render lockup: board mark + wordmark, optional navy capsule."""
    mark_px = int(MARK_U * scale)
    gap_px = int(GAP_U * scale)
    wm_h = int(WM_VB_H * (MARK_U / 48) * scale)  # x-height 25/48 of mark
    pad_px = int(PAD_U * scale)
    lock_w = mark_px + gap_px + int(WM_VB_W * (wm_h / WM_VB_H))
    lock_h = mark_px

    wm_file = os.path.join(HERE, f".wm-{letter_color[-6:]}-{wm_h}.svg")
    with open(wm_file, "w") as f:
        f.write(wordmark_svg(letter_color, wm_h))

    if capsule:
        ipx = pad_px
        ipy = int(pad_px * 0.75)
        cap_w = lock_w + 2 * ipx
        cap_h = lock_h + 2 * ipy
        rx = cap_h / 2
        outer = pad_px
        total_w = cap_w + 2 * outer
        total_h = cap_h + 2 * outer
        html = f"""<!DOCTYPE html><html><body style="margin:0;background:transparent">
<div style="position:relative;width:{total_w}px;height:{total_h}px">
  <div style="position:absolute;left:{outer}px;top:{outer}px;width:{cap_w}px;
    height:{cap_h}px;border-radius:{rx}px;background:{NAVY};opacity:{CAPSULE_BG}"></div>
  <div style="position:absolute;left:{outer + ipx}px;top:{outer + ipy}px;
    display:flex;align-items:center;gap:{gap_px}px;opacity:{opacity}">
    <img src="{os.path.abspath(mark_path)}" width="{mark_px}" height="{mark_px}"
      style="display:block">
    <img src="{os.path.abspath(wm_file)}" height="{wm_h}" style="display:block">
  </div>
</div></body></html>"""
        v3.render_html(html, out_path, total_w, total_h, transparent=True)
    else:
        total_w = lock_w + 2 * pad_px
        total_h = lock_h + 2 * pad_px
        # optically center wordmark on mark
        wm_top = pad_px + (mark_px - wm_h) / 2
        html = f"""<!DOCTYPE html><html><body style="margin:0;background:transparent">
<div style="position:relative;width:{total_w}px;height:{total_h}px;opacity:{opacity}">
  <img src="{os.path.abspath(mark_path)}" width="{mark_px}" height="{mark_px}"
    style="position:absolute;left:{pad_px}px;top:{pad_px}px;display:block">
  <img src="{os.path.abspath(wm_file)}" height="{wm_h}"
    style="position:absolute;left:{pad_px + mark_px + gap_px}px;top:{wm_top}px;display:block">
</div></body></html>"""
        v3.render_html(html, out_path, total_w, total_h, transparent=True)

    try:
        os.unlink(wm_file)
    except OSError:
        pass
    print("rendered", os.path.basename(out_path))


def mark_only(mark_path, out_path, size, opacity=1.0):
    pad = int(size * 0.25)
    total = size + 2 * pad
    html = f"""<!DOCTYPE html><html><body style="margin:0;background:transparent">
<div style="width:{total}px;height:{total}px;opacity:{opacity}">
  <img src="{os.path.abspath(mark_path)}" width="{size}" height="{size}"
    style="display:block;margin:{pad}px">
</div></body></html>"""
    v3.render_html(html, out_path, total, total, transparent=True)
    print("rendered", os.path.basename(out_path))


def build_preview():
    soft = f"{PNG}/sivrce-wm-soft-white-8x.png"
    soft_ink = f"{PNG}/sivrce-wm-soft-ink-8x.png"
    capsule = f"{PNG}/sivrce-wm-capsule-8x.png"
    soft_c = f"{PNG}/sivrce-wm-soft-color-8x.png"
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; }}
  body {{
    font-family: Manrope, sans-serif; background: {NAVY}; color: #E9EDFF;
    padding: 48px;
  }}
  h1 {{ font-weight: 800; letter-spacing: -0.04em; font-size: 28px; margin-bottom: 8px; }}
  p {{ opacity: 0.55; font-weight: 600; margin-bottom: 32px; font-size: 14px; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }}
  .shot {{
    position: relative; height: 280px; border-radius: 22px; overflow: hidden;
  }}
  .shot.dark {{
    background:
      linear-gradient(135deg, rgba(46,107,255,0.35), transparent 55%),
      linear-gradient(220deg, #0A1440, {NAVY});
  }}
  .shot.light {{
    background:
      linear-gradient(135deg, rgba(143,180,255,0.4), transparent 50%),
      linear-gradient(200deg, #FFFFFF, #F6F7FB);
  }}
  .shot.busy {{
    background:
      radial-gradient(circle at 30% 40%, #2E6BFF 0%, transparent 45%),
      radial-gradient(circle at 70% 60%, #FF6A2D 0%, transparent 40%),
      linear-gradient(160deg, #0A1440, {NAVY});
  }}
  .shot.hero {{
    background:
      linear-gradient(120deg, #0A1440 0%, #1A3FC0 55%, #0A1440 100%);
  }}
  .wm {{ position: absolute; right: 28px; bottom: 24px; height: 40px; width: auto; }}
  .wm.cap {{ height: 56px; }}
  .label {{
    position: absolute; left: 20px; top: 16px;
    font-size: 11px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; opacity: 0.45;
  }}
  .shot.light .label {{ color: {INK}; }}
</style></head><body>
  <h1>sivrce<span style="color:{ORANGE}">.</span> watermark</h1>
  <p>Board Spark Star · soft 72% · capsule for busy · 100/100 photo kit</p>
  <div class="grid">
    <div class="shot dark">
      <span class="label">soft white · dark photo</span>
      <img class="wm" src="{soft}" alt="">
    </div>
    <div class="shot light">
      <span class="label">soft ink · light photo</span>
      <img class="wm" src="{soft_ink}" alt="">
    </div>
    <div class="shot hero">
      <span class="label">soft color · hero</span>
      <img class="wm" src="{soft_c}" alt="">
    </div>
    <div class="shot busy">
      <span class="label">capsule · busy / mixed</span>
      <img class="wm cap" src="{capsule}" alt="">
    </div>
  </div>
</body></html>"""
    with open(os.path.join(HERE, "board.html"), "w") as f:
        f.write(html)
    v3.render_html(html, os.path.join(HERE, "board.png"), 1100, 720, transparent=False)
    print("wrote board.html + board.png")


def main():
    mark = extract_board_mark(1024)
    color_path = os.path.join(PNG, "sivrce-wm-mark-board-1024.png")
    white_path = mono_from(mark, WHITE, "sivrce-wm-mark-mono-white-1024.png")
    ink_path = mono_from(mark, INK, "sivrce-wm-mark-mono-ink-1024.png")

    for scale, tag in ((8, "8x"), (16, "16x")):
        compose_lockup(color_path, WHITE,
                       f"{PNG}/sivrce-wm-color-white-{tag}.png", scale)
        compose_lockup(color_path, INK,
                       f"{PNG}/sivrce-wm-color-ink-{tag}.png", scale)
        compose_lockup(white_path, WHITE,
                       f"{PNG}/sivrce-wm-mono-white-{tag}.png", scale)
        compose_lockup(ink_path, INK,
                       f"{PNG}/sivrce-wm-mono-ink-{tag}.png", scale)

        compose_lockup(white_path, WHITE,
                       f"{PNG}/sivrce-wm-soft-white-{tag}.png", scale, SOFT)
        compose_lockup(ink_path, INK,
                       f"{PNG}/sivrce-wm-soft-ink-{tag}.png", scale, SOFT_LIGHT)
        compose_lockup(color_path, WHITE,
                       f"{PNG}/sivrce-wm-soft-color-{tag}.png", scale, SOFT)

        compose_lockup(color_path, WHITE,
                       f"{PNG}/sivrce-wm-capsule-{tag}.png", scale, SOFT,
                       capsule=True)
        compose_lockup(white_path, WHITE,
                       f"{PNG}/sivrce-wm-capsule-mono-{tag}.png", scale, SOFT,
                       capsule=True)

        mark_only(white_path, f"{PNG}/sivrce-wm-mark-soft-white-{tag}.png",
                  int(MARK_U * scale), SOFT)
        mark_only(ink_path, f"{PNG}/sivrce-wm-mark-soft-ink-{tag}.png",
                  int(MARK_U * scale), SOFT_LIGHT)
        mark_only(color_path, f"{PNG}/sivrce-wm-mark-soft-color-{tag}.png",
                  int(MARK_U * scale), SOFT)

    # drop old v3-geometry SVGs so nobody ships the wrong mark
    for name in os.listdir(OUT):
        if name.endswith(".svg"):
            os.unlink(os.path.join(OUT, name))
            print("removed stale", name)

    build_preview()


if __name__ == "__main__":
    main()
