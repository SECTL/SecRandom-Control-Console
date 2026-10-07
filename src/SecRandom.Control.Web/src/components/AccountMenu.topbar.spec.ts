import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import AccountMenu from './AccountMenu.vue'
import { api } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import zhCN from '@/i18n/locales/zh-CN'
import type { CurrentUser } from '@/api/protocol'








vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, api: { ...actual.api, logout: vi.fn() } }
})

const signedInUser: CurrentUser = { user_id: 'u-1', display_name: '张老师', groups: [] }

interface Harness {
  wrapper: VueWrapper
  router: Router
  session: ReturnType<typeof useSessionStore>
}

async function mountTopBar(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/console', name: 'console', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const session = useSessionStore(pinia)
  session.user = signedInUser

  const wrapper = mount(AccountMenu, {
    props: { variant: 'topbar' },
    global: { plugins: [pinia, i18n, router] },
  })

  return { wrapper, router, session }
}

const trigger = (wrapper: VueWrapper) => wrapper.get('button')
const items = (wrapper: VueWrapper) => wrapper.findAll('[role="menuitem"]')

describe('AccountMenu（顶栏变体）', () => {
  beforeEach(() => {
    vi.mocked(api.logout).mockReset()
  })

  it('收起时只显示头像与昵称', async () => {
    const { wrapper } = await mountTopBar()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(trigger(wrapper).text()).toContain('张老师')
    
    expect(trigger(wrapper).text()).not.toContain(zhCN.console.signedInViaSectl)
  })

  it('菜单向下弹（顶栏下方展开），并同时提供"进入控制台"与"退出登录"', async () => {
    const { wrapper } = await mountTopBar()

    await trigger(wrapper).trigger('click')

    const panel = wrapper.get('[role="menu"]')
    expect(panel.classes()).toContain('top-full')
    expect(panel.classes()).not.toContain('bottom-full')

    const labels = items(wrapper).map((item) => item.text())
    expect(labels).toHaveLength(2)
    expect(labels[0]).toContain(zhCN.home.enterConsole)
    expect(labels[1]).toContain(zhCN.auth.signOut)
  })

  it('"进入控制台"是一个真正能跳转的链接，点击后菜单收起', async () => {
    const { wrapper, router } = await mountTopBar()

    await trigger(wrapper).trigger('click')
    const entry = items(wrapper)[0]
    expect(entry?.attributes('href')).toBe('/console')

    await entry?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/console')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('从顶栏退出：调用登出接口、清空会话并回首页', async () => {
    vi.mocked(api.logout).mockResolvedValue({ ok: true })
    const { wrapper, router, session } = await mountTopBar()

    await trigger(wrapper).trigger('click')
    await items(wrapper)[1]?.trigger('click')
    await flushPromises()

    expect(api.logout).toHaveBeenCalledTimes(1)
    expect(session.isSignedIn).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/')
  })
})
