"""图标字体子集化：把 FluentSystemIcons-Resizable 收成"界面真正会画的 57 个码位"。

跑法（在 src/SecRandom.Control.Web 下）：

    python scripts/subset-icon-font.py

码位清单由 `scripts/font-extract-codepoints.mjs` 从两张字形表生成；
这里不自己猜码位，也不扫描仓库文本——两张表就是权威清单。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
REPO = WEB.parent.parent
FONTS = WEB / "public" / "fonts"

# 子集化的**输入**是原件。原件不再随前端发布（`public/fonts/` 只留 .woff2），
# 因此默认去仓库里的复刻稿资产目录取；如果谁把原件放回了 public/fonts，也认。
SRC_CANDIDATES = [
    FONTS / "FluentSystemIcons-Resizable.ttf",
    REPO / "artifacts" / "client-style-preview" / "fonts" / "FluentSystemIcons-Resizable.ttf",
]
OUT = FONTS / "FluentSystemIcons-Resizable.woff2"


def codepoints() -> list[str]:
    result = subprocess.run(
        ["node", str(HERE / "font-extract-codepoints.mjs")],
        cwd=WEB,
        capture_output=True,
        text=True,
        check=True,
    )
    sys.stderr.write(result.stderr)
    return [token.strip() for token in result.stdout.strip().split(",") if token.strip()]


def main() -> int:
    src = next((c for c in SRC_CANDIDATES if c.exists()), None)
    if src is None:
        print("找不到原始图标字体，试过：", file=sys.stderr)
        for c in SRC_CANDIDATES:
            print(f"  {c}", file=sys.stderr)
        return 1

    codes = codepoints()
    if not codes:
        print("没有抽到任何码位，拒绝子集化", file=sys.stderr)
        return 1

    before = src.stat().st_size
    tmp = OUT.with_suffix(".woff2.tmp")

    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(src),
        f"--unicodes={','.join(codes)}",
        f"--output-file={tmp}",
        "--flavor=woff2",
        # 保留 name 表：fonts 面板 / devtools 里要能看出这是什么字体
        "--name-IDs=*",
        "--layout-features=*",
        # 不留提示指令：图标是纯几何字形，hinting 对小字号没有可见收益
        "--no-hinting",
        "--desubroutinize",
        "--drop-tables+=DSIG",
        "--notdef-outline",
        "--recalc-bounds",
    ]
    print("pyftsubset", " ".join(cmd[3:]), file=sys.stderr)
    subprocess.run(cmd, check=True)
    tmp.replace(OUT)

    after = OUT.stat().st_size
    print(f"{src.name}: {before:,} -> {OUT.name}: {after:,} bytes "
          f"({before / after:.1f}x, -{100 * (1 - after / before):.1f}%)")
    print(f"glyphs requested: {len(codes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
