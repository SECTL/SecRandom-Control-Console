import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import LanguagePicker from './LanguagePicker.vue'
import { createAppI18n, currentLocale, setLocale } from '@/i18n'
import {
  pickOption,
  selectLabels,
  selectPopup,
  selectValue,
} from '@/components/client/fluent/client-select.test-utils'









enableAutoUnmount(afterEach)



beforeEach(() => {
  setLocale('zh-CN')
})

afterEach(() => {
  setLocale('zh-CN')
})

function mountPicker(): ReturnType<typeof mount> {
  return mount(LanguagePicker, { global: { plugins: [createAppI18n('zh-CN')] } })
}

describe('LanguagePicker', () => {
  it('触发器显示当前语言；候选是三种，弹层自己画（挂在 body 下）', async () => {
    const wrapper = mountPicker()
    const trigger = wrapper.get('[data-testid="language-select"]')

    expect(selectValue(trigger)).toBe('简体中文')
    expect(selectPopup()).toBeNull()
    
    expect(wrapper.find('select').exists()).toBe(false)

    await trigger.trigger('click')

    expect(selectPopup()).not.toBeNull()
    expect(selectLabels()).toEqual(['简体中文', 'English', '日本語'])
  })

  it('选中另一种语言：模块状态真的切过去，触发器跟着换，弹层自己收起', async () => {
    const wrapper = mountPicker()
    const trigger = wrapper.get('[data-testid="language-select"]')

    await pickOption(trigger, 'English')

    expect(currentLocale.value).toBe('en-US')
    
    expect(selectValue(trigger)).toBe('English')
    expect(selectPopup()).toBeNull()
  })
})
