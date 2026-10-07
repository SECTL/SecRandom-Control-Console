import { onBeforeUnmount, onMounted } from 'vue'









export const NODE_REFRESH_INTERVAL_MS = 10 * 1000







const VISIBLE_REFRESH_THROTTLE_MS = 2 * 1000

export interface AutoRefreshOptions {
  
  intervalMs?: number
  





  canRefresh?: () => boolean
}












export function useAutoRefresh(refresh: () => unknown, options: AutoRefreshOptions = {}): void {
  const intervalMs = options.intervalMs ?? NODE_REFRESH_INTERVAL_MS

  let timer: ReturnType<typeof setInterval> | undefined
  let inFlight = false
  let lastRunAt = 0

  async function run(): Promise<void> {
    if (inFlight) return
    if (options.canRefresh !== undefined && !options.canRefresh()) return

    inFlight = true
    lastRunAt = Date.now()
    try {
      await refresh()
    } catch {
      
    } finally {
      inFlight = false
    }
  }

  function onVisibilityChange(): void {
    if (document.visibilityState !== 'visible') return
    if (Date.now() - lastRunAt < VISIBLE_REFRESH_THROTTLE_MS) return
    void run()
  }

  onMounted(() => {
    if (intervalMs > 0) {
      timer = setInterval(() => {
        
        if (document.visibilityState !== 'visible') return
        void run()
      }, intervalMs)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onBeforeUnmount(() => {
    if (timer !== undefined) clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}
