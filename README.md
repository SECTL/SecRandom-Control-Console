# SecRandom Control Console

SecRandom 集控的 Web 控制台与协议规范。

> 本仓库开源（[AGPL-3.0](LICENSE)），因为它**不持有任何特权**：它只是一个 OAuth public client，
> 权限由服务端强制，危险操作由设备本地授权决定。
>
> **服务端实现是专有的**，在私有仓库 [`SECTL/SecRandom-Control`](https://github.com/SECTL/SecRandom-Control)。

**当前状态：仓库已创建，内容待补。** 协议规范、控制台与协议 mock server 将陆续加入。

## 计划包含

| 目录 | 内容 |
|---|---|
| `docs/protocol/` | control-v1 协议规范（权威版本） |
| `protocol/` | OpenAPI 描述 |
| `tools/mock-server/` | 协议的可执行契约 |
| `src/` | Web 控制台（计划 Vue 3 + TypeScript + Vite） |

## 信任边界

- **控制台不是特权组件**：拿到的令牌只能做服务端允许的事，没有组密钥、没有设备密钥。
- **服务端也不是特权组件**：客户端不因为"它来自服务端"就接受下发内容——策略与名单包必须带签名，
  验签失败即拒绝；任何改变设备行为的操作都要先过设备本地的授权表。
- **改协议 = 先改公开规范，再改实现。** 反向顺序会让公开契约与实现漂移。

## 贡献

协议讨论、兼容服务端实现、控制台贡献都欢迎。安全漏洞请走私下渠道，见 [SECURITY.md](SECURITY.md)。
