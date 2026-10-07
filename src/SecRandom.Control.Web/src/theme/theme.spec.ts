import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  currentTheme,
  initTheme,
  resolveInitialTheme,
  setTheme,
  toggleTheme,
  type ThemeMode,
} from './index'

const STORAGE_KEY = 'srctrl:theme'

function domTheme(): ThemeMode | undefined {
  const value = document.documentElement.dataset.theme
  return value === 'light' || value === 'dark' ? value : undefined
}





function stubMatchMedia(prefersLight: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const query = {
    matches: prefersLight,
    media: '(prefers-color-scheme: light)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener)
    },
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => query),
  })

  return {
    emit(matches: boolean) {
      query.matches = matches
      for (const listener of listeners) listener({ matches } as MediaQueryListEvent)
    },
    listenerCount: () => listeners.size,
  }
}

function removeMatchMedia(): void {
  Reflect.deleteProperty(window, 'matchMedia')
}

describe('主题', () => {
  beforeEach(() => {
    localStorage.clear()
    removeMatchMedia()
    delete document.documentElement.dataset.theme
  })

  it('没有显式选择、系统也不表态时是深色', () => {
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('系统偏好浅色时用浅色', () => {
    stubMatchMedia(true)
    expect(resolveInitialTheme()).toBe('light')
  })

  it('显式选择优先于系统偏好', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    stubMatchMedia(true)
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('DOM 上已有的结论优先——它由 index.html 的内联脚本写入（防首屏闪烁）', () => {
    
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem(STORAGE_KEY, 'dark')
    expect(resolveInitialTheme()).toBe('light')
  })

  it('localStorage 里的垃圾值不会被当成主题', () => {
    localStorage.setItem(STORAGE_KEY, 'solarized')
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('setTheme 同时落到 <html data-theme> 与 localStorage', () => {
    setTheme('light')

    expect(currentTheme.value).toBe('light')
    expect(domTheme()).toBe('light')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('toggleTheme 在两态之间来回切', () => {
    setTheme('dark')
    toggleTheme()
    expect(domTheme()).toBe('light')
    toggleTheme()
    expect(domTheme()).toBe('dark')
  })

  it('initTheme 立刻把当前主题落到 DOM，并在用户没选过时跟随系统', () => {
    setTheme('dark')
    localStorage.clear() 

    const media = stubMatchMedia(false)
    const stop = initTheme()

    expect(domTheme()).toBe('dark')

    media.emit(true)
    expect(domTheme()).toBe('light')

    stop()
    expect(media.listenerCount()).toBe(0)
  })

  it('用户显式选过之后，系统改主题不再覆盖他的选择', () => {
    setTheme('dark') 

    const media = stubMatchMedia(false)
    const stop = initTheme()

    media.emit(true)

    expect(domTheme()).toBe('dark')
    stop()
  })
})
