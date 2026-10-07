import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClientRosterPanel from './ClientRosterPanel.vue'
import { createAppI18n } from '@/i18n'
import type { NodeRosterListDto, NodeRosterMemberDto, RosterKind } from '@/api/protocol'
import type { ClientRosterPanelState } from './client-model'











const LIST_NAME = '高二（3）班'

const LISTS: readonly NodeRosterListDto[] = [
  { name: LIST_NAME, is_default: true, count: 2, total: 2, truncated: false, members: [] },
  { name: '高一（1）班', is_default: false, count: 0, total: 0, truncated: false, members: [] },
]


const MEMBERS: readonly NodeRosterMemberDto[] = [
  {
    id: '20230301',
    name: '陈思远',
    gender: '男',
    group: '第一组',
    count: null,
    weight: null,
    enabled: true,
    tags: ['组长'],
  },
  {
    id: '20230304',
    name: '苏婉清',
    gender: '女',
    group: '第二组',
    count: null,
    weight: null,
    enabled: false,
  },
]

const STATE: ClientRosterPanelState = {
  status: 'ready',
  canRead: true,
  canPush: true,
  busy: false,
  notices: [],
}

interface PanelProps {
  kind: RosterKind
  lists: readonly NodeRosterListDto[]
  selectedListName: string | null
  members: readonly NodeRosterMemberDto[]
  state: ClientRosterPanelState
}

function mountRoster(overrides: Partial<PanelProps> = {}): VueWrapper {
  const props: PanelProps = {
    kind: 'students',
    lists: LISTS,
    selectedListName: LIST_NAME,
    members: MEMBERS,
    state: STATE,
    ...overrides,
  }
  return mount(ClientRosterPanel, {
    props,
    global: { plugins: [createAppI18n('zh-CN')] },
  })
}


async function changeValue(wrapper: VueWrapper, selector: string, value: string): Promise<void> {
  const input = wrapper.get(selector)
  ;(input.element as HTMLInputElement).value = value
  await input.trigger('change')
}

describe('ClientRosterPanel 列', () => {
  it('学生名单：启用 / ID / 姓名 / 性别 / 分组 / 标签 / 操作', () => {
    const wrapper = mountRoster()

    expect(wrapper.findAll('th').map((th) => th.attributes('data-testid'))).toEqual([
      'roster-col-enabled',
      'roster-col-id',
      'roster-col-name',
      'roster-col-gender',
      'roster-col-group',
      'roster-col-tags',
      'roster-col-actions',
    ])
    expect(wrapper.get('[data-testid="roster-col-name"]').text()).toContain('姓名')
    expect(wrapper.get('[data-testid="roster-col-gender"]').text()).toContain('性别')
  })

  it('奖品名单：姓名换成奖项名，性别 / 分组换成数量 / 权重', () => {
    const wrapper = mountRoster({ kind: 'prizes' })

    expect(wrapper.findAll('th').map((th) => th.attributes('data-testid'))).toEqual([
      'roster-col-enabled',
      'roster-col-id',
      'roster-col-name',
      'roster-col-count',
      'roster-col-weight',
      'roster-col-tags',
      'roster-col-actions',
    ])
    expect(wrapper.get('[data-testid="roster-col-name"]').text()).toContain('奖项名')
    expect(wrapper.find('[data-testid="roster-col-gender"]').exists()).toBe(false)

    const count = wrapper.get('[data-testid="roster-count-0"]')
    expect(count.attributes('type')).toBe('number')
  })
})

describe('ClientRosterPanel 就地编辑', () => {
  it('标签格：没碰过就不发 tags，改过才发', async () => {
    const wrapper = mountRoster()

    
    expect(wrapper.emitted('updateMember')).toBeUndefined()
    expect((wrapper.get('[data-testid="roster-tags-0"]').element as HTMLInputElement).value).toBe(
      '组长',
    )

    
    await wrapper.get('[data-testid="roster-tags-0"]').trigger('change')
    expect(wrapper.emitted('updateMember')).toBeUndefined()

    
    await changeValue(wrapper, '[data-testid="roster-tags-0"]', '组长, 英语课代表')
    expect(wrapper.emitted('updateMember')).toEqual([[0, { tags: ['组长', '英语课代表'] }]])
  })

  it('标签格：清空是明确清空（发空数组，语义与"不发"不同）', async () => {
    const wrapper = mountRoster()

    await changeValue(wrapper, '[data-testid="roster-tags-0"]', '')

    expect(wrapper.emitted('updateMember')).toEqual([[0, { tags: [] }]])
  })

  it('编号 / 姓名格：改了发新值，清空发 null（协议里是 string | null）', async () => {
    const wrapper = mountRoster()

    await changeValue(wrapper, '[data-testid="roster-id-0"]', '20230399')
    await changeValue(wrapper, '[data-testid="roster-name-1"]', '')

    expect(wrapper.emitted('updateMember')).toEqual([
      [0, { id: '20230399' }],
      [1, { name: null }],
    ])
  })

  it('数量 / 权重格：改了发数值，清空发 null', async () => {
    const wrapper = mountRoster({ kind: 'prizes' })

    await changeValue(wrapper, '[data-testid="roster-count-0"]', '5')
    await changeValue(wrapper, '[data-testid="roster-weight-1"]', '')

    expect(wrapper.emitted('updateMember')).toEqual([
      [0, { count: 5 }],
      [1, { weight: null }],
    ])
  })

  it('「启用」列勾选发 enabled', async () => {
    const wrapper = mountRoster()

    await wrapper.get('[data-testid="roster-enabled-1"]').setValue(true)

    expect(wrapper.emitted('updateMember')).toEqual([[1, { enabled: true }]])
  })

  it('操作列的删除按钮发这一行的下标（并且不顺手把行选中）', async () => {
    const wrapper = mountRoster()

    await wrapper.get('[data-testid="roster-remove-1"]').trigger('click')

    expect(wrapper.emitted('removeRow')).toEqual([[1]])
    expect(wrapper.get('[data-testid="roster-row-1"]').classes()).not.toContain('is-selected')
  })
})

describe('ClientRosterPanel 命令栏', () => {
  it('每条命令都接上了自己的动作', async () => {
    const wrapper = mountRoster()

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await wrapper.get('[data-testid="roster-add"]').trigger('click')
    await wrapper.get('[data-testid="roster-import"]').trigger('click')
    await wrapper.get('[data-testid="roster-export"]').trigger('click')
    await wrapper.get('[data-testid="roster-submit"]').trigger('click')

    expect(wrapper.emitted('read')).toHaveLength(1)
    
    expect(wrapper.find('[data-testid="roster-add-dialog"]').exists()).toBe(true)
    expect(wrapper.emitted('addRow')).toBeUndefined()
    expect(wrapper.emitted('import')).toHaveLength(1)
    expect(wrapper.emitted('export')).toHaveLength(1)
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('没选中名单时不能加人 / 导入，并说清为什么', () => {
    const wrapper = mountRoster({ selectedListName: null, members: [] })

    for (const id of ['roster-add', 'roster-import']) {
      const button = wrapper.get(`[data-testid="${id}"]`)
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.attributes('title')).toContain('先选中一份名单')
    }
    
    expect(wrapper.get('[data-testid="roster-export"]').attributes('disabled')).toBeDefined()
  })

  it('没有下发能力时不能下发', () => {
    const wrapper = mountRoster({ state: { ...STATE, canPush: false } })

    expect(wrapper.get('[data-testid="roster-submit"]').attributes('disabled')).toBeDefined()
  })

  it('点名 / 抽奖分段开关发 switchKind，当前那一档是选中的', async () => {
    const wrapper = mountRoster()

    expect(wrapper.get('[data-testid="roster-kind-students"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.get('[data-testid="roster-kind-prizes"]').attributes('aria-selected')).toBe(
      'false',
    )

    await wrapper.get('[data-testid="roster-kind-prizes"]').trigger('click')
    expect(wrapper.emitted('switchKind')).toEqual([['prizes']])
  })

  it('当前名单按钮弹出名单列表，选一份发 selectList', async () => {
    const wrapper = mountRoster()

    expect(wrapper.get('[data-testid="roster-current-list"]').text()).toContain(LIST_NAME)
    expect(wrapper.find('[data-testid="roster-list-menu"]').exists()).toBe(false)

    await wrapper.get('[data-testid="roster-current-list"]').trigger('click')
    const menu = wrapper.get('[data-testid="roster-list-menu"]')
    expect(menu.findAll('[role="menuitemradio"]')).toHaveLength(2)
    expect(wrapper.get('[data-testid="roster-list-option-0"]').attributes('aria-checked')).toBe('true')

    await wrapper.get('[data-testid="roster-list-option-1"]').trigger('click')
    expect(wrapper.emitted('selectList')).toEqual([['高一（1）班']])
    
    expect(wrapper.find('[data-testid="roster-list-menu"]').exists()).toBe(false)
  })

  it('尾部小结说得出这是学生还是奖品', () => {
    expect(mountRoster().get('[data-testid="roster-member-count"]').text()).toBe('2 人')
    expect(mountRoster({ kind: 'prizes' }).get('[data-testid="roster-member-count"]').text()).toBe(
      '2 个奖项',
    )
  })
})

describe('ClientRosterPanel 添加一行对话框', () => {
  
  async function openDialog(wrapper: VueWrapper): Promise<void> {
    await wrapper.get('[data-testid="roster-add"]').trigger('click')
  }

  function fill(wrapper: VueWrapper, field: string, value: string): Promise<void> {
    return wrapper.get(`[data-testid="roster-add-${field}"]`).setValue(value)
  }

  it('「添加一行」开的是对话框：遮罩 + 卡片 + 标题 + 学生那几格 + 取消/确认', async () => {
    const wrapper = mountRoster()

    expect(wrapper.find('[data-testid="roster-add-dialog"]').exists()).toBe(false)
    await openDialog(wrapper)

    const dialog = wrapper.get('[data-testid="roster-add-dialog"]')
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.find('.cn-dialog__scrim').exists()).toBe(true)
    expect(dialog.find('.cn-dialog__card').exists()).toBe(true)
    expect(dialog.get('.cn-dialog__title').text()).toBe('添加一行')

    
    expect(dialog.findAll('.cn-field__label').map((node) => node.text())).toEqual([
      'ID',
      '姓名',
      '性别',
      '分组',
      '标签',
    ])

    expect(wrapper.get('[data-testid="roster-add-cancel"]').text()).toBe('取消')
    expect(wrapper.get('[data-testid="roster-add-confirm"]').text()).toBe('确认')
    
    expect(wrapper.get('[data-testid="roster-add-confirm"]').attributes('disabled')).toBeDefined()
  })

  it('奖品：数量 / 权重 代替性别 / 分组', async () => {
    const wrapper = mountRoster({ kind: 'prizes' })
    await openDialog(wrapper)

    const dialog = wrapper.get('[data-testid="roster-add-dialog"]')
    expect(dialog.findAll('.cn-field__label').map((node) => node.text())).toEqual([
      'ID',
      '奖项名',
      '数量',
      '权重',
      '标签',
    ])
    
    expect(wrapper.get('[data-testid="roster-add-count"]').attributes('inputmode')).toBe('decimal')
    expect(wrapper.get('[data-testid="roster-add-weight"]').attributes('inputmode')).toBe('decimal')
    expect(wrapper.get('[data-testid="roster-add-name"]').attributes('inputmode')).toBeUndefined()
    expect(wrapper.find('[data-testid="roster-add-gender"]').exists()).toBe(false)
  })

  it('确认之后发 addRow(member)：填了什么就是什么，标签按逗号拆、空字段是 null', async () => {
    const wrapper = mountRoster()
    await openDialog(wrapper)

    await fill(wrapper, 'id', '20230399')
    await fill(wrapper, 'name', '郑一诺')
    await fill(wrapper, 'gender', '女')
    await fill(wrapper, 'group', '第四组')
    await fill(wrapper, 'tags', '组长, 英语课代表')

    await wrapper.get('[data-testid="roster-add-confirm"]').trigger('click')

    expect(wrapper.emitted('addRow')).toEqual([
      [
        {
          id: '20230399',
          name: '郑一诺',
          gender: '女',
          group: '第四组',
          count: null,
          weight: null,
          enabled: true,
          tags: ['组长', '英语课代表'],
        },
      ],
    ])
    
    expect(wrapper.find('[data-testid="roster-add-dialog"]').exists()).toBe(false)
  })

  it('奖品：数量 / 权重 读成数字，空着就是 null', async () => {
    const wrapper = mountRoster({ kind: 'prizes' })
    await openDialog(wrapper)

    await fill(wrapper, 'name', '四等奖 · 橡皮')
    await fill(wrapper, 'count', '10')
    await fill(wrapper, 'weight', '2.5')

    await wrapper.get('[data-testid="roster-add-confirm"]').trigger('click')

    expect(wrapper.emitted('addRow')?.[0]?.[0]).toMatchObject({
      id: null,
      name: '四等奖 · 橡皮',
      gender: null,
      group: null,
      count: 10,
      weight: 2.5,
      enabled: true,
    })
  })

  it('至少要有编号或姓名：一个都没有时确认点不动，有了就点得动', async () => {
    const wrapper = mountRoster()
    await openDialog(wrapper)

    const confirm = (): string | undefined =>
      wrapper.get('[data-testid="roster-add-confirm"]').attributes('disabled')

    expect(confirm()).toBeDefined()

    
    await fill(wrapper, 'id', '20230400')
    expect(confirm()).toBeUndefined()

    
    await fill(wrapper, 'id', '')
    await fill(wrapper, 'name', '无名氏')
    expect(confirm()).toBeUndefined()

    await fill(wrapper, 'name', '')
    expect(confirm()).toBeDefined()
  })

  it('数量 / 权重 填了不是数字就不给确认', async () => {
    const wrapper = mountRoster({ kind: 'prizes' })
    await openDialog(wrapper)

    await fill(wrapper, 'name', '安慰奖')
    expect(wrapper.get('[data-testid="roster-add-confirm"]').attributes('disabled')).toBeUndefined()

    await fill(wrapper, 'count', '很多')
    expect(wrapper.get('[data-testid="roster-add-confirm"]').attributes('disabled')).toBeDefined()
  })

  it('取消 / Esc 都关掉对话框且什么都不发；再打开时是空的', async () => {
    const wrapper = mountRoster()
    await openDialog(wrapper)
    await fill(wrapper, 'name', '临时')
    await wrapper.get('[data-testid="roster-add-cancel"]').trigger('click')

    expect(wrapper.find('[data-testid="roster-add-dialog"]').exists()).toBe(false)
    expect(wrapper.emitted('addRow')).toBeUndefined()

    
    await openDialog(wrapper)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('[data-testid="roster-add-dialog"]').exists()).toBe(false)
    expect(wrapper.emitted('addRow')).toBeUndefined()

    
    await openDialog(wrapper)
    expect(
      (wrapper.get('[data-testid="roster-add-name"]').element as HTMLInputElement).value,
    ).toBe('')
  })

  it('点遮罩也关（客户端的内容对话框同此）', async () => {
    const wrapper = mountRoster()
    await openDialog(wrapper)

    await wrapper.get('[data-testid="roster-add-scrim"]').trigger('click')

    expect(wrapper.find('[data-testid="roster-add-dialog"]').exists()).toBe(false)
    expect(wrapper.emitted('addRow')).toBeUndefined()
  })
})

describe('ClientRosterPanel 状态与提示', () => {
  it('设备上一份名单都没有时说清楚', () => {
    const wrapper = mountRoster({ lists: [], selectedListName: null, members: [] })

    expect(wrapper.get('[data-testid="roster-status"]').text()).toBe('设备上还没有名单')
    expect(wrapper.get('[data-testid="roster-no-rows"]').text()).toBe('这份名单里没有成员')
  })

  it('截断必须提示：被截断时整份覆盖会删掉没回传的人', () => {
    const wrapper = mountRoster({
      lists: [
        { name: LIST_NAME, is_default: true, count: 5, total: 40, truncated: true, members: [] },
      ],
    })

    const notice = wrapper.get('[data-testid="roster-truncated"]')
    expect(notice.text()).toContain('5')
    expect(notice.text()).toContain('40')
  })

  it('读不到名单时：面板不重复那句笼统结论，只有权限不够才由面板说', () => {
    
    
    const unsupported = mountRoster({ state: { ...STATE, status: 'unavailable', canRead: true } })
    expect(unsupported.find('[data-testid="roster-status"]').exists()).toBe(false)

    const noRole = mountRoster({ state: { ...STATE, status: 'unavailable', canRead: false } })
    expect(noRole.get('[data-testid="roster-status"]').text()).toContain('管理员')
  })

  it('提示条按语气上色（文案由调用方组织）', () => {
    const wrapper = mountRoster({
      state: {
        ...STATE,
        status: 'failed',
        notices: [{ tone: 'fail', text: '读取失败：超时', testId: 'roster-notice' }],
      },
    })

    expect(wrapper.get('[data-testid="roster-notice"]').text()).toBe('读取失败：超时')
    expect(wrapper.get('[data-testid="roster-notice"]').classes()).toContain('cn-note--fail')
  })
})
