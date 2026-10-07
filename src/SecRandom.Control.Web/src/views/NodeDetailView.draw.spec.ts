import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import NodeDetailView from './NodeDetailView.vue'
import { api } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { createAppI18n } from '@/i18n'
import { pickOption, selectLabels, selectValue } from '@/components/client/fluent/client-select.test-utils'
import type { CurrentUser, DrawTriggerRequest, GroupRole, NodeCommandDto, NodeView } from '@/api/protocol'












vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      session: vi.fn(),
      listNodes: vi.fn(),
      setDrawLock: vi.fn(),
      triggerDraw: vi.fn(),
      removeNode: vi.fn(),
      playMedia: vi.fn(),
      patchSettings: vi.fn(),
      pushRoster: vi.fn(),
      getCommand: vi.fn(),
      revokeCommand: vi.fn(),
      readSettings: vi.fn(),
      readRoster: vi.fn(),
    },
  }
})

const GROUP_ID = 'grp_01ab30b332e6'
const NODE_ID = 'node_lab_1'
const SELF_ID = 'user_owner_1'

function userWith(role: GroupRole): CurrentUser {
  return {
    user_id: SELF_ID,
    display_name: '张老师',
    groups: [
      {
        group_id: GROUP_ID,
        name: '高一（1）班 · 教学楼301',
        owner_user_id: SELF_ID,
        created_at: '2026-03-12T00:00:00Z',
        role,
      },
    ],
  }
}

function nodeView(overrides: Partial<NodeView> = {}): NodeView {
  return {
    node_id: NODE_ID,
    group_id: GROUP_ID,
    platform: 'windows',
    version: 'v3.1.2',
    capabilities: ['node.status.read', 'draw.lock', 'draw.trigger', 'roster.read', 'roster.write'],
    local_remote_allowed: true,
    last_heartbeat_at: '2026-10-04T13:20:00Z',
    registered_at: '2026-10-04T13:00:00Z',
    online: true,
    draw_locked: false,
    ...overrides,
  }
}

function command(overrides: Partial<NodeCommandDto> = {}): NodeCommandDto {
  return {
    command_id: 'cmd_1',
    target_node_id: NODE_ID,
    capability: 'draw.trigger',
    kind: 'action',
    status: 'delivered',
    issued_at: '2026-10-04T13:20:00Z',
    expires_at: '2026-10-04T13:22:00Z',
    ...overrides,
  }
}


const ROSTER_PAYLOAD = {
  roster_kind: 'students',
  lists: [
    {
      name: '高一（1）班',
      is_default: true,
      count: 3,
      total: 3,
      truncated: false,
      members: [
        { id: '01', name: '张三', gender: '男', group: 'A组', count: null, weight: null, enabled: true },
        { id: '02', name: '李四', gender: '女', group: 'A组', count: null, weight: null, enabled: true },
        { id: '03', name: '王五', gender: '男', group: 'B组', count: null, weight: null, enabled: false },
      ],
    },
  ],
}

async function mountView(role: GroupRole = 'owner', nodes: NodeView[] = [nodeView()]): Promise<VueWrapper> {
  const pinia = createPinia()
  setActivePinia(pinia)

  vi.mocked(api.listNodes).mockResolvedValue(nodes)

  const session = useSessionStore(pinia)
  session.user = userWith(role)
  session.loaded = true

  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/console/groups/:groupId', name: 'console-group-detail', component: { template: '<div />' } },
      {
        path: '/console/groups/:groupId/nodes/:nodeId',
        name: 'console-node-detail',
        component: { template: '<div />' },
      },
    ],
  })
  await router.push(`/console/groups/${GROUP_ID}/nodes/${NODE_ID}`)
  await router.isReady()

  const wrapper = mount(NodeDetailView, {
    props: { groupId: GROUP_ID, nodeId: NODE_ID, pollDelaysMs: [0] },
    global: { plugins: [pinia, createAppI18n('zh-CN'), router] },
  })

  await flushPromises()
  return wrapper
}


async function settle(turns = 3): Promise<void> {
  for (let index = 0; index < turns; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
  }
}










async function readRoster(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('[data-testid="tab-roster"]').trigger('click')
  await flushPromises()
  await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
  await settle()
  await wrapper.get('[data-testid="tab-overview"]').trigger('click')
  await flushPromises()
  
  await openAdvanced(wrapper)
}


async function openAdvanced(wrapper: VueWrapper): Promise<void> {
  if (!wrapper.find('[data-testid="node-detail-draw-scope-quick"]').exists()) {
    await wrapper.get('[data-testid="node-detail-draw-toggle"]').trigger('click')
    await flushPromises()
  }
}


async function pickRollCallScope(wrapper: VueWrapper): Promise<void> {
  await openAdvanced(wrapper)
  await wrapper.get('[data-testid="node-detail-draw-scope-roll-call"]').trigger('click')
  await flushPromises()
}







async function optionTexts(wrapper: VueWrapper, testid: string): Promise<string[]> {
  const trigger = wrapper.get(`[data-testid="${testid}"]`)
  await trigger.trigger('click')
  const labels = selectLabels()
  
  
  await trigger.trigger('click')
  return labels
}







async function selectOption(wrapper: VueWrapper, testid: string, value: string): Promise<void> {
  const trigger = wrapper.get(`[data-testid="${testid}"]`)
  const labels = await optionTexts(wrapper, testid)
  const label = labels.find((text) => text === value || text.startsWith(value))
  if (label === undefined) {
    throw new Error(`${testid} 里没有「${value}」，只有：${labels.join(' / ')}`)
  }
  await pickOption(trigger, label)
  await flushPromises()
}

function drawCalls(): DrawTriggerRequest[] {
  return vi.mocked(api.triggerDraw).mock.calls.map((call) => call[2] ?? {})
}







enableAutoUnmount(afterEach)

beforeEach(() => {
  for (const method of [
    api.listNodes,
    api.setDrawLock,
    api.triggerDraw,
    api.removeNode,
    api.playMedia,
    api.patchSettings,
    api.pushRoster,
    api.getCommand,
    api.readSettings,
    api.readRoster,
  ]) {
    vi.mocked(method).mockReset()
  }

  
  vi.mocked(api.getCommand).mockImplementation(async (_groupId, commandId) =>
    command({ command_id: commandId, status: 'completed' }),
  )
})

describe('抽取设置的界面', () => {
  it('默认**收起**：只留标题、摘要与展开按钮，不占地方', async () => {
    const wrapper = await mountView()

    expect(wrapper.get('[data-testid="node-detail-draw-toggle"]').attributes('aria-expanded')).toBe('false')
    
    expect(wrapper.get('[data-testid="node-detail-draw-legend"]').text()).toBe('快抽（设备默认名单）')
    
    expect(wrapper.find('[data-testid="node-detail-draw-scope-quick"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="node-detail-draw-submit"]').exists()).toBe(false)
  })

  it('展开后是「快抽」：说清它不传任何参数（旧控制台那条命令）', async () => {
    const wrapper = await mountView()
    await openAdvanced(wrapper)

    expect(wrapper.get('[data-testid="node-detail-draw-toggle"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-testid="node-detail-draw-quick-note"]').text()).toContain('不传任何参数')
    
    expect(wrapper.find('[data-testid="node-detail-draw-list"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="node-detail-draw-submit"]').exists()).toBe(false)
  })

  it('摘要跟着选择走：切到点名并选好条件后，收起也看得见这次会怎么抽', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )

    const wrapper = await mountView()
    await readRoster(wrapper)
    await pickRollCallScope(wrapper)
    await selectOption(wrapper, 'node-detail-draw-list', '高一（1）班')
    await selectOption(wrapper, 'node-detail-draw-gender', '男')
    await wrapper.get('[data-testid="node-detail-draw-count"]').setValue('2')
    await flushPromises()

    
    await wrapper.get('[data-testid="node-detail-draw-toggle"]').trigger('click')
    await flushPromises()

    const legend = wrapper.get('[data-testid="node-detail-draw-legend"]').text()
    expect(legend).toContain('点名单')
    expect(legend).toContain('高一（1）班')
    expect(legend).toContain('男')
    expect(legend).toContain('2 人')
    expect(wrapper.find('[data-testid="node-detail-draw-submit"]').exists()).toBe(false)
  })

  it('切到「点名单」时给出发送按钮，并说清"还没读名单"该怎么走', async () => {
    const wrapper = await mountView()
    await pickRollCallScope(wrapper)

    expect(wrapper.find('[data-testid="node-detail-draw-submit"]').exists()).toBe(true)
    
    expect(wrapper.get('[data-testid="node-detail-draw-submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="node-detail-draw-submit"]').attributes('title')).toContain('名单')
  })

  it('条件与人数：取值从设备名单派生，绝不写死男/女与第一组', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )

    const wrapper = await mountView()
    await readRoster(wrapper)
    await pickRollCallScope(wrapper)
    await selectOption(wrapper, 'node-detail-draw-list', '高一（1）班')

    
    
    expect([...(await optionTexts(wrapper, 'node-detail-draw-gender'))].sort()).toEqual(['不限', '女', '男'].sort())
    
    expect([...(await optionTexts(wrapper, 'node-detail-draw-group'))].sort()).toEqual(['A组', 'B组', '不限'].sort())
    
    expect(await optionTexts(wrapper, 'node-detail-draw-list')).toEqual(['不指定（用设备当前的默认名单）', '高一（1）班（3 人）'])
  })

  it('本机预检：条件在这份名单里不成立时当场说清，不让用户点了才知道', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )

    const wrapper = await mountView()
    await readRoster(wrapper)
    await pickRollCallScope(wrapper)
    await selectOption(wrapper, 'node-detail-draw-list', '高一（1）班')

    
    await selectOption(wrapper, 'node-detail-draw-group', 'B组')

    const check = wrapper.get('[data-testid="node-detail-draw-check"]').text()
    expect(check).toContain('没有可抽取的人')
    expect(wrapper.get('[data-testid="node-detail-draw-submit"]').attributes('disabled')).toBeDefined()
  })

  it('人数超过符合条件的人数：说出实际有几个人', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )

    const wrapper = await mountView()
    await readRoster(wrapper)
    await pickRollCallScope(wrapper)
    await selectOption(wrapper, 'node-detail-draw-list', '高一（1）班')
    await selectOption(wrapper, 'node-detail-draw-group', 'A组')
    await wrapper.get('[data-testid="node-detail-draw-count"]').setValue('5')
    await flushPromises()

    
    expect(wrapper.get('[data-testid="node-detail-draw-check"]').text()).toContain('1–2')
  })
})

describe('下发抽取命令', () => {
  it('「立即抽取」仍然不带 payload（与旧控制台逐字一致）', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'completed' }))

    const wrapper = await mountView()
    
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await settle()

    expect(api.triggerDraw).toHaveBeenCalledTimes(1)
    expect(vi.mocked(api.triggerDraw).mock.calls[0]).toEqual([GROUP_ID, NODE_ID])
  })

  it('「点名单」把目标、名单、条件、人数一起发出去；空的键一个都不出现', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'completed' }))

    const wrapper = await mountView()
    await readRoster(wrapper)
    await pickRollCallScope(wrapper)
    await selectOption(wrapper, 'node-detail-draw-list', '高一（1）班')
    
    await wrapper.get('[data-testid="node-detail-draw-count"]').setValue('2')
    await flushPromises()

    
    const submit = wrapper.get('[data-testid="node-detail-draw-submit"]')
    expect(submit.attributes('disabled')).toBeUndefined()

    await submit.trigger('click')
    await settle()

    expect(drawCalls()).toEqual([{ target: 'roll_call', list_name: '高一（1）班', count: 2 }])
    
    expect('gender' in drawCalls()[0]!).toBe(false)
    expect('group' in drawCalls()[0]!).toBe(false)
  })

  it('选了性别条件时也照发（其余没选的条件仍然缺席）', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'completed' }))

    const wrapper = await mountView()
    await readRoster(wrapper)
    await pickRollCallScope(wrapper)
    await selectOption(wrapper, 'node-detail-draw-list', '高一（1）班')
    await selectOption(wrapper, 'node-detail-draw-gender', '男')
    await wrapper.get('[data-testid="node-detail-draw-count"]').setValue('1')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    expect(drawCalls()).toEqual([{ target: 'roll_call', list_name: '高一（1）班', gender: '男', count: 1 }])
    expect('group' in drawCalls()[0]!).toBe(false)
  })

  it('人数大于 1 也走「点名单」这条路：设备侧会开主窗口用点名页抽', async () => {
    
    
    
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'completed' }))

    const wrapper = await mountView()
    await readRoster(wrapper)
    await pickRollCallScope(wrapper)
    await selectOption(wrapper, 'node-detail-draw-list', '高一（1）班')
    
    
    await wrapper.get('[data-testid="node-detail-draw-count"]').setValue('2')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    expect(drawCalls()).toEqual([{ target: 'roll_call', list_name: '高一（1）班', count: 2 }])
  })
})

describe('在抽取设置里直接读名单', () => {
  it('入口就在设置里，读完自动选中设备当前在用的那份名单', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed', result_payload: ROSTER_PAYLOAD }),
    )

    const wrapper = await mountView()
    await pickRollCallScope(wrapper)

    
    expect(await optionTexts(wrapper, 'node-detail-draw-list')).toEqual(['不指定（用设备当前的默认名单）'])
    expect(wrapper.get('[data-testid="node-detail-draw-submit"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()

    
    expect(api.readRoster).toHaveBeenCalledTimes(1)
    expect(await optionTexts(wrapper, 'node-detail-draw-list')).toContain('高一（1）班（3 人）')
    
    expect(selectValue(wrapper.get('[data-testid="node-detail-draw-list"]'))).toBe('高一（1）班（3 人）')
    
    expect(wrapper.get('[data-testid="node-detail-draw-submit"]').attributes('disabled')).toBeUndefined()
  })

  it('读不到名单时说清"这台设备读不了"，而不是让按钮默默没反应', async () => {
    
    vi.mocked(api.readRoster).mockResolvedValue(command({ command_id: 'cmd_read' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed' }),
    )

    const wrapper = await mountView()
    await pickRollCallScope(wrapper)
    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()

    expect(wrapper.get('[data-testid="node-detail-draw-read-error"]').text()).toContain('读不到名单')
    
    expect(wrapper.get('[data-testid="node-detail-draw-submit"]').attributes('disabled')).toBeDefined()
  })

  it('读取中的按钮变成"正在读取"，避免连点两次', async () => {
    
    
    
    
    let resolveRead: (issued: NodeCommandDto) => void = () => {}
    const pendingRead = new Promise<NodeCommandDto>((resolve) => {
      resolveRead = resolve
    })
    vi.mocked(api.readRoster).mockReturnValue(pendingRead)

    const wrapper = await mountView()
    await pickRollCallScope(wrapper)
    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await flushPromises()

    const button = wrapper.get('[data-testid="node-detail-draw-read-roster"]')
    expect(button.text()).toContain('正在读取')
    expect(button.attributes('disabled')).toBeDefined()

    resolveRead(command({ command_id: 'cmd_read' }))
    await settle()
  })
})

describe('抽取回执', () => {
  it('设备回 draw_denied + no_candidate：说"名单里没有可抽取的人"', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'accepted' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        status: 'rejected',
        result_detail: 'draw_denied',
        result_context: { reason: 'no_candidate' },
      }),
    )

    const wrapper = await mountView()
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await settle()

    const detail = wrapper.get('[data-testid="node-detail-command-detail"]').text()
    
    expect(detail).not.toContain('还不认识')
    
    expect(detail).toContain('没有人')
  })

  it('设备回 draw_denied + blocked_by_class_time：说清是上课时间', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'accepted' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        status: 'rejected',
        result_detail: 'draw_denied',
        result_context: { reason: 'blocked_by_class_time' },
      }),
    )

    const wrapper = await mountView()
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await settle()

    expect(wrapper.get('[data-testid="node-detail-command-detail"]').text()).toContain('上课时间')
  })

  it('抽成功：把"抽到了谁"显示出来（这才是远程抽取的用途）', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'accepted' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        status: 'completed',
        result_context: {
          target: 'roll_call',
          list_name: '高一（1）班',
          count: 2,
          drawn: [
            { id: '01', name: '张三' },
            { id: '02', name: '李四' },
          ],
        },
      }),
    )

    const wrapper = await mountView()
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await settle()

    const result = wrapper.get('[data-testid="node-detail-draw-result"]')
    expect(wrapper.get('[data-testid="node-detail-draw-drawn"]').text()).toContain('01 张三 · 02 李四')
    expect(result.text()).toContain('高一（1）班')
    expect(result.text()).toContain('2')
  })

  it('设备回 invalid_value:gender:not_in_list：文案里带出控制台选的那个取值', async () => {
    
    
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ status: 'rejected', result_detail: 'draw_denied', result_context: { reason: 'no_candidate' } }),
    )

    const wrapper = await mountView()
    await pickRollCallScope(wrapper)
    await wrapper.get('[data-testid="node-detail-draw-count"]').setValue('1')
    await flushPromises()
    
    
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        status: 'rejected',
        result_detail: 'invalid_value:gender:not_in_list',
        result_context: { field: 'gender', why: 'not_in_list' },
      }),
    )
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await settle()

    const detail = wrapper.get('[data-testid="node-detail-command-detail"]').text()
    
    
    expect(detail).not.toContain('「」')
  })

  it('设备没带回抽取结果：说"设备没有带结果"，绝不假装抽到了空名单', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'completed' }))
    vi.mocked(api.getCommand).mockResolvedValue(command({ status: 'completed' }))

    const wrapper = await mountView()
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await wrapper.get('[data-testid="node-detail-trigger"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="node-detail-draw-result"]').exists()).toBe(false)
  })
})
