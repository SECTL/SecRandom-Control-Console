import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClientBroadcastDialog from './ClientBroadcastDialog.vue'
import { createAppI18n } from '@/i18n'











function mountDialog(): VueWrapper {
  return mount(ClientBroadcastDialog, { global: { plugins: [createAppI18n('zh-CN')] } })
}


function confirmButton(wrapper: VueWrapper) {
  return wrapper.get('[data-testid="broadcast-confirm"]')
}

function cancelButton(wrapper: VueWrapper) {
  return wrapper.get('[data-testid="broadcast-cancel"]')
}


function fillVolume(wrapper: VueWrapper, testId: string, value: string): Promise<void> {
  return wrapper.get(`[data-testid="${testId}"]`).setValue(value)
}

describe('ClientBroadcastDialog 结构', () => {
  it('遮罩 + 卡片 + 标题 + 三行选项 + 取消/确认', () => {
    const wrapper = mountDialog()

    const dialog = wrapper.get('[data-testid="broadcast-dialog"]')
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.find('.cn-dialog__scrim').exists()).toBe(true)
    expect(dialog.find('.cn-dialog__card').exists()).toBe(true)
    expect(dialog.get('.cn-dialog__title').text()).toBe('播报选项')

    
    expect(wrapper.get('[data-testid="broadcast-quick-draw-row"]').text()).toContain('显示闪抽窗口')
    expect(wrapper.get('[data-testid="broadcast-system-row"]').text()).toContain('系统音量')
    expect(wrapper.get('[data-testid="broadcast-voice-row"]').text()).toContain('播报音量')

    expect(cancelButton(wrapper).text()).toBe('取消')
    expect(confirmButton(wrapper).text()).toBe('确认')
  })

  it('默认什么都不改：闪抽窗口不打开、两个音量都是「不修改」，但确认可用', async () => {
    const wrapper = mountDialog()

    expect((wrapper.get('[data-testid="broadcast-quick-draw"]').element as HTMLInputElement).checked).toBe(
      false,
    )

    
    for (const id of ['broadcast-system-volume', 'broadcast-voice-volume']) {
      expect(wrapper.get(`[data-testid="${id}"]`).attributes('disabled')).toBeDefined()
    }
    expect(wrapper.get('[data-testid="broadcast-system-keep"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.get('[data-testid="broadcast-voice-keep"]').attributes('aria-selected')).toBe(
      'true',
    )

    
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()

    await confirmButton(wrapper).trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([[{ show_quick_draw_window: false }]])
  })
})

describe('ClientBroadcastDialog 选项', () => {
  it('勾上闪抽窗口：确认时带上 true', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="broadcast-quick-draw"]').setValue(true)
    await confirmButton(wrapper).trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([[{ show_quick_draw_window: true }]])
  })

  it('「设定为」之后填的数才会进载荷，另一个音量仍然缺席', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="broadcast-system-set"]').trigger('click')
    await nextTick()
    
    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined()

    await fillVolume(wrapper, 'broadcast-system-volume', '30')
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()

    await confirmButton(wrapper).trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([
      [{ show_quick_draw_window: false, system_volume_percent: 30 }],
    ])
  })

  it('0 是静音，要照发；切回「不修改」则这个键整个消失', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="broadcast-voice-set"]').trigger('click')
    await fillVolume(wrapper, 'broadcast-voice-volume', '0')
    await confirmButton(wrapper).trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([
      [{ show_quick_draw_window: false, voice_volume_percent: 0 }],
    ])

    
    const second = mountDialog()
    await second.get('[data-testid="broadcast-voice-set"]').trigger('click')
    await fillVolume(second, 'broadcast-voice-volume', '0')
    await second.get('[data-testid="broadcast-voice-keep"]').trigger('click')
    await confirmButton(second).trigger('click')

    expect(second.emitted('confirm')).toEqual([[{ show_quick_draw_window: false }]])
  })

  it('越界 / 小数 / 空着都不给确认，并当场说清要填什么', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="broadcast-system-set"]').trigger('click')
    
    expect(wrapper.get('[data-testid="broadcast-problem"]').text()).toContain('0–100')

    await fillVolume(wrapper, 'broadcast-system-volume', '150')
    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="broadcast-problem"]').text()).toContain('0–100')

    await fillVolume(wrapper, 'broadcast-system-volume', '12.5')
    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined()

    await fillVolume(wrapper, 'broadcast-system-volume', '100')
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="broadcast-problem"]').exists()).toBe(false)
  })

  it('两个音量各自独立：只改播报音量时不动系统音量', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="broadcast-voice-set"]').trigger('click')
    await fillVolume(wrapper, 'broadcast-voice-volume', '60')
    await confirmButton(wrapper).trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([
      [{ show_quick_draw_window: false, voice_volume_percent: 60 }],
    ])
  })
})

describe('ClientBroadcastDialog 关闭', () => {
  it('取消什么都不发', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="broadcast-quick-draw"]').setValue(true)
    await cancelButton(wrapper).trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('Esc 与点遮罩都关掉它，且不发确认', async () => {
    const wrapper = mountDialog()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()

    await wrapper.get('[data-testid="broadcast-scrim"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })
})
