








import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const web = resolve(here, '..')

const { FLUENT_ICONS } = await import(
  new URL('../src/components/client/fluent/fluent-icons.ts', import.meta.url).href
)

const { CONSOLE_FLUENT_ICONS } = await import(
  new URL('../src/components/console-icons.ts', import.meta.url).href
)

const json = JSON.parse(
  readFileSync(resolve(web, '../../artifacts/client-style-preview/fonts/FluentSystemIcons-Resizable.json'), 'utf8'),
)

const codepoints = new Map()

function add(cp, source) {
  if (!Number.isInteger(cp) || cp < 0xe000 || cp > 0xf8ff) {
    throw new Error(`${source}: 码位 ${cp} 不在私用区`)
  }
  if (!codepoints.has(cp)) codepoints.set(cp, [])
  codepoints.get(cp).push(source)
}

for (const [name, cp] of Object.entries(FLUENT_ICONS)) add(cp, `fluent-icons:${name}`)
for (const [name, cp] of Object.entries(CONSOLE_FLUENT_ICONS)) add(cp, `console-icons:${name}`)


const known = new Set(Object.values(json))
const unknown = [...codepoints.keys()].filter((cp) => !known.has(cp))

const sorted = [...codepoints.keys()].sort((a, b) => a - b)
const hex = sorted.map((cp) => `U+${cp.toString(16).toUpperCase()}`)

process.stdout.write(hex.join(',') + '\n')
process.stderr.write(`icons=${Object.keys(FLUENT_ICONS).length} console=${Object.keys(CONSOLE_FLUENT_ICONS).length}\n`)
process.stderr.write(`unique=${sorted.length}\n`)
process.stderr.write(`in-json=${sorted.length - unknown.length}/${sorted.length}\n`)
if (unknown.length > 0) process.stderr.write(`NOT-IN-JSON=${unknown.map((c) => '0x' + c.toString(16)).join(',')}\n`)
