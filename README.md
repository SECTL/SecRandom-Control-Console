# SecRandom Control Console

集控是 [SecRandom](https://github.com/SECTL/SecRandom) 的集中管理端：面向「一校多机、多教室」的
部署，用一套 Web 界面统一查看设备状态、下发抽取策略与名单、执行远程操作，而不必逐台走到机器前。

本仓库包含集控的**服务端实现与 Web 控制台**——也就是说，**可以自己部署**。

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Server: Elastic-2.0](https://img.shields.io/badge/server-Elastic--2.0-lightgrey.svg)](src/SecRandom.Control/LICENSE)

## 三种跑法

| | 身份来源 | 谁在跑 | 现状 |
|---|---|---|---|
| **官方云** | 官方账号体系（OAuth；我们这边接的是思拓创联账号） | 我们的实例 `secrandom-control.sectl.cn` | 生产可用；运营配置不随本仓库发布 |
| **自建** | 自有登录：本地账号 / 飞书 / 钉钉 | 你自己 | **开发中**（尚未可用） |
| **客户端** | — | `SecRandom`（被控端 Agent） | 生产可用，连官方云即可 |

自建与官方云的区别只在**账号侧**：官方云用官方账号体系；自建实例用你自己的身份源，账号与数据都在
你手上。设备控制、集控组、命令总线、播报、期望状态、审计这些能力与身份源无关，自建实例一条不少；
官方云多出来的云备份、账号资料、用量统计由我们运营，运营配置不随本仓库发布。

## 当前状态

服务端实现已在本仓库，且**不含任何专有身份源代码**：身份源是插件式的，按程序集
`SecRandom.Control.Identity.<名字>` 在启动时加载，由 `CTRL_AUTH_PROVIDER` 点名。因此本仓库里的服务端
**能编译、能启动，但没有任何身份源**——登录入口返回 `503 auth_not_configured`，程序化调用的 Bearer
通道一律 `401`。

自建所需的首次启动引导（OOBE）与 `local` / `feishu` / `dingtalk` 三种身份源、设备接入码换节点令牌
正在做，适合先跑通部署链路；在这些落地之前，自建实例只能跑到上面那个"未配置身份源"的状态，**不能
登录、不能正式上线**。完整部署手册与设计进度不随本仓库发布。

## 自己构建

前置：**.NET SDK ≥ 10.0.103**、**Node ≥ 20.19**（[`global.json`](global.json) 固定 SDK 版本）。

```bash
node scripts/build-web.mjs            # 控制台 → artifacts/web（.NET 构建时自动复制进 wwwroot）
dotnet build SecRandom.Control.slnx
dotnet run --project src/SecRandom.Control
```

只想改服务端、不动前端时，跳过第一步也能编译：SPA 产物存在才复制，不存在时服务端照常构建
（只是打开首页没有界面）。

## 版本号与发布

**版本号就是部署日期**：`2026.10.07` 读作"2026 年 10 月 7 日发出去的那一版"。服务端把它编进程序集，
控制台页脚与 `GET /v1/meta` 的 `server_version` 都显示它——排障时不用问"你装的是哪个版本"，看一眼
页脚的日期就知道该不该升级。日期取自 **HEAD 的提交日期**（不是"构建当天的挂钟"），所以同一个提交在
任何机器上构建都得到同一个版本号。

推一个形如 `v2026.10.07` 的 tag 就会自动发一版（[`.github/workflows/release.yml`](.github/workflows/release.yml)）：

- Release 附件 → `secrandom-control-2026.10.07-linux-x64.tar.gz`（自包含，解包即用）、`version.json`、`SHA256SUMS`；
- 容器镜像 → `ghcr.io/sectl/secrandom-control-console:2026.10.07`（另有 `:<commit sha>` 与 `:latest`）。

Docker 路线默认就是拉这个镜像，宿主机不必装 .NET / Node：

```bash
cd deploy && cp .env.example .env && vi .env
docker compose up -d                     # 想钉版本：在 .env 里写 CTRL_IMAGE_TAG=2026.10.07
```

## 部署要求

| 项 | 要求 |
|---|---|
| 服务器 | 64 位 Linux（x86_64 / arm64）；Windows 未做部署验证 |
| 资源 | 1 核 / 512 MB 内存够跑（服务端空载几十 MB）；磁盘留 5 GB 以上，数据目录必须持久化 |
| Docker 路线 | Docker Engine + Compose v2 插件；**默认拉取 `ghcr.io/sectl/secrandom-control-console`，宿主机不需要 .NET 与 Node**，能出网访问 `ghcr.io` 即可；自己构建才需要 4 GB 内存以上的构建机 |
| 裸机路线 | 运行：**.NET 10 运行时** + systemd + **nginx ≥ 1.25.1**；构建机另需 **.NET SDK ≥ 10.0.103** 与 **Node ≥ 20.19** |
| 证书 | 客户端只接受 `https`/`wss`，并校验**每台客户端自己的信任存储**：自签或内网 CA 证书要导入每一台机 |

部署方式见 [`deploy/`](deploy/)；逐项说明见 [自部署手册](https://secrandom.sectl.cn/doc/control/self-host)。

## 信任边界

这是本项目的核心设计前提，也是控制台能按 AGPL-3.0 开源的原因：

- **控制台不是特权组件。** 它只是一个 OAuth public client（官方云接的是思拓创联账号），拿到的令牌只能做服务端允许的事；
  它不持有组密钥、设备密钥，任何「把密钥放进前端」的改动都与设计相悖。
- **服务端是唯一的授权判定点。** 谁能控制哪台设备，只由服务端裁决；客户端不会因为「来自服务端」
  就服从。它有特权，所以它的许可与前端不同（[Elastic License 2.0](src/SecRandom.Control/LICENSE)：
  可自建、可改，不可拿去做托管服务卖）。
- **权力在设备手上。** 下发给设备的策略与名单必须带签名，验签失败即拒绝；任何改变设备行为的操作，
  都要先过设备本地的授权表——服务端被攻破或被替换，也不能单方面接管一台设备。
- **危险操作要确认。** 远程锁定抽取、下发名单、重启设备这类操作必须在界面上二次确认，并明确显示
  目标设备。

## 仓库结构

| 路径 | 内容 | 许可 |
|---|---|---|
| `src/SecRandom.Control/` | 服务端（ASP.NET Core，.NET 10，SQLite） | Elastic-2.0 |
| `src/SecRandom.Control.Web/` | Web 控制台（Vue 3 + Vite + Tailwind v4） | AGPL-3.0 |
| `deploy/`、`scripts/` | 部署配置与控制台构建脚本 | AGPL-3.0 |

`control-v1` 的协议规范正文、自建集控的设计与部署手册都**不在本仓库**（协议规范只在私有仓库
维护，改协议时先改规范、再改实现）；自建用户请看 <https://secrandom.sectl.cn/doc/control/self-host>。

## 相关仓库

客户端 [SECTL/SecRandom](https://github.com/SECTL/SecRandom)：设备端主程序 + 集控被控端 Agent
（GPL-3.0）。使用文档与自部署说明在 <https://secrandom.sectl.cn/>。

## 许可

| 部分 | 许可 |
|---|---|
| 服务端 `src/SecRandom.Control/` | [Elastic License 2.0](src/SecRandom.Control/LICENSE)（源码可见、可自建、不可托管转售） |
| 控制台 `src/SecRandom.Control.Web/`、`deploy/`、`scripts/`、文档 | [AGPL-3.0](LICENSE) |

被控端客户端（`SecRandom`，GPL-3.0）与本仓库的程序**只通过网络通信**，是各自独立的程序：服务端选
Elastic-2.0 不会影响 GPL-3.0 客户端的许可，反之亦然。哪些代码不能合并、给学校内网装一套算不算托管，
见 [LICENSING.md](LICENSING.md)；字体等第三方内容的署名见
[`public/fonts/README.md`](src/SecRandom.Control.Web/public/fonts/README.md)。

## 反馈

欢迎通过 [Issues](https://github.com/SECTL/SecRandom-Control-Console/issues) 反馈问题或讨论部署与自建。
安全问题请勿公开提 Issue，见 [SECURITY.md](SECURITY.md)。
