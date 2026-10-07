import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import GroupBatchConfigView from './GroupBatchConfigView.vue'
import { api, ApiError } from '@/api/client'
import {
  openSelect,
  pickOption,
  selectLabels,
  selectValue,
} from '@/components/client/fluent/client-select.test-utils'
import { createAppI18n } from '@/i18n'
import { useSessionStore } from '@/stores/session'
import { NodeCapability, type CurrentUser, type GroupRole, type NodeCommandDto, type NodeView } from '@/api/protocol'











enableAutoUnmount(afterEach)

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: { ...actual.api, listNodes: vi.fn(), patchSettings: vi.fn() },
  }
})

const GROUP_ID = 'grp_01ab30b332e6'
const GROUP_ID_2 = 'grp_01ab30b332e7'
const USER_ID = 'user_owner_1'
const NODE_A = 'node_01a'
const NODE_B = 'node_01b'

function userWith(role: GroupRole): CurrentUser {
  return {
    user_id: USER_ID,
    display_name: '张老师',
    groups: [
      {
        group_id: GROUP_ID,
        name: '高一（1）班 · 教学楼301',
        owner_user_id: USER_ID,
        created_at: '2026-03-12T00:00:00Z',
        role,
      },
      {
        group_id: GROUP_ID_2,
        name: '高一（2）班 · 教学楼302',
        owner_user_id: USER_ID,
        created_at: '2026-03-12T00:00:00Z',
        role,
      },
    ],
  }
}

function node(id: string, capabilities: string[], extra: Partial<NodeView> = {}): NodeView {
  return {
    node_id: id,
    group_id: GROUP_ID,
    platform: 'windows',
    version: '1.0.0',
    capabilities,
    local_remote_allowed: true,
    display_name: `讲台机 ${id}`,
    online: true,
    draw_locked: false,
    registered_at: '2026-03-12T00:00:00Z',
    ...extra,
  }
}

function command(overrides: Partial<NodeCommandDto> = {}): NodeCommandDto {
  return {
    command_id: 'cmd_1',
    target_node_id: NODE_A,
    capability: 'settings.write',
    kind: 'action',
    status: 'completed',
    issued_at: '2026-03-12T00:00:00Z',
    expires_at: '2026-03-12T00:02:00Z',
    ...overrides,
  }
}

interface MountOptions {
  role?: GroupRole
  nodes?: string
  list?: NodeView[]
  
  pendingList?: boolean
  
  deferredList?: boolean
}


let pendingListResolve: ((nodes: NodeView[]) => void) | null = null

function finishPendingList(nodes: NodeView[]): void {
  const resolve = pendingListResolve
  pendingListResolve = null
  resolve?.(nodes)
}

async function mountView(options: MountOptions = {}): Promise<VueWrapper> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const list = options.list ?? [node(NODE_A, [NodeCapability.SettingsWrite])]

  if (options.pendingList === true) {
    vi.mocked(api.listNodes).mockReturnValue(new Promise<NodeView[]>(() => {}))
  } else if (options.deferredList === true) {
    pendingListResolve = null
    const deferred = new Promise<NodeView[]>((resolve) => {
      pendingListResolve = resolve
    })
    vi.mocked(api.listNodes).mockReturnValueOnce(deferred).mockResolvedValue(list)
  } else {
    vi.mocked(api.listNodes).mockResolvedValue(list)
  }

  const session = useSessionStore(pinia)
  session.user = userWith(options.role ?? 'admin')
  session.loaded = true

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      {
        path: '/console/groups/:groupId',
        name: 'console-group-detail',
        component: { template: '<div />' },
      },
      {
        path: '/console/groups/:groupId/batch-config',
        name: 'console-group-batch-config',
        component: { template: '<div />' },
      },
    ],
  })
  await router.push(`/console/groups/${GROUP_ID}`)
  await router.isReady()

  const wrapper = mount(GroupBatchConfigView, {
    props: { groupId: GROUP_ID, nodes: options.nodes ?? NODE_A },
    global: { plugins: [pinia, createAppI18n('zh-CN'), router] },
  })
  await flushPromises()
  return wrapper
}


async function pickThemeMode(wrapper: VueWrapper): Promise<void> {
  const trigger = wrapper.get('[data-testid="batch-row-appearance.theme"] [data-cn-select]')
  await openSelect(trigger)
  const labels = selectLabels()
  const light = labels[1]
  if (light === undefined) throw new Error(`下拉里没有第二个候选：${labels.join(' / ')}`)
  await pickOption(trigger, light)
}

beforeEach(() => {
  vi.mocked(api.patchSettings).mockReset()
  
  vi.mocked(api.listNodes).mockReset()
  pendingListResolve = null
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GroupBatchConfigView', () => {
  it('只把声明了「远程改设置」的机器算进目标，其余如实跳过', async () => {
    const wrapper = await mountView({
      nodes: `${NODE_A},${NODE_B}`,
      list: [
        node(NODE_A, [NodeCapability.SettingsWrite]),
        node(NODE_B, [NodeCapability.MediaPlay]),
      ],
    })

    expect(wrapper.find(`[data-testid="batch-config-target-${NODE_A}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-testid="batch-config-target-${NODE_B}"]`).exists()).toBe(false)

    
    const targets = wrapper.get('[data-testid="batch-config-targets"]')
    expect(targets.text()).toContain('有 1 台没有声明「远程改设置」能力，已跳过')
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeDefined()
  })

  it('节点列表还没回来时不先下"一台都不支持"的结论', async () => {
    const wrapper = await mountView({ nodes: NODE_A, pendingList: true })

    expect(wrapper.get('[data-testid="batch-config-targets"]').text()).toContain('正在加载')
    expect(wrapper.find('[data-testid="batch-config-no-targets"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="batch-config-unknown-nodes"]').exists()).toBe(false)
  })

  it('不在本组节点列表里的 id 也跳过，并且不静默吞掉', async () => {
    const wrapper = await mountView({ nodes: 'node_gone', list: [] })

    expect(wrapper.get('[data-testid="batch-config-unknown-nodes"]').text()).toContain(
      '不在本组的节点列表里',
    )
    expect(wrapper.find('[data-testid="batch-config-no-targets"]').exists()).toBe(true)
  })

  it('没选任何设置项时不能下发；选好之后下发的是"那一项 = 那个值"', async () => {
    const wrapper = await mountView()
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeDefined()

    await pickThemeMode(wrapper)

    expect(wrapper.get('[data-testid="batch-config-count"]').text()).toContain('待下发 1 项')
    expect(wrapper.get('[data-testid="batch-config-summary"]').text()).toContain('appearance.theme')
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeUndefined()

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    
    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_A, {
      'appearance.theme': 'Light',
    })
    expect(window.confirm).toHaveBeenCalledWith('将向 1 台机器下发 1 项设置，确定？')
  })

  it('没勾的项一个都不发：设备的 patch 只带选中的那些', async () => {
    const wrapper = await mountView({
      nodes: `${NODE_A},${NODE_B}`,
      list: [
        node(NODE_A, [NodeCapability.SettingsWrite]),
        node(NODE_B, [NodeCapability.SettingsWrite]),
      ],
    })

    await pickThemeMode(wrapper)
    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    expect(api.patchSettings).toHaveBeenCalledTimes(2)
    for (const nodeId of [NODE_A, NODE_B]) {
      expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, nodeId, {
        'appearance.theme': 'Light',
      })
    }
  })

  it('填写型控件：勾上但没填值算一处问题，填好之后才发得出去', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-floating_window"]').trigger('click')

    const include = wrapper.get(
      '[data-testid="batch-include-floating_window.floating_window_opacity"]',
    )
    await include.setValue(true)

    
    expect(wrapper.get('[data-testid="batch-config-problems"]').text()).toContain('还没有填值')
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeDefined()

    await wrapper
      .get('[data-testid="setting-floating_window.floating_window_opacity"]')
      .setValue('60')

    expect(wrapper.find('[data-testid="batch-config-problems"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="batch-config-count"]').text()).toContain('待下发 1 项')

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    
    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_A, {
      'floating_window.floating_window_opacity': 60,
    })
  })

  it('折叠分组（容器）里的子项也逐个画出来，开关按「不改变 / 开启 / 关闭」三档下发', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-floating_window"]').trigger('click')

    
    
    expect(wrapper.find('[data-testid="batch-container-enabledItems"]').exists()).toBe(true)

    const child = wrapper.get('[data-testid="batch-row-floating_window.show_roll_call_button"]')
    const trigger = child.get('[data-cn-select]')
    await openSelect(trigger)
    expect(selectValue(trigger)).toBe('不改变')

    await pickOption(trigger, '关闭')

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    
    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_A, {
      'floating_window.show_roll_call_button': false,
    })
  })

  it('「可覆盖设置」那种真实行的子项也画出来，并且能下发', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')

    
    
    await wrapper.get('[data-testid="batch-include-roll_call.font_size"]').setValue(true)
    await wrapper.get('[data-testid="setting-roll_call.font_size"]').setValue('40')

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_A, { 'roll_call.font_size': 40 })
  })

  it('文本项：输入框显示的就是要下发的值（切页回来不会被擦掉）', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')

    await wrapper.get('[data-testid="batch-include-roll_call.reminder_text"]').setValue(true)
    const input = wrapper.get('[data-testid="setting-roll_call.reminder_text"]')
    await input.setValue('请上台')
    expect((input.element as HTMLInputElement).value).toBe('请上台')

    
    
    await wrapper.get('[data-testid="client-nav-floating_window"]').trigger('click')
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')

    const again = wrapper.get('[data-testid="setting-roll_call.reminder_text"]')
    expect((again.element as HTMLInputElement).value).toBe('请上台')
    expect(wrapper.get('[data-testid="batch-summary-roll_call.reminder_text"]').text()).toContain(
      '请上台',
    )
  })

  it('快捷键项：录到的组合回显在框里，并原样下发', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-more"]').trigger('click')

    const path = 'more.quick_draw_shortcut'
    await wrapper.get(`[data-testid="batch-include-${path}"]`).setValue(true)

    const box = wrapper.get(`[data-testid="setting-${path}"]`)
    await box.trigger('click')
    await box.trigger('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, altKey: true })

    
    
    expect(box.text()).toContain('Ctrl+Alt+A')

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()
    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_A, {
      [path]: 'Ctrl+Alt+A',
    })
  })

  it('快捷键项：在录制框里按退格清空 = 明确清空，下发的是空串', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-more"]').trigger('click')

    const path = 'more.quick_draw_shortcut'
    await wrapper.get(`[data-testid="batch-include-${path}"]`).setValue(true)

    const box = wrapper.get(`[data-testid="setting-${path}"]`)
    await box.trigger('click')
    await box.trigger('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, altKey: true })
    expect(box.text()).toContain('Ctrl+Alt+A')

    
    await box.trigger('click')
    await box.trigger('keydown', { key: 'Backspace', code: 'Backspace' })
    expect(box.text()).not.toContain('Ctrl+Alt+A')
    expect(wrapper.get(`[data-testid="batch-summary-${path}"]`).text()).toContain('空值（清空）')

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()
    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_A, { [path]: '' })
  })

  it('文本项：清空是"要下发一个空值"，不是"还没填"', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')

    await wrapper.get('[data-testid="batch-include-roll_call.reminder_text"]').setValue(true)
    const input = wrapper.get('[data-testid="setting-roll_call.reminder_text"]')
    await input.setValue('请上台')

    expect(wrapper.get('[data-testid="batch-summary-roll_call.reminder_text"]').text()).toContain(
      '请上台',
    )

    
    
    await input.setValue('')

    expect(wrapper.find('[data-testid="batch-config-problems"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="batch-summary-roll_call.reminder_text"]').text()).toContain(
      '空值（清空）',
    )

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_A, {
      'roll_call.reminder_text': '',
    })
  })

  it('数字框被清空 → 退回"还没填值"，而不是把上一次的数字留着发出去', async () => {
    const wrapper = await mountView()
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')

    await wrapper.get('[data-testid="batch-include-roll_call.font_size"]').setValue(true)
    const input = wrapper.get('[data-testid="setting-roll_call.font_size"]')
    await input.setValue('40')
    expect(wrapper.get('[data-testid="batch-config-count"]').text()).toContain('待下发 1 项')

    await input.setValue('')

    
    expect(wrapper.get('[data-testid="batch-config-problems"]').text()).toContain('没有填值')
    expect(wrapper.find('[data-testid="batch-config-summary-empty"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeDefined()
  })

  it('全部成功后清掉草稿：同一份配置不会被连点两次重复下发', async () => {
    const wrapper = await mountView()
    await pickThemeMode(wrapper)

    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="batch-config-count"]').text()).toContain('还没有选择')
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeDefined()
    
    expect(wrapper.find('[data-testid="batch-config-result"]').exists()).toBe(true)
  })

  it('有机器失败时保留草稿：那几台正是要重试的', async () => {
    const wrapper = await mountView({
      nodes: `${NODE_A},${NODE_B}`,
      list: [
        node(NODE_A, [NodeCapability.SettingsWrite]),
        node(NODE_B, [NodeCapability.SettingsWrite]),
      ],
    })
    await pickThemeMode(wrapper)

    vi.mocked(api.patchSettings)
      .mockResolvedValueOnce(command())
      .mockRejectedValueOnce(new ApiError('insufficient_role', 403))

    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="batch-config-count"]').text()).toContain('待下发 1 项')
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeUndefined()
  })

  it('换组时清掉草稿并重拉节点列表：上一组的取值不能配着这一组的 id 发出去', async () => {
    const wrapper = await mountView()
    await pickThemeMode(wrapper)
    expect(api.listNodes).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ groupId: GROUP_ID_2, nodes: NODE_A })
    await flushPromises()

    expect(wrapper.get('[data-testid="batch-config-count"]').text()).toContain('还没有选择')
    expect(api.listNodes).toHaveBeenCalledTimes(2)
  })

  it('换组后，上一组晚到的节点列表不会覆盖这一组的清单', async () => {
    const wrapper = await mountView({ deferredList: true })
    
    await wrapper.setProps({ groupId: GROUP_ID_2, nodes: NODE_A })
    await flushPromises()
    expect(wrapper.find(`[data-testid="batch-config-target-${NODE_A}"]`).exists()).toBe(true)

    
    
    finishPendingList([])
    await flushPromises()

    expect(wrapper.find('[data-testid="batch-config-unknown-nodes"]').exists()).toBe(false)
    expect(wrapper.find(`[data-testid="batch-config-target-${NODE_A}"]`).exists()).toBe(true)
  })

  it('URL 里重复的节点 id 去重：同一台机器只发一条命令', async () => {
    const wrapper = await mountView({ nodes: `${NODE_A},${NODE_A}` })

    expect(wrapper.findAll('[data-testid^="batch-config-target-"]')).toHaveLength(1)

    await pickThemeMode(wrapper)
    vi.mocked(api.patchSettings).mockResolvedValue(command())
    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    expect(api.patchSettings).toHaveBeenCalledTimes(1)
  })

  it('清空选择把草稿全丢掉', async () => {
    const wrapper = await mountView()
    await pickThemeMode(wrapper)

    await wrapper.get('[data-testid="batch-config-clear"]').trigger('click')

    expect(wrapper.get('[data-testid="batch-config-count"]').text()).toContain('还没有选择')
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeDefined()
  })

  it('管理员以下：说明原因，且整页控件锁住（不是只把「下发」按钮灰掉）', async () => {
    const wrapper = await mountView({ role: 'operator' })
    await wrapper.get('[data-testid="client-nav-floating_window"]').trigger('click')

    expect(wrapper.get('[data-testid="batch-config-admin-required"]').text()).toContain(
      '需要「管理员」及以上',
    )
    expect(wrapper.get('[data-testid="batch-config-submit"]').attributes('disabled')).toBeDefined()

    
    
    expect(
      wrapper.get('[data-testid="batch-row-floating_window.floating_window_placement"] [data-cn-select]').attributes('disabled'),
    ).toBeDefined()
    expect(
      wrapper
        .get('[data-testid="batch-include-floating_window.floating_window_opacity"]')
        .attributes('disabled'),
    ).toBeDefined()
    expect(
      wrapper
        .get('[data-testid="setting-floating_window.floating_window_opacity"]')
        .attributes('disabled'),
    ).toBeDefined()
  })

  it('没有选中任何节点时给出回组页的出口', async () => {
    const wrapper = await mountView({ nodes: '' })

    const empty = wrapper.get('[data-testid="batch-config-empty"]')
    expect(empty.text()).toContain('没有选中任何节点')
    expect(wrapper.find('[data-testid="batch-config-panel"]').exists()).toBe(false)
  })

  it('下发结果逐台给结论：失败的那台带上服务端的错误码文案', async () => {
    const wrapper = await mountView({
      nodes: `${NODE_A},${NODE_B}`,
      list: [
        node(NODE_A, [NodeCapability.SettingsWrite]),
        node(NODE_B, [NodeCapability.SettingsWrite]),
      ],
    })

    await pickThemeMode(wrapper)
    vi.mocked(api.patchSettings)
      .mockResolvedValueOnce(command())
      .mockRejectedValueOnce(new ApiError('insufficient_role', 403))

    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="batch-config-result-summary"]').text()).toContain('部分完成')
    expect(wrapper.get(`[data-testid="batch-config-result-${NODE_A}"]`).text()).toContain('已下发')
    expect(wrapper.get(`[data-testid="batch-config-result-${NODE_B}"]`).text()).toContain(
      '你的角色不足以执行这个操作',
    )
    expect(wrapper.get('[data-testid="batch-config-result-failed-ids"]').text()).toContain(NODE_B)
  })

  it('设备在回执里给了原因时，逐台把那句话显示出来', async () => {
    const wrapper = await mountView()
    await pickThemeMode(wrapper)

    vi.mocked(api.patchSettings).mockResolvedValue(
      command({
        result_detail: 'not_writable',
        result_context: { path: 'appearance.theme', writable_paths: ['voice.volume'] },
      }),
    )

    await wrapper.get('[data-testid="batch-config-submit"]').trigger('click')
    await flushPromises()

    const row = wrapper.get(`[data-testid="batch-config-result-${NODE_A}"]`)
    expect(row.text()).toContain('不允许远程修改')
    
    expect(row.text()).toContain('voice.volume')
  })
})
