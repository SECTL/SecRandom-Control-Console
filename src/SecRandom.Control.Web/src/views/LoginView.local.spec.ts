import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import { createAppI18n, type AppLocale } from '@/i18n'
import { useSetupStore } from '@/stores/setup'
import type { SetupState } from '@/api/protocol'
import LoginView from './LoginView.vue'
import enUS from '@/i18n/locales/en-US'
import zhCN from '@/i18n/locales/zh-CN'

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: { ...actual.api, setupStatus: vi.fn(), passwordLogin: vi.fn() },
  }
})

const { api } = await import('@/api/client')


const localState: SetupState = {
  initialized: true,
  mode: 'local',
  display_name: '测试实例',
  membership_enabled: false,
  modes: [
    { id: 'local', display_name: '本地账号', available: true, requires_credentials: true },
  ],
}








async function mountLogin(options: { status?: SetupState | null; locale?: string } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const status = options.status === undefined ? localState : options.status

  if (status === null) {
    vi.mocked(api.setupStatus).mockRejectedValue(new ApiError('service_unavailable', 503))
  } else {
    vi.mocked(api.setupStatus).mockResolvedValue(status)
  }

  const setup = useSetupStore()
  setup.loaded = false
  setup.status = null
  if (status !== null) {
    setup.loaded = true
    setup.status = status
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/console', name: 'console', component: { template: '<div />' } },
      { path: '/setup', name: 'setup', component: { template: '<div />' } },
    ],
  })
  await router.push('/login')
  await router.isReady()

  const locale: AppLocale = options.locale === 'en-US' ? 'en-US' : 'zh-CN'
  
  
  const i18n = createAppI18n(locale)

  const wrapper = mount(LoginView, {
    global: { plugins: [pinia, i18n, router], stubs: { SiteHeader: true } },
  })
  await flushPromises()

  return { wrapper, router }
}


const actions = (wrapper: VueWrapper) => wrapper.get('.spotlight-card').text()

beforeEach(() => {
  vi.mocked(api.setupStatus).mockReset().mockResolvedValue(localState)
  vi.mocked(api.passwordLogin).mockReset().mockResolvedValue({ ok: true })
  navigatedTo = null
  
  
  
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...window.location, assign: (url: string) => (navigatedTo = url) },
  })
})


let navigatedTo: string | null = null

describe('LoginView 本地账号登录', () => {
  it('实例是 local 模式：给用户名/密码表单，而不是必然失败的整页授权', () => {
    return mountLogin().then(({ wrapper }) => {
      expect(wrapper.find('[data-testid="login-password-form"]').exists()).toBe(true)
      expect(wrapper.find('a[href^="/api/auth/login"]').exists()).toBe(false)
      expect(actions(wrapper)).toContain(zhCN.auth.password.title)
      expect(actions(wrapper)).toContain(zhCN.auth.password.submit)
      
      expect(actions(wrapper)).toContain(zhCN.auth.password.securityNote)
    })
  })

  it('本地模式：副标题不再提思拓创联，改用本机管理员口径', async () => {
    const { wrapper } = await mountLogin()

    expect(actions(wrapper)).toContain(zhCN.auth.signInTitleLocal)
    expect(actions(wrapper)).not.toContain(zhCN.auth.signInTitle)
    expect(actions(wrapper)).not.toContain('思拓创联')
  })

  it('状态未知（请求失败）：保持整页授权按钮的原行为', async () => {
    const { wrapper } = await mountLogin({ status: null })

    expect(wrapper.find('a[href^="/api/auth/login"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="login-password-form"]').exists()).toBe(false)
  })

  it('用户名或密码为空时提交按钮不可用，密码不会被送出去', async () => {
    const { wrapper } = await mountLogin()

    const submit = wrapper.get('[data-testid="login-password-submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="login-username"]').setValue('admin')
    expect(wrapper.get('[data-testid="login-password-submit"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="login-password"]').setValue('correct-horse')
    expect(wrapper.get('[data-testid="login-password-submit"]').attributes('disabled')).toBeUndefined()
  })

  it('提交成功后跳转 /console，并且不在内存里留下密码', async () => {
    const { wrapper } = await mountLogin()

    await wrapper.get('[data-testid="login-username"]').setValue(' admin ')
    await wrapper.get('[data-testid="login-password"]').setValue('correct-horse')
    await wrapper.get('[data-testid="login-password-form"]').trigger('submit')
    await flushPromises()

    
    expect(api.passwordLogin).toHaveBeenCalledWith('admin', 'correct-horse')
    expect(navigatedTo).toBe('/console')
    expect(wrapper.get('[data-testid="login-password"]').element).toHaveProperty('value', '')
  })

  it('401：说"用户名或密码不正确"，且不区分账号是否存在', async () => {
    vi.mocked(api.passwordLogin).mockRejectedValue(new ApiError('unauthorized', 401))
    const { wrapper } = await mountLogin()

    await fillAndSubmit(wrapper)

    expect(wrapper.get('[data-testid="login-password-error"]').text()).toContain(
      zhCN.auth.password.errors.unauthorized,
    )
  })

  it('429：按状态码识别限速，不依赖服务端错误码的字面量', async () => {
    
    vi.mocked(api.passwordLogin).mockRejectedValue(new ApiError('rate_limited', 429))
    const { wrapper } = await mountLogin()

    await fillAndSubmit(wrapper)

    expect(wrapper.get('[data-testid="login-password-error"]').text()).toContain(
      zhCN.auth.password.errors.too_many_attempts,
    )
  })

  it('503：说这台实例没有可用的身份源', async () => {
    vi.mocked(api.passwordLogin).mockRejectedValue(new ApiError('auth_not_configured', 503))
    const { wrapper } = await mountLogin()

    await fillAndSubmit(wrapper)

    expect(wrapper.get('[data-testid="login-password-error"]').text()).toContain(
      zhCN.auth.password.errors.auth_not_configured,
    )
  })

  it('连不上服务端：说网络问题，不说密码错', async () => {
    vi.mocked(api.passwordLogin).mockRejectedValue(new TypeError('fetch failed'))
    const { wrapper } = await mountLogin()

    await fillAndSubmit(wrapper)

    const message = wrapper.get('[data-testid="login-password-error"]').text()
    expect(message).not.toContain(zhCN.auth.password.errors.unauthorized)
    expect(message).toContain(zhCN.auth.errors.unknown)
  })

  it('英文界面下用英文文案', async () => {
    vi.mocked(api.passwordLogin).mockRejectedValue(new ApiError('unauthorized', 401))
    const { wrapper } = await mountLogin({ locale: 'en-US' })

    await fillAndSubmit(wrapper)

    expect(wrapper.get('[data-testid="login-password-error"]').text()).toContain(
      enUS.auth.password.errors.unauthorized,
    )
  })
})

async function fillAndSubmit(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('[data-testid="login-username"]').setValue('admin')
  await wrapper.get('[data-testid="login-password"]').setValue('correct-horse')
  await wrapper.get('[data-testid="login-password-form"]').trigger('submit')
  await flushPromises()
}
