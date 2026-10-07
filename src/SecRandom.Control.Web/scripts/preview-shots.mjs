










import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CHROME =
  process.env['CHROME_PATH'] ??
  join(
    process.env['LOCALAPPDATA'] ?? '',
    'ms-playwright',
    'chromium-1237',
    'chrome-win64',
    'chrome.exe',
  )

const BASE = process.env['PREVIEW_BASE'] ?? 'http://127.0.0.1:5399'
const OUT = join(import.meta.dirname, '..', '..', '..', 'artifacts', 'fluent-preview')
const PORT = Number(process.env['CDP_PORT'] ?? 9333)


const SHOTS = [
  { file: 'task2-select-open-light.png', url: '/preview.html?panel=select&openSelect=1&theme=light', selector: '[data-cn-select-popup]' },
  { file: 'task2-select-open-dark.png', url: '/preview.html?panel=select&openSelect=1&theme=dark', selector: '[data-cn-select-popup]' },
  { file: 'task2-select-open-clipped-light.png', url: '/preview.html?panel=settings&openSelect=1&clip=1&theme=light', selector: '[data-cn-select-popup]' },
  { file: 'task2-select-in-settings-light.png', url: '/preview.html?panel=settings&openSelect=1&theme=light', selector: '[data-cn-select-popup]' },
  { file: 'task2-select-in-settings-dark.png', url: '/preview.html?panel=settings&openSelect=1&theme=dark', selector: '[data-cn-select-popup]' },
  { file: 'task4-addrow-dialog-light.png', url: '/preview.html?panel=roster&dialog=1&theme=light', selector: '[data-testid="roster-add-dialog"]' },
  { file: 'task4-addrow-dialog-dark.png', url: '/preview.html?panel=roster&dialog=1&theme=dark', selector: '[data-testid="roster-add-dialog"]' },
  { file: 'task5-import-drawer-light.png', url: '/preview.html?panel=drawer&theme=light', selector: '[data-testid="node-detail-roster-import-preview"]' },
  { file: 'task5-import-drawer-dark.png', url: '/preview.html?panel=drawer&theme=dark', selector: '[data-testid="node-detail-roster-import-preview"]' },
  { file: 'task6-default-draw-light.png', url: '/preview.html?panel=settings&page=default_draw&theme=light', selector: '[data-testid="card-default_draw.draw_mode"]' },
  { file: 'task6-default-draw-dark.png', url: '/preview.html?panel=settings&page=default_draw&theme=dark', selector: '[data-testid="card-default_draw.draw_mode"]' },
  
  { file: 'task6-default-draw-readonly-light.png', url: '/preview.html?panel=settings&page=default_draw&theme=light&scroll=1500', selector: '[data-testid="card-default_draw.animation_music"]', extra: 900 },
  { file: 'task6-default-draw-readonly-dark.png', url: '/preview.html?panel=settings&page=default_draw&theme=dark&scroll=1500', selector: '[data-testid="card-default_draw.animation_music"]', extra: 900 },
  
  { file: 'task8-roster-listmenu-light.png', url: '/preview.html?panel=roster&openLists=1&theme=light', selector: '[data-testid="roster-list-menu"]' },
  { file: 'task8-roster-listmenu-dark.png', url: '/preview.html?panel=roster&openLists=1&theme=dark', selector: '[data-testid="roster-list-menu"]' },
  






  { file: 'nav-order-light.png', url: '/preview.html?panel=settings&page=appearance&theme=light', selector: '[data-testid="client-nav-notification"]' },
  { file: 'nav-and-appearance-dark.png', url: '/preview.html?panel=settings&page=appearance&theme=dark', selector: '[data-testid="card-appearance.font_weight"]' },
  { file: 'page-floating-window-light.png', url: '/preview.html?panel=settings&page=floating_window&theme=light&expandAll=1', selector: '[data-testid="card-floating_window.floating_window_placement"]' },
  { file: 'page-linkage-light.png', url: '/preview.html?panel=settings&page=linkage&theme=light', selector: '[data-testid="card-linkage.data_source"]' },
  
  { file: 'page-notification-light.png', url: '/preview.html?panel=settings&page=notification&theme=light&expandAll=1', selector: '[data-testid="settings-section-lotteryOverridable"]' },
]









const DIAG_EXPRESSION = `JSON.stringify((() => {
  const el = document.querySelector('[data-cn-select-popup]') ?? document.querySelector('[data-testid="roster-list-menu"]');
  if (el === null) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
  return {
    position: cs.position,
    zIndex: cs.zIndex,
    rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    parent: el.parentElement && el.parentElement.tagName,
    onTop: hit !== null && (hit === el || el.contains(hit)),
    hitTest: hit === null ? null : hit.className,
  };
})())`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchJson(path) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}${path}`)
      if (response.ok) return await response.json()
    } catch {
      
    }
    await sleep(250)
  }
  throw new Error(`CDP 没起来：${path}`)
}


function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl)
  const pending = new Map()
  let nextId = 0

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve())
    socket.addEventListener('error', () => reject(new Error('CDP socket error')))
  })

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    const entry = pending.get(message.id)
    if (entry === undefined) return
    pending.delete(message.id)
    if (message.error !== undefined) entry.reject(new Error(JSON.stringify(message.error)))
    else entry.resolve(message.result)
  })

  return {
    ready,
    send(method, params = {}, sessionId) {
      const id = (nextId += 1)
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        socket.send(JSON.stringify({ id, method, params, ...(sessionId === undefined ? {} : { sessionId }) }))
      })
    },
    close() {
      socket.close()
    },
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true })

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1440,900',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${join(process.env['TEMP'] ?? '.', 'dsh-preview-profile')}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  const client = connect((await fetchJson('/json/version')).webSocketDebuggerUrl)

  try {
    await client.ready

    for (const shot of SHOTS) {
      const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' })
      
      await client.send('Target.activateTarget', { targetId })
      const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true })

      await client.send('Page.enable', {}, sessionId)
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      }, sessionId)
      await client.send('Page.navigate', { url: `${BASE}${shot.url}` }, sessionId)

      const deadline = Date.now() + 20_000
      let found = false
      while (Date.now() < deadline) {
        const result = await client.send(
          'Runtime.evaluate',
          {
            expression: `document.querySelector(${JSON.stringify(shot.selector)}) !== null`,
            returnByValue: true,
          },
          sessionId,
        )
        if (result.result?.value === true) {
          found = true
          break
        }
        await sleep(120)
      }

      
      await sleep(400 + (shot.extra ?? 0))

      const image = await client.send('Page.captureScreenshot', { format: 'png' }, sessionId)
      writeFileSync(join(OUT, shot.file), Buffer.from(image.data, 'base64'))
      console.log(`${found ? 'OK  ' : 'MISS'} ${shot.file}`)

      
      if (process.env['PREVIEW_DIAG'] === '1') {
        const diag = await client.send(
          'Runtime.evaluate',
          { expression: DIAG_EXPRESSION, returnByValue: true },
          sessionId,
        )
        console.log('      ', diag.result?.value)
      }

      await client.send('Target.closeTarget', { targetId })
    }
  } finally {
    client.close()
    chrome.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
