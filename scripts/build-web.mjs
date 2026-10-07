#!/usr/bin/env node










import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const webRoot = join(repoRoot, 'src', 'SecRandom.Control.Web')
const skipInstall = process.argv.includes('--skip-install')

if (!existsSync(join(webRoot, 'package.json'))) {
  console.error(`找不到 SPA 项目：${webRoot}`)
  process.exit(1)
}











function resolveNpmInvocation() {
  const execPath = process.env.npm_execpath
  if (execPath && existsSync(execPath)) {
    return { command: process.execPath, prefixArgs: [execPath] }
  }

  
  const inferFromNodeBinary = (nodeBinary) => {
    if (!nodeBinary) return null
    const candidate = join(dirname(nodeBinary), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    return existsSync(candidate) ? candidate : null
  }

  const programFilesNode =
    process.env.ProgramFiles === undefined
      ? null
      : join(process.env.ProgramFiles, 'nodejs', 'node.exe')

  const cli = inferFromNodeBinary(process.execPath) ?? inferFromNodeBinary(programFilesNode)

  return cli
    ? { command: process.execPath, prefixArgs: [cli] }
    : { command: 'npm', prefixArgs: [] }
}

const npm = resolveNpmInvocation()

function runNpm(args) {
  const allArgs = [...npm.prefixArgs, ...args]
  console.log(`\n> ${npm.command} ${allArgs.join(' ')}`)
  
  
  const result = spawnSync(npm.command, allArgs, { cwd: webRoot, stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`\n命令失败（退出码 ${result.status}）：${allArgs.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

if (!skipInstall && !existsSync(join(webRoot, 'node_modules'))) {
  runNpm(['ci'])
}

runNpm(['run', 'build'])

console.log('\nSPA 构建完成 → artifacts/web')
