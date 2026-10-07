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

const signedInUser: CurrentUser = {
  user_id: 'u-1',
  display_name: '张老师',
  groups: [],
}

interface Harness {
  wrapper: VueWrapper
  router: Router
  session: ReturnType<typeof useSessionStore>
}

async function mountMenu(user: CurrentUser = signedInUser): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/console', name: 'console', component: { template: '<div />' } },
    ],
  })
  await router.push('/console')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const session = useSessionStore(pinia)
  session.user = user

  const wrapper = mount(AccountMenu, { global: { plugins: [pinia, i18n, router] } })

  return { wrapper, router, session }
}


const trigger = (wrapper: VueWrapper) => wrapper.get('button')
const menuItem = (wrapper: VueWrapper) => wrapper.get('[role="menuitem"]')

describe('AccountMenu', () => {
  beforeEach(() => {
    vi.mocked(api.logout).mockReset()
  })

  it('默认收起菜单，触发器显示昵称与头像首字母', async () => {
    const { wrapper } = await mountMenu()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    expect(trigger(wrapper).attributes('aria-haspopup')).toBe('menu')
    expect(trigger(wrapper).text()).toContain('张老师')
    expect(trigger(wrapper).text()).toContain('张')
    
    expect(trigger(wrapper).text()).toContain(zhCN.console.signedInViaSectl)
  })

  it('点击触发器弹出菜单，菜单里有退出登录', async () => {
    const { wrapper } = await mountMenu()

    await trigger(wrapper).trigger('click')

    const menu = wrapper.get('[role="menu"]')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
    expect(trigger(wrapper).attributes('aria-controls')).toBe(menu.attributes('id'))
    expect(menu.attributes('aria-label')).toBe('账号菜单')
    expect(menuItem(wrapper).text()).toContain('退出登录')
  })

  it('再点一次触发器收起菜单', async () => {
    const { wrapper } = await mountMenu()

    await trigger(wrapper).trigger('click')
    await trigger(wrapper).trigger('click')

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('按 Escape 收起菜单', async () => {
    const { wrapper } = await mountMenu()

    await trigger(wrapper).trigger('click')
    await trigger(wrapper).trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('点击菜单之外收起菜单', async () => {
    const { wrapper } = await mountMenu()

    await trigger(wrapper).trigger('click')
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('有头像时用 SECTL 头像，加载失败回落到首字母', async () => {
    const { wrapper } = await mountMenu({
      user_id: 'u-2',
      display_name: '李老师',
      avatar_url: 'https://sectl.example/avatar.png',
      groups: [],
    })

    const avatar = wrapper.get('img')
    expect(avatar.attributes('src')).toBe('https://sectl.example/avatar.png')

    await avatar.trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(trigger(wrapper).text()).toContain('李')
  })

  it('退出成功：调用登出接口、清空本地会话并回到首页', async () => {
    vi.mocked(api.logout).mockResolvedValue({ ok: true })
    const { wrapper, router, session } = await mountMenu()

    await trigger(wrapper).trigger('click')
    await menuItem(wrapper).trigger('click')
    await flushPromises()

    expect(api.logout).toHaveBeenCalledTimes(1)
    expect(session.isSignedIn).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('退出进行中：禁用菜单项并显示进度', async () => {
    let release: (value: { ok: boolean }) => void = () => {}
    vi.mocked(api.logout).mockImplementation(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          release = resolve
        }),
    )
    const { wrapper, router } = await mountMenu()

    await trigger(wrapper).trigger('click')
    await menuItem(wrapper).trigger('click')

    expect(menuItem(wrapper).attributes('disabled')).toBeDefined()
    expect(menuItem(wrapper).text()).toContain('正在退出')

    release({ ok: true })
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('退出失败：保持登录态、留在原页面并给出提示', async () => {
    vi.mocked(api.logout).mockRejectedValue(new Error('network down'))
    const { wrapper, router, session } = await mountMenu()

    await trigger(wrapper).trigger('click')
    await menuItem(wrapper).trigger('click')
    await flushPromises()

    expect(session.isSignedIn).toBe(true)
    expect(router.currentRoute.value.fullPath).toBe('/console')
    expect(wrapper.get('[role="menu"]').text()).toContain('退出失败')
    
    expect(menuItem(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('路由变化时收起菜单', async () => {
    const { wrapper, router } = await mountMenu()

    await trigger(wrapper).trigger('click')
    await router.push('/')
    await flushPromises()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
