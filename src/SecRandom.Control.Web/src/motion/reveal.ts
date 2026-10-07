import type { App } from 'vue'






















const STAGGER_MS = 55
const MAX_STAGGER_STEPS = 6


const OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: '0px 0px -8% 0px',
  threshold: 0.05,
}















const REVEAL_SELECTOR = '[data-reveal], .reveal'

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}


function revealAllNow(root: HTMLElement): void {
  for (const element of root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)) {
    element.dataset['revealed'] = ''
  }
}

export function installReveal(app: App): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const root = document.documentElement

  
  if (prefersReducedMotion() || typeof IntersectionObserver !== 'function') {
    revealAllNow(root)
    return
  }

  
  
  root.dataset['revealReady'] = 'true'

  
  let batchIndex = 0
  let batchFrame = 0

  const observer = new IntersectionObserver((entries) => {
    const entering: HTMLElement[] = []
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const element = entry.target as HTMLElement
      observer.unobserve(element)
      entering.push(element)
    }
    if (entering.length === 0) return

    
    entering.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    for (const element of entering) {
      const step = Math.min(batchIndex, MAX_STAGGER_STEPS)
      batchIndex += 1
      window.setTimeout(() => {
        element.dataset['revealed'] = ''
      }, step * STAGGER_MS)
    }

    
    if (batchFrame === 0) {
      batchFrame = window.requestAnimationFrame(() => {
        batchIndex = 0
        batchFrame = 0
      })
    }
  }, OBSERVER_OPTIONS)

  function observeNew(): void {
    for (const element of root.querySelectorAll<HTMLElement>(
      `${REVEAL_SELECTOR}:not([data-revealed])`,
    )) {
      if (element.dataset['revealPending'] === 'true') continue
      element.dataset['revealPending'] = 'true'
      observer.observe(element)
    }
  }

  observeNew()

  
  const mutation = new MutationObserver(() => observeNew())
  mutation.observe(root, { childList: true, subtree: true })

  
  
  window.setTimeout(() => {
    for (const element of root.querySelectorAll<HTMLElement>(
      `${REVEAL_SELECTOR}:not([data-revealed])`,
    )) {
      const box = element.getBoundingClientRect()
      const visible = box.width > 0 && box.height > 0 && box.top < window.innerHeight
      if (visible) element.dataset['revealed'] = ''
    }
  }, 2500)

  const router = app.config.globalProperties.$router as
    | { afterEach: (hook: () => void) => void }
    | undefined
  router?.afterEach(() => {
    
    window.requestAnimationFrame(() => observeNew())
  })
}
