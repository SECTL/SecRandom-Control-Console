import { onBeforeUnmount, onMounted, watch } from 'vue'




export const PRESENCE_EVENT_NAME = 'nodes'







const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30 * 1000


const EVENT_SOURCE_CLOSED = 2








const POKE_THROTTLE_MS = 1000

export interface PresenceEventsOptions {
  



  createEventSource?: (url: string) => EventSource | null
  
  canRefresh?: () => boolean
}

















export function usePresenceEvents(
  groupId: () => string,
  onPoke: () => unknown,
  options: PresenceEventsOptions = {},
): void {
  let source: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let trailingTimer: ReturnType<typeof setTimeout> | undefined
  let attempts = 0
  let stopped = false
  let lastPokeAt = 0

  function canFire(): boolean {
    return options.canRefresh === undefined || options.canRefresh()
  }

  async function fire(): Promise<void> {
    lastPokeAt = Date.now()
    try {
      await onPoke()
    } catch {
      
    }
  }

  
  function poke(): void {
    if (stopped || !canFire()) return

    const elapsed = Date.now() - lastPokeAt
    if (elapsed >= POKE_THROTTLE_MS) {
      void fire()
      return
    }

    if (trailingTimer !== undefined) return
    trailingTimer = setTimeout(() => {
      trailingTimer = undefined
      if (!stopped && canFire()) void fire()
    }, POKE_THROTTLE_MS - elapsed)
  }

  function clearReconnect(): void {
    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }
    if (trailingTimer !== undefined) {
      clearTimeout(trailingTimer)
      trailingTimer = undefined
    }
  }

  function closeSource(): void {
    if (source === null) return
    source.removeEventListener(PRESENCE_EVENT_NAME, poke)
    source.close()
    source = null
  }

  function scheduleReconnect(): void {
    if (stopped || reconnectTimer !== undefined) return

    closeSource()

    const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempts, RECONNECT_MAX_MS)
    attempts += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined
      connect()
    }, delay)
  }

  function connect(): void {
    if (stopped) return

    const group = groupId()
    if (group.length === 0) return

    closeSource()

    const url = `/v1/groups/${encodeURIComponent(group)}/events`
    const created = options.createEventSource
      ? options.createEventSource(url)
      : typeof EventSource === 'undefined'
        ? null
        : new EventSource(url)

    
    if (created === null) return

    source = created
    source.addEventListener(PRESENCE_EVENT_NAME, poke)
    source.addEventListener('open', () => {
      attempts = 0
    })
    source.addEventListener('error', () => {
      
      
      if (source?.readyState !== EVENT_SOURCE_CLOSED) return
      scheduleReconnect()
    })
  }

  onMounted(connect)

  
  watch(groupId, () => {
    attempts = 0
    clearReconnect()
    connect()
  })

  onBeforeUnmount(() => {
    stopped = true
    clearReconnect()
    closeSource()
  })
}
