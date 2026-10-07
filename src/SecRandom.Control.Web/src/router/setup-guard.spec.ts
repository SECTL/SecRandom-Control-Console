import { describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import {
  guardSetupEntry,
  resolveSetupRedirect,
  SETUP_ROUTE,
  shouldLoadSetupStatus,
  type SetupGuardContext,
} from './setup-guard'


function route(path: string, name?: string): RouteLocationNormalized {
  return { path, fullPath: path, name } as RouteLocationNormalized
}

function context(overrides: Partial<SetupGuardContext> = {}): SetupGuardContext {
  return {
    loaded: () => true,
    initialized: () => true,
    load: vi.fn(async () => {}),
    ...overrides,
  }
}

describe('实例初始化守卫', () => {
  it('未初始化：只放行 /setup，其余一律改道', () => {
    const ctx = context({ initialized: () => false })

    expect(resolveSetupRedirect(route(SETUP_ROUTE, 'setup'), ctx)).toBe(true)
    expect(resolveSetupRedirect(route('/console', 'console-groups'), ctx)).toBe(SETUP_ROUTE)
    expect(resolveSetupRedirect(route('/', 'home'), ctx)).toBe(SETUP_ROUTE)
  })

  it('未初始化也放行 /login：否则会和会话守卫成环', () => {
    
    
    const ctx = context({ initialized: () => false })

    expect(resolveSetupRedirect(route('/login', 'login'), ctx)).toBe(true)
  })

  it('已初始化：一切照旧放行', () => {
    const ctx = context()

    expect(resolveSetupRedirect(route('/console', 'console-groups'), ctx)).toBe(true)
    expect(resolveSetupRedirect(route('/login', 'login'), ctx)).toBe(true)
  })

  it('状态未知（请求失败）：放行，绝不把人锁在向导里', () => {
    
    
    const ctx = context({ loaded: () => false, initialized: () => false })

    expect(resolveSetupRedirect(route('/console', 'console-groups'), ctx)).toBe(true)
    expect(resolveSetupRedirect(route('/', 'home'), ctx)).toBe(true)
  })

  it('状态未知时任何一次导航都要先读一次', () => {
    expect(shouldLoadSetupStatus(context({ loaded: () => false }))).toBe(true)
  })

  it('状态已确定就不再重复读：初始化的实例不该为每次点击多付一次往返', () => {
    expect(shouldLoadSetupStatus(context())).toBe(false)
  })

  it('读状态失败也照样能走出判断（走"未知则放行"那条）', async () => {
    const load = vi.fn(async () => {})
    const ctx = context({ loaded: () => false, initialized: () => false, load })

    await expect(guardSetupEntry(route('/console', 'console-groups'), ctx)).resolves.toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('未初始化：读完之后改道向导', async () => {
    let loaded = false
    const ctx = context({
      loaded: () => loaded,
      initialized: () => false,
      load: vi.fn(async () => {
        loaded = true
      }),
    })

    await expect(guardSetupEntry(route('/', 'home'), ctx)).resolves.toBe(SETUP_ROUTE)
  })
})
