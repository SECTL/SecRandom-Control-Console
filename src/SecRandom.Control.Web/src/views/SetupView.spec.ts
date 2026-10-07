import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import { useSetupStore } from '@/stores/setup'
import type { SetupState } from '@/api/protocol'
import SetupView from './SetupView.vue'
import zhCN from '@/i18n/locales/zh-CN'

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: { ...actual.api, setupStatus: vi.fn(), setup: vi.fn() },
  }
})

const { api } = await import('@/api/client')

const localMode = {
  id: 'local',
  display_name: '本地账号',
  available: true,
  requires_credentials: true,
}


const freshState: SetupState = {
  initialized: false,
  mode: null,
  display_name: null,
  membership_enabled: false,
  modes: [localMode],
}







async function mountSetup(options: { status?: SetupState | null; loaded?: boolean } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const status = options.status === undefined ? freshState : options.status
  const loaded = options.loaded ?? status !== null

  if (status === null) {
    vi.mocked(api.setupStatus).mockRejectedValue(new ApiError('service_unavailable', 503))
  } else {
    vi.mocked(api.setupStatus).mockResolvedValue(status)
  }

  const setup = useSetupStore()
  setup.loaded = loaded
  setup.status = loaded ? status : null

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/setup', name: 'setup', component: { template: '<div />' } },
    ],
  })
  await router.push('/setup')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })
  const wrapper = mount(SetupView, {
    global: { plugins: [pinia, i18n, router], stubs: { SiteHeader: true } },
  })
  await flushPromises()

  return { wrapper, setup }
}


async function reachTokenStep(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('[data-testid="setup-next"]').trigger('click')
  await wrapper.get('[data-testid="setup-admin-username"]').setValue('admin')
  await wrapper.get('[data-testid="setup-admin-password"]').setValue('correct-horse')
  await wrapper.get('[data-testid="setup-confirm-password"]').setValue('correct-horse')
  await wrapper.get('[data-testid="setup-next"]').trigger('click')
}

beforeEach(() => {
  vi.mocked(api.setupStatus).mockReset().mockResolvedValue(freshState)
  vi.mocked(api.setup).mockReset().mockResolvedValue({ ok: true, mode: 'local' })
})

describe('SetupView 初始化向导', () => {
  it('未初始化：只有一个可用模式时直接预选，可进入下一步', async () => {
    const { wrapper } = await mountSetup()

    const mode = wrapper.get('[data-testid="setup-mode-local"]')
    expect(mode.attributes('data-selected')).toBe('true')
    expect(wrapper.get('[data-testid="setup-next"]').attributes('disabled')).toBeUndefined()
  })

  it('不可用的模式置灰且选不中', async () => {
    const { wrapper } = await mountSetup({
      status: {
        ...freshState,
        modes: [localMode, { ...localMode, id: 'sectl', display_name: '思拓创联', available: false }],
      },
    })

    const disabled = wrapper.get('[data-testid="setup-mode-sectl"]')
    expect(disabled.attributes('disabled')).toBeDefined()

    
    await disabled.trigger('click')
    expect(wrapper.get('[data-testid="setup-mode-sectl"]').attributes('data-selected')).toBe('false')
  })

  it('没有任何可用模式：给说明而不是一个走不下去的向导', async () => {
    const { wrapper } = await mountSetup({ status: { ...freshState, modes: [] } })

    expect(wrapper.find('[data-testid="setup-no-modes"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="setup-next"]').attributes('disabled')).toBeDefined()
  })

  it('管理员账号不合法：两次密码不一致时进不了下一步', async () => {
    const { wrapper } = await mountSetup()
    await wrapper.get('[data-testid="setup-next"]').trigger('click')

    await wrapper.get('[data-testid="setup-admin-username"]').setValue('ab')
    await wrapper.get('[data-testid="setup-admin-password"]').setValue('correct-horse')
    await wrapper.get('[data-testid="setup-confirm-password"]').setValue('other-horse')

    expect(wrapper.get('[data-testid="setup-next"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="setup-identity-error"]').text()).toContain(
      zhCN.setup.passwordMismatch,
    )
  })

  it('密码短于 8 位：给出长度规则而不是等到服务端报错', async () => {
    const { wrapper } = await mountSetup()
    await wrapper.get('[data-testid="setup-next"]').trigger('click')

    await wrapper.get('[data-testid="setup-admin-username"]').setValue('admin')
    await wrapper.get('[data-testid="setup-admin-password"]').setValue('short')
    await wrapper.get('[data-testid="setup-admin-password"]').trigger('blur')

    expect(wrapper.get('[data-testid="setup-identity-error"]').text()).toContain(
      zhCN.setup.errors.admin_password_too_short,
    )
    expect(wrapper.get('[data-testid="setup-next"]').attributes('disabled')).toBeDefined()
  })

  it('令牌为空时提交按钮不可用；提交成功后给出去登录的出口', async () => {
    const { wrapper, setup } = await mountSetup()
    await reachTokenStep(wrapper)

    expect(wrapper.get('[data-testid="setup-submit"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="setup-token"]').setValue('  tok-123  ')
    await wrapper.get('[data-testid="setup-submit"]').trigger('click')
    await flushPromises()

    
    expect(api.setup).toHaveBeenCalledWith({
      setup_token: 'tok-123',
      mode: 'local',
      admin_username: 'admin',
      admin_password: 'correct-horse',
    })
    expect(wrapper.find('[data-testid="setup-finished"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="setup-go-login"]').attributes('href')).toBe('/login')
    
    expect(setup.initialized).toBe(true)
  })

  it('令牌无效：留在令牌这一步并说清楚去日志里重取', async () => {
    vi.mocked(api.setup).mockRejectedValue(new ApiError('setup_token_invalid', 401))
    const { wrapper, setup } = await mountSetup()
    await reachTokenStep(wrapper)

    await wrapper.get('[data-testid="setup-token"]').setValue('bad-token')
    await wrapper.get('[data-testid="setup-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="setup-step-token"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="setup-error"]').text()).toContain(
      zhCN.setup.errors.setup_token_invalid,
    )
    expect(setup.initialized).toBe(false)
  })

  it('429：按状态码识别限速，不依赖服务端的错误码字面量', async () => {
    vi.mocked(api.setup).mockRejectedValue(new ApiError('slow_down', 429))
    const { wrapper } = await mountSetup()
    await reachTokenStep(wrapper)

    await wrapper.get('[data-testid="setup-token"]').setValue('tok-123')
    await wrapper.get('[data-testid="setup-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="setup-error"]').text()).toContain(
      zhCN.setup.errors.setup_rate_limited,
    )
  })

  it('409：别人已经初始化过这台实例，向导立刻作废', async () => {
    vi.mocked(api.setup).mockRejectedValue(new ApiError('already_initialized', 409))
    const { wrapper, setup } = await mountSetup()
    await reachTokenStep(wrapper)

    await wrapper.get('[data-testid="setup-token"]').setValue('tok-123')
    await wrapper.get('[data-testid="setup-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="setup-finished"]').exists()).toBe(true)
    expect(setup.initialized).toBe(true)
  })

  it('已经初始化过：不给向导，只给去登录', async () => {
    const { wrapper } = await mountSetup({
      status: { ...freshState, initialized: true, mode: 'local' },
    })

    expect(wrapper.find('[data-testid="setup-done-already"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="setup-steps"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="setup-done-already"] a').attributes('href')).toBe('/login')
  })

  it('状态读不到：说"没能确认"并提供重试，而不是把人塞进向导', async () => {
    const { wrapper } = await mountSetup({ status: null })

    expect(wrapper.find('[data-testid="setup-unavailable"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="setup-steps"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="setup-unavailable"]').text()).toContain(
      zhCN.setup.unavailableTitle,
    )
  })
})
