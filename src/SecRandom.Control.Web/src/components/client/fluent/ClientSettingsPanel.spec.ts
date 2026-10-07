import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import ClientSettingsPanel from './ClientSettingsPanel.vue'
import { openSelect, selectLabels, selectValue } from './client-select.test-utils'
import { createAppI18n, type AppLocale } from '@/i18n'
import type { NodeSettingFieldDto } from '@/api/protocol'
import type { ClientSettingRow, ClientSettingsPage } from '@/data/client-settings-pages'
import type { ClientSettingsPanelState } from './client-model'





enableAutoUnmount(afterEach)













const ROLLCALL = 'roll_call'
const VOICE = 'voice'





function row(
  base: ClientSettingRow,
  extra: { rows?: ClientSettingRow[]; expanded?: boolean } = {},
): ClientSettingRow {
  return { ...base, ...extra }
}

const PAGES: ClientSettingsPage[] = [
  {
    id: ROLLCALL,
    title: '点名抽取设置',
    groupId: 'picking',
    icon: 'PersonFilled',
    sections: [
      {
        id: 'draw',
        title: '抽取设置',
        rows: [
          {
            path: 'roll_call.draw_mode',
            labels: { 'zh-CN': '抽取模式', 'en-US': 'Draw Mode' },
            descriptions: { 'zh-CN': '控制重复抽取记录的处理方式' },
            icon: 'FlashFilled',
            control: 'select',
            options: ['Repeat', 'NoRepeat'],
          },
          {
            path: 'roll_call.half_repeat',
            labels: { 'zh-CN': '半重复阈值' },
            descriptions: { 'zh-CN': '抽中次数达到该值后不会再次进入候选池' },
            icon: 'ClipboardBulletListFilled',
            control: 'number',
          },
          {
            path: 'roll_call.custom_font',
            labels: { 'zh-CN': '自定义字体' },
            descriptions: { 'zh-CN': '字体族名称，留空时使用默认字体' },
            icon: 'TextFontFilled',
            control: 'readonly',
          },
        ],
      },
      {
        id: 'overridable',
        title: '可覆盖设置',
        rows: [
          row(
            {
              path: 'roll_call.override_display_settings',
              labels: { 'zh-CN': '覆盖显示设置' },
              descriptions: { 'zh-CN': '本页使用自己的显示设置' },
              icon: 'TextFontFilled',
              control: 'toggle',
            },
            {
              expanded: true,
              rows: [
                {
                  path: 'roll_call.use_global_font',
                  labels: { 'zh-CN': '字体来源' },
                  icon: 'TextFontFilled',
                  control: 'select',
                  options: ['FollowGlobal', 'Custom'],
                },
              ],
            },
          ),
        ],
      },
    ],
  },
  {
    id: VOICE,
    title: '语音设置',
    groupId: 'notification',
    icon: 'PersonVoiceFilled',
    sections: [
      {
        id: 'voice',
        title: '语音',
        rows: [
          {
            path: 'voice.enable',
            labels: { 'zh-CN': '启用语音播报' },
            icon: 'PersonVoiceFilled',
            control: 'toggle',
          },
        ],
      },
    ],
  },
]

const STATE: ClientSettingsPanelState = {
  status: 'ready',
  canRead: true,
  canWrite: true,
  busy: false,
  dirtyCount: 0,
  notices: [],
}

function field(
  path: string,
  type: string,
  value: unknown,
  writable = true,
  extra: Partial<NodeSettingFieldDto> = {},
): NodeSettingFieldDto {
  return { path, category: 'roll_call', type, value, writable, ...extra }
}

interface PanelProps {
  pages: readonly ClientSettingsPage[]
  activePageId: string
  fields: Record<string, NodeSettingFieldDto>
  drafts: Record<string, string | number | boolean>
  state: ClientSettingsPanelState
}

function mountPanel(overrides: Partial<PanelProps> = {}, locale: AppLocale = 'zh-CN'): VueWrapper {
  const props: PanelProps = {
    pages: PAGES,
    activePageId: ROLLCALL,
    fields: {},
    drafts: {},
    state: STATE,
    ...overrides,
  }
  return mount(ClientSettingsPanel, {
    props,
    global: { plugins: [createAppI18n(locale)] },
  })
}

describe('ClientSettingsPanel', () => {
  it('没有任何设备数据时也把快照的结构画全（导航 / 标题 / 段落 / 每一行）', () => {
    const wrapper = mountPanel()

    
    
    expect(wrapper.findAll('.cn-nav__group').map((node) => node.text())).toEqual([
      '抽取设置',
      '通知设置',
    ])
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(2)
    expect(wrapper.get('[data-testid="client-nav-roll_call"]').attributes('aria-selected')).toBe(
      'true',
    )

    expect(wrapper.get('[data-testid="settings-page-title"]').text()).toBe('点名抽取设置')
    const sectionHeads = wrapper.findAll('.cn-section__head').map((node) => node.text())
    expect(sectionHeads).toHaveLength(2)
    expect(sectionHeads[0]).toContain('抽取设置')
    expect(sectionHeads[1]).toContain('可覆盖设置')

    
    expect(wrapper.find('[data-testid="card-roll_call.draw_mode"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="card-roll_call.half_repeat"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="card-roll_call.custom_font"]').exists()).toBe(true)
    expect(
      wrapper.find('[data-testid="card-roll_call.override_display_settings"]').exists(),
    ).toBe(true)

    
    expect(wrapper.findAll('[data-mark="unread"]')).toHaveLength(5)
  })

  it('快照给了子项就画成嵌套项（数据层补上 `rows` 时这一支立刻可用）', async () => {
    const wrapper = mountPanel()

    const nested = wrapper.get('[data-testid="nested-roll_call.use_global_font"]')
    expect(nested.text()).toContain('字体来源')

    
    const trigger = nested.get('[data-testid="setting-roll_call.use_global_font"]')
    expect(trigger.element.tagName).toBe('BUTTON')
    await openSelect(trigger)
    expect(selectLabels()).toEqual(['跟随全局', '自定义'])
    
    expect(
      wrapper.find('[data-testid="card-roll_call.override_display_settings-chevron"]').exists(),
    ).toBe(true)
  })

  it('文案按当前界面语言取，缺这一语就回落中文（标题永不为空）', () => {
    const english = mountPanel({}, 'en-US')

    expect(english.get('[data-testid="card-roll_call.draw_mode"]').text()).toContain('Draw Mode')
    
    expect(english.get('[data-testid="card-roll_call.half_repeat"]').text()).toContain('半重复阈值')
    
    expect(english.get('[data-testid="settings-page-title"]').text()).toBe('点名抽取设置')
  })

  it('设备给了值就显示设备的值（enum 用成员名选中，触发器上显示的是文案）', () => {
    const wrapper = mountPanel({
      fields: {
        'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'NoRepeat', true, {
          options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
        }),
      },
    })

    const trigger = wrapper.get('[data-testid="setting-roll_call.draw_mode"]')
    expect(trigger.element.tagName).toBe('BUTTON')
    expect(selectValue(trigger)).toBe('不重复')
    
    expect(
      wrapper.find('[data-testid="card-roll_call.draw_mode"] [data-mark="unread"]').exists(),
    ).toBe(false)
  })

  it('枚举候选值：设备报的全集为准，标签用客户端的三语文案', async () => {
    const wrapper = mountPanel({
      fields: {
        'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'Repeat', true, {
          options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
        }),
      },
    })

    await openSelect(wrapper.get('[data-testid="setting-roll_call.draw_mode"]'))

    
    
    
    expect(selectLabels()).toEqual(['允许重复', '不重复', 'HalfRepeat'])
  })

  it('设备没报候选值时用快照那一份下拉，标签同样走客户端文案', async () => {
    const wrapper = mountPanel({
      fields: { 'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'Repeat') },
    })

    await openSelect(wrapper.get('[data-testid="setting-roll_call.draw_mode"]'))

    expect(selectLabels()).toEqual(['允许重复', '不重复'])
  })

  it('还没读取设备时整页锁住：控件禁用，但结构与说明照常显示', () => {
    const wrapper = mountPanel({
      
      state: { status: 'idle', canRead: true, canWrite: false, busy: false, dirtyCount: 0, notices: [] },
    })

    
    expect(wrapper.find('[data-testid="card-roll_call.draw_mode"]').exists()).toBe(true)
    
    expect(
      wrapper.get('[data-testid="setting-roll_call.draw_mode"]').attributes('disabled'),
    ).toBeDefined()

    const unlocked = mountPanel({
      state: { status: 'ready', canRead: true, canWrite: true, busy: false, dirtyCount: 0, notices: [] },
    })
    expect(
      unlocked.get('[data-testid="setting-roll_call.draw_mode"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('设备没报的那一项显示「未读取」占位符，而不是空框', () => {
    const wrapper = mountPanel({
      fields: { 'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'Repeat') },
    })

    const half = wrapper.get('[data-testid="setting-roll_call.half_repeat"]')
    expect(half.attributes('placeholder')).toBe('未读取')
    expect(half.attributes('min')).toBeUndefined()
  })

  it('设备说不可远程修改：控件禁用 + 挂上「不可远程修改」，但这一行仍然在', () => {
    const wrapper = mountPanel({
      fields: { 'roll_call.half_repeat': field('roll_call.half_repeat', 'int', 3, false) },
    })

    const input = wrapper.get('[data-testid="setting-roll_call.half_repeat"]')
    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="card-roll_call.half_repeat"]').classes()).toContain(
      'cn-expander--disabled',
    )
    expect(
      wrapper
        .get('[data-testid="card-roll_call.half_repeat"] [data-mark="readonly"]')
        .text(),
    ).toContain('不可远程修改')
  })

  it('取值范围以设备为准（快照里没有 min/max）', async () => {
    const wrapper = mountPanel({
      fields: {
        'roll_call.half_repeat': field('roll_call.half_repeat', 'int', 3, true, {
          min: 0,
          max: 100,
        }),
      },
    })

    const input = wrapper.get('[data-testid="setting-roll_call.half_repeat"]')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('100')

    
    await wrapper.get('[data-step="1"]').trigger('click')
    expect(wrapper.emitted('updateDraft')).toEqual([['roll_call.half_repeat', 4]])
  })

  it('只读行（`control: readonly`）把值显示成一个 chip，没有可编辑控件', () => {
    const wrapper = mountPanel({
      fields: { 'roll_call.custom_font': field('roll_call.custom_font', 'string', 'MiSans (默认)') },
    })

    const chip = wrapper.get('[data-testid="setting-roll_call.custom_font"]')
    expect(chip.element.tagName).toBe('SPAN')
    expect(chip.text()).toContain('MiSans (默认)')
    expect(chip.find('input').exists()).toBe(false)
  })

  it('改控件就发 updateDraft：开关、文本框、数字框各一次', async () => {
    const pages: ClientSettingsPage[] = [
      {
        id: ROLLCALL,
        title: '点名抽取设置',
        groupId: 'picking',
        icon: 'PersonFilled',
        sections: [
          {
            id: 'draw',
            title: '抽取设置',
            rows: [
              {
                path: 'roll_call.override_display_settings',
                labels: { 'zh-CN': '覆盖显示设置' },
                icon: 'TextFontFilled',
                control: 'toggle',
              },
              {
                path: 'roll_call.algorithm_id',
                labels: { 'zh-CN': '点名算法' },
                icon: 'FlashFilled',
                control: 'text',
              },
              {
                path: 'roll_call.half_repeat',
                labels: { 'zh-CN': '半重复阈值' },
                icon: 'ClipboardBulletListFilled',
                control: 'number',
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mountPanel({ pages })

    await wrapper.get('[data-testid="setting-roll_call.override_display_settings"]').setValue(true)
    await wrapper.get('[data-testid="setting-roll_call.algorithm_id"]').setValue('fair-01')
    expect(wrapper.emitted('updateDraft')).toEqual([
      ['roll_call.override_display_settings', true],
      ['roll_call.algorithm_id', 'fair-01'],
    ])
  })

  it('设备报了一个我们不认识的类型：照样渲染成文本框，一行都不少', () => {
    const pages: ClientSettingsPage[] = [
      {
        id: ROLLCALL,
        title: '点名抽取设置',
        groupId: 'picking',
        icon: 'PersonFilled',
        sections: [
          {
            id: 'draw',
            title: '抽取设置',
            rows: [
              {
                path: 'roll_call.brand_new',
                labels: { 'zh-CN': '未来的设置项' },
                icon: 'FlashFilled',
                
                control: 'number',
              },
            ],
          },
        ],
      },
    ]

    const wrapper = mountPanel({
      pages,
      fields: { 'roll_call.brand_new': field('roll_call.brand_new', 'quaternion', 0.5) },
    })

    const control = wrapper.get('[data-testid="setting-roll_call.brand_new"]')
    expect(control.element.tagName).toBe('INPUT')
    expect(control.attributes('type')).toBe('text')
    expect((control.element as HTMLInputElement).value).toBe('0.5')
    expect(wrapper.find('[data-testid="card-roll_call.brand_new"]').exists()).toBe(true)
  })

  it('草稿与设备值不同才画改动点；相同就不画', () => {
    const same = mountPanel({
      fields: { 'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'NoRepeat') },
      drafts: { 'roll_call.draw_mode': 'NoRepeat' },
    })
    expect(
      same.find('[data-testid="card-roll_call.draw_mode"] [data-mark="dirty"]').exists(),
    ).toBe(false)

    const changed = mountPanel({
      fields: { 'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'NoRepeat') },
      drafts: { 'roll_call.draw_mode': 'Repeat' },
    })
    expect(
      changed.find('[data-testid="card-roll_call.draw_mode"] [data-mark="dirty"]').exists(),
    ).toBe(true)
  })

  it('点导航发 selectPage，自己不切页（受控）', async () => {
    const wrapper = mountPanel()

    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')

    expect(wrapper.emitted('selectPage')).toEqual([[VOICE]])
    expect(wrapper.get('[data-testid="settings-page-title"]').text()).toBe('点名抽取设置')
  })

  it('动作行：读取发 read，下发带待下发计数，没有改动时下发点不动', async () => {
    const idle = mountPanel()
    expect(idle.get('[data-testid="settings-submit"]').attributes('disabled')).toBeDefined()
    expect(idle.get('[data-testid="settings-dirty-count"]').text()).toBe('还没有改动')

    await idle.get('[data-testid="settings-read"]').trigger('click')
    expect(idle.emitted('read')).toHaveLength(1)

    const dirty = mountPanel({ state: { ...STATE, dirtyCount: 2 } })
    expect(dirty.get('[data-testid="settings-dirty-count"]').text()).toBe('待下发 2 项')
    expect(dirty.get('[data-testid="settings-submit"]').attributes('disabled')).toBeUndefined()

    await dirty.get('[data-testid="settings-submit"]').trigger('click')
    expect(dirty.emitted('submit')).toHaveLength(1)
  })

  it('权限 / 能力不足时按钮禁用：不能读就不给点读取', () => {
    const wrapper = mountPanel({ state: { ...STATE, canRead: false, canWrite: false } })

    expect(wrapper.get('[data-testid="settings-read"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="settings-submit"]').attributes('disabled')).toBeDefined()
  })

  it('提示条按语气上色（文案由调用方组织，组件不拼句子）', () => {
    const wrapper = mountPanel({
      state: {
        ...STATE,
        status: 'failed',
        notices: [
          { tone: 'fail', text: '读取失败：命令过期', testId: 'notice-fail' },
          { tone: 'ok', text: '已重新读取设备' },
        ],
      },
    })

    const fail = wrapper.get('[data-testid="notice-fail"]')
    expect(fail.text()).toBe('读取失败：命令过期')
    expect(fail.classes()).toContain('cn-note--fail')
    expect(wrapper.findAll('[data-testid="settings-notices"] li')).toHaveLength(2)
    
    expect(wrapper.find('[data-testid="settings-status"]').exists()).toBe(false)
  })

  it('读不到设置时：面板不重复那句笼统结论，只有角色不够才由面板说', () => {
    




    const unsupported = mountPanel({
      state: { ...STATE, status: 'unavailable', canRead: true },
    })
    expect(unsupported.find('[data-testid="settings-status"]').exists()).toBe(false)

    const noRole = mountPanel({ state: { ...STATE, status: 'unavailable', canRead: false } })
    expect(noRole.get('[data-testid="settings-status"]').text()).toContain('操作者')
  })

  it('这一组没有可读取的设置项时说一句，而不是留一片空白', () => {
    const wrapper = mountPanel({
      pages: [
        { id: ROLLCALL, title: '点名抽取设置', groupId: 'picking', icon: 'PersonFilled', sections: [] },
      ],
    })

    expect(wrapper.get('[data-testid="settings-category-empty"]').text()).toBe(
      '这一组没有可读取的设置项',
    )
  })

  

  





  function conditionalPage(): ClientSettingsPage {
    return {
      id: ROLLCALL,
      title: '点名抽取设置',
      groupId: 'picking',
      icon: 'PersonFilled',
      sections: [
        {
          id: 'draw',
          title: '抽取设置',
          rows: [
            {
              path: 'roll_call.draw_mode',
              labels: { 'zh-CN': '抽取模式' },
              icon: 'FlashFilled',
              control: 'select',
              options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
            },
            {
              path: 'roll_call.half_repeat',
              labels: { 'zh-CN': '半重复阈值' },
              icon: 'ClipboardBulletListFilled',
              control: 'number',
              visibleWhen: { all: [{ path: 'roll_call.draw_mode', equals: 'HalfRepeat' }] },
            },
            {
              path: 'roll_call.algorithm_id',
              labels: { 'zh-CN': '点名算法' },
              icon: 'FlashFilled',
              control: 'select',
              options: [
                { value: 'builtin.fair', labels: { 'zh-CN': '公平抽取' } },
                { value: 'builtin.random', labels: { 'zh-CN': '随机抽取' } },
              ],
            },
            {
              kind: 'container',
              id: 'music',
              labels: { 'zh-CN': '音乐设置' },
              icon: 'Speaker2Filled',
              rows: [
                {
                  path: 'roll_call.animation_music',
                  labels: { 'zh-CN': '动画音乐' },
                  icon: 'Speaker2Filled',
                  control: 'text',
                  readonly: true,
                },
                {
                  path: 'roll_call.result_music',
                  labels: { 'zh-CN': '结果音乐' },
                  icon: 'Speaker2Filled',
                  control: 'text',
                  readonly: true,
                },
              ],
            },
          ],
        },
      ],
    }
  }

  
  function voiceOmniPage(): ClientSettingsPage {
    return {
      id: VOICE,
      title: '语音设置',
      groupId: 'notification',
      icon: 'PersonVoiceFilled',
      sections: [
        {
          id: 'playback',
          title: '语音播报',
          rows: [
            {
              path: 'voice.voice_engine',
              labels: { 'zh-CN': '语音引擎' },
              icon: 'PersonVoiceFilled',
              control: 'number',
            },
            {
              path: 'voice.system_tts_voice_name',
              labels: { 'zh-CN': '系统语音音色' },
              icon: 'MicFilled',
              control: 'text',
              visibleWhen: { all: [{ path: 'voice.voice_engine', equals: 0 }] },
            },
            {
              kind: 'container',
              id: 'omniTts',
              labels: { 'zh-CN': 'Omni TTS 设置' },
              icon: 'GlobeFilled',
              visibleWhen: { all: [{ path: 'voice.voice_engine', equals: 2 }] },
              rows: [
                {
                  path: 'voice.omni_tts_provider',
                  labels: { 'zh-CN': '服务提供方' },
                  icon: 'GlobeFilled',
                  control: 'text',
                },
              ],
            },
          ],
        },
      ],
    }
  }

  it('条件可见性：驱动值没读到时照常显示（读不到不等于这台机器没有这一项）', () => {
    const wrapper = mountPanel({ pages: [conditionalPage()] })

    expect(wrapper.find('[data-testid="card-roll_call.half_repeat"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="setting-roll_call.half_repeat"]').exists()).toBe(true)
  })

  it('条件可见性：设备报了不满足条件的值，整行不画（是隐藏，不是禁用）', () => {
    const wrapper = mountPanel({
      pages: [conditionalPage()],
      fields: {
        'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'NoRepeat', true, {
          options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
        }),
      },
    })

    expect(wrapper.find('[data-testid="card-roll_call.half_repeat"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="setting-roll_call.half_repeat"]').exists()).toBe(false)
    
    expect(wrapper.find('[data-testid="card-roll_call.draw_mode"]').exists()).toBe(true)
  })

  it('条件可见性：值满足条件时那一行还在；草稿比设备值优先', () => {
    const satisfied = mountPanel({
      pages: [conditionalPage()],
      fields: { 'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'HalfRepeat') },
    })
    expect(satisfied.find('[data-testid="card-roll_call.half_repeat"]').exists()).toBe(true)

    
    
    const drafted = mountPanel({
      pages: [conditionalPage()],
      fields: { 'roll_call.draw_mode': field('roll_call.draw_mode', 'enum', 'NoRepeat') },
      drafts: { 'roll_call.draw_mode': 'HalfRepeat' },
    })
    expect(drafted.find('[data-testid="card-roll_call.half_repeat"]').exists()).toBe(true)
  })

  it('条件可见性：设备值与条件常量的类型不同也认得出来（`"2"` vs `2`），容器整组跟着显隐', () => {
    const numeric = mountPanel({
      pages: [voiceOmniPage()],
      activePageId: VOICE,
      fields: { 'voice.voice_engine': field('voice.voice_engine', 'int', 2) },
    })
    expect(numeric.find('[data-testid="container-omniTts"]').exists()).toBe(true)

    
    const textual = mountPanel({
      pages: [voiceOmniPage()],
      activePageId: VOICE,
      fields: { 'voice.voice_engine': field('voice.voice_engine', 'int', '2') },
    })
    expect(textual.find('[data-testid="container-omniTts"]').exists()).toBe(true)

    const other = mountPanel({
      pages: [voiceOmniPage()],
      activePageId: VOICE,
      fields: { 'voice.voice_engine': field('voice.voice_engine', 'int', 1) },
    })
    
    expect(other.find('[data-testid="container-omniTts"]').exists()).toBe(false)
    expect(other.find('[data-testid="card-voice.system_tts_voice_name"]').exists()).toBe(false)
    expect(other.find('[data-testid="card-voice.voice_engine"]').exists()).toBe(true)
  })

  

  it('折叠分组容器：画成「图标 + 标题 + 箭头」的组头，没有控件、没有设置项标记', () => {
    const wrapper = mountPanel({ pages: [conditionalPage()] })

    const container = wrapper.get('[data-testid="container-music"]')
    const header = container.get('.cn-expander__header')
    expect(header.text()).toContain('音乐设置')
    
    expect(header.find('[data-testid^="setting-"]').exists()).toBe(false)
    expect(header.find('[data-mark="unread"]').exists()).toBe(false)
    expect(header.find('[data-mark="readonly"]').exists()).toBe(false)
    
    expect(container.classes()).not.toContain('cn-expander--disabled')
    
    expect(header.find('[data-testid="container-music-chevron"]').exists()).toBe(true)
    expect(container.classes()).toContain('cn-expander--collapsed')
  })

  it('折叠分组容器：点开箭头后展开，子项就是普通的嵌套行（有控件、有未读标记）', async () => {
    const wrapper = mountPanel({ pages: [conditionalPage()] })

    expect(wrapper.get('[data-testid="container-music"]').classes()).toContain(
      'cn-expander--collapsed',
    )

    await wrapper.get('[data-testid="container-music-chevron"]').trigger('click')

    const container = wrapper.get('[data-testid="container-music"]')
    expect(container.classes()).not.toContain('cn-expander--collapsed')

    const child = wrapper.get('[data-testid="nested-roll_call.animation_music"]')
    expect(child.text()).toContain('动画音乐')
    expect(child.find('[data-mark="unread"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="setting-roll_call.animation_music"]').exists()).toBe(true)
    
    expect(wrapper.find('[data-testid="nested-roll_call.result_music"]').exists()).toBe(true)
  })

  it('折叠分组容器：条件不成立时整组（含子项）都不画', async () => {
    const wrapper = mountPanel({
      pages: [voiceOmniPage()],
      activePageId: VOICE,
      fields: { 'voice.voice_engine': field('voice.voice_engine', 'int', 1) },
    })

    expect(wrapper.find('[data-testid="container-omniTts"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nested-voice.omni_tts_provider"]').exists()).toBe(false)
  })

  

  it('下拉永远包含当前有效值：设备上是插件算法时，那一项也在候选里（否则是一个空框）', async () => {
    const wrapper = mountPanel({
      pages: [conditionalPage()],
      fields: {
        
        'roll_call.algorithm_id': field('roll_call.algorithm_id', 'string', 'plugin.my-algorithm'),
      },
    })

    const trigger = wrapper.get('[data-testid="setting-roll_call.algorithm_id"]')
    expect(trigger.element.tagName).toBe('BUTTON')
    
    expect(selectValue(trigger)).toBe('plugin.my-algorithm')

    await openSelect(trigger)
    expect(selectLabels()).toEqual(['公平抽取', '随机抽取', 'plugin.my-algorithm'])
  })

  it('下拉的内置候选：设备值就是内置那一个时，显示客户端资源里的名字（不重复补一项）', async () => {
    const wrapper = mountPanel({
      pages: [conditionalPage()],
      fields: {
        'roll_call.algorithm_id': field('roll_call.algorithm_id', 'string', 'builtin.fair'),
      },
    })

    const trigger = wrapper.get('[data-testid="setting-roll_call.algorithm_id"]')
    expect(selectValue(trigger)).toBe('公平抽取')

    await openSelect(trigger)
    expect(selectLabels()).toEqual(['公平抽取', '随机抽取'])
  })

  

  







  function shortcutPage(): ClientSettingsPage {
    return {
      id: 'more',
      title: '更多设置',
      groupId: 'more',
      icon: 'AppsListFilled',
      sections: [
        {
          id: 'shortcut',
          title: '快捷键',
          rows: [
            {
              path: 'more.open_roll_call_page_shortcut',
              labels: { 'zh-CN': '打开点名页' },
              icon: 'KeyboardFilled',
              control: 'hotkey',
            },
            {
              path: 'more.quick_draw_shortcut',
              labels: { 'zh-CN': '执行闪抽' },
              icon: 'KeyboardFilled',
              control: 'hotkey',
              visibleWhen: { all: [{ path: 'more.open_roll_call_page_shortcut', notEquals: 'Ctrl+R' }] },
            },
          ],
        },
      ],
    }
  }

  it('`control: hotkey` 的行画成录制器：点一下、按下组合键，就把客户端格式的字符串发成草稿', async () => {
    const wrapper = mountPanel({
      pages: [shortcutPage()],
      activePageId: 'more',
      
      
      fields: { 'more.open_roll_call_page_shortcut': field('more.open_roll_call_page_shortcut', 'string', '') },
    })

    const box = wrapper.get('[data-testid="setting-more.open_roll_call_page_shortcut"]')
    
    expect(box.element.tagName).toBe('BUTTON')
    expect(box.find('input').exists()).toBe(false)
    expect(box.text()).toBe('按下快捷键')

    await box.trigger('click')
    expect(box.attributes('data-recording')).toBe('true')
    await box.trigger('keydown', { key: 'r', code: 'KeyR', ctrlKey: true })

    
    expect(wrapper.emitted('updateDraft')).toEqual([
      ['more.open_roll_call_page_shortcut', 'Ctrl+R'],
    ])
    
    expect(box.attributes('data-recording')).toBe('false')
  })

  it('快捷键行显示设备当前的值（原样），清空按钮发空字符串', async () => {
    const wrapper = mountPanel({
      pages: [shortcutPage()],
      activePageId: 'more',
      fields: {
        'more.open_roll_call_page_shortcut': field(
          'more.open_roll_call_page_shortcut',
          'string',
          'Ctrl+Alt+Q',
        ),
      },
    })

    const box = wrapper.get('[data-testid="setting-more.open_roll_call_page_shortcut"]')
    
    expect(box.text()).toBe('Ctrl+Alt+Q')

    await wrapper
      .get('[data-testid="setting-more.open_roll_call_page_shortcut-clear"]')
      .trigger('click')

    expect(wrapper.emitted('updateDraft')).toEqual([
      ['more.open_roll_call_page_shortcut', ''],
    ])
  })

  it('快捷键行照常跟着 locked 禁用（没读设备时整页都改不动）', () => {
    const wrapper = mountPanel({
      pages: [shortcutPage()],
      activePageId: 'more',
      state: { status: 'idle', canRead: true, canWrite: false, busy: false, dirtyCount: 0, notices: [] },
    })

    
    const box = wrapper.get('[data-testid="setting-more.open_roll_call_page_shortcut"]')
    expect(box.text()).toBe('未读取')
    expect(box.attributes('disabled')).toBeDefined()
    expect(
      wrapper.get('[data-testid="setting-more.open_roll_call_page_shortcut-clear"]').attributes(
        'disabled',
      ),
    ).toBeDefined()
  })
})
