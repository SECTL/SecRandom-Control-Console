import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import ClientSettingCard from './ClientSettingCard.vue'
import { createAppI18n } from '@/i18n'








function mountCard(props: Record<string, unknown>, slots?: Record<string, string>): VueWrapper {
  return mount(ClientSettingCard, {
    props: { title: '显示设置', icon: 'textFont', ...props },
    ...(slots === undefined ? {} : { slots }),
    global: { plugins: [createAppI18n('zh-CN')] },
  })
}

describe('ClientSettingCard', () => {
  it('画出图标、标题与描述，控件槽在右侧', () => {
    const wrapper = mountCard(
      { description: '在抽取结果中显示成员头像' },
      { control: '<span data-testid="ctl">开</span>' },
    )

    expect(wrapper.get('.cn-expander__title').text()).toBe('显示设置')
    expect(wrapper.get('.cn-expander__desc').text()).toBe('在抽取结果中显示成员头像')
    expect(wrapper.find('.cn-expander__icon').exists()).toBe(true)
    expect(wrapper.get('.cn-expander__footer [data-testid="ctl"]').text()).toBe('开')
  })

  it('没有描述时不画描述行（不留一段空白）', () => {
    const wrapper = mountCard({})

    expect(wrapper.find('.cn-expander__desc').exists()).toBe(false)
  })

  it('readonly 画「不可远程修改」的只读 chip', () => {
    const wrapper = mountCard({ readonly: true })

    expect(wrapper.get('[data-mark="readonly"]').text()).toContain('不可远程修改')
    
    expect(wrapper.find('[data-mark="unread"]').exists()).toBe(false)
  })

  it('unread 画「未读取」标记', () => {
    const wrapper = mountCard({ unread: true })

    expect(wrapper.get('[data-mark="unread"]').text()).toBe('未读取')
    expect(wrapper.find('[data-mark="readonly"]').exists()).toBe(false)
  })

  it('dirty 画一个改动点，并带上无障碍名字', () => {
    const wrapper = mountCard({ dirty: true })

    const dot = wrapper.get('[data-mark="dirty"]')
    expect(dot.attributes('aria-label')).toContain('待下发')
  })

  it('disabled 时整卡变淡', () => {
    const wrapper = mountCard({ disabled: true })

    expect(wrapper.get('.cn-expander').classes()).toContain('cn-expander--disabled')
    expect(wrapper.get('.cn-expander').classes()).not.toContain('cn-expander--collapsed')
  })

  it('有 extra 槽就画 chevron；没展开时整卡是 collapsed 的，点 chevron 发 toggle-expand', async () => {
    const wrapper = mountCard({}, { extra: '<span data-testid="extra">嵌套项</span>' })

    
    
    expect(wrapper.get('.cn-expander').classes()).toContain('cn-expander--collapsed')
    expect(wrapper.find('.cn-expander__items').exists()).toBe(true)

    const chevron = wrapper.get('.cn-expander__chevron')
    expect(chevron.attributes('aria-expanded')).toBe('false')
    await chevron.trigger('click')

    expect(wrapper.emitted('toggle-expand')).toHaveLength(1)
  })

  it('展开时 extra 画出来，chevron 说得出自己是展开的', () => {
    const wrapper = mountCard({ expanded: true }, { extra: '<span data-testid="extra">嵌套项</span>' })

    expect(wrapper.get('[data-testid="extra"]').text()).toBe('嵌套项')
    expect(wrapper.get('.cn-expander').classes()).not.toContain('cn-expander--collapsed')
    expect(wrapper.get('.cn-expander__chevron').attributes('aria-expanded')).toBe('true')
  })

  it('没有展开内容就不画 chevron（点不动的箭头比没有箭头更糟）', () => {
    const wrapper = mountCard({})

    expect(wrapper.find('.cn-expander__chevron').exists()).toBe(false)
  })

  it('hasExtra 为 true 时也画 chevron（哪怕内容是异步填进来的）', () => {
    const wrapper = mountCard({ hasExtra: true })

    expect(wrapper.find('.cn-expander__chevron').exists()).toBe(true)
  })
})
