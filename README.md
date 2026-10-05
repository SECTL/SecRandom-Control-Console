# SecRandom Control Console

SecRandom 集控

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

> 本仓库开源（[AGPL-3.0](LICENSE)），因为它**不持有任何特权**：它只是一个 OAuth public client，
> 权限由服务端强制，危险操作由设备本地授权决定。

## 这是什么

[SecRandom](https://github.com/SECTL/SecRandom) 是面向教室、会议等场景的公平随机抽取工具。

**集控**是它的集中管理端：面向「一校多机、多教室」的部署，用一套 Web 界面统一查看设备状态、
下发抽取策略与名单、执行远程操作，而不必逐台走到机器前。

本仓库是集控的**客户端部分**，即 Web 控制台与公开的协议规范；服务端实现不在本仓库。

## 当前状态

集控的主体功能已完成（2026-10-05），但出于上线时间安排，SecRandom 初版集控暂不开源。

因此本仓库目前只包含许可、信任边界声明与这份说明，**暂无可运行代码**。
后续条件允许时，会修改部分代码后再于本仓库开源，届时补齐控制台源码与协议规范。

## 信任边界

这是本项目的核心设计前提，也是本仓库可以开源的原因：

- **控制台不是特权组件。** 它只是一个 OAuth public client，拿到的令牌只能做服务端允许的事；
  它不持有组密钥、设备密钥，任何「把密钥放进前端」的改动都与设计相悖。
- **服务端也不是特权组件。** 客户端不会因为「内容来自服务端」就接受它：下发给设备的策略与名单必须带签名，
  验签失败即拒绝；任何改变设备行为的操作，都要先过设备本地的授权表。
- **危险操作要有确认。** 远程锁定抽取、下发名单、重启设备这类操作必须在界面上二次确认，并明确显示目标设备。

也就是说，前端被攻破不等于设备被攻破——能造成多大后果，由服务端权限与设备本地策略共同决定。

## 后续计划

条件允许时，本仓库将开源控制台的相关部分，计划包含：

| 目录 | 内容 |
|---|---|
| `docs/protocol/` | control-v1 协议规范（权威版本） |
| `protocol/` | API 描述 |
| `tools/mock-server/` | 协议的可执行契约 |
| `src/` | Web 控制台源码 |

> 改协议时先改公开规范，再改实现

## 仓库结构

当前仓库只有骨架，尚无代码：

| 路径 | 内容 |
|---|---|
| `README.md` | 项目说明（本文件） |
| `LICENSE` | [AGPL-3.0](LICENSE) 许可证全文 |
| `.editorconfig`、`.gitattributes`、`.gitignore` | 编辑器、换行与忽略配置 |

## 相关仓库

| 仓库 | 说明 |
|---|---|
| [SECTL/SecRandom](https://github.com/SECTL/SecRandom) | 设备端主程序 |
| `SECTL/SecRandom-Control` | 集控服务端，专有实现，私有仓库 |

文档：<https://secrandom.sectl.cn/>

## 许可

[AGPL-3.0](LICENSE)

## 反馈与讨论

欢迎通过 [Issues](https://github.com/SECTL/SecRandom-Control-Console/issues) 反馈问题或讨论协议设计。
