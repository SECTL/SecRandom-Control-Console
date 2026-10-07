import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useSessionWatchdog } from './useSessionWatchdog'
import { useSessionStore } from '@/stores/session'
import type { CurrentUser } from '@/api/protocol'







const signedInUser: CurrentUser = { user_id: 'u-1', display_name: '张老师', groups: [] }

interface Harness {
  wrapper: VueWrapper
  session: ReturnType<typeof useSessionStore>
  redirect: ReturnType<typeof vi.fn>
}

async function mountWatchdog(path: string): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/console', component: { template: '<div />' } },
      { path: '/console/groups/:groupId', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  await router.isReady()

  const session = useSessionStore(pinia)
  session.user = signedInUser
  session.loaded = true

  const redirect = vi.fn()
  const Host = defineComponent({
    setup() {
      useSessionWatchdog({ redirect, intervalMs: 1000 })
      return () => h('div')
    },
  })

  const wrapper = mount(Host, { global: { plugins: [pinia, router] } })
  return { wrapper, session, redirect }
}

describe('useSessionWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('按间隔重新查询会话', async () => {
    const { session } = await mountWatchdog('/console')
    const load = vi.fn(async () => {})
    session.load = load

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('控制台里会话失效（例如在官网退出登录）时跳回 SECTL 授权', async () => {
    const { session, redirect } = await mountWatchdog('/console/groups/g-1')
    
    session.load = vi.fn(async () => {
      session.user = null
    })

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(redirect).toHaveBeenCalledWith('/console/groups/g-1')
  })

  it('服务不可用时不跳转（那是运维问题，不是会话失效）', async () => {
    const { session, redirect } = await mountWatchdog('/console')
    session.load = vi.fn(async () => {
      session.user = null
      session.errorCode = 'http_502'
    })

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(redirect).not.toHaveBeenCalled()
  })

  it('未登录的访客不会被推去授权（本来就没登录）', async () => {
    const { session, redirect } = await mountWatchdog('/')
    session.user = null
    session.load = vi.fn(async () => {})

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(redirect).not.toHaveBeenCalled()
  })
})
