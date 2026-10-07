# 许可（分层）

本仓库**不是单一许可证**，按目录划分：

| 路径 | 内容 | 许可 | OSI 开源 |
|---|---|---|---|
| `src/SecRandom.Control.Web/` | Web 控制台 | [AGPL-3.0](LICENSE) | 是 |
| `deploy/`、`scripts/`、根目录文档 | 部署配置、构建脚本、自建文档 | [AGPL-3.0](LICENSE) | 是 |
| `src/SecRandom.Control/` | 集控服务端实现 | [Elastic License 2.0](src/SecRandom.Control/LICENSE) | 否（source-available） |
| `src/SecRandom.Control.Identity.Local/` | 本地账号身份源模块（服务端插件，随服务端一起构建进产物） | [Elastic License 2.0](src/SecRandom.Control/LICENSE) | 否（source-available） |

服务端与控制台是两个独立程序（C# 服务进程 + 浏览器里的 JS 应用），只通过 HTTP 与 WebSocket 通信：
同仓库、同镜像属于**聚合分发**，各部分许可各自生效，不产生新的合并作品，所以这张表可以这么分。

## 三条硬约束

- ❌ **不得把服务端（Elastic-2.0）与控制台（AGPL-3.0）的代码合并进同一个程序**，也不要跨这两个目录
  共享源文件或源码级 include——AGPL-3.0 是强 copyleft、Elastic-2.0 限制托管服务，两者无法同时满足。
- ❌ **不得把客户端（GPL-3.0）的代码抄进服务端（Elastic-2.0）**。需要同样的能力，就在服务端按协议
  重新实现。
- ⚠️ **身份源模块与服务端同侧**：本仓库发布的 `src/SecRandom.Control.Identity.Local/` 是 Elastic-2.0
  一侧的代码（它以插件方式加载进服务端进程）。自己写的其它身份源模块（飞书 / 钉钉等）也应与服务端
  保持同一许可策略，且不得引入 `src/SecRandom.Control.Web/` 的 AGPL-3.0 源码。
- ⚠️ 控制台里的 [`client-settings-pages.ts`](src/SecRandom.Control.Web/src/data/client-settings-pages.ts)
  与 [`client-setting-option-labels.ts`](src/SecRandom.Control.Web/src/data/client-setting-option-labels.ts)
  是客户端设置页的静态快照（GPL-3.0 作品的衍生数据），**必须留在 AGPL-3.0 一侧**（GPLv3 §13 与
  AGPLv3 §13 允许互相组合），不得挪进 `src/SecRandom.Control/`。

容器镜像同时装服务端二进制与控制台静态产物 = 聚合，**可以**；对外提供服务时控制台那部分的源码就是本
仓库，AGPL-3.0 要求的"对应源码"由此满足。自己写兼容实现、自建实例改服务端或控制台，各自遵守各自目录
的许可即可。

## 自建用户可以做什么

**可以**（不需要申请）：下载源码自己审／改／编译；在教室、学校、公司内网部署（单机、虚拟机、容器，
可离线、可不暴露公网）；把源码或你改过的版本交给别人（附许可全文并注明你改过）；用它管理你自己的
设备。

**不可以**：把本软件（含修改版）作为**托管／代管服务**提供给第三方使用其实质功能；移除或遮盖版权与
许可声明；用 SecRandom / SECTL 的名义暗示我们为你背书（商标权不在本许可范围内）。

> 让集成商**在你自己拥有的服务器上**装一套（学校找人在校园内网部署），不属于"托管服务"：服务器和
> 数据的控制权仍在你手里。判断标准是"最终用户通过谁的服务器访问这套系统的功能"。

## 相关仓库与第三方内容

客户端（[SECTL/SecRandom](https://github.com/SECTL/SecRandom)，GPL-3.0）与本仓库的服务端、控制台
只通过网络通信，是各自独立的程序，互不传染许可。官方托管服务（`secrandom-control.sectl.cn`）不适用
本仓库的许可，它是我们自己的运营实例。

服务端依赖 `Microsoft.Data.Sqlite`、`BouncyCastle.Cryptography`（均 MIT），控制台依赖见其
`package.json`；界面字体 `MiSans`（小米，非开源许可）与 `FluentSystemIcons`（MIT）的来源与义务见
[`public/fonts/README.md`](src/SecRandom.Control.Web/public/fonts/README.md)——控制台侧边栏底部已按
MiSans 许可要求署名。第三方组件的许可不因本仓库的分层而改变。

---

许可不是法律意见。场景处于灰区（尤其是"给别人部署"这类）时，先看
[Elastic License 2.0 正文](src/SecRandom.Control/LICENSE)，必要时咨询自己的法务。
