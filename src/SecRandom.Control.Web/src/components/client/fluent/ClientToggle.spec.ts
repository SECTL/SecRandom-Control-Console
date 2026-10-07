import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ClientToggle from './ClientToggle.vue'








describe('ClientToggle', () => {
  it('data-testid 落在 input 上（不是外层 label）', () => {
    const wrapper = mount(ClientToggle, {
      props: { modelValue: false },
      attrs: { 'data-testid': 'switch' },
    })

    const input = wrapper.get('[data-testid="switch"]')
    expect(input.element.tagName).toBe('INPUT')
    expect(input.attributes('type')).toBe('checkbox')
  })

  it('勾选发出 true，取消勾选发出 false', async () => {
    const wrapper = mount(ClientToggle, { props: { modelValue: false } })

    await wrapper.get('input').setValue(true)
    await wrapper.get('input').setValue(false)

    expect(wrapper.emitted('update:modelValue')).toEqual([[true], [false]])
  })

  it('外观跟着 modelValue 走（勾选态由 input 自己带着）', async () => {
    const wrapper = mount(ClientToggle, { props: { modelValue: true } })

    expect((wrapper.get('input').element as HTMLInputElement).checked).toBe(true)
    
    expect(wrapper.get('input').element.nextElementSibling?.className).toBe('cn-toggle__track')
    expect(wrapper.find('.cn-toggle__knob').exists()).toBe(true)
  })

  it('禁用时 input 带 disabled，整条开关变淡', () => {
    const wrapper = mount(ClientToggle, { props: { modelValue: false, disabled: true } })

    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('label').classes()).toContain('cn-toggle--disabled')
  })

  it('label 走 aria-label（旁边有文字标签时不重复念）', () => {
    const wrapper = mount(ClientToggle, { props: { modelValue: false, label: '启用覆盖' } })

    expect(wrapper.get('input').attributes('aria-label')).toBe('启用覆盖')
  })
})
