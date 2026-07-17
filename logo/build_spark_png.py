#!/usr/bin/env python3
"""Chrome-render the Spark SVG masters to exact-size PNGs (transparent bg).

Mirrors the Space Point png/ set: bare mark 16..1024 + navy tile 180/512/1024.
Requires Google Chrome (headless). Output: logo/png/sivrce-spark-*.png
"""
import os, subprocess, sys, tempfile

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = "png"
SIZES_MARK = [16, 32, 64, 128, 256, 512, 1024]
SIZES_TILE = [180, 512, 1024]

HTML = """<!DOCTYPE html><html><body style="margin:0">
<img src="{src}" width="{n}" height="{n}" style="display:block">
</body></html>"""

def render(svg, n, out):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, dir=".") as f:
        f.write(HTML.format(src=os.path.abspath(svg), n=n))
        tmp = f.name
    try:
        subprocess.run([
            CHROME, "--headless", "--disable-gpu", "--force-device-scale-factor=1",
            f"--screenshot={out}", f"--window-size={n},{n}",
            "--default-background-color=00000000",
            f"file://{os.path.abspath(tmp)}",
        ], check=True, capture_output=True)
        print("rendered", out)
    finally:
        os.unlink(tmp)

def main():
    if not os.path.exists(CHROME):
        sys.exit("Chrome not found")
    os.makedirs(OUT, exist_ok=True)
    for n in SIZES_MARK:
        render("assets/sivrce-spark.svg", n, f"{OUT}/sivrce-spark-{n}.png")
    for n in SIZES_TILE:
        render("assets/sivrce-spark-navy.svg", n, f"{OUT}/sivrce-spark-navy-{n}.png")
    print("done")

if __name__ == "__main__":
    main()
