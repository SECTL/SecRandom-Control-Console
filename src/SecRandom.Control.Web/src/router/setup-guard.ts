import type { RouteLocationNormalized } from 'vue-router'


export const SETUP_ROUTE = '/setup'








export const SETUP_BYPASS_ROUTES: readonly string[] = ['login']









export interface SetupGuardContext {
  
  loaded: () => boolean
  
  initialized: () => boolean
  
  load: () => Promise<void>
}


















export function resolveSetupRedirect(
  to: RouteLocationNormalized,
  context: SetupGuardContext,
): true | string {
  if (to.path === SETUP_ROUTE) return true
  if (isSetupBypassRoute(to)) return true

  
  if (!context.loaded()) return true

  if (context.initialized()) return true

  
  return SETUP_ROUTE
}







export function shouldLoadSetupStatus(context: SetupGuardContext): boolean {
  return !context.loaded()
}

function isSetupBypassRoute(to: RouteLocationNormalized): boolean {
  const name = to.name
  return typeof name === 'string' && SETUP_BYPASS_ROUTES.includes(name)
}







export async function guardSetupEntry(
  to: RouteLocationNormalized,
  context: SetupGuardContext,
): Promise<true | string> {
  if (shouldLoadSetupStatus(context)) await context.load()
  return resolveSetupRedirect(to, context)
}
