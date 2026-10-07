import type { RouteLocationNormalized } from 'vue-router'


export const CONSOLE_PATH_PREFIX = '/console'


export const LOGIN_ROUTE = '/login'








export interface ConsoleGuardContext {
  
  isSignedIn: () => boolean
  
  loaded: () => boolean
  
  serviceUnavailable: () => boolean
  
  load: () => Promise<void>
  
  redirectToSectlLogin: (returnTo: string) => void

  localMode: () => boolean
}














export async function guardConsoleEntry(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  context: ConsoleGuardContext,
): Promise<true | false | string> {
  if (!to.path.startsWith(CONSOLE_PATH_PREFIX)) return true

  const enteringFromOutside = !from.path.startsWith(CONSOLE_PATH_PREFIX)
  if (enteringFromOutside || !context.loaded()) await context.load()

  if (context.isSignedIn()) return true

  
  
  if (context.serviceUnavailable()) return LOGIN_ROUTE

  if (context.localMode()) return localLoginPath(to.fullPath)

  context.redirectToSectlLogin(to.fullPath)
  return false
}








export function redirectToSectlLogin(returnTo: string): void {
  window.location.assign(`/api/auth/login?return_to=${encodeURIComponent(returnTo)}`)
}

export function localLoginPath(returnTo: string): string {
  return `${LOGIN_ROUTE}?return_to=${encodeURIComponent(returnTo)}`
}

export function redirectToLocalLogin(returnTo: string): void {
  window.location.assign(localLoginPath(returnTo))
}
