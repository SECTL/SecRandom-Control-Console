import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ClientPageNav from './ClientPageNav.vue'
import type { ClientPageNavGroup } from './client-model'








const GROUPS: readonly ClientPageNavGroup[] = [
  {
    id: 'picking',
    label: '抽取设置',
    items: [
      { id: 'draw-default', label: '默认抽取设置', icon: 'flash' },
      { id: 'draw-rollcall', label: '点名抽取设置', icon: 'flash' },
    ],
  },
  {
    id: 'list',
    label: '名单管理',
    items: [{ id: 'rollcall-list', label: '成员名单', icon: 'peopleList' }],
  },
]

function mountNav(selected = 'draw-rollcall') {
  return mount(ClientPageNav, { props: { groups: GROUPS, selected, label: '设置分组' } })
}

describe('ClientPageNav', () => {
  it('画出分组名与每一项的图标 + 文字', () => {
    const wrapper = mountNav()

    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('设置分组')
    expect(wrapper.findAll('.cn-nav__group').map((node) => node.text())).toEqual([
      '抽取设置',
      '名单管理',
    ])
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    expect(wrapper.get('[data-testid="client-nav-draw-rollcall"]').text()).toContain('点名抽取设置')
    
    expect(wrapper.findAll('.cn-nav__indicator')).toHaveLength(3)
  })

  it('选中的项 aria-selected=true，其余 false', () => {
    const wrapper = mountNav()
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs.map((tab) => tab.attributes('aria-selected'))).toEqual(['false', 'true', 'false'])
  })

  it('roving tabindex：只有选中项在 Tab 序列里', () => {
    const wrapper = mountNav()
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs.map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('点一项只发 select，自己不偷改选中态（受控组件）', async () => {
    const wrapper = mountNav()

    await wrapper.get('[data-testid="client-nav-draw-default"]').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['draw-default']])
    expect(wrapper.get('[data-testid="client-nav-draw-rollcall"]').attributes('aria-selected')).toBe(
      'true',
    )
  })

  it('方向键跨分组走，并把选中项一起带过去（automatic activation）', async () => {
    const wrapper = mountNav()
    const tabs = wrapper.findAll('[role="tab"]')

    await tabs[2]?.trigger('keydown', { key: 'ArrowDown' })
    
    expect(wrapper.emitted('select')).toEqual([['draw-default']])

    await tabs[0]?.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('select')?.[1]).toEqual(['rollcall-list'])
  })

  it('Home / End 到首尾，焦点跟着走', async () => {
    const wrapper = mountNav()
    const tabs = wrapper.findAll('[role="tab"]')

    await tabs[1]?.trigger('keydown', { key: 'End' })
    await nextTick()
    expect(wrapper.emitted('select')?.[0]).toEqual(['rollcall-list'])

    await tabs[0]?.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('select')?.[1]).toEqual(['draw-default'])
  })

  it('别的键不拦截（Tab 要能正常离开导航）', async () => {
    const wrapper = mountNav()

    await wrapper.findAll('[role="tab"]')[1]?.trigger('keydown', { key: 'Tab' })

    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
