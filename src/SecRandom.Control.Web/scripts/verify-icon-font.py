"""核验：子集化后的图标字体里，两张表映射到的**每一个**码位都还在，而且有真实轮廓。

"还在 cmap 里"不够——字形可能是空轮廓（界面上就是一个空位）。
所以逐个量一遍轮廓包围盒，全为 0 才算失败。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
FONT = WEB / "public" / "fonts" / "FluentSystemIcons-Resizable.woff2"


def main() -> int:
    result = subprocess.run(
        ["node", str(HERE / "font-extract-codepoints.mjs")],
        cwd=WEB, capture_output=True, text=True, check=True,
    )
    wanted = [int(t.strip()[2:], 16) for t in result.stdout.strip().split(",") if t.strip()]

    font = TTFont(FONT)
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()

    missing, empty = [], []
    for cp in wanted:
        name = cmap.get(cp)
        if name is None:
            missing.append(cp)
            continue
        pen = BoundsPen(glyph_set)
        glyph_set[name].draw(pen)
        if pen.bounds is None:
            empty.append(cp)

    print(f"font            : {FONT.name} ({FONT.stat().st_size:,} bytes)")
    print(f"glyphs in cmap  : {len(cmap)}")
    print(f"requested       : {len(wanted)}")
    print(f"missing         : {len(missing)} {[hex(c) for c in missing]}")
    print(f"empty outlines  : {len(empty)} {[hex(c) for c in empty]}")

    if missing or empty:
        print("FAIL", file=sys.stderr)
        return 1
    print("OK — 每个映射到的码位都有非空轮廓")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
