# 部署

> 这里是**自建**：把集控部署到你自己的服务器上。官方托管（`secrandom-control.sectl.cn`）是另一条路，
> 用户不需要看这一页；如果你要用的是官方托管，照常用即可。

这里的 Dockerfile、`docker-compose.yml`、systemd unit 与 nginx 配置能把这套服务端跑起来。
配置项都在 [`.env.example`](.env.example) 里（**全是环境变量**，服务端不读 `appsettings.json`），
里面有分组注释，逐项说明"这是什么、不填会怎样"。

版本号就是**部署日期**（`2026.10.07` 读作"2026 年 10 月 7 日这一版"），页脚与
`GET /v1/meta` 的 `server_version` 都能看到。默认直接从镜像源拉取，宿主机不需要 .NET 与 Node：

```bash
cd deploy
cp .env.example .env && chmod 600 .env
vi .env                                  # 逐行注释说明了每一项不填会怎样
docker compose up -d
docker compose logs -f control           # 看到监听 8791 即可
curl -fsS http://127.0.0.1:8791/healthz
```

想钉住某一版就写进 `.env`（同一份 compose 文件，不用改 compose）：

```bash
CTRL_IMAGE_TAG=2026.10.07                # 也可用 latest / 具体的 commit sha
```

只有你要**自己改代码、自己出镜像**时才需要本地构建（要装 Docker 且首次构建较慢）：

```bash
cd deploy
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

就这几条。**完整的构建、systemd + nginx、备份恢复、升级回滚与排障手册不随本仓库发布**，
请看 <https://secrandom.sectl.cn/doc/control/self-host>。

## 镜像与发布

镜像在 GitHub Container Registry：`ghcr.io/sectl/secrandom-control-console`，每个版本三个 tag ——
`<部署日期>`（钉版本）、`<commit sha>`（可追溯）、`latest`（跟最新）。仓库里的
`.github/workflows/release.yml` 负责这件事：推一个形如 `v2026.10.07` 的 tag 就会自动

1. 用 tag 里的日期编译（`-p:VersionDate=`），并校验二进制里的版本号与 tag 一致；
2. 建 Release，附件是 `secrandom-control-2026.10.07-linux-x64.tar.gz`（自包含，解包即用）、
   `version.json`、`SHA256SUMS`；
3. 把镜像推到 GHCR 的上述三个 tag。

所以**装的是哪一版，页脚就写着哪一天**，不必去翻发布记录。

> 首次发布后要把这个 package 的可见性改成 public（GitHub → Packages → 该 package → Package
> settings → Danger Zone → Change visibility），否则仓库外的用户 `docker pull` 会 403。

## 系统要求

| 项 | 要求 |
|---|---|
| 宿主机 | 64 位 Linux（x86_64 / arm64）。Docker Engine + Compose v2 插件；宿主机不需要 .NET 与 Node |
| 资源 | 1 核 / **512 MB 内存**够跑（服务端空载几十 MB）；磁盘留 5 GB 以上，数据在命名卷里且**必须持久化** |
| 网络（拉镜像） | 能访问 `ghcr.io`。完全离线的内网就用 Release 附件里的 tar.gz 裸机跑，或在一台能出网的机器上 `docker save` 后搬进去 |
| 构建机（仅本地构建需要） | 首次构建要拉基础镜像、装 npm 依赖、`dotnet publish`：建议 4 GB 内存以上 |
| 证书 | 客户端只接受 `https`/`wss`，且校验的是**每台机器自己的信任存储**——自签或内网 CA 证书要导入每一台客户端 |
| 网络 | 教室机能出站访问到你发布的域名；反向代理那层需要 443（以及 80 用于 ACME 验证） |

裸机路线额外需要：**.NET 10 运行时**（运行）、**.NET SDK ≥ 10.0.103** 与 **Node 20.19+**（构建）、
**nginx ≥ 1.25.1**。逐项说明见上面那份手册。

## 五条容易踩的坑

- 客户端只接受 `https://`，或 `http://127.0.0.1`：填内网明文地址（`http://192.168.x.x:8791`）会被
  客户端直接拒绝，所以内网多机必须给 TLS 证书。
- 自签 / 内网 CA 的证书要**导入每一台客户端机器**的「受信任的根证书颁发机构（本地计算机）」：
  客户端走系统信任存储校验，代码里没有绕过开关，证书不受信就是握不上手。
- 端口默认只绑 `127.0.0.1:8791`，外部访问一律走反向代理；别改成 `0.0.0.0` 了事。
- 数据在命名卷 `control-data` 里，升级用 `docker compose pull && docker compose up -d`，数据不动
  （本地构建那条路线同样不会碰数据卷）。
- 镜像里已经包含构建好的控制台，宿主机不需要装 Node；版本号即部署日期，升级前记一下现在页脚写的是哪天。

> **当前状态**：容器能起来、控制台首页能打开，但**自建登录还没做完**：现在的代码里没有任何身份源，
> 登录入口返回 `503 auth_not_configured`。自建要用的本地账号 / 飞书 / 钉钉正在做——现在适合跑通部署
> 链路、评估运维方式，不适合直接给学生用。
