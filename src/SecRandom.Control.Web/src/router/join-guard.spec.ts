import { describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { CONSOLE_ROUTE, resolveJoinRedirect, type JoinGuardContext } from './join-guard'

function route(path: string, fullPath = path): RouteLocationNormalized {
  return { path, fullPath } as RouteLocationNormalized
}

function context(overrides: Partial<JoinGuardContext> = {}): JoinGuardContext {
  return {
    localMode: () => false,
    membershipEnabled: () => true,
    ...overrides,
  }
}

describe('resolveJoinRedirect', () => {
  it('非邀请页直接放行，且不查实例状态', () => {
    const localMode = vi.fn(() => false)
    const membershipEnabled = vi.fn(() => true)

    expect(resolveJoinRedirect(route('/'), context({ localMode, membershipEnabled }))).toBe(true)
    expect(resolveJoinRedirect(route('/login'), context({ localMode, membershipEnabled }))).toBe(true)
    expect(localMode).not.toHaveBeenCalled()
    expect(membershipEnabled).not.toHaveBeenCalled()
  })

  it('官方云模式下邀请页保持原行为', () => {
    expect(resolveJoinRedirect(route('/join'), context())).toBe(true)
  })

  it('带邀请码的邀请页在官方云模式下同样放行', () => {
    expect(resolveJoinRedirect(route('/join', '/join?code=ABCD-1234'), context())).toBe(true)
  })

  it('本地模式没有邀请入口：邀请页改去控制台', () => {
    expect(resolveJoinRedirect(route('/join'), context({ localMode: () => true }))).toBe(CONSOLE_ROUTE)
  })

  it('实例未开启成员功能时同样改去控制台', () => {
    expect(
      resolveJoinRedirect(
        route('/join', '/join?code=ABCD-1234'),
        context({ membershipEnabled: () => false }),
      ),
    ).toBe(CONSOLE_ROUTE)
  })
})
