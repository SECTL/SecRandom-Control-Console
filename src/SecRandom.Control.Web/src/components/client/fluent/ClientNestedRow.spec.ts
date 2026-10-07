import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import ClientNestedRow from './ClientNestedRow.vue'
import { createAppI18n } from '@/i18n'








function mountRow(props: Record<string, unknown>, slots?: Record<string, string>): VueWrapper {
  return mount(ClientNestedRow, {
    props: { title: '字体来源', ...props },
    ...(slots === undefined ? {} : { slots }),
    global: { plugins: [createAppI18n('zh-CN')] },
  })
}

describe('ClientNestedRow', () => {
  it('画出标题、描述与右侧控件槽', () => {
    const wrapper = mountRow(
      { description: '跟随全局字体或为抽取结果单独指定字体' },
      { control: '<span data-testid="ctl">跟随全局</span>' },
    )

    expect(wrapper.get('.cn-row__title').text()).toBe('字体来源')
    expect(wrapper.get('.cn-row__desc').text()).toContain('跟随全局字体')
    expect(wrapper.get('.cn-row__footer [data-testid="ctl"]').text()).toBe('跟随全局')
  })

  it('没有描述时不画描述行', () => {
    expect(mountRow({}).find('.cn-row__desc').exists()).toBe(false)
  })

  it('unread 与 readonly 用的是和顶层卡片同一套标记', () => {
    expect(mountRow({ unread: true }).get('[data-mark="unread"]').text()).toBe('未读取')
    expect(mountRow({ readonly: true }).get('[data-mark="readonly"]').text()).toContain(
      '不可远程修改',
    )
  })

  it('disabled 只让这一行变淡，不会藏起来', () => {
    const wrapper = mountRow({ disabled: true })

    expect(wrapper.get('.cn-row').classes()).toContain('cn-row--disabled')
    expect(wrapper.get('.cn-row__title').text()).toBe('字体来源')
  })

  it('testId 落在行根节点上（端到端测试靠它定位某一行）', () => {
    const wrapper = mountRow({ testId: 'nested-font' })

    expect(wrapper.get('[data-testid="nested-font"]').classes()).toContain('cn-row')
  })
})
