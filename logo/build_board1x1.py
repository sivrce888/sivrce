#!/usr/bin/env python3
"""Sivrce logo kit — 1:1 crops from the owner lockup master.

Master: logo/source/sivrce-lockup-master.png (horizontal spark + wordmark on white).
Regenerates: board1x1 kit, app/public/logo rasters, app icons
(public + src/app), favicon.ico, og-brand.png logo swap, and the
share watermark (soft-white 8x/16x).

Light-bg assets are soft-keyed from white (edges stay clean on any surface).
App icons = sv-navy square + clean spark. Run: python3 logo/build_board1x1.py
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BOARD = os.path.join(HERE, "source", "sivrce-lockup-master.png")
OUT_KIT = os.path.join(HERE, "board1x1")
PUB_LOGO = os.path.join(ROOT, "app", "public", "logo")
PUB_ICONS = os.path.join(ROOT, "app", "public", "icons")
SRC_APP = os.path.join(ROOT, "app", "src", "app")
OG = os.path.join(ROOT, "app", "public", "images", "og-brand.png")
WM = os.path.join(HERE, "watermark", "png")

BG = np.array([255, 255, 255], dtype=np.float32)  # lockup master bg
NAVY = np.array([5, 11, 38], dtype=np.float32)  # sv-navy
# app-icon spark box relative to navy tile (Apple-style inset)
ICON_REL = (0.18, 0.18, 0.64, 0.64)


def load_board():
    return Image.open(BOARD).convert("RGB")


def key_from(im, bg, lo=6.0, hi=22.0):
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
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    im.save(path)
    print(" ", os.path.relpath(path, ROOT), im.size)


def write_ico(path, images):
    """Multi-size BMP-DIB ICO — Next/Turbopack rejects PNG-compressed ICO."""
    import struct

    def dib(im):
        im = im.convert("RGBA")
        w, h = im.size
        px = list(im.getdata())
        xor = bytearray()
        for y in range(h - 1, -1, -1):
            for x in range(w):
                r, g, b, a = px[y * w + x]
                xor += bytes((b, g, r, a))
        and_row = ((w + 31) // 32) * 4
        mask = bytearray()
        for y in range(h - 1, -1, -1):
            row = bytearray(and_row)
            for x in range(w):
                if px[y * w + x][3] < 128:
                    row[x // 8] |= 1 << (7 - (x % 8))
            mask += row
        hdr = struct.pack("<IIIHHIIIIII", 40, w, h * 2, 1, 32, 0, len(xor) + len(mask), 0, 0, 0, 0)
        return hdr + bytes(xor) + bytes(mask)

    rgba = [im.convert("RGBA") for im in images]
    payloads = [dib(im) for im in rgba]
    n = len(rgba)
    offset = 6 + 16 * n
    out = struct.pack("<HHH", 0, 1, n)
    body = b""
    for im, payload in zip(rgba, payloads):
        wb = 0 if im.width >= 256 else im.width
        hb = 0 if im.height >= 256 else im.height
        out += struct.pack("<BBBBHHII", wb, hb, 0, 0, 1, 32, len(payload), offset)
        offset += len(payload)
        body += payload
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    open(path, "wb").write(out + body)
    print(" ", os.path.relpath(path, ROOT), [(im.width, im.height) for im in rgba])



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


def detect_boxes(board, thresh=12):
    """Auto-find spark / word / lock boxes from a white-bg horizontal lockup."""
    a = np.asarray(board).astype(np.float32)
    content = np.abs(a - BG).max(axis=2) > thresh
    ys, xs = np.nonzero(content)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

    empty = [x for x in range(x0, x1) if content[y0:y1, x].sum() < 3]
    if not empty:
        raise SystemExit("no gap between spark and wordmark")
    runs, s, prev = [], empty[0], empty[0]
    for x in empty[1:]:
        if x == prev + 1:
            prev = x
        else:
            runs.append((s, prev))
            s = prev = x
    runs.append((s, prev))
    gap0, gap1 = max(runs, key=lambda r: r[1] - r[0])
    mid = (gap0 + gap1) // 2

    def bbox(x_lo, x_hi):
        sub = content[:, x_lo:x_hi]
        ys2, xs2 = np.nonzero(sub)
        return (x_lo + int(xs2.min()), int(ys2.min()),
                x_lo + int(xs2.max()) + 1, int(ys2.max()) + 1)

    # pad spark to include soft shadow below tip
    sx0, sy0, sx1, sy1 = bbox(x0, mid)
    pad = 8
    spark = (max(0, sx0 - pad), max(0, sy0 - pad),
             min(board.width, sx1 + pad), min(board.height, sy1 + pad + 12))
    word = bbox(mid, x1)
    # lock = spark x-range + word x-range, shared y from spark (taller)
    lock = (spark[0], spark[1], word[2], spark[3])
    return spark, word, lock


def main():
    board = load_board()
    print("board", board.size, os.path.basename(BOARD))
    SPARK_BOX, WORD_BOX, LOCK_BOX = detect_boxes(board)
    print("boxes spark", SPARK_BOX, "word", WORD_BOX, "lock", LOCK_BOX)

    # ---------- light-bg masters (keyed) ----------
    spark_full = key_from(board.crop(SPARK_BOX), BG)
    word_full = key_from(board.crop(WORD_BOX), BG)
    lock_full = key_from(board.crop(LOCK_BOX), BG)
    spark = trim(spark_full)
    word_ink = trim(word_full)
    la = np.asarray(lock_full.getchannel("A"))
    lys, lxs = np.nonzero(la > 6)
    lb = (max(0, lxs.min() - 3), max(0, lys.min() - 3),
          min(lock_full.width, lxs.max() + 4), min(lock_full.height, lys.max() + 4))
    lock_ink = lock_full.crop(lb)

    # ---------- dark-surface spark (no soft shadow smudge) ----------
    sp = np.asarray(spark_full).astype(np.float32)
    rgb = sp[:, :, :3]
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bright = rgb.mean(axis=2)
    alpha = sp[:, :, 3]
    body = (alpha > 200) & ((sat > 50) | (bright > 180))
    core = (alpha > 200) & (sat > 90)
    cry, _ = np.nonzero(core)
    ycut = np.zeros_like(body)
    if len(cry):
        ycut[: int(cry.max()) + 4, :] = True
        spark_dark_full = apply_gate(spark_full, body & ycut)
    else:
        spark_dark_full = apply_gate(spark_full, body)
    spark_clean = trim(spark_dark_full)
    sb = np.asarray(spark_clean).astype(np.float32)[:, :, :3]
    bsat = sb.max(axis=2) - sb.min(axis=2)
    bys, bxs = np.nonzero(bsat > 40)
    body_box = (int(bxs.min()), int(bys.min()), int(bxs.max()) + 1, int(bys.max()) + 1)

    # ---------- white lockup/wordmark ----------
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
    lock_white = canvas.crop(lb)

    print("tile spark rel box", [round(v, 3) for v in ICON_REL])

    def app_icon(size, inset=None):
        """Navy tile + spark. Small sizes: larger spark + 4× supersample (Google/Apple crisp)."""
        # ≤32px: pull spark larger so 16×16 still reads in SERP / tabs
        if inset is None:
            inset = 0.10 if size <= 32 else (0.14 if size <= 48 else ICON_REL[0])
        span = 1.0 - 2 * inset
        ss = 4 if size <= 64 else 1
        big = size * ss
        cv = Image.new("RGB", (big, big), tuple(NAVY.astype(np.uint8)))
        bw, bh = body_box[2] - body_box[0], body_box[3] - body_box[1]
        tw = round(big * span)
        th = round(big * span)
        scale = min(tw / bw, th / bh)
        s = spark_clean.resize((max(1, round(spark_clean.width * scale)),
                                max(1, round(spark_clean.height * scale))), Image.LANCZOS)
        x = round(big * (inset + span / 2) - (body_box[0] + bw / 2) * scale)
        y = round(big * (inset + span / 2) - (body_box[1] + bh / 2) * scale)
        cv.paste(s, (x, y), s)
        if ss > 1:
            cv = cv.resize((size, size), Image.LANCZOS)
        return cv

    def maskable_icon(size):
        """Android/PWA maskable: spark inside safe zone (~40% margin → 60% content)."""
        return app_icon(size, inset=0.22)

    # ---------- ship kit (native resolution — master is already 1x) ----------
    print("board1x1 kit:")
    mark1x = spark
    save(mark1x, f"{OUT_KIT}/mark.png")
    save(lock_ink, f"{OUT_KIT}/lockup-ink.png")
    save(lock_white, f"{OUT_KIT}/lockup-white.png")
    save(word_ink, f"{OUT_KIT}/wordmark-ink.png")
    save(word_white, f"{OUT_KIT}/wordmark-white.png")

    side = round(max(spark.width, spark.height) * 1.06)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(spark, ((side - spark.width) // 2, (side - spark.height) // 2), spark)
    save(sq, f"{OUT_KIT}/mark-square.png")

    for s in (16, 32, 48, 64, 128, 180, 192, 256, 512, 1024):
        save(resize_h(spark, s), f"{OUT_KIT}/mark-{s}.png")

    save(app_icon(1024), f"{OUT_KIT}/app-icon-dark.png")
    # light tile: spark on white
    light = Image.new("RGB", (512, 512), (255, 255, 255))
    sc = spark.resize((round(spark.width * 320 / spark.height), 320), Image.LANCZOS)
    light.paste(sc, ((512 - sc.width) // 2, (512 - sc.height) // 2), sc)
    save(light, f"{OUT_KIT}/app-icon-light.png")
    # dark lockup ref
    dark_lock = Image.new("RGB", lock_white.size, tuple(NAVY.astype(np.uint8)))
    dark_lock.paste(lock_white, (0, 0), lock_white)
    save(dark_lock, f"{OUT_KIT}/lockup-dark.png")

    # ---------- app/public/logo ----------
    print("public/logo:")
    for name in ("mark.png", "lockup-ink.png", "lockup-white.png",
                 "wordmark-ink.png", "wordmark-white.png"):
        save(Image.open(f"{OUT_KIT}/{name}"), f"{PUB_LOGO}/{name}")
    save(resize_h(spark, 512), f"{PUB_LOGO}/mark-512.png")
    save(resize_h(spark, 1024), f"{PUB_LOGO}/mark-1024.png")

    # ---------- app icons / favicon (Google: ≥48px navy tile; multi-size ICO) ----------
    print("app icons:")
    os.makedirs(PUB_ICONS, exist_ok=True)
    # Next.js file conventions + public drop-ins
    save(app_icon(512), f"{ROOT}/app/public/icon.png")
    save(app_icon(512), f"{SRC_APP}/icon.png")          # app/icon.png → <link rel=icon>
    save(app_icon(180), f"{SRC_APP}/apple-icon.png")    # apple-touch-icon
    save(app_icon(192), f"{PUB_ICONS}/icon-192.png")
    save(maskable_icon(512), f"{PUB_ICONS}/icon-512.png")  # maskable safe zone
    save(app_icon(48), f"{PUB_ICONS}/icon-48.png")      # Google Search prefers ≥48
    save(app_icon(96), f"{PUB_ICONS}/icon-96.png")
    for s in (16, 32, 48, 64, 128, 180, 192, 256, 512, 1024):
        save(app_icon(s), f"{OUT_KIT}/app-icon-{s}.png")
    for s in (48, 72, 96, 128, 192, 256, 512):
        src = maskable_icon(s) if s >= 512 else app_icon(s)
        src.save(f"{PUB_ICONS}/icon-{s}.webp", quality=92, method=6)
        print(f"  app/public/icons/icon-{s}.webp")

    # favicon.ico: 16+32+48 navy tiles (readable on light/dark browser chrome)
    fav16, fav32, fav48 = app_icon(16), app_icon(32), app_icon(48)
    for dest in (f"{SRC_APP}/favicon.ico", f"{ROOT}/app/public/favicon.ico"):
        write_ico(dest, [fav16, fav32, fav48])
    save(fav32, f"{PUB_ICONS}/favicon-32.png")
    save(fav48, f"{PUB_ICONS}/favicon-48.png")

    # ---------- og-brand.png logo swap ----------
    print("og-brand:")
    og_base = os.path.join(HERE, "source", "og-brand-base.png")
    og = Image.open(og_base).convert("RGB")
    oa = np.asarray(og).astype(np.float32)
    rx0, ry0, rx1, ry1 = 440, 245, 770, 350
    region = oa[ry0:ry1, rx0:rx1]
    d = np.abs(region - NAVY).max(axis=2)
    ys, xs = np.nonzero(d > 30)
    bx0, by0, bx1, by1 = (rx0 + xs.min(), ry0 + ys.min(),
                          rx0 + xs.max() + 1, ry0 + ys.max() + 1)
    old_h, old_cx, old_cy = by1 - by0, (bx0 + bx1) // 2, (by0 + by1) // 2
    old_w = bx1 - bx0
    pad = 16
    og.paste(tuple(NAVY.astype(np.uint8)),
             (bx0 - pad, by0 - pad, min(bx1 + pad, 766), min(by1 + pad, 352)))
    sc = old_w / lock_white.width
    nl = lock_white.resize((round(lock_white.width * sc),
                            round(lock_white.height * sc)), Image.LANCZOS)
    og.paste(nl, (old_cx - nl.width // 2, old_cy - nl.height // 2), nl)
    save(og, OG)

    # ---------- share watermark ----------
    print("watermark:")
    for tag in ("8x", "16x"):
        p = f"{WM}/sivrce-wm-soft-white-{tag}.png"
        if not os.path.exists(p):
            continue
        canvas = Image.open(p).convert("RGBA")
        target_h = round(canvas.height * 0.86)
        wl = resize_h(lock_white, target_h)
        wa = np.asarray(wl).astype(np.float32)
        wa[:, :, 3] *= 0.72
        wl = Image.fromarray(wa.astype(np.uint8), "RGBA")
        out = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        out.paste(wl, ((canvas.width - wl.width) // 2,
                       (canvas.height - wl.height) // 2), wl)
        save(out, p)

    print("Logo.tsx ratios — LOCK", lock_ink.size, "MARK", spark.size)


if __name__ == "__main__":
    main()
