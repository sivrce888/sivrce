#!/usr/bin/env python3
"""Outline the Sivrce wordmark from Manrope 800 into SVG path data.

Brand lock (BRAND.md):
- wordmark: Manrope 800, lowercase, tracking -0.045em, orange final period.
Output: wordmark.json with per-glyph SVG path data (baseline y=0, y-up flipped
into SVG coords so letters extend to negative y), advances, and font metrics.
"""
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

FONT = "fonts/Manrope-Variable.ttf"
TEXT = "sivrce."
TRACKING_EM = -0.045  # brand-locked letter-spacing

font = TTFont(FONT)
instantiateVariableFont(font, {"wght": 800}, inplace=True)

upm = font["head"].unitsPerEm
os2 = font["OS/2"]
hhea = font["hhea"]
metrics = {
    "upm": upm,
    "xHeight": os2.sxHeight,
    "capHeight": os2.sCapHeight,
    "ascender": hhea.ascent,
    "descender": hhea.descent,
}

cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()
hmtx = font["hmtx"]
glyph_order = font.getGlyphOrder()

# ---- kerning from GPOS PairPos (format 1 & 2) -------------------------------
def glyph_class_def(class_def, gname):
    try:
        return class_def.classDefs.get(gname, 0)
    except Exception:
        return 0

kern = {}
if "GPOS" in font:
    gpos = font["GPOS"].table
    for lookup in gpos.LookupList.Lookup:
        if lookup.LookupType != 2:
            continue
        for sub in lookup.SubTable:
            if sub.Format == 1:
                for first, ps in zip(sub.Coverage.glyphs, sub.PairSet):
                    for rec in ps.PairValueRecord:
                        v = rec.Value1
                        if v is not None and getattr(v, "XAdvance", 0):
                            kern[(first, rec.SecondGlyph)] = v.XAdvance
            elif sub.Format == 2:
                c1, c2 = sub.ClassDef1, sub.ClassDef2
                for g1 in sub.Coverage.glyphs:
                    k1 = glyph_class_def(c1, g1)
                    if k1 >= len(sub.Class1Record):
                        continue
                    rec1 = sub.Class1Record[k1]
                    for g2 in glyph_order:
                        k2 = glyph_class_def(c2, g2)
                        if k2 >= len(rec1.Class2Record):
                            continue
                        v = rec1.Class2Record[k2].Value1
                        if v is not None and getattr(v, "XAdvance", 0):
                            kern.setdefault((g1, g2), v.XAdvance)

# ---- outline each glyph ------------------------------------------------------
glyphs = []
x = 0.0
tracking_units = TRACKING_EM * upm
prev_name = None
for ch in TEXT:
    gname = cmap[ord(ch)]
    adv = hmtx[gname][0]
    if prev_name is not None:
        x += kern.get((prev_name, gname), 0)
    glyph = glyph_set[gname]
    svg_pen = SVGPathPen(glyph_set)
    tpen = TransformPen(svg_pen, Transform(1, 0, 0, -1, x, 0))
    glyph.draw(tpen)
    d = svg_pen.getCommands()
    glyphs.append({
        "char": ch,
        "glyph": gname,
        "x": round(x, 2),
        "advance": adv,
        "path": d,
    })
    x += adv + tracking_units
    prev_name = gname

total_width = x - tracking_units  # no tracking after last glyph

out = {
    "text": TEXT,
    "trackingEm": TRACKING_EM,
    "metrics": metrics,
    "totalWidthUnits": round(total_width, 2),
    "glyphs": glyphs,
}
with open("wordmark.json", "w") as f:
    json.dump(out, f, indent=1)

print("UPM:", upm, "xHeight:", metrics["xHeight"], "cap:", metrics["capHeight"])
print("total width (units):", round(total_width, 1))
for g in glyphs:
    print(f"  {g['char']!r:5} x={g['x']:8.1f} adv={g['advance']:5} pathlen={len(g['path'])}")
