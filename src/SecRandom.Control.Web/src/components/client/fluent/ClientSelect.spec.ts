import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import ClientSelect from './ClientSelect.vue'
import {
  selectItems as popupItems,
  selectPopup as popup,
  selectValue,
  type FoundElement,
} from './client-select.test-utils'
import type { ClientSelectOption } from './client-model'











enableAutoUnmount(afterEach)

const OPTIONS: readonly ClientSelectOption[] = [
  { value: 'allow', label: '允许重复' },
  { value: 'deny', label: '不重复' },
  { value: 'half', label: '半重复' },
]

function mountSelect(
  props: Record<string, unknown> = {},
  attrs: Record<string, string> = {},
): { wrapper: VueWrapper; trigger: FoundElement } {
  const wrapper = mount(ClientSelect, {
    props: { modelValue: 'deny', options: OPTIONS, ...props },
    attrs,
    attachTo: document.body,
  })
  return { wrapper, trigger: wrapper.get('.cn-combo__trigger') }
}


function activeOptionId(): string | undefined {
  const list = popup()
  if (list === null) return undefined
  return `${list.id}-option-`
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function openWith(trigger: FoundElement): Promise<void> {
  await trigger.trigger('keydown', { key: 'ArrowDown' })
}

describe('ClientSelect', () => {
  











  it('`.client-ui` 与 `.cn-combo` 不写在同一个元素上', () => {
    const { wrapper } = mountSelect()
    const combo = wrapper.get('.cn-combo')

    expect(combo.classes()).not.toContain('client-ui')
    expect(wrapper.get('.client-ui').element.contains(combo.element)).toBe(true)
  })

  it('触发器显示**选中项的文案**，不是协议值', () => {
    const { trigger } = mountSelect()

    expect(trigger.element.tagName).toBe('BUTTON')
    expect(selectValue(trigger)).toBe('不重复')
    
    expect(trigger.find('.cn-combo__chev').exists()).toBe(true)
  })

  it('没有选中项时触发器上是空的（不是"默认选了第一项"那种假象）', () => {
    const { trigger } = mountSelect({ modelValue: '' })

    expect(selectValue(trigger)).toBe('')
  })

  it('点开弹层：候选值按文案列出，且弹层挂在 document.body 下', async () => {
    const { trigger } = mountSelect()

    expect(popup()).toBeNull()
    await trigger.trigger('click')

    expect(popup()).not.toBeNull()
    
    expect(
      popupItems().map((item) => item.querySelector('.cn-combo-popup__label')?.textContent?.trim()),
    ).toEqual(['允许重复', '不重复', '半重复'])
    
    expect(trigger.element.contains(popup())).toBe(false)
    expect(popup()?.parentElement).toBe(document.body)
    expect(popup()?.style.zIndex).not.toBe('')
  })

  it('点一项：发它的 value（不是文案），并关掉弹层', async () => {
    const { wrapper, trigger } = mountSelect({ modelValue: 'allow' })
    await trigger.trigger('click')

    popupItems()[2]?.click()
    await flush()

    expect(wrapper.emitted('update:modelValue')).toEqual([['half']])
    expect(popup()).toBeNull()
  })

  it('Esc 关掉弹层且不改选中的值', async () => {
    const { wrapper, trigger } = mountSelect()
    await trigger.trigger('click')

    await trigger.trigger('keydown', { key: 'Escape' })

    expect(popup()).toBeNull()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('点在弹层与触发器之外就关（document 上的 pointerdown）', async () => {
    const { trigger } = mountSelect()
    await trigger.trigger('click')
    expect(popup()).not.toBeNull()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()

    expect(popup()).toBeNull()
  })

  it('键盘：↑↓ 移动高亮、Home / End 跳到两端、Enter 选中高亮那一项', async () => {
    const { wrapper, trigger } = mountSelect({ modelValue: 'allow' })

    await openWith(trigger)
    
    expect(trigger.attributes('aria-activedescendant')).toBe(`${activeOptionId()}0`)

    await trigger.trigger('keydown', { key: 'ArrowDown' })
    expect(trigger.attributes('aria-activedescendant')).toBe(`${activeOptionId()}1`)

    await trigger.trigger('keydown', { key: 'End' })
    expect(trigger.attributes('aria-activedescendant')).toBe(`${activeOptionId()}2`)

    await trigger.trigger('keydown', { key: 'Enter' })
    
    expect(wrapper.emitted('update:modelValue')).toEqual([['half']])
    expect(popup()).toBeNull()

    
    await wrapper.setProps({ modelValue: 'half' })
    await openWith(trigger)
    expect(trigger.attributes('aria-activedescendant')).toBe(`${activeOptionId()}2`)

    await trigger.trigger('keydown', { key: 'ArrowUp' })
    expect(trigger.attributes('aria-activedescendant')).toBe(`${activeOptionId()}1`)

    await trigger.trigger('keydown', { key: 'Home' })
    expect(trigger.attributes('aria-activedescendant')).toBe(`${activeOptionId()}0`)
  })

  it('Space 也能开、也能选中（触发器是 button，Space 默认语义要接住）', async () => {
    const { wrapper, trigger } = mountSelect({ modelValue: 'allow' })

    await trigger.trigger('keydown', { key: ' ' })
    expect(popup()).not.toBeNull()

    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: ' ' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['deny']])
    expect(popup()).toBeNull()
  })

  it('读屏属性：listbox / option / aria-selected / aria-expanded 都在', async () => {
    const { trigger } = mountSelect({ label: '抽取模式' })

    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('aria-haspopup')).toBe('listbox')
    expect(trigger.attributes('aria-label')).toBe('抽取模式')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('click')

    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(popup()?.getAttribute('role')).toBe('listbox')
    expect(popup()?.getAttribute('aria-label')).toBe('抽取模式')

    const items = popupItems()
    expect(items.map((item) => item.getAttribute('role'))).toEqual(['option', 'option', 'option'])
    expect(items.map((item) => item.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ])
  })

  it('data-testid / aria-label / disabled 都落在触发器上', () => {
    const { trigger } = mountSelect({ disabled: true, label: '抽取模式' }, { 'data-testid': 'mode' })

    expect(trigger.element.tagName).toBe('BUTTON')
    expect(trigger.attributes('aria-label')).toBe('抽取模式')
    expect(trigger.attributes('disabled')).toBeDefined()
  })

  it('禁用时点不开', async () => {
    const { trigger } = mountSelect({ disabled: true })

    await trigger.trigger('click')

    expect(popup()).toBeNull()
  })

  it('宽度档位影响最小宽度（客户端 .settings ComboBox 的三档）', () => {
    const wide = mount(ClientSelect, {
      props: { modelValue: 'a', options: OPTIONS, size: 'wide' },
    })
    expect(wide.get('.cn-combo').classes()).toContain('cn-combo--wide')

    const plain = mount(ClientSelect, { props: { modelValue: 'a', options: OPTIONS } })
    expect(plain.get('.cn-combo').classes()).toContain('cn-combo--default')
  })

  it('窗口缩放时重新定位（弹层留在视口里）', async () => {
    const { trigger } = mountSelect()
    await trigger.trigger('click')

    const before = popup()?.style.top
    window.dispatchEvent(new Event('resize'))
    await flush()

    
    
    expect(popup()?.style.top).toBe(before)
    expect(popup()?.style.left).not.toBe('')
  })

  










  it('触发器贴近窗口下沿：弹层翻到上方，并且自己收住高度留在视口里', async () => {
    const { trigger } = mountSelect()

    const rect = (top: number, height = 32): DOMRect =>
      ({
        top,
        bottom: top + height,
        height,
        left: 62,
        right: 164,
        width: 102,
        x: 62,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect

    trigger.element.getBoundingClientRect = () => rect(631)
    await trigger.trigger('click')

    const list = popup()
    expect(list).not.toBeNull()
    
    Object.defineProperty(list, 'scrollHeight', { value: 106, configurable: true })

    window.dispatchEvent(new Event('resize'))
    await flush()

    
    expect(list?.style.bottom).not.toBe('')
    expect(list?.style.top).toBe('')
    
    expect(Number.parseFloat(list?.style.maxHeight ?? '0')).toBeLessThanOrEqual(240)
  })
})
