/**
 * 服务端版本号 → 页面页脚上那一行。
 *
 * 服务端现在的版本号就是**部署日期**：`2026.10.07`（年.月.日，见仓库根
 * `Directory.Build.props`）。它来自程序集信息版本（`AssemblyInformationalVersion`），
 * 而那个值不一定干净：
 *   · 有 .git 时 CI 会追加源修订信息 —— `2026.10.07+b22675b…`（那串哈希是提交，
 *     不是版本的一部分，只在排障时要）；
 *   · 预发布构建会带预发布标记 —— `2026.10.07-rc.1`。
 * 这两样都不该出现在页脚给老师看的版本号里。
 *
 * 因此这里做**显示层**的裁剪：协议里的原始值保持不动（排障时还要用），页面上只呈现
 * 三段数字。节点（客户端）上报的 `version` 也走这里 —— 各版本格式不一（`3.1.2`、
 * `2026.10.07`、带 `+<sha>` 的都有），统一裁成三段最省事，也最不容易显示成垃圾串。
 */
export function formatVersion(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return ''

  // 去掉构建元数据（`+…`）与预发布标记（`-…`），再要求剩下的全是数字段。
  const core = (raw.split('+')[0] ?? '').split('-')[0]?.trim() ?? ''
  const digits = core.replace(/^[vV]/, '')
  if (!/^\d+(\.\d+)*$/.test(digits)) return ''

  // 少于三段就补零（`1.2` → `1.2.0`），多于三段只取前三段。
  const [major = '0', minor = '0', patch = '0'] = digits.split('.')
  return `${major}.${minor}.${patch}`
}
