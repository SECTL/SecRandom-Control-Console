import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { PRESENCE_EVENT_NAME, usePresenceEvents } from './usePresenceEvents'











class FakeEventSource {
  static instances: FakeEventSource[] = []

  readonly listeners = new Map<string, Set<() => void>>()
  readyState = 1

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, handler: () => void): void {
    const set = this.listeners.get(type) ?? new Set<() => void>()
    set.add(handler)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, handler: () => void): void {
    this.listeners.get(type)?.delete(handler)
  }

  close(): void {
    this.readyState = 2
  }

  emit(type: string): void {
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler()
  }

  static get last(): FakeEventSource | undefined {
    return FakeEventSource.instances.at(-1)
  }

  static asEventSource = (url: string): EventSource =>
    new FakeEventSource(url) as unknown as EventSource
}

function mountHost(
  onPoke: () => unknown,
  options: Parameters<typeof usePresenceEvents>[2] = {},
  groupId = 'grp_1',
): VueWrapper {
  const Host = defineComponent({
    setup() {
      usePresenceEvents(() => groupId, onPoke, options)
      return () => h('div')
    },
  })

  return mount(Host)
}

describe('usePresenceEvents', () => {
  beforeEach(() => {
    FakeEventSource.instances = []
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('挂载即连上本组的事件流', () => {
    mountHost(vi.fn(), { createEventSource: FakeEventSource.asEventSource })

    expect(FakeEventSource.instances).toHaveLength(1)
    expect(FakeEventSource.last?.url).toBe('/v1/groups/grp_1/events')
  })

  it('收到 "有变化" 的通知立刻重拉', async () => {
    const onPoke = vi.fn()
    mountHost(onPoke, { createEventSource: FakeEventSource.asEventSource })

    FakeEventSource.last?.emit(PRESENCE_EVENT_NAME)
    await flushPromises()

    expect(onPoke).toHaveBeenCalledTimes(1)
  })

  it('一秒内的连发合并成一次收尾刷新，不丢最后一次', async () => {
    const onPoke = vi.fn()
    mountHost(onPoke, { createEventSource: FakeEventSource.asEventSource })

    
    FakeEventSource.last?.emit(PRESENCE_EVENT_NAME)
    await flushPromises()
    expect(onPoke).toHaveBeenCalledTimes(1)

    FakeEventSource.last?.emit(PRESENCE_EVENT_NAME)
    FakeEventSource.last?.emit(PRESENCE_EVENT_NAME)
    await vi.advanceTimersByTimeAsync(500)
    expect(onPoke).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()
    expect(onPoke).toHaveBeenCalledTimes(2)
  })

  it('有写操作在飞时跳过（收尾刷新也不排）', async () => {
    const onPoke = vi.fn()
    let allowed = false
    mountHost(onPoke, { createEventSource: FakeEventSource.asEventSource, canRefresh: () => allowed })

    FakeEventSource.last?.emit(PRESENCE_EVENT_NAME)
    await vi.advanceTimersByTimeAsync(2000)
    expect(onPoke).not.toHaveBeenCalled()

    allowed = true
    FakeEventSource.last?.emit(PRESENCE_EVENT_NAME)
    await flushPromises()
    expect(onPoke).toHaveBeenCalledTimes(1)
  })

  it('卸载后关流且不再刷新', async () => {
    const onPoke = vi.fn()
    const wrapper = mountHost(onPoke, { createEventSource: FakeEventSource.asEventSource })
    const stream = FakeEventSource.last!

    wrapper.unmount()

    expect(stream.readyState).toBe(2)
    stream.emit(PRESENCE_EVENT_NAME)
    await vi.advanceTimersByTimeAsync(5000)
    expect(onPoke).not.toHaveBeenCalled()
  })

  it('浏览器放弃这条流时按退避重建', async () => {
    mountHost(vi.fn(), { createEventSource: FakeEventSource.asEventSource })
    const first = FakeEventSource.last!

    
    first.readyState = 2
    first.emit('error')

    await vi.advanceTimersByTimeAsync(1000)
    expect(FakeEventSource.instances).toHaveLength(2)
    expect(FakeEventSource.last?.url).toBe('/v1/groups/grp_1/events')

    
    FakeEventSource.last!.readyState = 2
    FakeEventSource.last!.emit('error')
    await vi.advanceTimersByTimeAsync(1000)
    expect(FakeEventSource.instances).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1000)
    expect(FakeEventSource.instances).toHaveLength(3)
  })

  it('环境里没有事件流时静默降级：不抛错、不刷新（轮询照旧工作）', async () => {
    const onPoke = vi.fn()
    mountHost(onPoke, { createEventSource: () => null })

    await vi.advanceTimersByTimeAsync(30_000)
    expect(onPoke).not.toHaveBeenCalled()
  })
})
