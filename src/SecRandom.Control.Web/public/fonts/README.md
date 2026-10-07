# `public/fonts/`

前端发布的字体。**只有 `.woff2`**，`Vite` 把它们原样拷到站点根下的 `/fonts/`。

| 文件 | 大小 | 覆盖 | `font-display` |
| --- | --- | --- | --- |
| `MiSans-Regular.woff2` | 4.14 MB | 全量（29571 码位） | `swap` |
| `MiSans-Medium.woff2` | 4.18 MB | 全量 | `swap` |
| `MiSans-Semibold.woff2` | 4.24 MB | 全量 | `swap` |
| `FluentSystemIcons-Resizable.woff2` | 4.7 KB | 57 个码位（子集） | `block` |

合计 **11.98 MB**（整改前是 4 个 TTF 共 25.83 MB）。

## 来源与许可

| 文件 | 来源 | 许可 | 我们要守的义务 |
| --- | --- | --- | --- |
| `MiSans-Regular/Medium/Semibold.woff2` | 小米 **MiSans**；原件取自设备端仓库 `SecRandom.Core/Assets/Fonts/` | [MiSans 字体知识产权许可协议](https://hyperos.mi.com/font/faq)（免费商用，**非开源许可**） | ① **在软件中特别注明使用了 MiSans 字体**——控制台侧边栏底部已署名；② 可自由调节粗细／间距，但不得单独改变字体或其组件的外观；③ 完整条款以该许可协议正文为准 |
| `FluentSystemIcons-Resizable.woff2` | Microsoft [fluentui-system-icons](https://github.com/microsoft/fluentui-system-icons)（本仓库只做子集化，见下） | MIT | 分发时保留版权与许可声明 |

两点说明：

- **格式转换不构成"改变外观"**：三个 MiSans 是 TTF → WOFF2 的**无损**转换（轮廓逐点一致，
  由 `scripts/verify-woff2-lossless.py` 断言），码位一个没少；界面渲染的字形与原始 TTF 相同。
- **图标字体是我们自己子集化的**（1.40 MB → 4.7 KB），字形数据仍来自上游 MIT 许可的原字体。

## 为什么要改（2026-02 载荷整改）

原来的四个 `.ttf` 一共 25.8 MB，且 `client-theme.css` 把它们全部声明为
`font-display: block`——首屏要等这三个 8 MB 的中文字体到齐才画字，所以"页面加载慢"
与"字体发虚/发大"是同一件事的两面。

1. **图标字体子集化** 1.40 MB → 4.7 KB（314 倍）。见下。
2. **三个 MiSans 全量转 WOFF2**，约 2 倍无损压缩（轮廓逐点一致）。
   **没有做 CJK 子集化**：这套界面要显示表格里导入的学生/家长姓名，
   任何一个汉字都可能出现，"按仓库里出现过的字"子集化必然漏字。
   全量 WOFF2 保留了 29571 个码位，因此**最坏情况与整改前完全相同**。
3. `font-display` 分档：文字 `swap`（先画出来再换字体），图标保持 `block`。

## 重新生成

需要 `fonttools`（+ `brotli`，WOFF2 必需）：

```bash
pip install fonttools brotli
```

### 图标子集（改了 `fluent-icons.ts` / `console-icons.ts` 之后必须重跑）

```bash
cd src/SecRandom.Control.Web
python scripts/subset-icon-font.py     # 生成 public/fonts/FluentSystemIcons-Resizable.woff2
python scripts/verify-icon-font.py     # 逐字形量轮廓：57/57 命中且非空
```

码位清单由 `scripts/font-extract-codepoints.mjs` 从两张字形表生成，
并逐个到 `artifacts/client-style-preview/fonts/FluentSystemIcons-Resizable.json`
里核对存在性。**两张表是权威清单**——不靠"扫仓库里出现过的字符"来猜。

> ⚠️ 加了新图标名却忘了重跑子集化时，`fluent-icons.spec.ts` 仍然是绿的
> （它只校验名字能解析），但那个字形在字体里不存在，界面上是空的。
> 这一条只能靠"改表 → 重跑脚本"的人工约定，改表时请一并跑一次。

### MiSans 转 WOFF2

```bash
cd src/SecRandom.Control.Web/public/fonts
python -m fontTools.ttLib.woff2 compress MiSans-Regular.ttf -o MiSans-Regular.woff2
# Medium / Semibold 同理
python ../../scripts/verify-woff2-lossless.py   # 证明轮廓逐点一致
```

原件 `.ttf` 不入发布目录。图标字体的原件在
`artifacts/client-style-preview/fonts/`（子集化脚本的默认输入），
MiSans 原件请从 SecRandom 客户端仓库的 `SecRandom.Core/Assets/Fonts/` 取。
