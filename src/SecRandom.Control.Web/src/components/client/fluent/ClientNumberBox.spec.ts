import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ClientNumberBox from './ClientNumberBox.vue'







describe('ClientNumberBox', () => {
  it('加号 / 减号按 step 走，并发出数值', async () => {
    const wrapper = mount(ClientNumberBox, {
      props: { modelValue: 96, min: 1, max: 300, step: 1 },
    })

    await wrapper.get('[data-step="1"]').trigger('click')
    await wrapper.get('[data-step="-1"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[97], [95]])
  })

  it('步进夹在 min / max 之间', async () => {
    const upper = mount(ClientNumberBox, { props: { modelValue: 300, min: 1, max: 300 } })
    await upper.get('[data-step="1"]').trigger('click')
    expect(upper.emitted('update:modelValue')).toEqual([[300]])

    const lower = mount(ClientNumberBox, { props: { modelValue: 1, min: 1, max: 300 } })
    await lower.get('[data-step="-1"]').trigger('click')
    expect(lower.emitted('update:modelValue')).toEqual([[1]])
  })

  it('空值时从 min 起步（不是从 0 起步）', async () => {
    const wrapper = mount(ClientNumberBox, { props: { modelValue: null, min: 5, max: 10 } })

    await wrapper.get('[data-step="1"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[6]])
  })

  it('手输数字发数值，清空发 null', async () => {
    const wrapper = mount(ClientNumberBox, { props: { modelValue: 3 } })

    await wrapper.get('input').setValue('120')
    await wrapper.get('input').setValue('')

    expect(wrapper.emitted('update:modelValue')).toEqual([[120], [null]])
  })

  it('data-testid / disabled / placeholder 都落在 input 上', () => {
    const wrapper = mount(ClientNumberBox, {
      props: { modelValue: null, disabled: true, placeholder: '未读取', label: '字体大小' },
      attrs: { 'data-testid': 'size' },
    })

    const input = wrapper.get('[data-testid="size"]')
    expect(input.element.tagName).toBe('INPUT')
    expect(input.attributes('type')).toBe('number')
    expect(input.attributes('placeholder')).toBe('未读取')
    expect(input.attributes('aria-label')).toBe('字体大小')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('步进按钮不进 Tab 序列（键盘用户用原生数字框的上下键）', () => {
    const wrapper = mount(ClientNumberBox, { props: { modelValue: 1 } })

    for (const button of wrapper.findAll('.cn-number__spin')) {
      expect(button.attributes('tabindex')).toBe('-1')
      expect(button.attributes('aria-hidden')).toBe('true')
    }
  })
})
