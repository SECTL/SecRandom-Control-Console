import type { RouteLocationNormalized } from 'vue-router'

export const JOIN_ROUTE = '/join'

export const CONSOLE_ROUTE = '/console'

export interface JoinGuardContext {
  localMode: () => boolean
  membershipEnabled: () => boolean
}

export function resolveJoinRedirect(
  to: RouteLocationNormalized,
  context: JoinGuardContext,
): true | string {
  if (to.path !== JOIN_ROUTE) return true

  if (context.localMode() || !context.membershipEnabled()) return CONSOLE_ROUTE

  return true
}
