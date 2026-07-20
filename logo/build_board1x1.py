#!/usr/bin/env python3
"""Sivrce logo kit — 1:1 crops from the owner master board.

Master: logo/source/sivrce-spark-board.png (2048x1152).
Regenerates: board1x1 kit, app/public/logo rasters, app icons
(public + src/app), favicon.ico, og-brand.png logo swap, and the
share watermark (soft-white 8x/16x).

Light-bg assets are keyed from the board bg with a soft ramp +
bg-unblend (edges stay clean on any surface). Navy-bg assets are
keyed from sv-navy. Run: python3 logo/build_board1x1.py
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BOARD = os.path.join(HERE, "source", "sivrce-spark-board.png")
OUT_KIT = os.path.join(HERE, "board1x1")
PUB_LOGO = os.path.join(ROOT, "app", "public", "logo")
PUB_ICONS = os.path.join(ROOT, "app", "public", "icons")
SRC_APP = os.path.join(ROOT, "app", "src", "app")
OG = os.path.join(ROOT, "app", "public", "images", "og-brand.png")
WM = os.path.join(HERE, "watermark", "png")

BG = np.array([246, 246, 251], dtype=np.float32)      # board light bg
NAVY = np.array([5, 11, 38], dtype=np.float32)        # sv-navy

# --- content boxes on the 2048x1152 board (detected + padded) ---
SPARK_BOX = (289, 120, 820, 624)      # spark + soft shadow (wordmark starts ~834)
WORD_BOX = (800, 250, 1790, 540)      # ink wordmark + orange dot
TILE_DARK_BOX = (230, 735, 590, 1100)   # navy app tile + shadow
TILE_LOCK_BOX = (1060, 735, 1880, 1095)  # navy lockup tile + shadow
TILE_LIGHT_BOX = (690, 780, 965, 1090)   # white app tile + shadow


def load_board():
    return Image.open(BOARD).convert("RGB")


def key_from(im, bg, lo=8.0, hi=26.0):
    """Soft-key uniform bg -> transparency, un-blend fg color."""
    a = np.asarray(im).astype(np.float32)
    d = np.abs(a - bg).max(axis=2)
    alpha = np.clip((d - lo) / (hi - lo), 0.0, 1.0)
    af = alpha[..., None]
    fg = np.where(af > 0, (a - (1.0 - af) * bg) / np.maximum(af, 1e-6), 0.0)
    rgba = np.dstack([np.clip(fg, 0, 255), alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def trim(im, thresh=6, pad=3):
    a = np.asarray(im.getchannel("A"))
    ys, xs = np.nonzero(a > thresh)
    if len(xs) == 0:
        return im
    x0, x1 = max(0, xs.min() - pad), min(im.width, xs.max() + 1 + pad)
    y0, y1 = max(0, ys.min() - pad), min(im.height, ys.max() + 1 + pad)
    return im.crop((x0, y0, x1, y1))


def resize_h(im, h):
    w = max(1, round(im.width * h / im.height))
    return im.resize((w, h), Image.LANCZOS)


def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)
    print(" ", os.path.relpath(path, ROOT), im.size)


def content_bbox(arr, bg, thresh):
    d = np.abs(arr - bg).max(axis=2)
    ys, xs = np.nonzero(d > thresh)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def near_bbox(arr, bg, thresh):
    """bbox of pixels CLOSE to bg (e.g. the navy tile body)."""
    d = np.abs(arr - bg).max(axis=2)
    ys, xs = np.nonzero(d < thresh)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def on_bg(im, bg):
    """Flatten RGBA onto solid bg (for opaque reference raws)."""
    base = Image.new("RGB", im.size, tuple(bg.astype(np.uint8)))
    base.paste(im, (0, 0), im)
    return base


def dilate1(mask):
    out = mask.copy()
    out[1:, :] |= mask[:-1, :]
    out[:-1, :] |= mask[1:, :]
    out[:, 1:] |= mask[:, :-1]
    out[:, :-1] |= mask[:, 1:]
    return out


def apply_gate(im, hard):
    """Zero alpha outside a 1px-dilated hard-content zone (kills bg texture)."""
    a = np.asarray(im).copy()
    zone = dilate1(hard)
    a[:, :, 3] = np.where(zone, a[:, :, 3], 0)
    return Image.fromarray(a, "RGBA")


def main():
    board = load_board()
    print("board", board.size)

    # ---------- light-bg masters (keyed) ----------
    LOCK_BOX = (SPARK_BOX[0], SPARK_BOX[1], WORD_BOX[2], SPARK_BOX[3])
    spark_full = key_from(board.crop(SPARK_BOX), BG)      # untrimmed
    word_full = key_from(board.crop(WORD_BOX), BG)        # untrimmed
    lock_full = key_from(board.crop(LOCK_BOX), BG)        # untrimmed
    spark = trim(spark_full)
    word_ink = trim(word_full)
    # ink lockup trim box — the white lockup reuses it so both variants
    # share identical canvas/registration (same optical size in the header)
    la = np.asarray(lock_full.getchannel("A"))
    lys, lxs = np.nonzero(la > 6)
    lb = (max(0, lxs.min() - 3), max(0, lys.min() - 3),
          min(lock_full.width, lxs.max() + 4), min(lock_full.height, lys.max() + 4))
    lock_ink = lock_full.crop(lb)

    # ---------- dark-surface spark (no shadow/glow smudge) ----------
    # body = fully opaque + (saturated | sheen-bright); soft shadow and
    # board glow stay below the alpha/sat bar, 1px dilation keeps edges.
    sp = np.asarray(spark_full).astype(np.float32)
    rgb = sp[:, :, :3]
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bright = rgb.mean(axis=2)
    alpha = sp[:, :, 3]
    body = (alpha > 240) & ((sat > 70) | (bright > 200))
    # the soft shadow mimics body (sat ~50-90, full alpha) but lives below
    # the true tip: anchor the cut on the unambiguous core (sat > 120)
    core = (alpha > 240) & (sat > 120)
    cry, _ = np.nonzero(core)
    ycut = np.zeros_like(body)
    ycut[: int(cry.max()) + 3, :] = True
    spark_dark_full = apply_gate(spark_full, body & ycut)
    spark_clean = trim(spark_dark_full)
    # body bbox (saturated core) so icon scaling matches the tile's body box
    sb = np.asarray(spark_clean).astype(np.float32)[:, :, :3]
    bsat = sb.max(axis=2) - sb.min(axis=2)
    bys, bxs = np.nonzero(bsat > 40)
    body_box = (bxs.min(), bys.min(), bxs.max() + 1, bys.max() + 1)

    # ---------- white lockup/wordmark (synthesized from light masters) ----------
    # tile extraction carries the tile's glow texture onto other navy bgs;
    # top-lockup geometry + white-recolored ink glyphs is 1:1 and clean.
    wf = np.asarray(word_full).copy()
    wrgb = wf[:, :, :3].astype(np.int16)
    is_orange = (wrgb[:, :, 0] > 180) & (wrgb[:, :, 1] > 40) & \
                (wrgb[:, :, 1] < 170) & (wrgb[:, :, 2] < 120)
    wf[:, :, :3] = np.where(is_orange[..., None], wf[:, :, :3], 255)
    word_white_full = Image.fromarray(wf, "RGBA")
    word_white = trim(word_white_full)

    canvas = Image.new("RGBA", (LOCK_BOX[2] - LOCK_BOX[0], LOCK_BOX[3] - LOCK_BOX[1]), (0, 0, 0, 0))
    canvas.paste(spark_dark_full, (0, 0), spark_dark_full)
    canvas.paste(word_white_full,
                 (WORD_BOX[0] - LOCK_BOX[0], WORD_BOX[1] - LOCK_BOX[1]),
                 word_white_full)
    lock_white = canvas.crop(lb)  # same canvas/registration as lock_ink

    # ---------- dark app tile -> spark-on-navy for app icons ----------
    tile_dark = board.crop(TILE_DARK_BOX)
    da = np.asarray(tile_dark).astype(np.float32)
    dx0, dy0, dx1, dy1 = near_bbox(da, NAVY, 60)
    tile_sq = tile_dark.crop((dx0, dy0, dx1, dy1))
    # spark content inside the tile + its relative box
    # (saturated body only, inside an inset: no glow, no rounded-corner bg)
    sa = np.asarray(tile_sq).astype(np.float32)
    ix, iy = round(tile_sq.width * 0.18), round(tile_sq.height * 0.18)
    inner_rgb = sa[iy:tile_sq.height - iy, ix:tile_sq.width - ix]
    inner_sat = inner_rgb.max(axis=2) - inner_rgb.min(axis=2)
    ys2, xs2 = np.nonzero(inner_sat > 40)
    sx0, sy0 = xs2.min() + ix, ys2.min() + iy
    sx1, sy1 = xs2.max() + 1 + ix, ys2.max() + 1 + iy
    rel = (sx0 / tile_sq.width, sy0 / tile_sq.height,
           (sx1 - sx0) / tile_sq.width, (sy1 - sy0) / tile_sq.height)
    print("tile", tile_sq.size, "spark rel box", [round(v, 3) for v in rel])

    def app_icon(size):
        cv = Image.new("RGB", (size, size), tuple(NAVY.astype(np.uint8)))
        bw, bh = body_box[2] - body_box[0], body_box[3] - body_box[1]
        tw = round(size * rel[2])
        th = round(size * rel[3])
        scale = min(tw / bw, th / bh)
        s = spark_clean.resize((max(1, round(spark_clean.width * scale)),
                                max(1, round(spark_clean.height * scale))), Image.LANCZOS)
        x = round(size * (rel[0] + rel[2] / 2) - (body_box[0] + bw / 2) * scale)
        y = round(size * (rel[1] + rel[3] / 2) - (body_box[1] + bh / 2) * scale)
        cv.paste(s, (x, y), s)
        return cv

    # ---------- ship kit (1x = native/2, supersampled) ----------
    print("board1x1 kit:")
    def half(im):
        return im.resize((im.width // 2, im.height // 2), Image.LANCZOS)

    mark1x = half(spark)
    save(mark1x, f"{OUT_KIT}/mark.png")
    save(half(lock_ink), f"{OUT_KIT}/lockup-ink.png")
    save(half(lock_white), f"{OUT_KIT}/lockup-white.png")
    save(half(word_ink), f"{OUT_KIT}/wordmark-ink.png")
    save(half(word_white), f"{OUT_KIT}/wordmark-white.png")

    side = round(max(spark.width, spark.height) * 1.06) // 2
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    m1 = half(spark)
    sq.paste(m1, ((side - m1.width) // 2, (side - m1.height) // 2), m1)
    save(sq, f"{OUT_KIT}/mark-square.png")

    for s in (16, 32, 48, 64, 128, 180, 192, 256, 512, 1024):
        h = min(s, spark.height)
        save(resize_h(spark, s), f"{OUT_KIT}/mark-{s}.png")

    # reference raws (opaque, incl. board bg) — brand kit only
    save(on_bg(trim(key_from(tile_dark, BG), pad=0), BG),
         f"{OUT_KIT}/app-icon-dark.png")
    tl = board.crop(TILE_LIGHT_BOX)
    tla = np.asarray(tl).astype(np.float32)
    lx0, ly0, lx1, ly1 = content_bbox(tla, BG, 6)
    save(tl.crop((lx0, ly0, lx1, ly1)), f"{OUT_KIT}/app-icon-light.png")
    save(on_bg(trim(key_from(board.crop(TILE_LOCK_BOX), BG), pad=0), BG),
         f"{OUT_KIT}/lockup-dark.png")

    for s in (180, 192, 512, 1024):
        save(app_icon(s), f"{OUT_KIT}/app-icon-{s}.png")

    # ---------- app/public/logo ----------
    print("public/logo:")
    for name in ("mark.png", "lockup-ink.png", "lockup-white.png",
                 "wordmark-ink.png", "wordmark-white.png"):
        save(Image.open(f"{OUT_KIT}/{name}"), f"{PUB_LOGO}/{name}")
    save(resize_h(spark, 512), f"{PUB_LOGO}/mark-512.png")
    save(resize_h(spark, 1024), f"{PUB_LOGO}/mark-1024.png")

    # ---------- app icons / favicon ----------
    print("app icons:")
    save(app_icon(192), f"{ROOT}/app/public/icon.png")
    save(app_icon(192), f"{PUB_ICONS}/icon-192.png")
    save(app_icon(512), f"{PUB_ICONS}/icon-512.png")
    for s in (48, 72, 96, 128, 192, 256, 512):
        app_icon(s).save(f"{PUB_ICONS}/icon-{s}.webp", quality=90, method=6)
        print(f"  app/public/icons/icon-{s}.webp")
    save(app_icon(192), f"{SRC_APP}/icon.png")
    save(app_icon(180), f"{SRC_APP}/apple-icon.png")

    # favicon: mark on transparent, square-padded, 16/32/48
    fside = max(mark1x.width, mark1x.height)
    fav = Image.new("RGBA", (fside, fside), (0, 0, 0, 0))
    fav.paste(mark1x, ((fside - mark1x.width) // 2,
                       (fside - mark1x.height) // 2), mark1x)
    fav.save(f"{SRC_APP}/favicon.ico",
             sizes=[(16, 16), (32, 32), (48, 48)])
    print("  app/src/app/favicon.ico", [(16, 16), (32, 32), (48, 48)])

    # ---------- og-brand.png logo swap ----------
    print("og-brand:")
    og_base = os.path.join(HERE, "source", "og-brand-base.png")  # pristine (idempotent)
    og = Image.open(og_base).convert("RGB")
    oa = np.asarray(og).astype(np.float32)
    # old logo = non-navy content inside the focus frame interior
    rx0, ry0, rx1, ry1 = 440, 245, 770, 350
    region = oa[ry0:ry1, rx0:rx1]
    d = np.abs(region - NAVY).max(axis=2)
    ys, xs = np.nonzero(d > 30)
    bx0, by0, bx1, by1 = (rx0 + xs.min(), ry0 + ys.min(),
                          rx0 + xs.max() + 1, ry0 + ys.max() + 1)
    old_h, old_cx, old_cy = by1 - by0, (bx0 + bx1) // 2, (by0 + by1) // 2
    old_w = bx1 - bx0
    # erase old logo, clamped so the focus frame is never touched
    pad = 16
    og.paste(tuple(NAVY.astype(np.uint8)),
             (bx0 - pad, by0 - pad, min(bx1 + pad, 766), min(by1 + pad, 352)))
    # match the old lockup's footprint width (frame interior has headroom)
    sc = old_w / lock_white.width
    nl = lock_white.resize((round(lock_white.width * sc),
                            round(lock_white.height * sc)), Image.LANCZOS)
    og.paste(nl, (old_cx - nl.width // 2, old_cy - nl.height // 2), nl)
    save(og, OG)

    # ---------- share watermark (soft white) ----------
    print("watermark:")
    for tag in ("8x", "16x"):
        p = f"{WM}/sivrce-wm-soft-white-{tag}.png"
        if not os.path.exists(p):
            continue
        canvas = Image.open(p).convert("RGBA")
        # white lockup, SOFT opacity, fitted to current content area
        target_h = round(canvas.height * 0.86)
        wl = resize_h(lock_white, target_h)
        wa = np.asarray(wl).astype(np.float32)
        wa[:, :, 3] *= 0.72  # SOFT
        wl = Image.fromarray(wa.astype(np.uint8), "RGBA")
        out = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        out.paste(wl, ((canvas.width - wl.width) // 2,
                       (canvas.height - wl.height) // 2), wl)
        save(out, p)


if __name__ == "__main__":
    main()
