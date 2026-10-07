import { describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { guardConsoleEntry, LOGIN_ROUTE, type ConsoleGuardContext } from './console-guard'








function route(path: string): RouteLocationNormalized {
  return { path, fullPath: path } as RouteLocationNormalized
}

function context(overrides: Partial<ConsoleGuardContext> = {}): ConsoleGuardContext {
  return {
    isSignedIn: () => true,
    loaded: () => true,
    serviceUnavailable: () => false,
    load: vi.fn(async () => {}),
    redirectToSectlLogin: vi.fn(),
    ...overrides,
  }
}

describe('guardConsoleEntry', () => {
  it('非控制台路径直接放行，且不查会话', async () => {
    const load = vi.fn(async () => {})
    const result = await guardConsoleEntry(route('/'), route('/login'), context({ load }))

    expect(result).toBe(true)
    expect(load).not.toHaveBeenCalled()
  })

  it('从站外进入控制台时，即使内存里已是登录态也必须重新校验一次', async () => {
    const load = vi.fn(async () => {})
    const result = await guardConsoleEntry(
      route('/console'),
      route('/'),
      context({ load, loaded: () => true }),
    )

    expect(result).toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('控制台内部导航不重复校验', async () => {
    const load = vi.fn(async () => {})
    const result = await guardConsoleEntry(
      route('/console/groups/g-1'),
      route('/console'),
      context({ load }),
    )

    expect(result).toBe(true)
    expect(load).not.toHaveBeenCalled()
  })

  it('未登录时跳转 SECTL 授权，并阻断本次导航（保留原始目标）', async () => {
    const redirectToSectlLogin = vi.fn()
    const result = await guardConsoleEntry(
      route('/console/groups/g-1'),
      route('/'),
      context({ isSignedIn: () => false, redirectToSectlLogin }),
    )

    expect(result).toBe(false)
    expect(redirectToSectlLogin).toHaveBeenCalledWith('/console/groups/g-1')
  })

  it('服务不可用时改去登录页，而不是把用户推给 SECTL', async () => {
    const redirectToSectlLogin = vi.fn()
    const result = await guardConsoleEntry(
      route('/console'),
      route('/'),
      context({
        isSignedIn: () => false,
        serviceUnavailable: () => true,
        redirectToSectlLogin,
      }),
    )

    
    expect(result).toBe(LOGIN_ROUTE)
    expect(redirectToSectlLogin).not.toHaveBeenCalled()
  })
})
