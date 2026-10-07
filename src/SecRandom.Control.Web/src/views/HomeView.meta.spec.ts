import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeView from './HomeView.vue'
import zhCN from '@/i18n/locales/zh-CN'
import type { ServerMeta } from '@/api/protocol'








const { serverMeta } = vi.hoisted(() => ({ serverMeta: vi.fn() }))

vi.mock('@/api/client', () => ({
  api: { serverMeta },
  buildLoginUrl: () => '/api/auth/login',
  ApiError: class ApiError extends Error {},
}))

function meta(overrides: Partial<ServerMeta> = {}): ServerMeta {
  return {
    service: 'secrandom-control',
    
    protocol: 'protocol-marker',
    server_version: '1.0.0+3f9a1c2d4e5f6a7b8c9d0e1f2a3b4c5d',
    server_time: '2026-01-01T00:00:00Z',
    status: 'ready',
    ...overrides,
  }
}

async function mountHome(): Promise<VueWrapper> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/join', name: 'join', component: { template: '<div />' } },
      { path: '/console', name: 'console', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const wrapper = mount(HomeView, {
    global: { plugins: [pinia, i18n, router], stubs: { SiteHeader: true } },
  })
  await vi.waitFor(() => expect(serverMeta).toHaveBeenCalled())
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('HomeView 的服务端元信息', () => {
  beforeEach(() => {
    serverMeta.mockReset()
  })

  it('首屏不再有"服务正常"状态徽标', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome()

    expect(wrapper.text()).not.toContain('服务正常')
    expect(wrapper.text()).not.toContain('服务不可达')
    
    expect(wrapper.find('.status-dot--down').exists()).toBe(false)
  })

  it('不再展示协议版本', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome()

    expect(wrapper.text()).not.toContain('协议版本')
    expect(wrapper.text()).not.toContain('protocol-marker')
  })

  it('版本号显示在页脚，并且裁成三段式（去掉提交信息）', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome()

    const version = wrapper.get('[data-testid="server-version"]')
    expect(version.text()).toBe('1.0.0')
    expect(wrapper.get('footer').text()).toContain('1.0.0')
    
    expect(wrapper.text()).not.toContain('3f9a1c2')
  })

  it('版本号不出现在首屏主体里，只在页脚', async () => {
    serverMeta.mockResolvedValue(meta())
    const wrapper = await mountHome()

    const main = wrapper.get('main, section')
    expect(main.text()).not.toContain('1.0.0')
  })

  it('取不到 /v1/meta 时不显示版本，也不编造一个', async () => {
    serverMeta.mockRejectedValue(new Error('service down'))
    const wrapper = await mountHome()

    expect(wrapper.find('[data-testid="server-version"]').exists()).toBe(false)
    
    expect(wrapper.get('footer').text()).toContain('SecRandom 集控')
  })

  it('版本号不是正常三段式时宁可不显示', async () => {
    serverMeta.mockResolvedValue(meta({ server_version: 'build-unknown' }))
    const wrapper = await mountHome()

    expect(wrapper.find('[data-testid="server-version"]').exists()).toBe(false)
  })
})
