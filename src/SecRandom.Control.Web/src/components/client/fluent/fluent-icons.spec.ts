import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FluentIcon from './FluentIcon.vue'
import {
  FLUENT_ICON_FALLBACK,
  FLUENT_ICONS,
  fluentGlyph,
  hasFluentIcon,
  normalizeFluentIconName,
  resolveFluentIconName,
} from './fluent-icons'
import { CLIENT_SETTINGS_PAGES } from '@/data/client-settings-pages'








describe('fluent-icons', () => {
  it('恰好收着复刻稿用到的 36 个字形，每个码位都不为 0', () => {
    expect(Object.keys(FLUENT_ICONS)).toHaveLength(36)
    for (const [name, code] of Object.entries(FLUENT_ICONS)) {
      expect(code, name).toBeGreaterThan(0)
      
      expect(code, name).toBeGreaterThanOrEqual(0xe000)
      expect(code, name).toBeLessThanOrEqual(0xf8ff)
    }
  })

  it('三种写法都能认出来：短名 / JSON 键 / FluentAvalonia 名', () => {
    expect(resolveFluentIconName('flash')).toBe('flash')
    expect(resolveFluentIconName('ic_fluent_flash_20_filled')).toBe('flash')
    expect(resolveFluentIconName('ic_fluent_arrow_left_20_regular')).toBe('arrowLeft')
    expect(resolveFluentIconName('FlashFilled')).toBe('flash')
    expect(resolveFluentIconName('PeopleListFilled')).toBe('peopleList')
    expect(normalizeFluentIconName('ic_fluent_chevron_down_20_filled')).toBe('chevronDown')
  })

  it('别名只指向已经收着的那 36 个字形（不为新名字引入新字形）', () => {
    expect(resolveFluentIconName('LotteryFilled')).toBe('gift')
    expect(resolveFluentIconName('WindowAppsFilled')).toBe('databaseWindow')
    expect(FLUENT_ICONS[resolveFluentIconName('LotteryFilled') ?? 'gift']).toBe(FLUENT_ICONS.gift)
  })

  it('认不出来的名字回落到齿轮，而不是空字符串', () => {
    expect(resolveFluentIconName('not_a_real_icon')).toBeNull()
    expect(hasFluentIcon('not_a_real_icon')).toBe(false)
    expect(fluentGlyph('not_a_real_icon')).toBe(fluentGlyph(FLUENT_ICON_FALLBACK))
    expect(fluentGlyph('not_a_real_icon').length).toBe(1)
  })

  







  it('客户端设置页快照里的每个图标名都命中字形（不留齿轮）', () => {
    const names = new Set<string>()
    for (const page of CLIENT_SETTINGS_PAGES) {
      names.add(page.icon)
      for (const section of page.sections) {
        for (const row of section.rows) names.add(row.icon)
      }
    }

    const missing = [...names].filter((name) => !hasFluentIcon(name))
    expect(missing).toEqual([])
  })
})

describe('FluentIcon', () => {
  it('画出一个字符（不是 SVG，也不是空框）', () => {
    const wrapper = mount(FluentIcon, { props: { name: 'flash' } })
    const span = wrapper.get('span.cn-fi')

    expect(span.text()).toBe(String.fromCodePoint(FLUENT_ICONS.flash))
    expect(span.attributes('aria-hidden')).toBe('true')
    
    expect(span.attributes('data-icon-name')).toBe('flash')
    expect(span.attributes('data-icon-unknown')).toBeUndefined()
  })

  it('认不出来的名字画回落字形，并把原名留在 DOM 上供排查', () => {
    const wrapper = mount(FluentIcon, { props: { name: 'ic_fluent_totally_new_20_filled' } })

    expect(wrapper.get('span.cn-fi').text()).toBe(fluentGlyph(FLUENT_ICON_FALLBACK))
    expect(wrapper.get('span.cn-fi').attributes('data-icon-unknown')).toBe(
      'ic_fluent_totally_new_20_filled',
    )
  })

  it('size 只改字号，不改字形', () => {
    const wrapper = mount(FluentIcon, { props: { name: 'delete', size: 20 } })

    expect(wrapper.get('span.cn-fi').attributes('style')).toContain('font-size: 20px')
  })
})
