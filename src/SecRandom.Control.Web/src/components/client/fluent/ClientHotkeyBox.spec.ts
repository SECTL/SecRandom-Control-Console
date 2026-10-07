import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import ClientHotkeyBox from './ClientHotkeyBox.vue'
import { createAppI18n } from '@/i18n'












enableAutoUnmount(afterEach)


function mountBox(
  props: Record<string, unknown> = {},
  attrs: Record<string, string> = {},
): { wrapper: VueWrapper; box: Omit<DOMWrapper<Element>, 'exists'> } {
  const wrapper = mount(ClientHotkeyBox, {
    props: { modelValue: '', ...props },
    attrs,
    global: { plugins: [createAppI18n('zh-CN')] },
    
    attachTo: document.body,
  })
  return { wrapper, box: wrapper.get('[data-cn-hotkey]') }
}

const RECORDING = '按下组合键…（Esc 取消）'

describe('ClientHotkeyBox', () => {
  it('显示当前的组合键；空绑定时显示客户端的「按下快捷键」占位', () => {
    const filled = mountBox({ modelValue: 'Ctrl+Alt+R' })
    expect(filled.box.text()).toBe('Ctrl+Alt+R')
    
    expect(filled.wrapper.get('[data-cn-hotkey-clear]').attributes('disabled')).toBeUndefined()

    const empty = mountBox()
    expect(empty.box.text()).toBe('按下快捷键')
    
    expect(empty.wrapper.get('[data-cn-hotkey-clear]').attributes('disabled')).toBeDefined()
  })

  it('设备没读到这一项时显示「未读取」，而不是客户端的起录提示', () => {
    const { box } = mountBox({ placeholder: '未读取' })

    expect(box.text()).toBe('未读取')
  })

  it('点击开始录制：框里换成提示，并把状态播报出来', async () => {
    const { wrapper, box } = mountBox({ modelValue: 'Ctrl+R' })

    expect(box.attributes('data-recording')).toBe('false')

    await box.trigger('click')

    expect(box.attributes('data-recording')).toBe('true')
    expect(box.text()).toBe(RECORDING)
    expect(box.classes()).toContain('cn-hotkey__box--recording')
    
    expect(wrapper.get('[data-cn-hotkey-clear]').attributes('disabled')).toBeDefined()
    
    expect(wrapper.get('[data-cn-hotkey-live]').text()).toBe(RECORDING)
  })

  it('录制：按下组合键就发出**客户端格式**的字符串（修饰键顺序 Ctrl → Alt → Shift → Win）', async () => {
    const { wrapper, box } = mountBox()

    await box.trigger('click')
    await box.trigger('keydown', { key: 'A', code: 'KeyA', ctrlKey: true, altKey: true, shiftKey: true, metaKey: true })

    expect(wrapper.emitted('update:modelValue')).toEqual([['Ctrl+Alt+Shift+Win+A']])
    
    expect(box.attributes('data-recording')).toBe('false')

    
    const second = mountBox()
    await second.box.trigger('click')
    await second.box.trigger('keydown', { key: 'R', code: 'KeyR', shiftKey: true, ctrlKey: true })
    expect(second.wrapper.emitted('update:modelValue')).toEqual([['Ctrl+Shift+R']])
  })

  it('录制：主键走客户端那张键名表（数字 / 功能键 / 方向键 / 具名键）', async () => {
    const cases: readonly (readonly [Record<string, unknown>, string])[] = [
      [{ key: '1', code: 'Digit1', ctrlKey: true }, 'Ctrl+1'],
      [{ key: 'F5', code: 'F5' }, 'F5'],
      [{ key: 'F24', code: 'F24', altKey: true }, 'Alt+F24'],
      [{ key: 'ArrowUp', code: 'ArrowUp', altKey: true }, 'Alt+Up'],
      [{ key: 'PageDown', code: 'PageDown', ctrlKey: true }, 'Ctrl+PageDown'],
      [{ key: ' ', code: 'Space', ctrlKey: true }, 'Ctrl+Space'],
      [{ key: 'Delete', code: 'Delete' }, 'Delete'],
      [{ key: 'Enter', code: 'Enter', ctrlKey: true, altKey: true }, 'Ctrl+Alt+Enter'],
    ]

    for (const [init, expected] of cases) {
      const { wrapper, box } = mountBox()
      await box.trigger('click')
      await box.trigger('keydown', init)
      expect(wrapper.emitted('update:modelValue'), JSON.stringify(init)).toEqual([[expected]])
    }
  })

  it('录制：单独按一个修饰键不算一次输入，继续等下一个键', async () => {
    const { wrapper, box } = mountBox()

    await box.trigger('click')
    await box.trigger('keydown', { key: 'Control', code: 'ControlLeft', ctrlKey: true })
    await box.trigger('keydown', { key: 'Shift', code: 'ShiftRight', shiftKey: true })

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(box.attributes('data-recording')).toBe('true')

    
    await box.trigger('keydown', { key: 'r', code: 'KeyR', ctrlKey: true })
    expect(wrapper.emitted('update:modelValue')).toEqual([['Ctrl+R']])
  })

  it('录制：认不出的主键（标点 / 小键盘 / Insert…）不算数，也不退出录制', async () => {
    const { wrapper, box } = mountBox()

    await box.trigger('click')
    for (const init of [
      { key: ';', code: 'Semicolon' },
      { key: '1', code: 'Numpad1' },
      { key: 'Insert', code: 'Insert' },
      { key: 'F25', code: 'F25' },
    ]) {
      await box.trigger('keydown', init)
    }

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(box.attributes('data-recording')).toBe('true')

    await box.trigger('keydown', { key: 'K', code: 'KeyK' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['K']])
  })

  it('Escape 取消录制：不改值、不发事件', async () => {
    const { wrapper, box } = mountBox({ modelValue: 'Ctrl+R' })

    await box.trigger('click')
    await box.trigger('keydown', { key: 'Escape', code: 'Escape' })

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(box.attributes('data-recording')).toBe('false')
    expect(box.text()).toBe('Ctrl+R')
  })

  it('Backspace 清空绑定（客户端 `Key.Back` 的行为），且 Delete 仍然是主键', async () => {
    const { wrapper, box } = mountBox({ modelValue: 'Ctrl+R' })

    await box.trigger('click')
    await box.trigger('keydown', { key: 'Backspace', code: 'Backspace' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])

    const withDelete = mountBox({ modelValue: 'Ctrl+R' })
    await withDelete.box.trigger('click')
    await withDelete.box.trigger('keydown', { key: 'Delete', code: 'Delete' })
    expect(withDelete.wrapper.emitted('update:modelValue')).toEqual([['Delete']])
  })

  it('清空按钮发出空字符串', async () => {
    const { wrapper } = mountBox({ modelValue: 'Ctrl+Alt+Q' })

    await wrapper.get('[data-cn-hotkey-clear]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('键盘起录：Enter / Space；Tab 让出焦点并取消录制（不把焦点困在框里）', async () => {
    const enter = mountBox()
    await enter.box.trigger('keydown', { key: 'Enter', code: 'Enter' })
    expect(enter.box.attributes('data-recording')).toBe('true')

    const space = mountBox()
    await space.box.trigger('keydown', { key: ' ', code: 'Space' })
    expect(space.box.attributes('data-recording')).toBe('true')

    
    await space.box.trigger('keydown', { key: 'Tab', code: 'Tab' })
    expect(space.box.attributes('data-recording')).toBe('false')
    expect(space.wrapper.emitted('update:modelValue')).toBeUndefined()

    
    const tab = mountBox()
    await tab.box.trigger('keydown', { key: 'Tab', code: 'Tab' })
    expect(tab.box.attributes('data-recording')).toBe('false')
  })

  it('disabled：点不动、按不动，清空按钮也禁用', async () => {
    const { wrapper, box } = mountBox({ modelValue: 'Ctrl+R', disabled: true })

    expect(box.attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-cn-hotkey-clear]').attributes('disabled')).toBeDefined()

    await box.trigger('click')
    expect(box.attributes('data-recording')).toBe('false')

    await box.trigger('keydown', { key: 'K', code: 'KeyK', ctrlKey: true })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('无障碍：`aria-label` 用行标题（录制中换成"在等按键"），`data-testid` 落在框上', async () => {
    const { box } = mountBox(
      { modelValue: 'Ctrl+R', label: '打开点名页' },
      { 'data-testid': 'setting-more.open_roll_call_page_shortcut' },
    )

    expect(box.attributes('aria-label')).toBe('打开点名页')
    
    expect(box.attributes('data-testid')).toBe('setting-more.open_roll_call_page_shortcut')
    expect(box.element.tagName).toBe('BUTTON')

    await box.trigger('click')
    expect(box.attributes('aria-label')).toBe(RECORDING)
  })
})
