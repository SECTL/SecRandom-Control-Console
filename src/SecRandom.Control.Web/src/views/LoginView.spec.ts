import { beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginView from './LoginView.vue'
import { useSessionStore } from '@/stores/session'
import zhCN from '@/i18n/locales/zh-CN'
import type { CurrentUser } from '@/api/protocol'








const signedInUser: CurrentUser = { user_id: 'u-1', display_name: '张老师', groups: [] }

async function mountLogin(options: { query?: Record<string, string>; signedIn?: boolean } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const query = options.query ?? {}
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/console', name: 'console', component: { template: '<div />' } },
    ],
  })
  await router.push({ path: '/login', query })
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const session = useSessionStore(pinia)
  session.loaded = true
  if (options.signedIn) session.user = signedInUser

  const wrapper = mount(LoginView, {
    global: { plugins: [pinia, i18n, router], stubs: { SiteHeader: true } },
  })

  return { wrapper, session }
}


const actions = (wrapper: VueWrapper) => wrapper.get('.spotlight-card').text()

describe('LoginView 登录卡片', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('未登录：品牌名 + 登录标题 + 登录按钮 + 安全说明底注', async () => {
    const { wrapper } = await mountLogin()

    const text = actions(wrapper)
    expect(text).toContain(zhCN.common.appName)
    expect(text).toContain(zhCN.auth.signInTitle)
    expect(text).toContain(zhCN.auth.signInWithSectl)
    expect(text).toContain(zhCN.auth.securityNote)

    const link = wrapper.get('a[href^="/api/auth/login"]')
    expect(link.attributes('href')).toContain(encodeURIComponent('/console'))
  })

  it('底注显示真文案，而不是 i18n 的 key', async () => {
    const { wrapper } = await mountLogin()

    
    expect(wrapper.text()).not.toContain('auth.securityNote')
    expect(wrapper.text()).toContain('不透明的会话标识')
  })

  it('已登录：只给「继续进入控制台」，不再显示登录按钮', async () => {
    const { wrapper } = await mountLogin({ signedIn: true })

    expect(actions(wrapper)).toContain(zhCN.auth.alreadySignedIn)
    expect(wrapper.find('a[href^="/api/auth/login"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/console"]').exists()).toBe(true)
  })

  it('服务端不可用：给重试而不是必然失败的登录按钮', async () => {
    const { wrapper, session } = await mountLogin()
    session.errorCode = 'network_error'

    await wrapper.vm.$nextTick()

    expect(actions(wrapper)).toContain(zhCN.common.retry)
    expect(wrapper.find('a[href^="/api/auth/login"]').exists()).toBe(false)
  })

  it('回调带来的错误码显示对应文案；未知错误码回落到通用文案', async () => {
    const known = await mountLogin({ query: { error: 'login_failed' } })
    expect(known.wrapper.text()).toContain(zhCN.auth.errors.login_failed)

    const unknown = await mountLogin({ query: { error: 'some_future_error' } })
    expect(unknown.wrapper.text()).toContain(zhCN.auth.errors.unknown)
  })
})
