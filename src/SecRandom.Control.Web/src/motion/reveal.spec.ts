import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { App } from 'vue'
import { installReveal } from './reveal'
















class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []

  readonly observed = new Set<Element>()

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this)
  }

  observe(target: Element): void {
    this.observed.add(target)
  }

  unobserve(target: Element): void {
    this.observed.delete(target)
  }

  disconnect(): void {
    this.observed.clear()
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  
  enter(elements: Element[]): void {
    this.callback(
      elements.map(
        (target) => ({ target, isIntersecting: true }) as unknown as IntersectionObserverEntry,
      ),
      this as unknown as IntersectionObserver,
    )
  }
}

const app = { config: { globalProperties: {} } } as unknown as App

function currentObserver(): FakeIntersectionObserver {
  const instance = FakeIntersectionObserver.instances.at(0)
  if (!instance) throw new Error('installReveal 没有创建 IntersectionObserver')
  return instance
}

function mustFind(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) throw new Error(`测试 DOM 里缺少 #${id}`)
  return element
}


function tick(ms = 0): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

beforeEach(() => {
  FakeIntersectionObserver.instances = []
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-reveal-ready')

  
  
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('installReveal', () => {
  it('只写了 .reveal 的元素也会被观察，进入视口后放开（回归：卡片被永久隐藏）', async () => {
    
    
    document.body.innerHTML = `
      <div id="card" class="reveal rounded-card">
        <div id="card-body" data-reveal>登录按钮在这里</div>
      </div>
    `
    const card = mustFind('card')

    installReveal(app)

    expect(document.documentElement.dataset['revealReady']).toBe('true')
    expect(currentObserver().observed.has(card)).toBe(true)

    
    expect(card.dataset['revealed']).toBeUndefined()

    currentObserver().enter([card])
    await tick()

    expect(card.dataset['revealed']).toBe('')
  })

  it('`data-reveal` 标记继续有效', async () => {
    document.body.innerHTML = '<div id="legacy" data-reveal></div>'
    const legacy = mustFind('legacy')

    installReveal(app)
    expect(currentObserver().observed.has(legacy)).toBe(true)

    currentObserver().enter([legacy])
    await tick()

    expect(legacy.dataset['revealed']).toBe('')
  })

  it('同一批入场的元素按 DOM 顺序级联，后面的元素稍晚放开', async () => {
    document.body.innerHTML = `
      <p id="first" class="reveal"></p>
      <p id="second" class="reveal"></p>
    `

    installReveal(app)
    currentObserver().enter([mustFind('second'), mustFind('first')])

    
    await tick(5)
    expect(mustFind('first').dataset['revealed']).toBe('')
    expect(mustFind('second').dataset['revealed']).toBeUndefined()

    await tick(80)
    expect(mustFind('second').dataset['revealed']).toBe('')
  })

  it('没有 IntersectionObserver 时不隐藏任何内容，直接以最终状态呈现', () => {
    document.body.innerHTML = '<div id="card" class="reveal"></div>'
    vi.stubGlobal('IntersectionObserver', undefined)

    installReveal(app)

    expect(document.documentElement.dataset['revealReady']).toBeUndefined()
    expect(mustFind('card').dataset['revealed']).toBe('')
  })
})
