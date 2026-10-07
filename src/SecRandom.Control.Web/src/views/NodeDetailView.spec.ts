import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import NodeDetailView from './NodeDetailView.vue'
import { selectValue, pickOption } from '@/components/client/fluent/client-select.test-utils'
import { api, ApiError } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { createAppI18n } from '@/i18n'
import type {
  CurrentUser,
  GroupRole,
  NodeCommandDto,
  NodeView,
  PrizeRosterPushRequest,
  RosterPushRequest,
} from '@/api/protocol'






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
      resetDraw: vi.fn(),
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
    capabilities: [
      'node.status.read',
      'draw.lock',
      'draw.trigger',
      'draw.reset',
      'media.play',
      'settings.read',
      'settings.write',
      'roster.read',
      'roster.write',
    ],
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


type TabId = 'overview' | 'settings' | 'roster' | 'commands'


type RosterKindId = 'students' | 'prizes'

interface Harness {
  wrapper: VueWrapper
  router: Router
}










async function mountView(
  role: GroupRole,
  nodes: NodeView[] = [nodeView()],
  options: { nodeId?: string } = {},
): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  vi.mocked(api.listNodes).mockResolvedValue(nodes)

  const session = useSessionStore(pinia)
  session.user = userWith(role)
  session.loaded = true

  const nodeId = options.nodeId ?? NODE_ID
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/console/groups/:groupId',
        name: 'console-group-detail',
        component: { template: '<div />' },
      },
      {
        path: '/console/groups/:groupId/nodes/:nodeId',
        name: 'console-node-detail',
        component: { template: '<div />' },
      },
    ],
  })
  await router.push(`/console/groups/${GROUP_ID}/nodes/${nodeId}`)
  await router.isReady()

  const wrapper = mount(NodeDetailView, {
    props: { groupId: GROUP_ID, nodeId, pollDelaysMs: [0] },
    global: { plugins: [pinia, createAppI18n('zh-CN'), router] },
  })

  await flushPromises()
  return { wrapper, router }
}


async function openTab(wrapper: VueWrapper, tab: TabId): Promise<void> {
  await wrapper.get(`[data-testid="tab-${tab}"]`).trigger('click')
  await flushPromises()
}










async function switchRosterKind(wrapper: VueWrapper, kind: RosterKindId): Promise<void> {
  await wrapper.get(`[data-testid="roster-kind-${kind}"]`).trigger('click')
  await settle()
}








async function settle(turns = 3): Promise<void> {
  for (let index = 0; index < turns; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
  }
}







async function openListPicker(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('[data-testid="roster-current-list"]').trigger('click')
  await flushPromises()
}


function listOptionIndex(wrapper: VueWrapper, name: string): number {
  const options = wrapper.findAll('[data-testid^="roster-list-option-"]')
  const index = options.findIndex((option) => option.text().includes(name))
  if (index < 0) throw new Error(`名单菜单里没有「${name}」`)
  return index
}


function listOptionText(wrapper: VueWrapper, name: string, badge: string): string {
  const index = listOptionIndex(wrapper, name)
  return wrapper.get(`[data-testid="roster-list-${badge}-${index}"]`).text()
}


function currentListText(wrapper: VueWrapper): string {
  return wrapper.get('[data-testid="roster-current-list"]').text()
}


async function openImportDrawer(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('[data-testid="roster-import"]').trigger('click')
  await flushPromises()
}


async function loadImportFile(wrapper: VueWrapper, file: File): Promise<void> {
  const input = wrapper.get('[data-testid="node-detail-roster-import-file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await settle()
}


function commandRows(wrapper: VueWrapper) {
  return wrapper.findAll('li[data-testid^="node-detail-command-"]')
}








async function broadcast(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('[data-testid="node-detail-announce-send"]').trigger('click')
  await flushPromises()
  await wrapper.get('[data-testid="broadcast-confirm"]').trigger('click')
  await settle()
}







async function triggerDraw(wrapper: VueWrapper): Promise<void> {
  const trigger = wrapper.get('[data-testid="node-detail-trigger"]')
  await trigger.trigger('click')
  await trigger.trigger('click')
  await settle()
}








async function queueDrawCommand(wrapper: VueWrapper, commandId = 'cmd_queued'): Promise<void> {
  vi.mocked(api.triggerDraw).mockResolvedValue(
    command({ command_id: commandId, status: 'queued' }),
  )
  vi.mocked(api.getCommand).mockImplementation(async (_groupId, id) =>
    command({ command_id: id, status: 'queued' }),
  )
  await triggerDraw(wrapper)
}


function commandRow(wrapper: VueWrapper, commandId: string) {
  return wrapper.get(`li[data-testid="node-detail-command-${commandId}"]`)
}


function revokeButton(wrapper: VueWrapper, commandId: string) {
  return commandRow(wrapper, commandId).find('[data-testid="node-detail-command-revoke"]')
}

beforeEach(() => {
  vi.mocked(api.listNodes).mockReset()
  vi.mocked(api.setDrawLock).mockReset()
  vi.mocked(api.triggerDraw).mockReset()
  vi.mocked(api.removeNode).mockReset()
  vi.mocked(api.playMedia).mockReset()
  vi.mocked(api.patchSettings).mockReset()
  vi.mocked(api.pushRoster).mockReset()
  vi.mocked(api.getCommand).mockReset()
  vi.mocked(api.revokeCommand).mockReset()
  vi.mocked(api.readSettings).mockReset()
  vi.mocked(api.readRoster).mockReset()
  vi.mocked(api.resetDraw).mockReset()
  
  
  
  vi.mocked(api.getCommand).mockImplementation(async (_groupId, commandId) =>
    command({ command_id: commandId, status: 'completed' }),
  )
})

describe('NodeDetailView 页头', () => {
  it('展示设备信息：ID、平台版本、在线与能力清单', async () => {
    const { wrapper } = await mountView('owner', [
      nodeView({ local_remote_allowed: false, draw_locked: true }),
    ])

    const text = wrapper.text()
    expect(text).toContain(NODE_ID)
    
    expect(text).toContain('3.1.2')
    expect(wrapper.get('[data-testid="node-detail-presence"]').text()).toBe('在线')
    
    expect(wrapper.get('[data-testid="node-detail-local-remote"]').text()).toContain('本机已禁用远控')
    expect(wrapper.get('[data-testid="node-detail-draw-locked"]').text()).toContain('禁止抽取中')
    
    expect(text).toContain('读取状态')
    expect(text).not.toContain('node.status.read')
  })

  



  it('页头在任何页签下都可见', async () => {
    const { wrapper } = await mountView('owner')

    for (const tab of ['overview', 'settings', 'roster', 'commands'] as TabId[]) {
      await openTab(wrapper, tab)
      expect(wrapper.find('[data-testid="node-detail-name"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="node-detail-presence"]').exists()).toBe(true)
      expect(wrapper.text()).toContain(NODE_ID)
      expect(wrapper.text()).toContain('读取状态')
    }
  })

  it('节点不在本组时给出结论，而不是一个空页面', async () => {
    const { wrapper } = await mountView('owner', [], { nodeId: 'node_gone' })

    const notFound = wrapper.get('[data-testid="node-detail-not-found"]')
    expect(notFound.text()).toContain('不在本组的节点列表里')
    expect(notFound.text()).toContain('node_gone')
  })
})

describe('NodeDetailView 页签', () => {
  it('四个功能页签都在，默认停在总览', async () => {
    const { wrapper } = await mountView('owner')

    expect(wrapper.get('[data-testid="tab-overview"]').text()).toBe('总览')
    expect(wrapper.get('[data-testid="tab-settings"]').text()).toBe('设置')
    
    expect(wrapper.get('[data-testid="tab-roster"]').text()).toBe('名单')
    expect(wrapper.get('[data-testid="tab-commands"]').text()).toBe('命令记录')
    expect(wrapper.find('[data-testid="tab-prizes"]').exists()).toBe(false)

    
    expect(wrapper.find('[data-testid="node-detail-lock"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="node-detail-summary"]').exists()).toBe(true)
  })

  it('切页签只换内容，已填的草稿与已加载的数据都还在', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    const { wrapper } = await mountView('admin')

    await openTab(wrapper, 'settings')
    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()
    await editCell(wrapper, 'setting-voice.volume', '60')

    await openTab(wrapper, 'roster')
    expect(wrapper.find('[data-testid="card-voice.volume"]').exists()).toBe(false)

    await openTab(wrapper, 'settings')
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()
    expect(
      (wrapper.get('[data-testid="setting-voice.volume"]').element as HTMLInputElement).value,
    ).toBe('60')

    
    expect(wrapper.text()).toContain(NODE_ID)
  })

  it('设备离线时页面照常可用：期望状态能下发，只是提示未投递', async () => {
    vi.mocked(api.setDrawLock).mockResolvedValue({
      node_id: NODE_ID,
      revision: 7,
      draw_locked: true,
      delivered: false,
    })
    const { wrapper } = await mountView('operator', [nodeView({ online: false })])

    expect(wrapper.get('[data-testid="node-detail-presence"]').text()).toBe('离线')

    await wrapper.get('[data-testid="node-detail-lock"]').trigger('click')
    await flushPromises()

    expect(api.setDrawLock).toHaveBeenCalledWith(GROUP_ID, NODE_ID, true)
    expect(wrapper.get('[data-testid="node-detail-desired"]').text()).toContain('设备离线，未投递')
  })

  it('viewer 看不到任何下发入口（服务端仍会拒，这只是界面裁剪）', async () => {
    const { wrapper } = await mountView('viewer')

    expect(wrapper.find('[data-testid="node-detail-lock"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="node-detail-trigger"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="node-detail-remove"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="node-detail-announce-send"]').exists()).toBe(false)
  })
})

describe('NodeDetailView 动作下发', () => {
  
  it('锁 / 解锁走期望状态，并展示 revision 与是否投递', async () => {
    vi.mocked(api.setDrawLock).mockResolvedValue({
      node_id: NODE_ID,
      revision: 1791121498024,
      draw_locked: true,
      delivered: true,
    })
    const { wrapper } = await mountView('operator')

    await wrapper.get('[data-testid="node-detail-lock"]').trigger('click')
    await flushPromises()

    expect(api.setDrawLock).toHaveBeenCalledWith(GROUP_ID, NODE_ID, true)
    const desired = wrapper.get('[data-testid="node-detail-desired"]')
    expect(desired.text()).toContain('1791121498024')
    expect(desired.text()).toContain('已投递到设备')
    
    expect(wrapper.get('[data-testid="node-detail-draw-locked"]').text()).toContain('禁止抽取中')
  })

  it('立即抽取必须二次确认：第一次点击只进入待确认', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ capability: 'draw.trigger' }))
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-trigger"]')
    await button.trigger('click')

    expect(api.triggerDraw).not.toHaveBeenCalled()
    expect(button.text()).toContain('确认抽取')

    await button.trigger('click')
    await flushPromises()

    expect(api.triggerDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID)
  })

  



  it('播报只下发 announce，并随后跟进回执', async () => {
    vi.mocked(api.playMedia).mockResolvedValue(command({ capability: 'media.play' }))
    const { wrapper } = await mountView('operator')

    expect(wrapper.find('[data-testid="node-detail-announce-send"]').exists()).toBe(true)

    await wrapper.get('[data-testid="node-detail-announce-text"]').setValue('请第一组上台')
    await broadcast(wrapper)

    expect(api.playMedia).toHaveBeenCalledWith(GROUP_ID, NODE_ID, 'announce', '请第一组上台', {
      show_quick_draw_window: false,
    })
    expect(api.getCommand).toHaveBeenCalledWith(GROUP_ID, 'cmd_1')
    expect(wrapper.get('[data-testid="node-detail-command-status"]').text()).toContain('执行完成')
  })

  it('空内容时播报按钮不可用，不会打服务端', async () => {
    const { wrapper } = await mountView('operator')

    expect(
      wrapper.get('[data-testid="node-detail-announce-send"]').attributes('disabled'),
    ).toBeDefined()
    expect(api.playMedia).not.toHaveBeenCalled()
  })

  it('没有声明能力的机器上按钮不可用', async () => {
    const { wrapper } = await mountView('operator', [
      nodeView({ capabilities: ['node.status.read'] }),
    ])

    expect(wrapper.get('[data-testid="node-detail-lock"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="node-detail-trigger"]').attributes('disabled')).toBeDefined()
    expect(
      wrapper.get('[data-testid="node-detail-announce-send"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('服务端拒绝时把错误码渲染成文案', async () => {
    vi.mocked(api.triggerDraw).mockRejectedValue(new ApiError('insufficient_role', 403))
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-trigger"]')
    await button.trigger('click')
    await button.trigger('click')
    await flushPromises()

    const feedback = wrapper.get('[data-testid="node-detail-feedback"]')
    expect(feedback.text()).toContain('失败')
    expect(feedback.text()).toContain('你的角色不足以执行这个操作')
  })

  it('移除节点后跳回组页签', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      vi.mocked(api.removeNode).mockResolvedValue(undefined)
      const { wrapper, router } = await mountView('admin')

      await wrapper.get('[data-testid="node-detail-remove"]').trigger('click')
      await flushPromises()

      expect(api.removeNode).toHaveBeenCalledWith(GROUP_ID, NODE_ID)
      expect(router.currentRoute.value.name).toBe('console-group-detail')
    } finally {
      confirmSpy.mockRestore()
    }
  })
})

describe('NodeDetailView 播报选项', () => {
  
  async function openBroadcast(wrapper: VueWrapper, text = '请第一组上台'): Promise<void> {
    await wrapper.get('[data-testid="node-detail-announce-text"]').setValue(text)
    await wrapper.get('[data-testid="node-detail-announce-send"]').trigger('click')
    await flushPromises()
  }

  it('点「播报」先开对话框，此时一条命令都没发出去', async () => {
    const { wrapper } = await mountView('operator')

    await openBroadcast(wrapper)

    expect(wrapper.find('[data-testid="broadcast-dialog"]').exists()).toBe(true)
    expect(api.playMedia).not.toHaveBeenCalled()
    
    expect(
      (wrapper.get('[data-testid="broadcast-quick-draw"]').element as HTMLInputElement).checked,
    ).toBe(false)
  })

  



  it('取消什么都不发', async () => {
    const { wrapper } = await mountView('operator')

    await openBroadcast(wrapper)
    await wrapper.get('[data-testid="broadcast-quick-draw"]').setValue(true)
    await wrapper.get('[data-testid="broadcast-cancel"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="broadcast-dialog"]').exists()).toBe(false)
    expect(api.playMedia).not.toHaveBeenCalled()
  })

  





  it('确认把选了的选项放进载荷；没动过的音量一个键都不带', async () => {
    vi.mocked(api.playMedia).mockResolvedValue(command({ capability: 'media.play' }))
    const { wrapper } = await mountView('operator')

    await openBroadcast(wrapper)
    await wrapper.get('[data-testid="broadcast-quick-draw"]').setValue(true)
    await wrapper.get('[data-testid="broadcast-system-set"]').trigger('click')
    await wrapper.get('[data-testid="broadcast-system-volume"]').setValue('30')
    await wrapper.get('[data-testid="broadcast-confirm"]').trigger('click')
    await settle()

    expect(api.playMedia).toHaveBeenCalledWith(GROUP_ID, NODE_ID, 'announce', '请第一组上台', {
      show_quick_draw_window: true,
      system_volume_percent: 30,
    })

    const options = vi.mocked(api.playMedia).mock.calls[0]?.[4]
    expect(options === undefined ? {} : 'voice_volume_percent' in options).toBe(false)
    
    expect(wrapper.find('[data-testid="broadcast-dialog"]').exists()).toBe(false)
  })

  it('两个音量都「不修改」时，载荷里只有闪抽窗口那一个开关', async () => {
    vi.mocked(api.playMedia).mockResolvedValue(command({ capability: 'media.play' }))
    const { wrapper } = await mountView('operator')

    await openBroadcast(wrapper)
    await wrapper.get('[data-testid="broadcast-confirm"]').trigger('click')
    await settle()

    expect(api.playMedia).toHaveBeenCalledWith(GROUP_ID, NODE_ID, 'announce', '请第一组上台', {
      show_quick_draw_window: false,
    })
  })
})

describe('NodeDetailView 命令回执', () => {
  it('轮询到终态就停，并展示结果', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'queued' }))
    vi.mocked(api.getCommand).mockResolvedValue(command({ status: 'completed' }))
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-trigger"]')
    await button.trigger('click')
    await button.trigger('click')
    
    
    await settle()

    
    expect(api.getCommand).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-testid="node-detail-command-status"]').text()).toContain('执行完成')
  })

  




  it('设备拒绝不可远程修改的设置时，给出可读的原因', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    vi.mocked(api.patchSettings).mockResolvedValue(
      command({ command_id: 'cmd_write', capability: 'settings.write', status: 'delivered' }),
    )
    mockSettingsWriteReply({
      command_id: 'cmd_write',
      capability: 'settings.write',
      status: 'rejected',
      result_detail: 'not_writable:security.password',
    })
    const { wrapper } = await mountView('admin')

    await openTab(wrapper, 'settings')
    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()
    await editCell(wrapper, 'setting-voice.volume', '60')
    await wrapper.get('[data-testid="settings-submit"]').trigger('click')
    await settle()

    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_ID, { 'voice.volume': 60 })

    
    await openTab(wrapper, 'commands')
    const row = wrapper.get('[data-testid="node-detail-command-cmd_write"]')
    expect(row.text()).toContain('security.password')
    expect(row.text()).toContain('不允许远程修改')
    
    expect(row.text()).toContain('桌面集成')
  })

  it('设备正在抽取时把 busy 翻成人话', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'delivered' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ status: 'rejected', result_detail: 'busy' }),
    )
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-trigger"]')
    await button.trigger('click')
    await button.trigger('click')
    await settle()

    expect(wrapper.get('[data-testid="node-detail-command-detail"]').text()).toContain('正在抽取')
  })

  




  it('media_disabled：说明语音总开关关着，并能一键打开后重播', async () => {
    vi.mocked(api.playMedia).mockResolvedValue(
      command({ command_id: 'cmd_media', capability: 'media.play', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockImplementation(async (_groupId, commandId) =>
      commandId === 'cmd_media'
        ? command({
            command_id: 'cmd_media',
            capability: 'media.play',
            status: 'rejected',
            result_detail: 'media_disabled',
            result_context: { voice_enable: false },
          })
        : command({ command_id: commandId, status: 'completed' }),
    )
    vi.mocked(api.patchSettings).mockResolvedValue(
      command({ command_id: 'cmd_voice', capability: 'settings.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('owner')

    await wrapper.get('[data-testid="node-detail-announce-text"]').setValue('请第一组上台')
    await broadcast(wrapper)

    const detail = wrapper.get('[data-testid="node-detail-command-detail"]')
    expect(detail.text()).toContain('语音总开关')
    expect(detail.text()).toContain('远程播报不会出声')

    const fix = wrapper.get('[data-testid="node-detail-voice-fix"]')
    expect(fix.text()).toContain('打开语音')
    await fix.trigger('click')
    await settle()

    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_ID, { 'voice.enable': true })
    
    
    expect(api.playMedia).toHaveBeenCalledTimes(2)
    expect(vi.mocked(api.playMedia).mock.calls[1]).toEqual([
      GROUP_ID,
      NODE_ID,
      'announce',
      '请第一组上台',
      { show_quick_draw_window: false },
    ])
  })

  it('media_disabled 但没有改设置的权限时，只说明修复需要什么权限', async () => {
    vi.mocked(api.playMedia).mockResolvedValue(
      command({ command_id: 'cmd_media', capability: 'media.play', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_media',
        capability: 'media.play',
        status: 'rejected',
        result_detail: 'media_disabled',
        result_context: { voice_enable: false },
      }),
    )
    const { wrapper } = await mountView('operator')

    await wrapper.get('[data-testid="node-detail-announce-text"]').setValue('请第一组上台')
    await broadcast(wrapper)

    expect(wrapper.find('[data-testid="node-detail-voice-fix"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="node-detail-voice-fix-hint"]').text()).toContain(
      '远程修改设置',
    )
  })

  it('text_too_long：把设备自己的长度上限显示出来', async () => {
    vi.mocked(api.playMedia).mockResolvedValue(
      command({ command_id: 'cmd_media', capability: 'media.play', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_media',
        capability: 'media.play',
        status: 'rejected',
        result_detail: 'text_too_long',
        result_context: { max_text_length: 60 },
      }),
    )
    const { wrapper } = await mountView('operator')

    await wrapper.get('[data-testid="node-detail-announce-text"]').setValue('很长的一句话')
    await broadcast(wrapper)

    expect(wrapper.get('[data-testid="node-detail-command-detail"]').text()).toContain('60')
  })

  it('capability_unsupported：说清被拒的能力，并列出设备支持的能力', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    
    
    
    vi.mocked(api.readSettings)
      .mockReset()
      .mockResolvedValueOnce(
        command({ command_id: 'cmd_read', capability: 'settings.read', status: 'delivered' }),
      )
      .mockRejectedValue(new Error('offline'))
    vi.mocked(api.patchSettings).mockResolvedValue(
      command({ command_id: 'cmd_write', capability: 'settings.write', status: 'delivered' }),
    )
    mockSettingsWriteReply({
      command_id: 'cmd_write',
      capability: 'settings.write',
      status: 'rejected',
      result_detail: 'capability_unsupported',
      result_context: { capability: 'settings.write', supported: ['node.status.read', 'draw.lock'] },
    })
    const { wrapper } = await mountView('admin')

    await openTab(wrapper, 'settings')
    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()
    await editCell(wrapper, 'setting-voice.volume', '60')
    await wrapper.get('[data-testid="settings-submit"]').trigger('click')
    await settle()
    await openTab(wrapper, 'overview')

    const detail = wrapper.get('[data-testid="node-detail-command-detail"]').text()
    
    expect(detail).toContain('修改设置')
    expect(detail).not.toContain('settings.write')
    
    expect(detail).toContain('读取状态')
    expect(detail).toContain('禁止 / 允许抽取')
  })

  it('local_remote_disabled：说清是设备自己关的，控制台改不了', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'delivered' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        status: 'rejected',
        result_detail: 'local_remote_disabled',
        result_context: { remote_control_enabled: false },
      }),
    )
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-trigger"]')
    await button.trigger('click')
    await button.trigger('click')
    await settle()

    const detail = wrapper.get('[data-testid="node-detail-command-detail"]').text()
    expect(detail).toContain('设备自己关的')
    expect(detail).toContain('控制台改不了')
  })

  it('not_writable：列出设备允许远程修改的路径', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'delivered' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        status: 'rejected',
        result_detail: 'not_writable',
        result_context: { path: 'security.password', writable_paths: ['voice.volume'] },
      }),
    )
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-trigger"]')
    await button.trigger('click')
    await button.trigger('click')
    await settle()

    const detail = wrapper.get('[data-testid="node-detail-command-detail"]').text()
    expect(detail).toContain('security.password')
    expect(detail).toContain('voice.volume')
  })

  it('认不出来的上下文绝不隐藏：保留原因码并折叠展示原始 JSON', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(command({ status: 'delivered' }))
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        status: 'rejected',
        result_detail: 'quantum_flux',
        result_context: { flux: 42 },
      }),
    )
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-trigger"]')
    await button.trigger('click')
    await button.trigger('click')
    await settle()

    const detail = wrapper.get('[data-testid="node-detail-command-detail"]')
    expect(detail.text()).toContain('quantum_flux')

    const raw = wrapper.get('[data-testid="node-detail-command-context"]')
    expect(raw.text()).toContain('flux')
    expect(raw.text()).toContain('42')
  })
})

describe('NodeDetailView 设置', () => {
  it('operator 只有说明，下发按钮是禁用的（admin 及以上）', async () => {
    const { wrapper } = await mountView('operator')
    await openTab(wrapper, 'settings')

    
    expect(wrapper.get('[data-testid="settings-submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="node-detail-settings-note"]').text()).toContain('管理员')
  })
})

describe('NodeDetailView 命令记录', () => {
  it('还没有下发过命令时给出空态', async () => {
    const { wrapper } = await mountView('operator')
    await openTab(wrapper, 'commands')

    expect(wrapper.get('[data-testid="node-detail-command-log-empty"]').text()).toContain(
      '还没有下发过命令',
    )
    expect(commandRows(wrapper)).toHaveLength(0)
  })

  it('记录本页会话下发的命令，最新在最前，且状态就地更新', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_first', status: 'queued' }),
    )
    vi.mocked(api.playMedia).mockResolvedValue(
      command({ command_id: 'cmd_second', capability: 'media.play', status: 'accepted' }),
    )
    vi.mocked(api.getCommand).mockImplementation(async (_groupId, commandId) =>
      command({
        command_id: commandId,
        capability: commandId === 'cmd_second' ? 'media.play' : 'draw.trigger',
        status: 'completed',
      }),
    )
    const { wrapper } = await mountView('operator')

    const trigger = wrapper.get('[data-testid="node-detail-trigger"]')
    await trigger.trigger('click')
    await trigger.trigger('click')
    await settle()

    await wrapper.get('[data-testid="node-detail-announce-text"]').setValue('请第一组上台')
    await broadcast(wrapper)

    await openTab(wrapper, 'commands')
    const rows = commandRows(wrapper)
    expect(rows).toHaveLength(2)
    
    expect(rows[0]!.text()).toContain('cmd_second')
    expect(rows[1]!.text()).toContain('cmd_first')
    
    expect(rows[1]!.text()).toContain('执行完成')
    
    expect(rows[0]!.find('button').exists()).toBe(false)
    
    expect(rows[0]!.text()).toContain('展示结果 / 播报')
  })

  it('设备拒绝过的命令在记录里也带着原因', async () => {
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_rejected', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_rejected',
        status: 'rejected',
        result_detail: 'busy',
      }),
    )
    const { wrapper } = await mountView('operator')

    const trigger = wrapper.get('[data-testid="node-detail-trigger"]')
    await trigger.trigger('click')
    await trigger.trigger('click')
    await settle()

    await openTab(wrapper, 'commands')
    const row = commandRows(wrapper)[0]!
    expect(row.text()).toContain('cmd_rejected')
    expect(row.text()).toContain('正在抽取')
  })
})












describe('NodeDetailView 撤销排队命令', () => {
  it('只有排队中的命令给撤销按钮，终态的命令都不给', async () => {
    vi.mocked(api.triggerDraw)
      .mockResolvedValueOnce(command({ command_id: 'cmd_queued', status: 'queued' }))
      .mockResolvedValueOnce(command({ command_id: 'cmd_completed', status: 'delivered' }))
      .mockResolvedValueOnce(command({ command_id: 'cmd_rejected', status: 'delivered' }))
    vi.mocked(api.getCommand).mockImplementation(async (_groupId, id) =>
      command({
        command_id: id,
        status: id === 'cmd_completed' ? 'completed' : id === 'cmd_rejected' ? 'rejected' : 'queued',
      }),
    )
    const { wrapper } = await mountView('operator')

    await triggerDraw(wrapper)
    await triggerDraw(wrapper)
    await triggerDraw(wrapper)
    await openTab(wrapper, 'commands')

    
    expect(commandRow(wrapper, 'cmd_queued').text()).toContain('排队中')
    expect(commandRow(wrapper, 'cmd_completed').text()).toContain('执行完成')
    expect(commandRow(wrapper, 'cmd_rejected').text()).toContain('设备拒绝了')

    expect(revokeButton(wrapper, 'cmd_queued').exists()).toBe(true)
    expect(revokeButton(wrapper, 'cmd_completed').exists()).toBe(false)
    expect(revokeButton(wrapper, 'cmd_rejected').exists()).toBe(false)
  })

  it('总览回执在排队时说明设备离线，并把撤销入口放在同一处', async () => {
    const { wrapper } = await mountView('operator')
    await queueDrawCommand(wrapper)

    
    
    const hint = wrapper.get('[data-testid="node-detail-queued-hint"]')
    expect(hint.text()).toContain('设备离线')
    expect(hint.text()).toContain('现在撤销')
    expect(wrapper.find('[data-testid="node-detail-overview-revoke"]').exists()).toBe(true)
  })

  it('撤销要点两次：第一次只进入待确认，第二次才真的 DELETE', async () => {
    vi.mocked(api.revokeCommand).mockResolvedValue(
      command({ command_id: 'cmd_queued', status: 'revoked' }),
    )
    const { wrapper } = await mountView('operator')
    await queueDrawCommand(wrapper)
    await openTab(wrapper, 'commands')

    await revokeButton(wrapper, 'cmd_queued').trigger('click')
    await flushPromises()

    
    expect(api.revokeCommand).not.toHaveBeenCalled()
    expect(revokeButton(wrapper, 'cmd_queued').text()).toContain('再点一次确认撤销')

    await revokeButton(wrapper, 'cmd_queued').trigger('click')
    await settle()

    expect(api.revokeCommand).toHaveBeenCalledWith(GROUP_ID, 'cmd_queued')

    
    const row = commandRow(wrapper, 'cmd_queued')
    expect(row.text()).toContain('已撤销')
    expect(revokeButton(wrapper, 'cmd_queued').exists()).toBe(false)
    expect(row.text()).toContain('设备上线后不会执行这条命令')
    
    
    expect(row.text()).not.toContain('还不认识')
    
    expect(row.find('span.rounded-full').classes()).toContain('text-warn')
  })

  it('服务端说 not_revocable 时给出原因，且不把状态本地改成已撤销', async () => {
    vi.mocked(api.revokeCommand).mockRejectedValue(new ApiError('not_revocable', 409))
    const { wrapper } = await mountView('operator')
    await queueDrawCommand(wrapper)
    await openTab(wrapper, 'commands')

    await revokeButton(wrapper, 'cmd_queued').trigger('click')
    await flushPromises()
    await revokeButton(wrapper, 'cmd_queued').trigger('click')
    await settle()

    const row = commandRow(wrapper, 'cmd_queued')
    
    expect(row.text()).toContain('来不及撤销')
    
    expect(row.text()).not.toContain('已撤销')
    expect(row.text()).toContain('排队中')
    expect(revokeButton(wrapper, 'cmd_queued').exists()).toBe(true)
  })
})






const SETTINGS_PAYLOAD = {
  categories: [
    {
      id: 'voice',
      fields: [
        { path: 'voice.enable', category: 'voice', type: 'bool', value: true, writable: true },
        {
          path: 'voice.volume',
          category: 'voice',
          type: 'int',
          value: 80,
          writable: true,
          min: 0,
          max: 100,
        },
        {
          
          
          path: 'voice.voice_engine',
          category: 'voice',
          type: 'int',
          value: 1,
          writable: true,
        },
        {
          path: 'voice.speech_rate',
          category: 'voice',
          type: 'int',
          value: 150,
          writable: false,
          min: 50,
          max: 200,
        },
      ],
    },
  ],
}







const SETTINGS_PAYLOAD_LABELLED = {
  categories: [
    {
      id: 'voice',
      label: '音声設定',
      description: '端末のスピーカー設定',
      fields: [
        {
          path: 'voice.volume',
          category: 'voice',
          type: 'int',
          value: 80,
          writable: true,
          min: 0,
          max: 100,
          label: '音量',
          description: '0 〜 100 の範囲',
        },
        {
          path: 'voice.speech_rate',
          category: 'voice',
          type: 'int',
          value: 150,
          writable: false,
          min: 50,
          max: 200,
          label: '話速',
        },
      ],
    },
  ],
}

const ROSTER_PAYLOAD_STUDENTS = {
  roster_kind: 'students',
  lists: [
    {
      name: '高一（1）班',
      is_default: true,
      count: 2,
      total: 2,
      truncated: false,
      members: [
        {
          id: '01',
          name: '张三',
          gender: '男',
          group: 'A',
          count: null,
          weight: null,
          enabled: true,
        },
        {
          id: '02',
          name: '李四',
          gender: null,
          group: null,
          count: null,
          weight: null,
          enabled: false,
        },
      ],
    },
    {
      name: '大名单',
      is_default: false,
      count: 2,
      total: 500,
      truncated: true,
      members: [
        {
          id: '99',
          name: '王五',
          gender: null,
          group: null,
          count: null,
          weight: null,
          enabled: true,
        },
      ],
    },
  ],
}

const ROSTER_PAYLOAD_PRIZES = {
  roster_kind: 'prizes',
  lists: [
    {
      name: '元旦奖池',
      is_default: true,
      count: 1,
      total: 1,
      truncated: false,
      members: [
        { id: 'p1', name: '一等奖', gender: null, group: null, count: 2, weight: 1, enabled: true },
      ],
    },
  ],
}


function mockRead(kind: 'settings' | 'roster', payload: unknown, commandId = 'cmd_read'): void {
  const issued = command({ command_id: commandId, status: 'delivered' })
  if (kind === 'settings') vi.mocked(api.readSettings).mockResolvedValue(issued)
  else vi.mocked(api.readRoster).mockResolvedValue(issued)

  vi.mocked(api.getCommand).mockResolvedValue(
    command({ command_id: commandId, status: 'completed', result_payload: payload }),
  )
}








function mockSettingsWriteReply(write: Partial<NodeCommandDto> & { command_id: string }): void {
  vi.mocked(api.getCommand).mockImplementation(async (_groupId, commandId) =>
    commandId === write.command_id
      ? command(write)
      : command({ command_id: commandId, status: 'completed', result_payload: SETTINGS_PAYLOAD }),
  )
}






describe('NodeDetailView 读设备设置', () => {
  




  it('打开就是客户端的整页结构，一次设备读取都不发，每一行都是「未读取」', async () => {
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    
    expect(wrapper.get('[data-testid="settings-page-title"]').text()).toBe('外观')
    expect(wrapper.get('[data-testid="client-nav-appearance"]').attributes('aria-selected')).toBe(
      'true',
    )
    
    for (const page of [
      'appearance',
      'floating_window',
      'timer',
      'linkage',
      'more',
      'default_draw',
      'roll_call',
      'quick_draw',
      'lottery',
      'voice',
      'notification',
    ]) {
      expect(wrapper.find(`[data-testid="client-nav-${page}"]`).exists()).toBe(true)
    }

    
    
    expect(wrapper.find('[data-testid="card-appearance.theme"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="setting-appearance.theme"]').exists()).toBe(true)
    
    
    const modeControl = wrapper.get('[data-testid="setting-appearance.theme"]')
    expect(selectValue(modeControl)).toBe('')
    expect(modeControl.attributes('disabled')).toBeDefined()

    
    
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')
    await settle()

    const group = wrapper.get('[data-testid="card-roll_call.override_display_settings"]')
    expect(
      group.find('[data-testid="card-roll_call.override_display_settings-chevron"]').exists(),
    ).toBe(true)
    expect(group.classes()).toContain('cn-expander--collapsed')
    
    
    expect(wrapper.find('[data-testid="nested-roll_call.use_global_font"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="setting-roll_call.use_global_font"]').exists()).toBe(true)

    
    await group.get('[data-testid="card-roll_call.override_display_settings-chevron"]').trigger('click')
    await flushPromises()
    expect(group.find('[data-testid="nested-roll_call.use_global_font"]').exists()).toBe(true)
    expect(group.find('[data-testid="setting-roll_call.use_global_font"]').exists()).toBe(true)

    
    expect(wrapper.find('[data-testid="setting-roll_call.draw_mode"]').exists()).toBe(true)
    expect(
      wrapper
        .get('[data-testid="card-roll_call.half_repeat"]')
        .find('[data-mark="unread"]')
        .exists(),
    ).toBe(true)

    
    expect(api.readSettings).not.toHaveBeenCalled()
  })

  it('读回来之后设备的值填进快照的行里，不可远程改的行禁用并标注', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    expect(api.readSettings).toHaveBeenCalledWith(
      GROUP_ID,
      NODE_ID,
      
      
      [
        'default_draw',
        'roll_call',
        'quick_draw',
        'lottery',
        'notification',
        'voice',
        'more',
        'appearance',
        'floating_window',
        'timer',
        'linkage',
      ],
      
      'zh-CN',
    )

    
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()

    const volume = wrapper.get('[data-testid="setting-voice.volume"]')
    expect(volume.attributes('type')).toBe('number')
    expect(volume.attributes('min')).toBe('0')
    expect(volume.attributes('max')).toBe('100')
    expect((volume.element as HTMLInputElement).value).toBe('80')
    expect(wrapper.get('[data-testid="card-voice.volume"]').text()).toContain('语音音量')
    
    expect(
      wrapper.get('[data-testid="card-voice.volume"]').find('[data-mark="unread"]').exists(),
    ).toBe(false)

    
    
    const engine = wrapper.get('[data-testid="setting-voice.voice_engine"]')
    expect(engine.element.tagName).toBe('BUTTON')
    expect(engine.text()).toContain('Edge TTS')

    const booleanField = wrapper.get('[data-testid="setting-voice.enable"]')
    expect(booleanField.attributes('type')).toBe('checkbox')
    expect(booleanField.attributes('disabled')).toBeUndefined()

    
    const locked = wrapper.get('[data-testid="setting-voice.speech_rate"]')
    expect(locked.attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="card-voice.speech_rate"]').classes()).toContain(
      'cn-expander--disabled',
    )
    expect(
      wrapper.get('[data-testid="card-voice.speech_rate"]').find('[data-mark="readonly"]').text(),
    ).toContain('不可远程修改')
  })

  




  it('设备开着覆盖时，那一组默认展开（与客户端的 IsExpanded 同一个口径）', async () => {
    mockRead('settings', {
      categories: [
        {
          id: 'roll_call',
          fields: [
            {
              path: 'roll_call.override_display_settings',
              category: 'roll_call',
              type: 'bool',
              value: true,
              writable: true,
            },
            {
              path: 'roll_call.use_global_font',
              category: 'roll_call',
              type: 'enum',
              value: 'Custom',
              writable: true,
              options: ['FollowGlobal', 'Custom'],
            },
            {
              path: 'roll_call.override_animation_settings',
              category: 'roll_call',
              type: 'bool',
              value: false,
              writable: true,
            },
          ],
        },
      ],
    })
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')
    
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')
    await settle()

    
    expect(wrapper.get('[data-testid="card-roll_call.override_display_settings"]').classes()).toContain(
      'cn-expander--collapsed',
    )

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    
    expect(
      wrapper.get('[data-testid="card-roll_call.override_display_settings"]').classes(),
    ).not.toContain('cn-expander--collapsed')
    expect(wrapper.find('[data-testid="nested-roll_call.use_global_font"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="card-roll_call.override_animation_settings"]').classes()).toContain(
      'cn-expander--collapsed',
    )
  })

  it('设备没报的那一项照样在版面上，标着「未读取」（一行都不会少）', async () => {    
    mockRead('settings', {
      categories: [
        {
          id: 'voice',
          fields: [
            {
              path: 'voice.volume',
              category: 'voice',
              type: 'int',
              value: 80,
              writable: true,
              min: 0,
              max: 100,
            },
          ],
        },
      ],
    })
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()

    expect((wrapper.get('[data-testid="setting-voice.volume"]').element as HTMLInputElement).value).toBe(
      '80',
    )
    
    expect(wrapper.find('[data-testid="card-voice.enable"]').exists()).toBe(true)
    expect(
      wrapper.get('[data-testid="card-voice.enable"]').find('[data-mark="unread"]').exists(),
    ).toBe(true)
    
    expect(
      wrapper.get('[data-testid="setting-voice.speech_rate"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('只下发改过且可写的字段，并在下发后重新读一次设备', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    vi.mocked(api.patchSettings).mockResolvedValue(
      command({ command_id: 'cmd_write', capability: 'settings.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()

    await editCell(wrapper, 'setting-voice.volume', '60')

    await wrapper.get('[data-testid="settings-submit"]').trigger('click')
    await settle()

    expect(api.patchSettings).toHaveBeenCalledWith(GROUP_ID, NODE_ID, { 'voice.volume': 60 })
    
    expect(api.readSettings).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="node-detail-settings-refreshed"]').exists()).toBe(true)
  })

  it('越界值不下发，当场说清是哪一项、允许什么范围', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()

    await editCell(wrapper, 'setting-voice.volume', '999')
    await wrapper.get('[data-testid="settings-submit"]').trigger('click')
    await settle()

    const problems = wrapper.get('[data-testid="node-detail-settings-read-problems"]').text()
    expect(problems).toContain('voice.volume')
    expect(problems).toContain('100')
    expect(api.patchSettings).not.toHaveBeenCalled()
  })

  





  it('设备多报了一个快照里没有的分类：页面照常渲染，不会崩', async () => {
    mockRead('settings', {
      categories: [
        ...SETTINGS_PAYLOAD.categories,
        {
          id: 'desktop_integration',
          fields: [
            {
              path: 'desktop_integration.autostart',
              category: 'desktop_integration',
              type: 'bool',
              value: false,
              writable: true,
            },
          ],
        },
      ],
    })
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    
    for (const page of [
      'appearance',
      'floating_window',
      'timer',
      'linkage',
      'more',
      'default_draw',
      'roll_call',
      'quick_draw',
      'lottery',
      'voice',
      'notification',
    ]) {
      expect(wrapper.find(`[data-testid="client-nav-${page}"]`).exists()).toBe(true)
    }
    expect(wrapper.find('[data-testid="client-nav-desktop_integration"]').exists()).toBe(false)
    
    expect(wrapper.get('[data-testid="settings-page-title"]').text()).toBe('外观')
  })

  it('设备没声明 settings.read 时读取点不动；角色不够时说清是角色问题', async () => {
    const noCapability = await mountView('owner', [
      nodeView({ capabilities: ['node.status.read', 'settings.write'] }),
    ])
    await openTab(noCapability.wrapper, 'settings')
    
    expect(
      noCapability.wrapper.get('[data-testid="settings-read"]').attributes('disabled'),
    ).toBeDefined()
    expect(noCapability.wrapper.get('[data-testid="settings-status"]').text()).toContain(
      '还不支持「读取设置」',
    )
    
    await noCapability.wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()
    expect(api.readSettings).not.toHaveBeenCalled()

    
    const viewer = await mountView('viewer')
    await openTab(viewer.wrapper, 'settings')
    expect(viewer.wrapper.get('[data-testid="settings-read"]').attributes('disabled')).toBeDefined()
    expect(viewer.wrapper.get('[data-testid="settings-status"]').text()).toContain(
      '「操作者」及以上',
    )
  })

  it('旧服务端没有 result_payload 时明确说读不到，而不是给一张空表', async () => {
    vi.mocked(api.readSettings).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'delivered' }),
    )
    
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed' }),
    )
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="node-detail-settings-read-unsupported"]').exists()).toBe(true)
    
    expect(wrapper.find('[data-testid="setting-appearance.theme"]').exists()).toBe(true)
  })

  






  it('读取进行中只有一句「正在读取…」，上一轮的结论不同屏', async () => {
    
    vi.mocked(api.readSettings).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', status: 'completed' }),
    )
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    
    expect(wrapper.text().match(/读不到设置/g)).toHaveLength(1)

    
    vi.mocked(api.readSettings).mockImplementation(() => new Promise(() => {}))
    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await flushPromises()

    
    expect(wrapper.text().match(/正在读取/g)).toHaveLength(1)
    expect(wrapper.text()).not.toContain('读不到设置')
  })

  it('设备拒绝读取时把原因一起显示出来', async () => {
    vi.mocked(api.readSettings).mockResolvedValue(
      command({ command_id: 'cmd_read', capability: 'settings.read', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_read',
        capability: 'settings.read',
        status: 'rejected',
        result_detail: 'capability_unsupported',
        result_context: {
          capability: 'settings.read',
          supported: ['node.status.read', 'draw.lock'],
        },
      }),
    )
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    const box = wrapper.get('[data-testid="node-detail-settings-read-unsupported"]').text()
    expect(box).toContain('读取设置')
    
    expect(wrapper.get('[data-testid="node-detail-settings-read-reason"]').text()).toContain(
      '本机没有声明这个能力',
    )
  })

  






  it('设备给了本机语言的名称与说明：行照旧在，标题仍取快照，值仍是设备的', async () => {
    mockRead('settings', SETTINGS_PAYLOAD_LABELLED)
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()

    const volumeCard = wrapper.get('[data-testid="card-voice.volume"]')
    expect(volumeCard.text()).toContain('语音音量')
    expect(
      (wrapper.get('[data-testid="setting-voice.volume"]').element as HTMLInputElement).value,
    ).toBe('80')
    expect(volumeCard.find('[data-mark="readonly"]').exists()).toBe(false)

    
    expect(wrapper.get('[data-testid="setting-voice.speech_rate"]').attributes('disabled')).toBeDefined()
    expect(
      wrapper.get('[data-testid="card-voice.speech_rate"]').find('[data-mark="readonly"]').text(),
    ).toContain('不可远程修改')
  })

  
  it('改过的行挂上「待下发」标记，下发按钮上带着项数', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    vi.mocked(api.patchSettings).mockResolvedValue(
      command({ command_id: 'cmd_write', capability: 'settings.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="settings-dirty-count"]').text()).toContain('还没有改动')
    expect(
      wrapper.get('[data-testid="card-voice.volume"]').find('[data-mark="dirty"]').exists(),
    ).toBe(false)

    await editCell(wrapper, 'setting-voice.volume', '60')

    expect(
      wrapper.get('[data-testid="card-voice.volume"]').find('[data-mark="dirty"]').exists(),
    ).toBe(true)
    expect(wrapper.get('[data-testid="settings-dirty-count"]').text()).toContain('待下发 1 项')
    
    expect(
      wrapper.get('[data-testid="card-voice.enable"]').find('[data-mark="dirty"]').exists(),
    ).toBe(false)
    
    expect(wrapper.get('[data-testid="setting-voice.speech_rate"]').attributes('disabled')).toBeDefined()

    
    await wrapper.get('[data-testid="settings-submit"]').trigger('click')
    await settle()
    expect(wrapper.get('[data-testid="settings-dirty-count"]').text()).toContain('还没有改动')
  })

  it('导航切到哪一页就画哪一页；换页不会把没下发的草稿丢掉', async () => {
    mockRead('settings', SETTINGS_PAYLOAD)
    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')

    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    
    expect(wrapper.get('[data-testid="settings-page-title"]').text()).toBe('外观')

    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="settings-page-title"]').text()).toBe('语音设置')
    expect(panelShown(wrapper, 'voice')).toBe(true)
    expect(panelShown(wrapper, 'roll_call')).toBe(false)

    await editCell(wrapper, 'setting-voice.volume', '60')
    expect(wrapper.get('[data-testid="settings-dirty-count"]').text()).toContain('待下发 1 项')

    
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="settings-page-title"]').text()).toBe('点名抽取设置')
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()

    expect(
      (wrapper.get('[data-testid="setting-voice.volume"]').element as HTMLInputElement).value,
    ).toBe('60')
    expect(wrapper.get('[data-testid="settings-dirty-count"]').text()).toContain('待下发 1 项')
  })
})








describe('NodeDetailView 设置回执超限', () => {
  it('设备回 payload_too_large 时按分类分批读回来并合并，且说明为什么慢', async () => {
    const categories = (SETTINGS_PAYLOAD.categories ?? []) as { id: string }[]

    vi.mocked(api.readSettings).mockImplementation((_groupId, _nodeId, requested) =>
      Promise.resolve(
        command({
          
          command_id: (requested?.length ?? 0) > 1 ? 'cmd_big' : `cmd_${requested?.[0] ?? 'none'}`,
          status: 'delivered',
        }),
      ),
    )
    vi.mocked(api.getCommand).mockImplementation((_groupId, commandId) =>
      Promise.resolve(
        commandId === 'cmd_big'
          ? command({ command_id: commandId, status: 'rejected', result_detail: 'payload_too_large' })
          : command({
              command_id: commandId,
              status: 'completed',
              result_payload: {
                categories: categories.filter((category) => `cmd_${category.id}` === commandId),
              },
            }),
      ),
    )

    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')
    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    
    await settle(16)

    
    expect(vi.mocked(api.readSettings).mock.calls).toHaveLength(12)
    expect(vi.mocked(api.readSettings).mock.calls.map((call) => call[2])).toEqual([
      [
        'default_draw',
        'roll_call',
        'quick_draw',
        'lottery',
        'notification',
        'voice',
        'more',
        'appearance',
        'floating_window',
        'timer',
        'linkage',
      ],
      ['default_draw'],
      ['roll_call'],
      ['quick_draw'],
      ['lottery'],
      ['notification'],
      ['voice'],
      ['more'],
      ['appearance'],
      ['floating_window'],
      ['timer'],
      ['linkage'],
    ])

    expect(wrapper.find('[data-testid="node-detail-settings-batched"]').exists()).toBe(true)
    
    await wrapper.get('[data-testid="client-nav-voice"]').trigger('click')
    await flushPromises()
    expect(
      (wrapper.get('[data-testid="setting-voice.volume"]').element as HTMLInputElement).value,
    ).toBe('80')
    
    await wrapper.get('[data-testid="client-nav-roll_call"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="card-roll_call.draw_mode"]').exists()).toBe(true)
  })

  it('连单个分类都读不回来时说"设置太多"，而不是说成没有读通道', async () => {
    vi.mocked(api.readSettings).mockResolvedValue(
      command({ command_id: 'cmd_big', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_big', status: 'rejected', result_detail: 'payload_too_large' }),
    )

    const { wrapper } = await mountView('owner')
    await openTab(wrapper, 'settings')
    await wrapper.get('[data-testid="settings-read"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="node-detail-settings-read-too-large"]').exists()).toBe(true)
    
    expect(vi.mocked(api.readSettings).mock.calls).toHaveLength(2)
  })
})

describe('NodeDetailView 读设备名单', () => {
  it('列出设备上的名单（人数 / 当前 / 截断），选中后展示成员表格', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    expect(api.readRoster).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      roster_kind: 'students',
      
      include_disabled: true,
    })

    
    expect(wrapper.get('[data-testid="roster-current-list"]').text()).toContain(
      '高一（1）班',
    )

    await openListPicker(wrapper)
    
    expect(listOptionText(wrapper, '高一（1）班', 'count')).toContain('2 人')
    expect(listOptionText(wrapper, '高一（1）班', 'default')).toContain('当前使用')
    
    expect(listOptionText(wrapper, '大名单', 'truncated')).toContain('已截断')

    
    const memberName = wrapper.get('[data-testid="roster-name-0"]')
    expect((memberName.element as HTMLInputElement).value).toBe('张三')
    
    expect(wrapper.get('[data-testid="roster-enabled-1"]').attributes('checked')).toBeUndefined()

    
    await wrapper
      .get(`[data-testid="roster-list-option-${listOptionIndex(wrapper, '大名单')}"]`)
      .trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="roster-truncated"]').text()).toContain('500')
    
    expect(wrapper.find('[data-testid="roster-list-menu"]').exists()).toBe(false)
    expect(currentListText(wrapper)).toContain('大名单')
  })

  



  it('命令栏是客户端那一套，表格列与学生列同序', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')
    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    for (const command of ['roster-refresh', 'roster-add', 'roster-import', 'roster-export', 'roster-submit']) {
      expect(wrapper.find(`[data-testid="${command}"]`).exists()).toBe(true)
    }
    expect(wrapper.get('[data-testid="roster-member-count"]').text()).toContain('2 人')

    
    const columns = wrapper
      .findAll('[data-testid^="roster-col-"]')
      .map((cell) => cell.attributes('data-testid')?.replace('roster-col-', ''))
    expect(columns).toEqual(['enabled', 'id', 'name', 'gender', 'group', 'tags', 'actions'])

    
    await switchRosterKind(wrapper, 'prizes')
    const prizeColumns = wrapper
      .findAll('[data-testid^="roster-col-"]')
      .map((cell) => cell.attributes('data-testid')?.replace('roster-col-', ''))
    expect(prizeColumns).toEqual(['enabled', 'id', 'name', 'count', 'weight', 'tags', 'actions'])
  })

  it('编辑草稿后下发：走 roster.write 的 students，并在下发后重读', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    await editCell(wrapper, 'roster-name-0', '张三丰')
    await editCell(wrapper, 'roster-enabled-1', 'true')
    await wrapper.get('[data-testid="roster-remove-1"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.pushRoster).mock.calls[0]?.[2] as RosterPushRequest | undefined
    expect(payload).toEqual({
      list_name: '高一（1）班',
      
      mode: 'merge',
      activate: false,
      students: [{ id: '01', name: '张三丰', gender: '男', group: 'A', enabled: true }],
    })
    expect(api.readRoster).toHaveBeenCalledTimes(2)
  })

  it('切到抽奖那一侧读的是奖池，下发带 roster_kind 与 prizes', async () => {
    mockRead('roster', ROSTER_PAYLOAD_PRIZES)
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')
    
    await switchRosterKind(wrapper, 'prizes')

    expect(api.readRoster).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      roster_kind: 'prizes',
      include_disabled: true,
    })

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    
    await editCell(wrapper, 'roster-count-0', '5')
    await editCell(wrapper, 'roster-weight-0', '2.5')
    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.pushRoster).mock.calls[0]?.[2] as
      | PrizeRosterPushRequest
      | undefined
    expect(payload?.roster_kind).toBe('prizes')
    expect(payload?.list_name).toBe('元旦奖池')
    expect(payload?.prizes).toEqual([
      { id: 'p1', name: '一等奖', count: 5, weight: 2.5, enabled: true },
    ])
  })

  



  it('从 CSV 文件导入名单草稿：确认之后才替换草稿', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    await openImportDrawer(wrapper)
    expect(wrapper.find('[data-testid="node-detail-roster-import-drawer"]').exists()).toBe(true)

    await loadImportFile(
      wrapper,
      new File(
        ['id,name,gender,group,tags\n07,赵六,女,C,\n08,钱七,男,D,组长\n'],
        'students.csv',
        { type: 'text/csv' },
      ),
    )

    
    expect(wrapper.get('[data-testid="node-detail-roster-import-preview"]').text()).toContain('赵六')
    
    expect(
      (wrapper.get('[data-testid="roster-name-0"]').element as HTMLInputElement)
        .value,
    ).toBe('张三')

    await wrapper.get('[data-testid="node-detail-roster-import-confirm"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="node-detail-roster-import-drawer"]').exists()).toBe(false)
    expect(
      (wrapper.get('[data-testid="roster-id-0"]').element as HTMLInputElement)
        .value,
    ).toBe('07')
    expect(
      (wrapper.get('[data-testid="roster-name-1"]').element as HTMLInputElement)
        .value,
    ).toBe('钱七')
    
    expect(wrapper.get('[data-testid="roster-enabled-0"]').attributes('checked')).toBeDefined()
    
    expect(api.pushRoster).not.toHaveBeenCalled()
  })

  





  it('导入之后下发：草稿就是文件里的成员，模式是整份覆盖', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    await openImportDrawer(wrapper)
    
    expect(wrapper.get('[data-testid="node-detail-roster-import-overwrite"]').text()).toBe(
      '整份覆盖（缺的人会被删除）',
    )

    await loadImportFile(
      wrapper,
      new File(
        ['id,name,gender,group,tags\n07,赵六,女,C,\n08,钱七,男,D,组长\n'],
        'students.csv',
        { type: 'text/csv' },
      ),
    )
    await wrapper.get('[data-testid="node-detail-roster-import-confirm"]').trigger('click')
    await flushPromises()

    
    expect(wrapper.find('[data-testid="roster-row-2"]').exists()).toBe(false)
    expect((wrapper.get('[data-testid="roster-id-0"]').element as HTMLInputElement).value).toBe('07')
    expect((wrapper.get('[data-testid="roster-name-1"]').element as HTMLInputElement).value).toBe(
      '钱七',
    )

    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.pushRoster).mock.calls[0]?.[2] as RosterPushRequest | undefined
    expect(payload?.list_name).toBe('高一（1）班')
    expect(payload?.mode).toBe('replace')
    expect(payload?.students).toEqual([
      { enabled: true, id: '07', name: '赵六', gender: '女', group: 'C' },
      { enabled: true, id: '08', name: '钱七', gender: '男', group: 'D', tags: ['组长'] },
    ])
  })

  




  it('选中的名单被截断时导入不整份覆盖：模式仍是只增改，截断提示还在', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    
    await openListPicker(wrapper)
    await wrapper
      .get(`[data-testid="roster-list-option-${listOptionIndex(wrapper, '大名单')}"]`)
      .trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="roster-truncated"]').text()).toContain('500')

    await openImportDrawer(wrapper)
    await loadImportFile(
      wrapper,
      new File(['id,name,gender,group\n07,赵六,女,C\n'], 'students.csv', { type: 'text/csv' }),
    )
    await wrapper.get('[data-testid="node-detail-roster-import-confirm"]').trigger('click')
    await flushPromises()

    
    expect((wrapper.get('[data-testid="roster-id-0"]').element as HTMLInputElement).value).toBe('07')
    
    expect(wrapper.get('[data-testid="roster-truncated"]').text()).toContain('500')

    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.pushRoster).mock.calls[0]?.[2] as RosterPushRequest | undefined
    expect(payload?.list_name).toBe('大名单')
    expect(payload?.mode).toBe('merge')
    expect(payload?.students).toEqual([
      { enabled: true, id: '07', name: '赵六', gender: '女', group: 'C' },
    ])
  })

  




  it('覆盖只对那一次导入生效：之后再下发仍是默认的只增改', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    await openImportDrawer(wrapper)
    await loadImportFile(wrapper, new File(['id,name\n07,赵六\n'], 'students.csv', { type: 'text/csv' }))
    await wrapper.get('[data-testid="node-detail-roster-import-confirm"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()
    expect(
      (vi.mocked(api.pushRoster).mock.calls[0]?.[2] as RosterPushRequest | undefined)?.mode,
    ).toBe('replace')

    
    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()
    expect(
      (vi.mocked(api.pushRoster).mock.calls[1]?.[2] as RosterPushRequest | undefined)?.mode,
    ).toBe('merge')
  })

  it('导入不认识的文件时给出提示，不动草稿', async () => {
    mockRead('roster', ROSTER_PAYLOAD_STUDENTS)
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    await openImportDrawer(wrapper)
    await loadImportFile(wrapper, new File(['[{ "name": }]'], 'broken.json', { type: 'application/json' }))

    
    expect(wrapper.get('[data-testid="node-detail-roster-import-unreadable"]').text()).toContain(
      '读不出内容',
    )
    
    expect(
      (wrapper.get('[data-testid="roster-name-0"]').element as HTMLInputElement)
        .value,
    ).toBe('张三')
  })

  it('设备没声明 roster.read / 角色不够时读取点不动并说明原因', async () => {
    const noCapability = await mountView('admin', [
      nodeView({ capabilities: ['node.status.read', 'roster.write'] }),
    ])
    await openTab(noCapability.wrapper, 'roster')
    
    expect(
      noCapability.wrapper.get('[data-testid="roster-refresh"]').attributes('disabled'),
    ).toBeDefined()
    expect(noCapability.wrapper.get('[data-testid="roster-status"]').text()).toContain(
      '还不支持「读取名单」',
    )

    const operator = await mountView('operator')
    await openTab(operator.wrapper, 'roster')
    
    expect(operator.wrapper.get('[data-testid="roster-refresh"]').attributes('disabled')).toBeDefined()
    expect(operator.wrapper.get('[data-testid="roster-status"]').text()).toContain(
      '「管理员」及以上',
    )
  })

  it('旧服务端读不到名单时明确说明，而不是给一个空列表', async () => {
    vi.mocked(api.readRoster).mockResolvedValue(
      command({ command_id: 'cmd_read', capability: 'roster.read', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({ command_id: 'cmd_read', capability: 'roster.read', status: 'completed' }),
    )
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="node-detail-roster-read-unsupported"]').exists()).toBe(true)
    
    expect(wrapper.findAll('[data-testid^="roster-row-"]')).toHaveLength(0)
    expect(wrapper.find('[data-testid="roster-name-0"]').exists()).toBe(false)
    
    expect(wrapper.get('[data-testid="roster-submit"]').attributes('disabled')).toBeDefined()
  })

  it('没有读过时只有命令栏，没有任何可编辑的草稿', async () => {
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    expect(wrapper.find('[data-testid="roster-refresh"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-name-0"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="roster-submit"]').attributes('disabled')).toBeDefined()
  })
})







function mockRosterReadByKind(): void {
  vi.mocked(api.readRoster).mockImplementation(async (_groupId, _nodeId, payload) =>
    command({
      command_id: payload.roster_kind === 'prizes' ? 'cmd_prizes' : 'cmd_students',
      capability: 'roster.read',
      status: 'delivered',
    }),
  )
  vi.mocked(api.getCommand).mockImplementation(async (_groupId, commandId) =>
    command({
      command_id: commandId,
      capability: 'roster.read',
      status: 'completed',
      result_payload: commandId === 'cmd_prizes' ? ROSTER_PAYLOAD_PRIZES : ROSTER_PAYLOAD_STUDENTS,
    }),
  )
}

describe('NodeDetailView 名单页签的开关', () => {
  it('点名与抽奖是同一个页签里的两段开关，默认停在点名', async () => {
    mockRosterReadByKind()
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    
    expect(wrapper.get('[data-testid="roster-kind-students"]').text()).toBe('点名名单')
    expect(wrapper.get('[data-testid="roster-kind-prizes"]').text()).toBe('抽奖名单')
    expect(wrapper.get('[data-testid="roster-kind-students"]').attributes('aria-selected')).toBe(
      'true',
    )

    
    expect(wrapper.find('[data-testid="roster-col-gender"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-col-count"]').exists()).toBe(false)
  })

  it('切到抽奖会用 roster_kind=prizes 重读，切回点名不会把已读的那本重读', async () => {
    mockRosterReadByKind()
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()
    
    await openListPicker(wrapper)
    expect(listOptionIndex(wrapper, '高一（1）班')).toBeGreaterThanOrEqual(0)

    await switchRosterKind(wrapper, 'prizes')
    expect(api.readRoster).toHaveBeenCalledTimes(2)
    expect(vi.mocked(api.readRoster).mock.calls[1]?.[2]).toEqual({
      roster_kind: 'prizes',
      include_disabled: true,
    })
    
    expect(currentListText(wrapper)).toContain('元旦奖池')

    await switchRosterKind(wrapper, 'students')
    
    expect(api.readRoster).toHaveBeenCalledTimes(2)
    expect(currentListText(wrapper)).toContain('高一（1）班')
  })

  it('两侧各留一份未下发的草稿，切来切去都不会被冲掉', async () => {
    mockRosterReadByKind()
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()
    await editCell(wrapper, 'roster-name-0', '张三丰')
    await flushPromises()

    await switchRosterKind(wrapper, 'prizes')
    await editCell(wrapper, 'roster-count-0', '5')
    await flushPromises()

    await switchRosterKind(wrapper, 'students')
    expect(
      (wrapper.get('[data-testid="roster-name-0"]').element as HTMLInputElement)
        .value,
    ).toBe('张三丰')

    await switchRosterKind(wrapper, 'prizes')
    expect(
      (wrapper.get('[data-testid="roster-count-0"]').element as HTMLInputElement)
        .value,
    ).toBe('5')
  })

  it('点名那一侧下发的是 students，从头到尾不带 roster_kind', async () => {
    mockRosterReadByKind()
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.pushRoster).mock.calls[0]?.[2] as RosterPushRequest | undefined
    expect(payload?.list_name).toBe('高一（1）班')
    expect(payload?.students).toHaveLength(2)
    
    expect(payload).not.toHaveProperty('roster_kind')
    expect(payload).not.toHaveProperty('prizes')
  })
})






const ROSTER_PAYLOAD_TAGS = {
  roster_kind: 'students',
  lists: [
    {
      name: '高一（1）班',
      is_default: true,
      count: 3,
      total: 3,
      truncated: false,
      members: [
        {
          id: '01',
          name: '张三',
          gender: '男',
          group: 'A',
          count: null,
          weight: null,
          enabled: true,
          tags: ['班长', '数学课代表'],
        },
        { id: '02', name: '李四', gender: '女', group: 'A', count: null, weight: null, enabled: true },
        {
          id: '03',
          name: '王五',
          gender: '男',
          group: 'B',
          count: null,
          weight: null,
          enabled: true,
          tags: null,
        },
      ],
    },
  ],
}


function tagsValue(wrapper: VueWrapper, index: number): string {
  return (wrapper.get(`[data-testid="roster-tags-${index}"]`).element as HTMLInputElement).value
}








async function editCell(wrapper: VueWrapper, testId: string, value: string): Promise<void> {
  const input = wrapper.get(`[data-testid="${testId}"]`)
  await input.setValue(value)
  await input.trigger('change')
  await flushPromises()
}








function panelShown(wrapper: VueWrapper, pageId: string): boolean {
  return wrapper.get(`[data-testid="client-nav-${pageId}"]`).attributes('aria-selected') === 'true'
}

describe('NodeDetailView 名单表格（客户端列）', () => {
  
  async function readList(wrapper: VueWrapper, payload: unknown): Promise<void> {
    mockRead('roster', payload)
    await openTab(wrapper, 'roster')
    await wrapper.get('[data-testid="roster-refresh"]').trigger('click')
    await settle()
  }

  




  it('标签照三态显示；只有改过的那一行才带上 tags 下发', async () => {
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await readList(wrapper, ROSTER_PAYLOAD_TAGS)

    expect(tagsValue(wrapper, 0)).toBe('班长, 数学课代表')
    
    expect(tagsValue(wrapper, 1)).toBe('')
    expect(tagsValue(wrapper, 2)).toBe('')

    await editCell(wrapper, 'roster-tags-0', '班长, 体育')
    await flushPromises()

    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.pushRoster).mock.calls[0]?.[2] as RosterPushRequest | undefined
    expect(payload?.students[0]?.tags).toEqual(['班长', '体育'])
    
    expect(payload?.students[1]).not.toHaveProperty('tags')
    expect(payload?.students[2]).not.toHaveProperty('tags')
    
    expect(payload?.students[0]?.name).toBe('张三')
  })

  it('把标签格子清空 = 明确清空（下发 []），与「没动过」是两件事', async () => {
    vi.mocked(api.pushRoster).mockResolvedValue(
      command({ command_id: 'cmd_push', capability: 'roster.write', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await readList(wrapper, ROSTER_PAYLOAD_TAGS)

    await editCell(wrapper, 'roster-tags-0', '')
    await flushPromises()
    await wrapper.get('[data-testid="roster-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.pushRoster).mock.calls[0]?.[2] as RosterPushRequest | undefined
    
    expect(payload?.students[0]?.tags).toEqual([])
    
    expect(payload?.students[2]).not.toHaveProperty('tags')
  })

  







  it('导出当前草稿：表头与客户端列同序；空草稿时导出禁用并说明原因', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock')
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    })
    
    const clickSpy = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {})

    try {
      const { wrapper } = await mountView('admin')
      await readList(wrapper, ROSTER_PAYLOAD_STUDENTS)

      await wrapper.get('[data-testid="roster-export"]').trigger('click')
      await flushPromises()

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      const blob = createObjectURL.mock.calls[0]?.[0] as Blob
      const csv = await blob.text()
      expect(csv.split('\r\n')[0]).toBe('enabled,id,name,gender,group,tags')
      expect(csv).toContain('1,01,张三,男,A,')
      expect(wrapper.get('[data-testid="node-detail-roster-notice"]').text()).toContain('已导出 2 行')

      
      await wrapper.get('[data-testid="roster-remove-0"]').trigger('click')
      await flushPromises()
      await wrapper.get('[data-testid="roster-remove-0"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="roster-row-0"]').exists()).toBe(false)
      expect(wrapper.get('[data-testid="roster-export"]').attributes('disabled')).toBeDefined()
      expect(wrapper.get('[data-testid="roster-export"]').attributes('title')).toContain('没有内容')
      
      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(wrapper.get('[data-testid="node-detail-roster-notice"]').text()).not.toContain(
        '没有内容',
      )
    } finally {
      clickSpy.mockRestore()
    }
  })

  
  it('没读过设备时命令栏上的草稿操作不可用', async () => {
    const { wrapper } = await mountView('admin')
    await openTab(wrapper, 'roster')

    expect(wrapper.get('[data-testid="roster-add"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="roster-import"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="roster-export"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="roster-submit"]').attributes('disabled')).toBeDefined()
    
    expect(wrapper.get('[data-testid="roster-refresh"]').attributes('disabled')).toBeUndefined()
  })
})









describe('NodeDetailView 重置本轮', () => {
  it('operator 及以上看得到按钮，viewer 看不到（角色裁剪）', async () => {
    const owner = await mountView('owner')
    expect(owner.wrapper.find('[data-testid="node-detail-reset"]').exists()).toBe(true)

    const viewer = await mountView('viewer')
    expect(viewer.wrapper.find('[data-testid="node-detail-reset"]').exists()).toBe(false)
    
    expect(viewer.wrapper.find('[data-testid="node-detail-reset-panel"]').exists()).toBe(false)
  })

  it('设备没声明 draw.reset 时按钮置灰，并写明原因', async () => {
    const { wrapper } = await mountView('operator', [
      nodeView({ capabilities: ['node.status.read', 'draw.lock', 'draw.trigger'] }),
    ])

    const button = wrapper.get('[data-testid="node-detail-reset"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toContain('重置本轮')
    expect(wrapper.get('[data-testid="node-detail-reset-unsupported"]').text()).toContain('没有声明')
  })

  it('两步确认：第一次点击只进入待确认，再点一次才下发', async () => {
    vi.mocked(api.resetDraw).mockResolvedValue(
      command({ command_id: 'cmd_reset', capability: 'draw.reset', status: 'delivered' }),
    )
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-reset"]')
    await button.trigger('click')

    expect(api.resetDraw).not.toHaveBeenCalled()
    expect(button.text()).toContain('确认重置')

    await button.trigger('click')
    await settle()

    
    expect(api.resetDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID, 'roll_call', undefined)
  })

  it('换了对象就按新对象下发，且名单留空时说明只能重置默认名单', async () => {
    vi.mocked(api.resetDraw).mockResolvedValue(
      command({ command_id: 'cmd_reset', capability: 'draw.reset', status: 'delivered' }),
    )
    const { wrapper } = await mountView('operator')

    
    
    await pickOption(wrapper.get('[data-testid="node-detail-reset-target"]'), '抽奖')
    await flushPromises()

    
    expect(wrapper.get('[data-testid="node-detail-reset-list-hint"]').text()).toContain('名单')

    const button = wrapper.get('[data-testid="node-detail-reset"]')
    await button.trigger('click')
    await button.trigger('click')
    await settle()

    expect(api.resetDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID, 'lottery', undefined)
  })

  it('成功后显示清掉的条数，并说明历史未受影响', async () => {
    vi.mocked(api.resetDraw).mockResolvedValue(
      command({ command_id: 'cmd_reset', capability: 'draw.reset', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_reset',
        capability: 'draw.reset',
        status: 'completed',
        result_context: { target: 'roll_call', list_name: '高一（1）班', cleared: 12 },
      }),
    )
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-reset"]')
    await button.trigger('click')
    await button.trigger('click')
    await settle()

    const result = wrapper.get('[data-testid="node-detail-reset-result"]').text()
    expect(result).toContain('12')
    expect(result).toContain('历史记录不受影响')
  })

  it('设备正在抽取（busy）时用通用的回执解读说人话', async () => {
    vi.mocked(api.resetDraw).mockResolvedValue(
      command({ command_id: 'cmd_reset', capability: 'draw.reset', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_reset',
        capability: 'draw.reset',
        status: 'rejected',
        result_detail: 'busy',
      }),
    )
    const { wrapper } = await mountView('operator')

    const button = wrapper.get('[data-testid="node-detail-reset"]')
    await button.trigger('click')
    await button.trigger('click')
    await settle()

    expect(wrapper.get('[data-testid="node-detail-command-detail"]').text()).toContain('正在抽取')
  })

  it('invalid_value:target 与 list_name:not_found 在重置面板里单独说清', async () => {
    vi.mocked(api.resetDraw).mockResolvedValue(
      command({ command_id: 'cmd_reset', capability: 'draw.reset', status: 'delivered' }),
    )
    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_reset',
        capability: 'draw.reset',
        status: 'rejected',
        result_detail: 'invalid_value:target:unknown_target',
      }),
    )
    const first = await mountView('operator')
    const firstButton = first.wrapper.get('[data-testid="node-detail-reset"]')
    await firstButton.trigger('click')
    await firstButton.trigger('click')
    await settle()

    const failure = first.wrapper.get('[data-testid="node-detail-reset-failure"]').text()
    expect(failure).toContain('重置对象')
    expect(failure).toContain('unknown_target')

    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_reset',
        capability: 'draw.reset',
        status: 'rejected',
        result_detail: 'list_name:not_found',
      }),
    )
    const second = await mountView('operator')
    const secondButton = second.wrapper.get('[data-testid="node-detail-reset"]')
    await secondButton.trigger('click')
    await secondButton.trigger('click')
    await settle()

    expect(second.wrapper.get('[data-testid="node-detail-reset-failure"]').text()).toContain(
      '找不到这本名单',
    )
  })
})









const PRIZE_POOL_PAYLOAD = {
  roster_kind: 'prizes',
  lists: [
    {
      name: '元旦奖池',
      is_default: true,
      count: 1,
      total: 1,
      truncated: false,
      members: [
        { id: 'p1', name: '一等奖', gender: null, group: null, count: 2, weight: 1, enabled: true },
      ],
    },
  ],
}


function mockRosterRead(payload: unknown, commandId = 'cmd_roster'): void {
  vi.mocked(api.readRoster).mockResolvedValue(
    command({ command_id: commandId, capability: 'roster.read', status: 'delivered' }),
  )
  vi.mocked(api.getCommand).mockResolvedValue(
    command({
      command_id: commandId,
      capability: 'roster.read',
      status: 'completed',
      result_payload: payload,
    }),
  )
}


async function openDrawPanel(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('[data-testid="node-detail-draw-toggle"]').trigger('click')
  await flushPromises()
}

describe('NodeDetailView 立即抽取 · 抽奖池', () => {
  it('目标有三档；选抽奖后隐藏性别 / 分组并说明原因', async () => {
    const { wrapper } = await mountView('admin')
    await openDrawPanel(wrapper)

    expect(wrapper.find('[data-testid="node-detail-draw-scope-quick"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="node-detail-draw-scope-roll-call"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="node-detail-draw-scope-lottery"]').exists()).toBe(true)

    
    await wrapper.get('[data-testid="node-detail-draw-scope-roll-call"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="node-detail-draw-gender"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="node-detail-draw-group"]').exists()).toBe(true)

    
    await wrapper.get('[data-testid="node-detail-draw-scope-lottery"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="node-detail-draw-gender"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="node-detail-draw-group"]').exists()).toBe(false)
    
    expect(
      wrapper.get('[data-testid="node-detail-draw-conditions-unsupported"]').text(),
    ).toContain('不支持条件抽取')
    expect(wrapper.find('[data-testid="node-detail-draw-count"]').exists()).toBe(true)
  })

  it('抽奖读的是奖池（roster_kind=prizes），下发只带 target / list_name / count', async () => {
    mockRosterRead(PRIZE_POOL_PAYLOAD)
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openDrawPanel(wrapper)

    await wrapper.get('[data-testid="node-detail-draw-scope-lottery"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()

    
    expect(api.readRoster).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      roster_kind: 'prizes',
      include_disabled: true,
    })

    
    expect(selectValue(wrapper.get('[data-testid="node-detail-draw-list"]'))).toContain('元旦奖池')

    await wrapper.get('[data-testid="node-detail-draw-count"]').setValue('3')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    
    expect(api.triggerDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      target: 'lottery',
      list_name: '元旦奖池',
      count: 3,
    })
  })

  it('切换目标会清掉上一档的名单与条件（奖池名不能留在点名那一档）', async () => {
    mockRosterRead(PRIZE_POOL_PAYLOAD)
    const { wrapper } = await mountView('admin')
    await openDrawPanel(wrapper)

    await wrapper.get('[data-testid="node-detail-draw-scope-lottery"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()
    expect(selectValue(wrapper.get('[data-testid="node-detail-draw-list"]'))).toContain('元旦奖池')

    await wrapper.get('[data-testid="node-detail-draw-scope-roll-call"]').trigger('click')
    await flushPromises()

    
    
    expect(selectValue(wrapper.get('[data-testid="node-detail-draw-list"]'))).toContain('不指定')
  })

  it('设备回 invalid_value:gender:not_applicable 时给出人话', async () => {
    mockRosterRead(PRIZE_POOL_PAYLOAD)
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openDrawPanel(wrapper)

    await wrapper.get('[data-testid="node-detail-draw-scope-lottery"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()

    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_draw',
        capability: 'draw.trigger',
        status: 'rejected',
        result_detail: 'invalid_value:gender:not_applicable',
      }),
    )
    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    expect(wrapper.get('[data-testid="node-detail-draw-failure"]').text()).toContain('不接受性别')
  })

  it('设备说这台机器被锁着（draw_locked）时告诉用户去解锁', async () => {
    mockRosterRead(PRIZE_POOL_PAYLOAD)
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openDrawPanel(wrapper)

    await wrapper.get('[data-testid="node-detail-draw-scope-lottery"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()

    vi.mocked(api.getCommand).mockResolvedValue(
      command({
        command_id: 'cmd_draw',
        capability: 'draw.trigger',
        status: 'rejected',
        result_detail: 'draw_locked',
      }),
    )
    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    expect(wrapper.get('[data-testid="node-detail-draw-failure"]').text()).toContain('禁止抽取')
  })
})











const CONDITION_PRIZE_POOL = {
  roster_kind: 'prizes',
  lists: [
    {
      name: '期末奖品',
      is_default: true,
      count: 2,
      total: 2,
      truncated: false,
      members: [
        {
          id: 'p1',
          name: '铅笔',
          gender: null,
          group: null,
          count: 1,
          weight: 1,
          enabled: true,
          tags: ['文具'],
        },
        {
          id: 'p2',
          name: '故事书',
          gender: null,
          group: null,
          count: 1,
          weight: 1,
          enabled: true,
          tags: ['书籍', '文具'],
        },
      ],
    },
  ],
}


const CONDITION_STUDENT_LIST = {
  roster_kind: 'students',
  lists: [
    {
      name: '高一（1）班',
      is_default: true,
      count: 2,
      total: 2,
      truncated: false,
      members: [
        { id: '01', name: '张三', gender: '男', group: '第一组', count: null, weight: null, enabled: true },
        { id: '02', name: '李四', gender: '女', group: '第二组', count: null, weight: null, enabled: true },
      ],
    },
  ],
}


function nodeWithConditions(): NodeView {
  return nodeView({ capabilities: [...nodeView().capabilities, 'draw.trigger.conditions'] })
}


function mockConditionsReads(): void {
  vi.mocked(api.readRoster).mockImplementation(async (_groupId, _nodeId, payload) =>
    command({
      command_id: payload.roster_kind === 'prizes' ? 'cmd_prizes' : 'cmd_students',
      capability: 'roster.read',
      status: 'delivered',
    }),
  )
  vi.mocked(api.getCommand).mockImplementation(async (_groupId, commandId) =>
    command({
      command_id: commandId,
      capability: 'roster.read',
      status: 'completed',
      result_payload: commandId === 'cmd_students' ? CONDITION_STUDENT_LIST : CONDITION_PRIZE_POOL,
    }),
  )
}


async function openLotteryWithPools(wrapper: VueWrapper): Promise<void> {
  await openDrawPanel(wrapper)
  await wrapper.get('[data-testid="node-detail-draw-scope-lottery"]').trigger('click')
  await flushPromises()
  await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
  await settle()
}

describe('NodeDetailView 抽奖条件', () => {
  it('设备没声明能力：条件区只有一句说明，且不发 conditions', async () => {
    mockConditionsReads()
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin')
    await openLotteryWithPools(wrapper)

    expect(
      wrapper.get('[data-testid="node-detail-draw-conditions-unsupported"]').text(),
    ).toContain('不支持条件抽取')
    
    expect(wrapper.find('[data-testid="node-detail-draw-conditions-tags"]').exists()).toBe(false)
    expect(
      wrapper.find('[data-testid="node-detail-draw-condition-student-list"]').exists(),
    ).toBe(false)

    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    
    expect(api.triggerDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      target: 'lottery',
      list_name: '期末奖品',
      count: 1,
    })
  })

  it('声明了能力：标签来自已读回的奖池，选中后按 OR 语义进 conditions', async () => {
    mockConditionsReads()
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin', [nodeWithConditions()])
    await openLotteryWithPools(wrapper)

    
    expect(wrapper.find('[data-testid="node-detail-draw-condition-tag-文具"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="node-detail-draw-condition-tag-书籍"]').exists()).toBe(true)

    await wrapper.get('[data-testid="node-detail-draw-condition-tag-文具"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-condition-tag-书籍"]').trigger('click')
    await flushPromises()
    
    await wrapper.get('[data-testid="node-detail-draw-condition-tag-书籍"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    expect(api.triggerDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      target: 'lottery',
      list_name: '期末奖品',
      count: 1,
      conditions: { version: 1, prize_tags: ['文具'] },
    })
  })

  it('选了发放对象才显示性别 / 分组，并把三者一起放进 conditions', async () => {
    mockConditionsReads()
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin', [nodeWithConditions()])
    await openLotteryWithPools(wrapper)

    
    expect(wrapper.find('[data-testid="node-detail-draw-condition-gender"]').exists()).toBe(false)
    await wrapper.get('[data-testid="node-detail-draw-condition-read-students"]').trigger('click')
    await settle()

    
    expect(
      selectValue(wrapper.get('[data-testid="node-detail-draw-condition-student-list"]')),
    ).toContain('高一（1）班')

    
    await wrapper.get('[data-testid="node-detail-draw-condition-gender"]').trigger('click')
    await flushPromises()
    await pickOption(wrapper.get('[data-testid="node-detail-draw-condition-gender"]'), '男')
    await flushPromises()
    await pickOption(wrapper.get('[data-testid="node-detail-draw-condition-group"]'), '第一组')
    await flushPromises()

    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    expect(api.triggerDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      target: 'lottery',
      list_name: '期末奖品',
      count: 1,
      conditions: { version: 1, student_list: '高一（1）班', gender: '男', group: '第一组' },
    })
  })

  it('选了发放对象时回执说明照实写：回执里看不到发给了谁', async () => {
    mockConditionsReads()
    const { wrapper } = await mountView('admin', [nodeWithConditions()])
    await openLotteryWithPools(wrapper)
    await wrapper.get('[data-testid="node-detail-draw-condition-read-students"]').trigger('click')
    await settle()

    expect(wrapper.get('[data-testid="node-detail-draw-conditions-recipient-note"]').text()).toContain(
      '看不到发给了谁',
    )
  })

  it('没选任何条件时不发 conditions（老行为逐字保留）', async () => {
    mockConditionsReads()
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin', [nodeWithConditions()])
    await openLotteryWithPools(wrapper)

    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    expect(api.triggerDraw).toHaveBeenCalledWith(GROUP_ID, NODE_ID, {
      target: 'lottery',
      list_name: '期末奖品',
      count: 1,
    })
  })

  it('条件相关的失败码都翻成人话', async () => {
    mockConditionsReads()
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )

    const cases: { detail: string; expect: string }[] = [
      { detail: 'invalid_command:conditions:version_unsupported', expect: '不支持这个版本' },
      { detail: 'invalid_command:conditions:unsupported_field', expect: '不认识条件里的某个字段' },
      { detail: 'invalid_command:student_list:required', expect: '必须先选发放对象名单' },
      { detail: 'invalid_value:prize_tags:not_in_list', expect: '不在这个奖池里' },
      { detail: 'invalid_value:prize_tags:no_matching_member', expect: '没有可抽的对象' },
      { detail: 'invalid_value:student_list:not_found', expect: '找不到这个学生名单' },
      { detail: 'invalid_value:gender:not_in_list', expect: '不在该学生名单里' },
    ]

    for (const { detail, expect: expected } of cases) {
      vi.mocked(api.getCommand).mockResolvedValue(
        command({
          command_id: 'cmd_draw',
          capability: 'draw.trigger',
          status: 'rejected',
          result_detail: detail,
        }),
      )
      const { wrapper } = await mountView('admin', [nodeWithConditions()])
      await openLotteryWithPools(wrapper)
      await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
      await settle()

      expect(
        wrapper.get('[data-testid="node-detail-draw-failure"]').text(),
        `失败码 ${detail}`,
      ).toContain(expected)
    }
  })

  it('顶层 gender / group 对抽奖永远不发（not_applicable 旧路径仍在）', async () => {
    mockConditionsReads()
    vi.mocked(api.triggerDraw).mockResolvedValue(
      command({ command_id: 'cmd_draw', capability: 'draw.trigger', status: 'delivered' }),
    )
    const { wrapper } = await mountView('admin', [nodeWithConditions()])
    await openLotteryWithPools(wrapper)

    
    
    await wrapper.get('[data-testid="node-detail-draw-scope-roll-call"]').trigger('click')
    await flushPromises()
    
    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()
    await pickOption(wrapper.get('[data-testid="node-detail-draw-gender"]'), '男')
    await flushPromises()
    expect(selectValue(wrapper.get('[data-testid="node-detail-draw-gender"]'))).toContain('男')

    await wrapper.get('[data-testid="node-detail-draw-scope-lottery"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-draw-read-roster"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="node-detail-draw-submit"]').trigger('click')
    await settle()

    const payload = vi.mocked(api.triggerDraw).mock.calls[0]?.[2] as Record<string, unknown>
    expect(payload).toEqual({ target: 'lottery', list_name: '期末奖品', count: 1 })
    expect(payload['gender']).toBeUndefined()
    expect(payload['group']).toBeUndefined()
  })
})








