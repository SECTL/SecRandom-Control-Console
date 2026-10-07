import { computed, onBeforeUnmount, ref, type ComputedRef } from 'vue'

















const sortingOwner = ref<string | null>(null)


let nextOwnerId = 0


export function useAnyListSorting(): ComputedRef<boolean> {
  return computed(() => sortingOwner.value !== null)
}


const DefaultHoldMs = 500


const PressSlopPx = 8

export interface LongPressSortOptions {
  
  ids: () => string[]
  
  onStart: () => void
  
  onMove: (from: number, to: number) => void
  
  onCommit: () => void
  
  onCancel: () => void
  
  holdMs?: number
}

export function useLongPressSort(options: LongPressSortOptions) {
  const owner = `group-sort-${++nextOwnerId}`
  const sorting = ref(false)
  const draggingId = ref<string | null>(null)

  let phase: 'idle' | 'press' | 'sort' = 'idle'
  let pressOrigin: { x: number; y: number } | null = null
  let holdTimer: number | null = null

  function arm(event: PointerEvent, id: string): void {
    if (phase !== 'idle' || sortingOwner.value !== null) return
    
    if (event.pointerType === 'mouse' && event.button !== 0) return

    phase = 'press'
    pressOrigin = { x: event.clientX, y: event.clientY }

    
    
    const target = event.currentTarget as HTMLElement | null
    if (typeof event.pointerId === 'number') target?.setPointerCapture?.(event.pointerId)

    holdTimer = window.setTimeout(() => {
      holdTimer = null
      begin(id)
    }, options.holdMs ?? DefaultHoldMs)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
  }

  function begin(id: string): void {
    if (phase !== 'press') return

    phase = 'sort'
    sortingOwner.value = owner
    sorting.value = true
    draggingId.value = id

    window.addEventListener('keydown', onKeyDown)
    options.onStart()
  }

  function onPointerMove(event: PointerEvent): void {
    if (phase === 'press') {
      if (pressOrigin === null) return
      const moved = Math.hypot(event.clientX - pressOrigin.x, event.clientY - pressOrigin.y)
      
      if (moved > PressSlopPx) abortPress()
      return
    }

    if (phase !== 'sort' || draggingId.value === null) return

    
    
    const under = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-sort-id]')
    const targetId = (under as HTMLElement | null)?.dataset.sortId
    if (targetId === undefined || targetId === '' || targetId === draggingId.value) return

    const ids = options.ids()
    const from = ids.indexOf(draggingId.value)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0 || from === to) return

    options.onMove(from, to)
  }

  function onPointerUp(): void {
    
    if (phase === 'press') {
      abortPress()
      return
    }

    if (phase === 'sort') finish(true)
  }

  function onPointerCancel(): void {
    if (phase === 'press') abortPress()
    else if (phase === 'sort') finish(false)
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') finish(false)
  }

  
  function abortPress(): void {
    teardown()
  }

  function finish(commit: boolean): void {
    const wasSorting = phase === 'sort'
    teardown()

    if (!wasSorting) return
    if (commit) options.onCommit()
    else options.onCancel()
  }

  function teardown(): void {
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer)
      holdTimer = null
    }

    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
    window.removeEventListener('keydown', onKeyDown)

    phase = 'idle'
    pressOrigin = null
    sorting.value = false
    draggingId.value = null
    if (sortingOwner.value === owner) sortingOwner.value = null
  }

  
  function moveBy(id: string, delta: number): void {
    const ids = options.ids()
    const from = ids.indexOf(id)
    if (from < 0) return

    const to = from + delta
    if (to < 0 || to >= ids.length) return

    options.onMove(from, to)
  }

  
  function commit(): void {
    if (phase === 'sort') finish(true)
  }

  
  function cancel(): void {
    if (phase === 'sort') finish(false)
  }

  
  
  onBeforeUnmount(() => {
    const wasSorting = phase === 'sort'
    teardown()
    if (wasSorting) options.onCancel()
  })

  return { sorting, draggingId, arm, moveBy, commit, cancel }
}
