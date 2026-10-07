# syntax=docker/dockerfile:1
#
# SecRandom 集控 · 自建镜像
#
#   构建上下文必须是**仓库根目录**（不是 deploy/）：
#     docker build -f deploy/Dockerfile -t secrandom-control .
#   走 compose 自己构建（官方发布件不够用时）用 build 覆盖文件：
#     docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.build.yml up -d --build
#   （只写 docker-compose.yml 时是**拉 GHCR 官方镜像**，不构建）
#
# 三段式：控制台（Node）→ 服务端（.NET SDK）→ 运行时（ASP.NET）。
# 控制台产物落在 artifacts/web，服务端项目构建时会把它复制进 wwwroot —— 与本地
# `node scripts/build-web.mjs && dotnet publish` 完全同一条路，不维护第二条构建流程。
#
# 版本号 = 部署日期（`2026.10.07`，见根目录 Directory.Build.props）：
#   · `.dockerignore` 排除了 `.git`（镜像里不该有仓库元信息，上下文也更小），
#     所以容器里**算不出提交日期**，只能由构建方把日期传进来；
#   · 不传 `VERSION_DATE` 就是"构建当天的本地日期"，够用但不保证可复现；
#   · 发布流水线按 tag 传 `VERSION_DATE=2026-10-07`，让镜像里的版本号与 tag 严格一致。

# ── 1. 控制台 SPA ────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS web

WORKDIR /src

# 先只复制清单，让 npm ci 这一层能进缓存（改源码不必重装依赖）。
COPY src/SecRandom.Control.Web/package.json src/SecRandom.Control.Web/package-lock.json ./src/SecRandom.Control.Web/
RUN npm --prefix src/SecRandom.Control.Web ci --no-audit --no-fund

COPY src/SecRandom.Control.Web ./src/SecRandom.Control.Web
COPY scripts ./scripts

# --skip-install：依赖上面已经装好了。
RUN node scripts/build-web.mjs --skip-install

# ── 2. 服务端 ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# 版本号日期（yyyy-MM-dd）。空 = 用构建当天的本地日期。
ARG VERSION_DATE=""

COPY global.json Directory.Build.props Directory.Packages.props SecRandom.Control.slnx ./
COPY src/SecRandom.Control ./src/SecRandom.Control

RUN dotnet restore src/SecRandom.Control/SecRandom.Control.csproj

# ⚠️ 必须在 publish 之前：csproj 里 artifacts/web 的存在性是在求值阶段判断的，
#    晚一步复制进来就等于"没有前端"（首页 404，且构建不会报错）。
COPY --from=web /src/artifacts ./artifacts

# `VersionDate=$VERSION_DATE` 会覆盖 Directory.Build.props 的日期推导；
# 传空串时那里回落到构建当天的本地日期。
RUN dotnet publish src/SecRandom.Control/SecRandom.Control.csproj \
        -c Release -o /app --no-restore \
        -p:VersionDate="$VERSION_DATE"

# ── 3. 运行时 ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

ARG VERSION_DATE=""
ARG VCS_REF=""

# 镜像自带的版本标记：`docker inspect` 与 `GET /v1/meta` 能对上，排障时不用进容器翻文件。
LABEL org.opencontainers.image.title="SecRandom Control" \
      org.opencontainers.image.source="https://github.com/SECTL/SecRandom-Control-Console" \
      org.opencontainers.image.version="${VERSION_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}"

# curl 只为 HEALTHCHECK：docker compose ps 能直接看出实例是死是活。
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app ./

ENV CTRL_DATA_ROOT=/data \
    CTRL_LISTEN_URL=http://0.0.0.0:8791 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0

# 数据根目录：SQLite 库、会话、Data Protection 密钥环、首次启动要写 instance.json。
# 丢了它 = 所有人重新登录、所有设备需要重新接入 —— 必须挂卷。
RUN mkdir -p /data && chown app:app /data
VOLUME ["/data"]

USER app
EXPOSE 8791

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8791/healthz || exit 1

ENTRYPOINT ["dotnet", "SecRandom.Control.dll"]
