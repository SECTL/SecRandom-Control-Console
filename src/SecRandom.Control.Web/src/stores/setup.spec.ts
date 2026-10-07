import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/client'
import { parseSetupState, useSetupStore } from './setup'
import type { SetupState } from '@/api/protocol'

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, api: { ...actual.api, setupStatus: vi.fn() } }
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

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(api.setupStatus).mockReset()
})

describe('parseSetupState', () => {
  it('原样保留服务端给的模式列表', () => {
    expect(parseSetupState(localState)?.modes).toHaveLength(1)
  })

  it('没给 modes 时给空数组：向导据此说"没有可用模式"，而不是崩在 map 上', () => {
    const payload = { ...localState, modes: undefined } as unknown as SetupState
    expect(parseSetupState(payload)?.modes).toEqual([])
  })

  it('没给 membership_enabled 时按开启处理：宁多显示入口，不少显示功能', () => {
    const payload = { ...localState, membership_enabled: undefined } as unknown as SetupState
    expect(parseSetupState(payload)?.membership_enabled).toBe(true)
  })

  it('空字符串的 mode / display_name 归一成 null', () => {
    const payload = { ...localState, mode: '', display_name: '' }
    const parsed = parseSetupState(payload)
    expect(parsed?.mode).toBeNull()
    expect(parsed?.display_name).toBeNull()
  })

  it('null 就是 null，不编造一份状态', () => {
    expect(parseSetupState(null)).toBeNull()
  })
})

describe('useSetupStore', () => {
  it('读取成功后 loaded 为真，needsSetup 表示"确定未初始化"', async () => {
    vi.mocked(api.setupStatus).mockResolvedValue({ ...localState, initialized: false, mode: null })
    const store = useSetupStore()

    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.initialized).toBe(false)
    expect(store.needsSetup).toBe(true)
  })

  it('请求失败：loaded 保持为假——这是把"没问到"和"未初始化"分开的关键', async () => {
    vi.mocked(api.setupStatus).mockRejectedValue(new ApiError('service_unavailable', 503))
    const store = useSetupStore()

    await store.load()

    expect(store.loaded).toBe(false)
    expect(store.needsSetup).toBe(false)
    expect(store.errorCode).toBe('service_unavailable')
    expect(store.errorStatus).toBe(503)
  })

  it('连不上服务端（没有状态码）：errorCode 归一到 network_error', async () => {
    vi.mocked(api.setupStatus).mockRejectedValue(new TypeError('fetch failed'))
    const store = useSetupStore()

    await store.load()

    expect(store.errorCode).toBe('network_error')
    expect(store.errorStatus).toBeNull()
  })

  it('membership_enabled 为假时下发给界面；状态未知时按开启处理', async () => {
    vi.mocked(api.setupStatus).mockResolvedValue(localState)
    const store = useSetupStore()

    expect(store.membershipEnabled).toBe(true)

    await store.load()
    expect(store.membershipEnabled).toBe(false)
  })

  it('提交成功后就地标记已初始化：守卫立刻放行，不必再多打一次请求', async () => {
    vi.mocked(api.setupStatus).mockResolvedValue({ ...localState, initialized: false, mode: null })
    const store = useSetupStore()
    await store.load()

    store.markInitialized('local')

    expect(store.initialized).toBe(true)
    expect(store.mode).toBe('local')
    expect(store.needsSetup).toBe(false)
    
    expect(store.membershipEnabled).toBe(false)
  })
})
