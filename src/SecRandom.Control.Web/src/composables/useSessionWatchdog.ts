import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CONSOLE_PATH_PREFIX, redirectToSectlLogin } from '@/router/console-guard'
import { useSessionStore } from '@/stores/session'








export const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000


const VISIBILITY_CHECK_THROTTLE_MS = 30 * 1000

export interface SessionWatchdogOptions {
  
  redirect?: (returnTo: string) => void
  
  intervalMs?: number
}








export function useSessionWatchdog(options: SessionWatchdogOptions = {}): void {
  const redirect = options.redirect ?? redirectToSectlLogin
  const intervalMs = options.intervalMs ?? SESSION_CHECK_INTERVAL_MS

  const session = useSessionStore()
  const route = useRoute()

  let timer: ReturnType<typeof setInterval> | undefined
  let lastCheckAt = 0

  async function check(): Promise<void> {
    lastCheckAt = Date.now()

    
    const wasSignedIn = session.isSignedIn
    await session.load()

    if (!wasSignedIn || session.isSignedIn) return

    
    if (session.serviceUnavailable) return

    if (!route.path.startsWith(CONSOLE_PATH_PREFIX)) return

    redirect(route.fullPath)
  }

  function onVisibilityChange(): void {
    if (document.visibilityState !== 'visible') return
    if (Date.now() - lastCheckAt < VISIBILITY_CHECK_THROTTLE_MS) return
    void check()
  }

  onMounted(() => {
    timer = setInterval(() => void check(), intervalMs)
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onBeforeUnmount(() => {
    if (timer !== undefined) clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}
