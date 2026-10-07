import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeView from './HomeView.vue'
import { useSetupStore } from '@/stores/setup'
import zhCN from '@/i18n/locales/zh-CN'
import type { ServerMeta } from '@/api/protocol'


















const { serverMeta } = vi.hoisted(() => ({ serverMeta: vi.fn() }))

vi.mock('@/api/client', () => ({
  api: { serverMeta },
  
  buildLoginUrl: () => '/api/auth/login',
  ApiError: class ApiError extends Error {},
}))

function meta(serverTime?: string): ServerMeta {
  return {
    service: 'secrandom-control',
    protocol: 'v1',
    server_version: '0.1.0',
    ...(serverTime === undefined ? {} : { server_time: serverTime }),
    status: 'ready',
  }
}

async function mountHome(options: { membershipEnabled?: boolean; local?: boolean } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  
  if (options.membershipEnabled === false || options.local === true) {
    const setup = useSetupStore(pinia)
    setup.loaded = true
    setup.status = {
      initialized: true,
      mode: 'local',
      display_name: '测试实例',
      membership_enabled: options.membershipEnabled !== false,
      modes: [],
    }
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/join', name: 'join', component: { template: '<div />' } },
      { path: '/console', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const wrapper = mount(HomeView, {
    global: { plugins: [pinia, i18n, router], stubs: { SiteHeader: true } },
  })
  
  await vi.waitFor(() => expect(serverMeta).toHaveBeenCalled())
  return wrapper
}


const copyright = (wrapper: Awaited<ReturnType<typeof mountHome>>) =>
  wrapper.get('[data-testid="copyright"]').text()

describe('HomeView hero 文案', () => {
  beforeEach(() => {
    serverMeta.mockReset()
  })

  it('本地模式：重复的副标题已删除，描述不再提账号', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome({ local: true })

    expect(wrapper.text()).not.toContain('SecRandom 集控平台')
    expect(wrapper.text()).toContain(zhCN.home.descriptionLocal)
    expect(wrapper.text()).not.toContain(zhCN.home.description)
  })

  it('非本地模式：描述仍是带账号的口径，重复的副标题同样不出现', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome()

    expect(wrapper.text()).not.toContain('SecRandom 集控平台')
    expect(wrapper.text()).toContain(zhCN.home.description)
  })
})

describe('HomeView 页脚版权', () => {
  beforeEach(() => {
    serverMeta.mockReset()
  })

  it('结束年份取自服务端时间，而不是访客本机时钟', async () => {
    
    const base = new Date().getUTCFullYear() + 3
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${base}-06-01T00:00:00Z`))

    try {
      serverMeta.mockResolvedValue(meta('2030-03-05T10:00:00.0000000+00:00'))
      const wrapper = await mountHome()

      expect(copyright(wrapper)).toContain('2030')
      expect(copyright(wrapper)).not.toContain(String(base))
      
      expect(copyright(wrapper)).toContain('2025-2030')
      expect(copyright(wrapper)).toContain('思拓创联')
    } finally {
      vi.useRealTimers()
    }
  })

  it('服务端时间出错时只显示公司名：不猜年份', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome()

    expect(copyright(wrapper)).toContain('思拓创联')
    expect(copyright(wrapper)).not.toMatch(/\d{4}/)
  })

  it('服务端时间不可解析时不显示年份', async () => {
    serverMeta.mockResolvedValue(meta('not-a-timestamp'))
    const wrapper = await mountHome()

    expect(copyright(wrapper)).toContain('思拓创联')
    expect(copyright(wrapper)).not.toMatch(/\d{4}/)
  })

  it('服务端时间就是起始年份时只显示一个年份，不显示区间', async () => {
    serverMeta.mockResolvedValue(meta('2025-01-02T00:00:00Z'))
    const wrapper = await mountHome()

    expect(copyright(wrapper)).toContain('2025')
    expect(copyright(wrapper)).not.toContain('2025-2025')
  })

  it('页脚不再出现登录页那句安全说明（它只属于登录页）', async () => {
    serverMeta.mockResolvedValue(meta('2026-01-01T00:00:00Z'))
    const wrapper = await mountHome()

    expect(wrapper.get('footer').text()).not.toContain('不透明的会话标识')
    expect(wrapper.get('footer').text()).toContain('思拓创联')
  })

  it('版权行是指向 sectl.cn 的外链：新标签页打开，且不交出 opener / Referer', async () => {
    serverMeta.mockResolvedValue(meta('2026-01-01T00:00:00Z'))
    const wrapper = await mountHome()

    const link = wrapper.get('[data-testid="copyright"]')
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('https://sectl.cn')
    
    expect(link.attributes('target')).toBe('_blank')
    
    expect(link.attributes('rel')).toContain('noopener')
    expect(link.attributes('rel')).toContain('noreferrer')
  })

  it('年份取不到时只少显示年份，外链照旧', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome()

    const link = wrapper.get('[data-testid="copyright"]')
    expect(link.text()).toContain('思拓创联')
    expect(link.text()).not.toMatch(/\d{4}/)
    expect(link.attributes('href')).toBe('https://sectl.cn')
  })
})

describe('HomeView 英雄区', () => {
  beforeEach(() => {
    serverMeta.mockReset()
  })

  it('顶部不再有"课堂抽取 · 集控平台"胶囊标签', async () => {
    serverMeta.mockResolvedValue(meta('2026-01-01T00:00:00Z'))
    const wrapper = await mountHome()

    expect(wrapper.text()).not.toContain('课堂抽取 · 集控平台')
    
    const heroFirst = wrapper.get('section [data-reveal]')
    expect(heroFirst.find('img').exists()).toBe(true)
  })

  it('胶囊删掉后 logo 不再留一段悬空的上边距', async () => {
    serverMeta.mockResolvedValue(meta('2026-01-01T00:00:00Z'))
    const wrapper = await mountHome()

    
    expect(wrapper.get('section img').classes()).not.toContain('mt-7')
  })
})








describe('HomeView 邀请入口', () => {
  beforeEach(() => {
    serverMeta.mockReset()
  })

  it('默认显示「我有邀请码」，直达加入页', async () => {
    serverMeta.mockResolvedValue(meta('2026-01-01T00:00:00Z'))
    const wrapper = await mountHome()

    const entry = wrapper.get('[data-testid="home-join-entry"]')
    expect(entry.attributes('href')).toBe('/join')
    expect(entry.text()).toContain('我有邀请码')
  })

  it('关掉成员功能时整块不出现', async () => {
    serverMeta.mockResolvedValue(meta('2026-01-01T00:00:00Z'))
    const wrapper = await mountHome({ membershipEnabled: false })

    expect(wrapper.find('[data-testid="home-join-entry"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('我有邀请码')
    
    expect(wrapper.text()).toContain('登录')
  })
})
