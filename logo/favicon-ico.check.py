#!/usr/bin/env python3
"""Assert app favicon.ico is BMP-DIB (Next/Turbopack rejects PNG-in-ICO)."""
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICO = ROOT / "app/src/app/favicon.ico"

data = ICO.read_bytes()
assert data[:4] == b"\x00\x00\x01\x00", "not an ICO"
n = struct.unpack_from("<H", data, 4)[0]
assert n >= 3, f"need 16+32+48, got {n}"
for i in range(n):
    off = 6 + 16 * i
    _w, _h, _c, _r, planes, bpp, size, offset = struct.unpack_from("<BBBBHHII", data, off)
    assert planes == 1 and bpp == 32, f"entry {i}: planes={planes} bpp={bpp}"
    assert data[offset : offset + 8] != b"\x89PNG\r\n\x1a\n", f"entry {i} is PNG-in-ICO"
    assert struct.unpack_from("<I", data, offset)[0] == 40, f"entry {i}: missing BITMAPINFOHEADER"
    assert size > 40, f"entry {i}: empty payload"

print("ok", ICO.relative_to(ROOT), f"{n} BMP-DIB frames")
