# 自建集控部署与使用

本文面向「自己部署一套集控」的用户：从起服务、初始化、把设备接进来，到排障要看的环境变量与接口语义。

> ℹ️ **本仓库自带「本地账号」身份源，开箱可用。** 照本文部署出来的实例：打开首页 → 初始化向导第一步
> 选「本地账号」→ 设一个本机管理员账号与密码，就能登录并开始接入设备。飞书 / 钉钉模块仍在开发中，
> 想接自己的身份源见 [身份源现状](#身份源现状)。

- 只想跑起来看界面：看 [快速开始](#快速开始)。
- 想接自己的身份源（飞书 / 钉钉）：看 [身份源现状](#身份源现状)。
- 想自己写对接代码：看 [接入协议](#接入协议)。

> 版本号就是部署日期（`2026.10.07` = 2026 年 10 月 7 日那一版），取自构建时 HEAD 的提交日期。
> 页脚与 `GET /v1/meta` 的 `server_version` 都显示它。

## 与官方云的区别

设备控制、集控组、命令总线、播报、期望状态、审计这些能力与身份源无关，自建实例一条不少。区别只在
**账号侧**：官方云用官方账号体系（我们这边接的是思拓创联账号），自建实例用你自己的身份源，账号与数据
都在你手上。云备份、账号资料、用量统计由我们运营，配置不随本仓库发布。

## 快速开始

### Docker（推荐，宿主机不需要 .NET / Node）

```bash
cd deploy && cp .env.example .env && vi .env
docker compose up -d
docker compose logs -f          # 初始化要用的一次性令牌会打在这里
```

### 裸机（.NET 10 运行时 + systemd + nginx）

```bash
node scripts/build-web.mjs                 # 控制台 → artifacts/web
dotnet publish src/SecRandom.Control -c Release -o /opt/secrandom-control
# 用 deploy/secrandom-control.service 起服务，用 deploy/nginx.conf 反代
```

回源要求（**漏一条就会「登录没反应」或「接入码换不到令牌」**）：

| 项 | 要求 |
|---|---|
| 反代路径 | `/api/` 与 `/v1/` **都要**转发到服务端（只转 `/api/` 会让设备通道 404） |
| WebSocket | `/v1/node/connect` 必须支持升级（nginx 需 `Upgrade`/`Connection` 头） |
| 缓存 | `index.html` 与 `version.json` 不缓存，带哈希的静态资源可长缓存 |
| HTTPS | 客户端只接受 `https`/`wss` 并校验**每台客户端自己的信任存储**：自签或内网 CA 证书必须导入每一台机 |
| systemd | 不要开 `MemoryDenyWriteExecute`（.NET JIT 需要 W+X 页，开了服务起不来且报错不说明原因） |

## 初始化（OOBE）

首次打开站点会进初始化向导，三步：**选使用方式 → 填实例信息 → 填安装令牌**。

第一步列出的「使用方式」**由已就位的身份源模块提供**：本仓库自带的 `local` 模块提供「本地账号」；
飞书 / 钉钉模块就位后才会多出对应选项。一个模块都没有时这一步是空的（`modes` 为空），见
[身份源现状](#身份源现状)。

安装令牌（setup token）从哪来：

- 服务端**每次以未初始化状态启动**都会在日志里打印一串新的安装令牌；
- 想自己指定，就设 `CTRL_SETUP_TOKEN`（长度不足 8 会被拒绝启动）。

```bash
docker compose logs secrandom-control | Select-String -Pattern '安装令牌'   # PowerShell
docker compose logs secrandom-control | grep 安装令牌                      # bash
```

**每次以未初始化状态重启都会重新生成令牌，旧的立刻作废**。如果你把日志窗口关了、或者中途重启过服务，
请用最新那串。

选「本地账号」后，向导会让你设本机管理员账号与密码，之后用它在控制台登录。这个模式下不提供成员功能
（邀请、成员列表、转移都不会出现），权限模型是「本机管理员 = 这套实例的 owner」。

## 把设备接进来

1. 控制台 → 进入一个组 → **设备** 页签 → 「接入自建集控」面板 → **生成接入码**。
   接入码形如 `PK4S-23AK`，**默认 15 分钟有效、一次性**；只有该组的管理员能生成。
2. 被控端 `SecRandom` → **设置 → 集控** → 填服务端地址（如 `https://control.example.com`）+ 粘贴接入码
   → 接入。也可以直接粘贴 `srn_` 开头的节点令牌。
3. 接入成功后，设备出现在该组的「已接入设备」里，并按心跳上报**在线状态**与**本机远控开关**。
   平板与桌面走同一设置页；手机端在「远程抽取」页就地给出接入卡片。

撤销：设备行的撤销按钮（`DELETE /v1/groups/{gid}/nodes/{nid}/token`）会让该设备的令牌立即失效，
设备侧显示「需要重新接入」，重新接入要生成新接入码。

## 身份源现状

身份源是插件式的：服务端启动时按程序集名加载模块，由 `CTRL_AUTH_PROVIDER` 点名（不点名时：恰好一个
模块自认为已配置就用它，多个都自认为已配置则拒绝启动——避免含糊地认错身份源）。

| 身份源 | 状态 |
|---|---|
| `local`（本机管理员账号 + 密码） | **随本仓库发布**：`src/SecRandom.Control.Identity.Local/`，构建服务端时自动一起构建并复制进应用目录 |
| `feishu`（飞书）/ `dingtalk`（钉钉） | 开发中，尚未发布 |
| 官方云的账号体系（思拓创联） | 不随本仓库发布 |

想接自己的身份源：实现 `IIdentityProviderModule`
（接口在 `src/SecRandom.Control/Authentication/IIdentityProviderModule.cs`），项目名/程序集名取
`SecRandom.Control.Identity.<名字>`，放在 `src/` 下与 `src/SecRandom.Control/` 同级——服务端构建时会
自动发现同级模块项目并把它的输出复制进应用目录。也可以手工把程序集放进 `SecRandom.Control.dll`
同目录（Docker 路线挂载进容器），再点名它：

```bash
CTRL_AUTH_PROVIDER=local        # 或用模块自己的名字
```

`local` 模式下不提供成员功能（邀请、成员列表、转移都不会出现），权限模型是「本机管理员 = 这套实例的
owner」；`local` 的 user_id 形如 `local:<用户名小写>`，**改名等于换一个身份**。账号存在数据目录的
`auth-local.json`：用户名限 3–32 位（`A-Za-z0-9._-`）、口令 8–256 位，口令只存
PBKDF2-SHA256（210 000 次迭代、随机盐）派生值。

没有可用模块的实例：`GET /api/setup/status` 的 `modes` 为空，提交初始化会返回 `mode_not_available`，
登录入口返回 `503 auth_not_configured`，程序化调用的 Bearer 通道一律 `401`。

## 环境变量

服务端读环境变量（也支持同名配置键）。下表是自建常用项，括号里是默认值。

| 变量 | 作用 |
|---|---|
| `CTRL_DATA_ROOT`（`/var/lib/secrandom-control`） | 数据目录：`control.db`、签名密钥、会话、审计都在这里，**必须持久化** |
| `CTRL_LISTEN_URL`（`http://127.0.0.1:8791`） | 监听地址；放在反代后面就保持只听本机 |
| `CTRL_AUTH_COOKIE_SECURE`（`true`） | 会话 Cookie 是否只走 HTTPS；**只在本地 http 试跑时**设 `false` |
| `CTRL_AUTH_PROVIDER` | 身份源名（`local` / `feishu` / `dingtalk` / 官方云） |
| `CTRL_SETUP_TOKEN` | 预设安装令牌；不设就每次未初始化启动重新生成 |
| `CTRL_SIGNING_KEY_PATH` | 签名密钥路径（下发给设备的策略/名单要签名，验签失败设备即拒绝） |
| `CTRL_NODE_ENROLLMENT_ENABLED`（`true`） | 是否允许设备用接入码换令牌（仅本地身份源实例对外开放） |
| `CTRL_ENROLLMENT_CODE_LIFETIME_MINUTES`（`15`，1–120） | 接入码有效期 |
| `CTRL_NODE_TOKEN_LIFETIME_DAYS`（`180`，1–3650） | 节点令牌有效期 |
| `CTRL_NODE_ENROLL_HIDE_GROUP_NAME`（`false`） | 接入响应里是否隐藏组名 |
| `CTRL_ENROLLMENT_CODE_REUSABLE`（`false`） | **仅验收/测试用**：放宽接入码的一次性语义；生产环境不要打开 |
| `CTRL_NODE_AUTO_REGISTER`（`true`） | 未登记的设备是否允许走旧的握手自动注册通道 |
| `CTRL_NODE_OFFLINE_AFTER_SECONDS` | 判定离线的心跳超时（默认 75 s = 心跳 25 s × 3） |
| `CTRL_MAX_OWNED_GROUPS_PER_USER` | 单个用户可拥有的组数上限 |
| `CTRL_AUDIT_RETENTION_DAYS`（`30`） | 审计保留天数 |

## 接入协议

对接自己的客户端或脚本时，只需要这些：

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/v1/node/enroll` | **匿名**，仅本地身份源 + 开启接入时可用；body `{code, node_id, platform, version, display_name}`，成功 `201` 返回 `{node_id, group_id, group_name, node_token, expires_at}` |
| `GET` | `/v1/meta` | 实例元信息，含 `auth_mode`、`node_enrollment`、`server_version` |
| `WS` | `/v1/node/connect` | 节点通道；`Authorization: Bearer srn_…`；首帧 `hello` → `hello.ack{heartbeat_seconds, offline_after_seconds}` |
| `GET` | `/v1/groups/{gid}/nodes` | 组内设备及其 `online` / `local_remote_allowed` / `enrolled` / `token_state` |
| `POST` | `/v1/groups/{gid}/nodes/{nid}/commands` | 向设备下发命令 |
| `GET` | `/v1/groups/{gid}/commands/{cid}` | 查命令结果 |
| `POST` | `/v1/groups/{gid}/enrollment-codes` | 生成接入码（`201`）；`GET` 同路径返回**裸数组**，`DELETE …/{code}` → `204` |
| `DELETE` | `/v1/groups/{gid}/nodes/{nid}/token` | 撤销该设备令牌（`204`） |

节点令牌格式 `srn_<tokenId>_<secret>`：`tokenId` 16 字节、`secret` 32 字节，都按十六进制编码；
服务端只存 `SHA-256(secret)` 并用定长比较。**节点令牌不携带角色**：它能看到什么由白名单决定——
只允许 `GET /v1/groups`（按令牌的组过滤，只回它自己那一个组）、`GET /v1/groups/{gid}/nodes`、
`GET …/nodes/{nid}`、`GET …/members`、`GET …/events`、`GET …/commands/{cid}`、
`POST …/nodes/{nid}/commands` 与 `/v1/node/*`；其余一律 `403`。

## 安全与数据

- **服务端只存摘要**：节点令牌的明文不进 `control.db`，库里只有 `SHA-256(secret)` 与令牌元数据。
- **客户端加密落盘**：节点令牌存在被控端自己的加密存储里（AES-256-GCM，密钥文件同目录且 ACL 只留
  系统/管理员/当前用户），**不会**出现在设置导出、云备份、诊断包里；界面也没有任何回显令牌的控件。
- **本地身份源的 user_id 是 `local:<用户名小写>`**：改名等于换一个身份，权限归属不会跟着走。
- **权力在设备手上**：设备本机有远控总开关，控制台看到的是它上报的状态；关掉开关，服务端下发也无效。

## 排障

| 现象 | 先看这里 |
|---|---|
| 打开首页 404 / 空白 | SPA 产物没构建或没复制进 `wwwroot`；服务端只在启动时存在 `wwwroot` 才注册静态文件，**先构建再启动** |
| 登录点了没反应 | 反代只转了 `/api/`，漏了 `/v1/`；看浏览器 Network 里请求打到哪 |
| 向导报「安装令牌不正确」 | 令牌随每次未初始化启动重新生成，用日志里最新那串 |
| 设备一直「已接入但离线」 | 设备侧的节点通道没连上：地址应是 `https`/`wss`，且证书已在设备信任存储里 |
| 接入码报「已被使用」 | 接入码一次性；重新生成一个（或确认是不是同一台设备重复接入） |

## 还没做完

- 飞书 / 钉钉身份源；
- 节点令牌轮换与周期重认证（当前只有显式撤销 + 到期）；
- 客户端令牌存储的平台级加固（计划在目录 ACL 之上再绑系统密钥）；
- 控制台对「手机接入（控制端）」与「离线被控端」的展示区分。

协议规范正文与设计文档在私有仓库维护（改协议先改规范、再改实现）。
