# 本地账号身份源模块

服务端的**本地账号**身份源：部署者自己设一个管理员账号与密码，用它登录控制台。单机、校园内网这类
「没有第三方账号体系」的部署默认就用它。

- **插件方式加载**：程序集名 `SecRandom.Control.Identity.Local`，实现
  [`IIdentityProviderModule`](../SecRandom.Control/Authentication/IIdentityProviderModule.cs)。
  构建服务端时会自动发现同级模块项目（`src/SecRandom.Control.Identity.*/`）并把输出复制进应用目录，
  不需要手工拷贝；加载与点名规则见 [`docs/self-host.md`](../../docs/self-host.md)。
- **账号存在数据目录**里（`auth-local.json`，不是本目录）：口令只存 PBKDF2-SHA256
  （210 000 次迭代、16 字节随机盐）派生值，比较用定长比较；Unix 下落盘权限 0600。
  未命中的用户名也会走一次假校验，避免用响应时间试探账号是否存在。
- **`user_id` 形如 `local:<用户名小写>`**：改名等于换一个身份，权限归属不会跟着走。
- **该模式下不提供成员功能**（邀请、成员列表、转移都不会出现）：权限模型是「本机管理员 = 这套实例的
  owner」。
- 启用方式：初始化向导第一步选「本地账号」，或用 `CTRL_AUTH_PROVIDER=local` 点名。

许可：[Elastic License 2.0](../SecRandom.Control/LICENSE)，与服务端同一侧（见
[LICENSING.md](../../LICENSING.md)）。
