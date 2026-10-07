































import { createApp, h, ref, type Component } from 'vue'
import { createAppI18n } from '@/i18n'
import type { NodeRosterListDto, NodeRosterMemberDto, NodeSettingFieldDto } from '@/api/protocol'
import { CLIENT_SETTINGS_PAGES, isClientSettingContainer } from '@/data/client-settings-pages'
import type {
  ClientSettingRow,
  ClientSettingValueRow,
  ClientSettingsPage,
} from '@/data/client-settings-pages'
import ClientSettingsPanel from '@/components/client/fluent/ClientSettingsPanel.vue'
import ClientRosterPanel from '@/components/client/fluent/ClientRosterPanel.vue'
import ClientImportDrawer from '@/components/client/fluent/ClientImportDrawer.vue'
import ClientSelect from '@/components/client/fluent/ClientSelect.vue'
import type {
  ClientRosterPanelState,
  ClientSelectOption,
  ClientSettingsPanelState,
} from '@/components/client/fluent/client-model'

const params = new URLSearchParams(location.search)
const theme = params.get('theme') === 'dark' ? 'dark' : 'light'
document.documentElement.dataset.theme = theme


document.documentElement.style.background = 'var(--cn-content-bg)'

const panel = params.get('panel') ?? 'settings'
const kind = params.get('kind') === 'prizes' ? 'prizes' : 'students'


const OPEN_SELECT = params.get('openSelect') === '1'







const OPEN_PATH = params.get('openPath')


const SELECT_TO_OPEN =
  OPEN_PATH !== null && OPEN_PATH.length > 0 ? `[data-testid="setting-${OPEN_PATH}"]` : null


const CLIP = params.get('clip') === '1'









const OPEN_LISTS = params.get('openLists') === '1'









const RECORD_PATH = params.get('record')


const pageId = params.get('page') ?? 'roll_call'
const previewPage: ClientSettingsPage =
  CLIENT_SETTINGS_PAGES.find((page) => page.id === pageId) ?? CLIENT_SETTINGS_PAGES[0]!

function field(
  path: string,
  type: string,
  value: unknown,
  writable = true,
  extra: Partial<NodeSettingFieldDto> = {},
): NodeSettingFieldDto {
  return { path, category: previewPage.id, type, value, writable, ...extra }
}










const MISSING_VALUE_INDEX = 4


function optionValuesOf(row: ClientSettingValueRow): string[] {
  return (row.options ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.value))
}


function valueRowsOf(rows: readonly ClientSettingRow[]): ClientSettingValueRow[] {
  return rows.flatMap((row) =>
    isClientSettingContainer(row) ? valueRowsOf(row.rows) : [row, ...valueRowsOf(row.rows ?? [])],
  )
}

function fieldsForPage(page: ClientSettingsPage): Record<string, NodeSettingFieldDto> {
  const out: Record<string, NodeSettingFieldDto> = {}
  const rows = page.sections.flatMap((section) => valueRowsOf(section.rows))

  rows.forEach((row, index) => {
    
    
    if (row.path.endsWith('custom_font')) return
    const unknown = index === MISSING_VALUE_INDEX

    if (row.control === 'toggle') {
      
      
      out[row.path] = field(row.path, 'bool', row.path.includes('.override_') ? true : index % 2 === 0)
      return
    }
    if (unknown) return
    if (row.control === 'number') {
      out[row.path] = field(row.path, 'int', 96, true, { min: 1, max: 300 })
      return
    }
    if (row.control === 'hotkey') {
      
      
      out[row.path] = field(row.path, 'string', 'Ctrl+Alt+R')
      return
    }
    if (row.control === 'select') {
      const options = optionValuesOf(row)
      out[row.path] = field(row.path, 'enum', options[1] ?? options[0] ?? '', true, { options })
      return
    }
    if (row.control === 'readonly') {
      out[row.path] = field(row.path, 'string', 'MiSans (默认)')
      return
    }
    out[row.path] = field(row.path, 'string', `示例值 ${index + 1}`, row.readonly !== true)
  })

  return out
}








function expandedPages(): readonly ClientSettingsPage[] {
  const expand = (rows: readonly ClientSettingRow[]): ClientSettingRow[] =>
    rows.map((row) => {
      const children = row.rows ?? []
      if (children.length === 0) return row
      const open = EXPAND_ALL || (!isClientSettingContainer(row) && SETTINGS_FIELDS[row.path]?.value === true)
      return { ...row, expanded: open, rows: expand(children) }
    })

  return CLIENT_SETTINGS_PAGES.map((page) => ({
    ...page,
    sections: page.sections.map((section) => ({ ...section, rows: expand(section.rows) })),
  }))
}


const EXPAND_ALL = params.get('expandAll') === '1'








const DRAW_MODE = params.get('drawMode')


const VOICE_ENGINE = params.get('voiceEngine')








function parseFieldOverrides(raw: string | null): readonly (readonly [string, unknown])[] {
  if (raw === null || raw.length === 0) return []

  const overrides: (readonly [string, unknown])[] = []
  for (const pair of raw.split(',')) {
    const separator = pair.indexOf(':')
    if (separator <= 0) continue

    const path = pair.slice(0, separator).trim()
    const text = pair.slice(separator + 1)
    let value: unknown = text
    try {
      value = JSON.parse(text)
    } catch {
      
      value = text
    }
    overrides.push([path, value])
  }
  return overrides
}

const FIELD_OVERRIDES = parseFieldOverrides(params.get('set'))







const LOCKED =
  params.get('locked') === '1' && params.get('openSelect') !== '1' && SELECT_TO_OPEN === null

const SETTINGS_FIELDS = LOCKED ? {} : fieldsForPage(previewPage)


if (!LOCKED) {
  if (DRAW_MODE !== null && DRAW_MODE.length > 0) {
    for (const path of [
      'default_draw.draw_mode',
      'roll_call.draw_mode',
      'quick_draw.draw_mode',
      'lottery.draw_mode',
    ]) {
      const existing = SETTINGS_FIELDS[path]
      if (existing === undefined) continue
      SETTINGS_FIELDS[path] = field(path, 'enum', DRAW_MODE, true, {
        options: existing.options ?? null,
      })
    }
  }

  if (VOICE_ENGINE !== null && SETTINGS_FIELDS['voice.voice_engine'] !== undefined) {
    SETTINGS_FIELDS['voice.voice_engine'] = field('voice.voice_engine', 'int', Number(VOICE_ENGINE), true, {
      min: 0,
      max: 2,
    })
  }

  for (const [path, value] of FIELD_OVERRIDES) {
    const existing = SETTINGS_FIELDS[path]
    if (existing === undefined) continue
    SETTINGS_FIELDS[path] = { ...existing, value }
  }
}

const SETTINGS_PAGES = expandedPages()

const SETTINGS_STATE: ClientSettingsPanelState = {
  status: LOCKED ? 'idle' : 'ready',
  canRead: true,
  canWrite: !LOCKED,
  busy: false,
  dirtyCount: LOCKED ? 0 : 1,
  notices: LOCKED
    ? [{ tone: 'info', text: '先「从设备读取」，读取之后才能修改' }]
    : [{ tone: 'ok', text: '已重新读取设备，界面与设备当前值对齐' }],
}



const ROSTER_MEMBERS: readonly NodeRosterMemberDto[] = [
  { id: '20230301', name: '陈思远', gender: '男', group: '第一组', count: null, weight: null, enabled: true, tags: ['组长'] },
  { id: '20230302', name: '林悦然', gender: '女', group: '第一组', count: null, weight: null, enabled: true, tags: ['英语课代表'] },
  { id: '20230303', name: '赵一鸣', gender: '男', group: '第二组', count: null, weight: null, enabled: true },
  { id: '20230304', name: '苏婉清', gender: '女', group: '第二组', count: null, weight: null, enabled: false, tags: ['转学生'] },
  { id: '20230305', name: '周墨涵', gender: '男', group: '第三组', count: null, weight: null, enabled: true, tags: ['体育委员'] },
  { id: '20230306', name: '何雨桐', gender: '女', group: '第三组', count: null, weight: null, enabled: true },
]

const PRIZE_MEMBERS: readonly NodeRosterMemberDto[] = [
  { id: 'P01', name: '一等奖 · 文具礼盒', gender: null, group: null, count: 1, weight: 1, enabled: true, tags: ['稀有'] },
  { id: 'P02', name: '二等奖 · 笔记本', gender: null, group: null, count: 5, weight: 5, enabled: true },
  { id: 'P03', name: '三等奖 · 签字笔', gender: null, group: null, count: 20, weight: 20, enabled: true, tags: ['参与奖'] },
  { id: 'P04', name: '鼓励奖 · 贴纸', gender: null, group: null, count: 40, weight: 40, enabled: false },
]

const ROSTER_LISTS: readonly NodeRosterListDto[] = [
  { name: '高二（3）班', is_default: true, count: 6, total: 6, truncated: false, members: [] },
  { name: '高一（1）班', is_default: false, count: 0, total: 0, truncated: false, members: [] },
]

const ROSTER_STATE: ClientRosterPanelState = {
  status: 'ready',
  canRead: true,
  canPush: true,
  busy: false,
  notices: [],
}

const CSV = '学号,姓名,性别,分组,标签\n20230301,陈思远,男,第一组,组长\n20230302,林悦然,女,第一组,英语课代表\n'


const SELECT_OPTIONS: readonly ClientSelectOption[] = [
  { value: 'RollCall', label: '按名单抽取' },
  { value: 'Fair', label: '公平抽取' },
  { value: 'Lottery', label: '按奖项抽取' },
]



const drawer = ref<InstanceType<typeof ClientImportDrawer> | null>(null)







function clickWhenReady(selector: string): void {
  let tries = 0
  const tick = (): void => {
    const node = document.querySelector<HTMLElement>(selector)
    if (node !== null) {
      node.click()
      return
    }
    if ((tries += 1) < 200) setTimeout(tick, 16)
  }
  setTimeout(tick, 16)
}


function clickWhenReadyInView(selector: string): void {
  let tries = 0
  const tick = (): void => {
    const node = document.querySelector<HTMLElement>(selector)
    if (node !== null) {
      
      
      node.click()
      setTimeout(() => centerInPageScroll(node), 50)
      return
    }
    if ((tries += 1) < 200) setTimeout(tick, 16)
  }
  setTimeout(tick, 16)
}










function centerInPageScroll(node: HTMLElement): void {
  const scroller = document.querySelector<HTMLElement>('.cn-page-scroll')
  if (scroller === null) {
    node.scrollIntoView({ block: 'center' })
    return
  }
  const offsetInScroller =
    node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
  scroller.scrollTop = offsetInScroller - (scroller.clientHeight - node.offsetHeight) / 2
}

const view: Component = {
  setup() {
    if (panel === 'roster') {
      if (params.get('dialog') === '1') {
        
        const fill = (): void => {
          const writes: readonly (readonly [string, string])[] = [
            ['[data-testid="roster-add-name"]', '郑一诺'],
            ['[data-testid="roster-add-group"]', '第四组'],
          ]
          for (const [selector, text] of writes) {
            const input = document.querySelector<HTMLInputElement>(selector)
            if (input === null) continue
            input.value = text
            
            input.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }
        setTimeout(() => {
          const open = document.querySelector<HTMLElement>('[data-testid="roster-add"]')
          open?.click()
          setTimeout(fill, 32)
        }, 32)
      }

      return () =>
        h(ClientRosterPanel, {
          kind,
          lists: ROSTER_LISTS,
          selectedListName: '高二（3）班',
          members: kind === 'prizes' ? PRIZE_MEMBERS : ROSTER_MEMBERS,
          state: ROSTER_STATE,
        })
    }

    if (panel === 'drawer') {
      return () =>
        h(ClientImportDrawer, {
          kind,
          ref: drawer,
          onClose: () => undefined,
        })
    }

    if (panel === 'select') {
      if (OPEN_SELECT) clickWhenReady('[data-cn-select]')
      return () =>
        h(
          
          'div',
          { class: 'client-ui', style: 'padding:48px' },
          [
            h(ClientSelect, {
              modelValue: 'Fair',
              options: SELECT_OPTIONS,
              label: '抽取模式',
              'data-testid': 'preview-select',
            }),
          ],
        )
    }

    return () => {
      const settingsPanel = h(ClientSettingsPanel, {
        pages: SETTINGS_PAGES,
        activePageId: previewPage.id,
        fields: SETTINGS_FIELDS,
        
        
        
        
        
        drafts: { 'roll_call.display_format': 'Id' },
        state: SETTINGS_STATE,
      })

      
      return CLIP
        ? h('div', { style: 'height:120px;overflow:hidden;border:1px dashed #888' }, [settingsPanel])
        : settingsPanel
    }
  },
}

const app = createApp(view)
app.use(createAppI18n('zh-CN'))
app.mount('#preview')

if (panel === 'drawer') {
  void drawer.value?.loadFromBuffer(new TextEncoder().encode(CSV).buffer as ArrayBuffer, 'students.csv')
}



if (panel === 'roster') {
  if (OPEN_LISTS) clickWhenReady('[data-testid="roster-current-list"]')
} else if (panel !== 'select') {
  if (RECORD_PATH !== null && RECORD_PATH.length > 0) {
    clickWhenReadyInView(`[data-testid="setting-${RECORD_PATH}"]`)
  } else if (SELECT_TO_OPEN !== null) clickWhenReady(SELECT_TO_OPEN)
  else if (OPEN_SELECT) clickWhenReady('[data-cn-select]')
}


const SCROLL = Number(params.get('scroll') ?? 0)
if (Number.isFinite(SCROLL) && SCROLL > 0) {
  setTimeout(() => {
    
    
    
    const inner = document.querySelector<HTMLElement>('.cn-page-scroll')
    if (inner !== null) inner.scrollTo(0, SCROLL)
    else window.scrollTo(0, SCROLL)
  }, 200)
}
