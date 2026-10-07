import { ref } from 'vue'













export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'srctrl:theme'


export function resolveInitialTheme(): ThemeMode {
  const fromDom = documentTheme()
  if (fromDom) return fromDom
  return readStoredTheme() ?? (prefersLight() ? 'light' : 'dark')
}

function documentTheme(): ThemeMode | null {
  if (typeof document === 'undefined') return null
  const value = document.documentElement.dataset.theme
  return value === 'light' || value === 'dark' ? value : null
}


function readStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function prefersLight(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: light)').matches
}

export const currentTheme = ref<ThemeMode>(resolveInitialTheme())


function apply(mode: ThemeMode): void {
  currentTheme.value = mode
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = mode
}





export function setTheme(mode: ThemeMode): void {
  apply(mode)
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    
  }
}

export function toggleTheme(): void {
  setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
}







export function initTheme(): () => void {
  apply(currentTheme.value)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}

  const media = window.matchMedia('(prefers-color-scheme: light)')
  const onChange = (event: MediaQueryListEvent): void => {
    if (readStoredTheme() !== null) return
    apply(event.matches ? 'light' : 'dark')
  }

  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
