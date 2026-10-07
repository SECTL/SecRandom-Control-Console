import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import ThemeToggle from './ThemeToggle.vue'
import { setTheme } from '@/theme'
import zhCN from '@/i18n/locales/zh-CN'





function mountToggle() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  return mount(ThemeToggle, { global: { plugins: [pinia, i18n] } })
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    setTheme('dark')
  })

  it('深色时显示太阳，按钮名说的是"点击后的结果"', () => {
    const wrapper = mountToggle()

    expect(wrapper.get('button').attributes('aria-label')).toBe(zhCN.theme.toLight)
    expect(wrapper.get('button').attributes('title')).toBe(zhCN.theme.toLight)
  })

  it('点击切到浅色：DOM 与 localStorage 一起更新，图标与按钮名同步翻转', async () => {
    const wrapper = mountToggle()

    await wrapper.get('button').trigger('click')

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('srctrl:theme')).toBe('light')
    expect(wrapper.get('button').attributes('aria-label')).toBe(zhCN.theme.toDark)

    await wrapper.get('button').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('srctrl:theme')).toBe('dark')
  })
})
