import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ClientCommandBar from './ClientCommandBar.vue'
import type { ClientCommand } from './client-model'







const COMMANDS: readonly ClientCommand[] = [
  { id: 'read', label: '读取设备名单', icon: 'arrowClockwise', testId: 'cmd-read' },
  { id: 'add', label: '添加一行', icon: 'personAdd', separatorBefore: true, testId: 'cmd-add' },
  {
    id: 'export',
    label: '导出 CSV',
    icon: 'arrowDownload',
    disabled: true,
    title: '当前草稿没有内容',
    testId: 'cmd-export',
  },
]

describe('ClientCommandBar', () => {
  it('画成一条 toolbar：每条命令一个按钮，图标 + 文字都在', () => {
    const wrapper = mount(ClientCommandBar, {
      props: { commands: COMMANDS, label: '名单操作' },
    })

    const bar = wrapper.get('[role="toolbar"]')
    expect(bar.attributes('aria-label')).toBe('名单操作')
    expect(wrapper.findAll('button')).toHaveLength(COMMANDS.length)
    expect(wrapper.get('[data-testid="cmd-read"]').text()).toContain('读取设备名单')
    expect(wrapper.get('[data-testid="cmd-read"]').find('.cn-fi').exists()).toBe(true)
  })

  it('点一条命令只发它的 id', async () => {
    const wrapper = mount(ClientCommandBar, { props: { commands: COMMANDS } })

    await wrapper.get('[data-testid="cmd-add"]').trigger('click')

    expect(wrapper.emitted('run')).toEqual([['add']])
  })

  it('禁用的命令真的点不动，并且用 title 说清为什么', () => {
    const wrapper = mount(ClientCommandBar, { props: { commands: COMMANDS } })

    const disabled = wrapper.get('[data-testid="cmd-export"]')
    expect(disabled.attributes('disabled')).toBeDefined()
    expect(disabled.attributes('title')).toBe('当前草稿没有内容')

    
    expect(wrapper.get('[data-testid="cmd-read"]').attributes('disabled')).toBeUndefined()
  })

  it('分组之间画一条竖分隔线，第一组之前不画', () => {
    const wrapper = mount(ClientCommandBar, { props: { commands: COMMANDS } })

    const separators = wrapper.findAll('.cn-cmdbar__sep')
    expect(separators).toHaveLength(1)
    expect(separators[0]?.attributes('role')).toBe('separator')
    expect(wrapper.get('[data-testid="cmd-add"]').element.previousElementSibling).toBe(
      separators[0]?.element,
    )
  })

  it('leading 槽画在命令之前，默认槽靠右', () => {
    const wrapper = mount(ClientCommandBar, {
      props: { commands: COMMANDS },
      slots: {
        leading: '<div data-testid="leading">分段开关</div>',
        default: '<span data-testid="tail">共 2 人</span>',
      },
    })

    const leading = wrapper.get('[data-testid="leading"]')
    const first = wrapper.get('[data-testid="cmd-read"]')
    expect(
      leading.element.compareDocumentPosition(first.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(wrapper.get('[data-testid="tail"]').text()).toBe('共 2 人')
  })

  it('leading prop 为 true 时留出前置区（就算没给槽）', () => {
    const wrapper = mount(ClientCommandBar, { props: { commands: [], leading: true } })

    expect(wrapper.find('.cn-cmdbar__leading').exists()).toBe(true)
  })

  it('没给 leading 槽就不画前置区（空的一块会多出 4px 内边距）', () => {
    const wrapper = mount(ClientCommandBar, { props: { commands: COMMANDS } })

    expect(wrapper.find('.cn-cmdbar__leading').exists()).toBe(false)
  })
})
