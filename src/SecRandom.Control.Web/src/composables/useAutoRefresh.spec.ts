import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { useAutoRefresh, type AutoRefreshOptions } from './useAutoRefresh'











let visibility: DocumentVisibilityState = 'visible'

function setVisibility(next: DocumentVisibilityState): void {
  visibility = next
  document.dispatchEvent(new Event('visibilitychange'))
}

function mountHost(
  refresh: () => unknown,
  options: AutoRefreshOptions = {},
): VueWrapper {
  const Host = defineComponent({
    setup() {
      useAutoRefresh(refresh, options)
      return () => h('div')
    },
  })

  return mount(Host)
}

describe('useAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    visibility = 'visible'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('按间隔刷新', async () => {
    const refresh = vi.fn()
    mountHost(refresh, { intervalMs: 1000 })

    expect(refresh).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)
    expect(refresh).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(2000)
    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('后台标签页不刷新', async () => {
    const refresh = vi.fn()
    mountHost(refresh, { intervalMs: 1000 })

    visibility = 'hidden'
    await vi.advanceTimersByTimeAsync(5000)

    expect(refresh).not.toHaveBeenCalled()
  })

  it('切回前台立刻补一次，抑制窗口内不重复', async () => {
    const refresh = vi.fn()
    mountHost(refresh, { intervalMs: 60_000 })

    
    visibility = 'hidden'
    await vi.advanceTimersByTimeAsync(1000)
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).toHaveBeenCalledTimes(1)

    
    setVisibility('hidden')
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).toHaveBeenCalledTimes(1)

    
    await vi.advanceTimersByTimeAsync(2000)
    setVisibility('hidden')
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('上一次还没回来时不叠加', async () => {
    let release: () => void = () => {}
    const refresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )

    mountHost(refresh, { intervalMs: 1000 })

    await vi.advanceTimersByTimeAsync(3000)
    expect(refresh).toHaveBeenCalledTimes(1)

    release()
    await vi.advanceTimersByTimeAsync(1000)
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('canRefresh 返回 false 时这一轮跳过，恢复后继续', async () => {
    const refresh = vi.fn()
    let allowed = false
    mountHost(refresh, { intervalMs: 1000, canRefresh: () => allowed })

    await vi.advanceTimersByTimeAsync(3000)
    expect(refresh).not.toHaveBeenCalled()

    allowed = true
    await vi.advanceTimersByTimeAsync(1000)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('卸载后不再刷新', async () => {
    const refresh = vi.fn()
    const wrapper = mountHost(refresh, { intervalMs: 1000 })

    await vi.advanceTimersByTimeAsync(1000)
    expect(refresh).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(5000)
    expect(refresh).toHaveBeenCalledTimes(1)

    
    setVisibility('hidden')
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('间隔为非正数时不装定时器，但切回前台仍会刷一次', async () => {
    const refresh = vi.fn()
    mountHost(refresh, { intervalMs: 0 })

    await vi.advanceTimersByTimeAsync(60_000)
    expect(refresh).not.toHaveBeenCalled()

    setVisibility('hidden')
    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('刷新抛错不会产生未处理的 rejection', async () => {
    const refresh = vi.fn(() => Promise.reject(new Error('boom')))
    mountHost(refresh, { intervalMs: 1000 })

    await vi.advanceTimersByTimeAsync(2000)

    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
