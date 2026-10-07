import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import SiteHeader from './SiteHeader.vue'
import { useSessionStore } from '@/stores/session'
import zhCN from '@/i18n/locales/zh-CN'
import type { CurrentUser } from '@/api/protocol'





const signedInUser: CurrentUser = { user_id: 'u-1', display_name: '张老师', groups: [] }

async function mountHeader(options: { signedIn?: boolean; path?: string } = {}): Promise<VueWrapper> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/console', name: 'console', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
    ],
  })
  await router.push(options.path ?? '/')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const session = useSessionStore(pinia)
  if (options.signedIn) session.user = signedInUser
  session.loaded = true

  return mount(SiteHeader, { global: { plugins: [pinia, i18n, router] } })
}

describe('SiteHeader', () => {
  it('品牌即回首页入口，主题与语言都在顶栏里', async () => {
    const wrapper = await mountHeader()

    expect(wrapper.get('header').find('a[href="/"]').exists()).toBe(true)
    
    expect(wrapper.get('header').find('[data-testid="language-select"]').exists()).toBe(true)
    expect(wrapper.get('header').find('button[aria-label]').exists()).toBe(true)
  })

  it('已登录：右上角显示当前账号，点开是账号菜单', async () => {
    const wrapper = await mountHeader({ signedIn: true })

    const trigger = wrapper.get('button[aria-haspopup="menu"]')
    expect(trigger.text()).toContain('张老师')
    
    expect(wrapper.text()).not.toContain(zhCN.home.signIn)

    await trigger.trigger('click')

    const labels = wrapper.findAll('[role="menuitem"]').map((item) => item.text())
    expect(labels[0]).toContain(zhCN.home.enterConsole)
    expect(labels[1]).toContain(zhCN.auth.signOut)
  })

  it('未登录：显示登录入口，且没有账号菜单', async () => {
    const wrapper = await mountHeader()

    const signIn = wrapper.get(`a[href="/login"]`)
    expect(signIn.text()).toContain(zhCN.home.signIn)
    expect(wrapper.find('button[aria-haspopup="menu"]').exists()).toBe(false)
  })

  it('登录页上不再重复一个指向自己的"登录"按钮', async () => {
    const wrapper = await mountHeader({ path: '/login' })

    expect(wrapper.find('a[href="/login"]').exists()).toBe(false)
  })
})
