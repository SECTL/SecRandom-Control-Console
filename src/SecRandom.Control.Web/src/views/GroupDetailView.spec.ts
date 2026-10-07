import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import GroupDetailView from './GroupDetailView.vue'
import { api, ApiError } from '@/api/client'
import { NODE_REFRESH_INTERVAL_MS } from '@/composables/useAutoRefresh'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import { createAppI18n } from '@/i18n'
import zhCN from '@/i18n/locales/zh-CN'
import type {
  CurrentUser,
  GroupRole,
  MemberDto,
  NodeCommandDto,
  NodeView,
  TransferDto,
} from '@/api/protocol'





vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      session: vi.fn(),
      listMembers: vi.fn(),
      listNodes: vi.fn(),
      serverMeta: vi.fn(),
      listEnrollmentCodes: vi.fn(),
      createEnrollmentCode: vi.fn(),
      revokeEnrollmentCode: vi.fn(),
      issueNodeToken: vi.fn(),
      revokeNodeToken: vi.fn(),
      renameGroup: vi.fn(),
      
      deleteGroup: vi.fn(),
      
      setDrawLock: vi.fn(),
      triggerDraw: vi.fn(),
      removeNode: vi.fn(),
      playMedia: vi.fn(),
      
      patchSettings: vi.fn(),
      pushRoster: vi.fn(),
      getCommand: vi.fn(),
      
      pendingTransfer: vi.fn(),
      requestTransfer: vi.fn(),
      confirmTransfer: vi.fn(),
      rejectTransfer: vi.fn(),
    },
  }
})

const GROUP_ID = 'grp_01ab30b332e6'
const OWNER_ID = 'user_owner_1'

function userWith(
  role: GroupRole,
  ownerDisplayName: string | null | undefined,
): CurrentUser {
  return {
    user_id: OWNER_ID,
    display_name: '张老师',
    groups: [
      {
        group_id: GROUP_ID,
        name: '高一（1）班 · 教学楼301',
        owner_user_id: OWNER_ID,
        
        
        ...(ownerDisplayName === undefined ? {} : { owner_display_name: ownerDisplayName }),
        created_at: '2026-03-12T00:00:00Z',
        role,
      },
    ],
  }
}

function member(role: GroupRole, displayName?: string): MemberDto {
  return {
    user_id: OWNER_ID,
    ...(displayName === undefined ? {} : { display_name: displayName }),
    role,
    joined_at: '2026-03-12T00:00:00Z',
    is_self: true,
  }
}

interface Harness {
  wrapper: VueWrapper
  session: ReturnType<typeof useSessionStore>
  
  router: ReturnType<typeof createRouter>
}






async function mountView(
  user: CurrentUser,
  members: MemberDto[] = [],
  nodes: NodeView[] = [],
  options: { membershipEnabled?: boolean; nodeEnrollment?: boolean } = {},
): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  
  
  if (options.membershipEnabled === false) {
    const setup = useSetupStore(pinia)
    setup.loaded = true
    setup.status = {
      initialized: true,
      mode: 'local',
      display_name: '测试实例',
      membership_enabled: false,
      modes: [
        { id: 'local', display_name: '本地账号', available: true, requires_credentials: true },
      ],
    }
  }

  vi.mocked(api.listMembers).mockResolvedValue(members)
  vi.mocked(api.listNodes).mockResolvedValue(nodes)
  vi.mocked(api.listEnrollmentCodes).mockResolvedValue([])
  vi.mocked(api.serverMeta).mockResolvedValue({
    service: 'secrandom-control',
    protocol: '1',
    server_version: '0.1.0',
    status: 'ready',
    ...(options.nodeEnrollment === undefined ? {} : { node_enrollment: options.nodeEnrollment }),
  })
  
  vi.mocked(api.pendingTransfer).mockResolvedValue(null)

  const session = useSessionStore(pinia)
  session.user = user
  session.loaded = true

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
      
      { path: '/console/groups', name: 'console-groups', component: { template: '<div />' } },
    ],
  })
  await router.push(`/console/groups/${GROUP_ID}`)
  await router.isReady()

  const wrapper = mount(GroupDetailView, {
    props: { groupId: GROUP_ID },
    global: { plugins: [pinia, createAppI18n('zh-CN'), router] },
  })

  await flushPromises()
  return { wrapper, session, router }
}

describe('GroupDetailView 创建者展示', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.renameGroup).mockReset()
  })

  it('显示创建者的昵称，并把组 ID 单独标注', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    
    expect(wrapper.text()).toContain('你是 创建者')

    const owner = wrapper.get('[data-testid="group-owner"]')
    expect(owner.text()).toContain('创建者')
    expect(owner.text()).toContain('张老师')

    
    const heading = wrapper.text()
    expect(heading).toContain('组 ID')
    expect(heading).toContain(GROUP_ID)

    
    expect(owner.text()).not.toContain(GROUP_ID)
  })

  it('会话里没有昵称时，用成员表里的昵称兜底', async () => {
    const { wrapper } = await mountView(
      userWith('owner', null),
      [member('owner', '李老师')],
    )

    expect(wrapper.get('[data-testid="group-owner"]').text()).toContain('李老师')
  })

  it('昵称彻底缺失时显示 user_id —— 绝不拿组 ID 冒充人名', async () => {
    const { wrapper } = await mountView(userWith('admin', null), [])

    const owner = wrapper.get('[data-testid="group-owner"]')
    expect(owner.text()).toContain(OWNER_ID)
    expect(owner.text()).not.toContain(GROUP_ID)
  })
})

describe('GroupDetailView 重命名组', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.renameGroup).mockReset()
  })

  it('viewer 看不到重命名入口', async () => {
    const { wrapper } = await mountView(userWith('viewer', '张老师'))

    expect(wrapper.find('[data-testid="group-rename-open"]').exists()).toBe(false)
  })

  it('admin 打开对话框，名字预填当前组名', async () => {
    const { wrapper } = await mountView(userWith('admin', '张老师'))

    await wrapper.get('[data-testid="group-rename-open"]').trigger('click')

    const dialog = wrapper.get('[data-testid="rename-dialog"]')
    expect((dialog.get('[data-testid="rename-name"]').element as HTMLInputElement).value).toBe(
      '高一（1）班 · 教学楼301',
    )
  })

  it('保存后调用服务端，并用重新拉取的会话更新标题', async () => {
    const { wrapper, session } = await mountView(userWith('owner', '张老师'))

    const renamed = userWith('owner', '张老师')
    renamed.groups[0]!.name = '高一（2）班'
    
    vi.mocked(api.session).mockImplementation(async () => {
      session.user = renamed
      return renamed
    })
    vi.mocked(api.renameGroup).mockResolvedValue({
      ...renamed.groups[0]!,
      name: '高一（2）班',
    })

    await wrapper.get('[data-testid="group-rename-open"]').trigger('click')
    await wrapper.get('[data-testid="rename-name"]').setValue('  高一（2）班  ')
    await wrapper.get('[data-testid="rename-dialog"] form').trigger('submit')
    await flushPromises()

    expect(api.renameGroup).toHaveBeenCalledWith(GROUP_ID, '高一（2）班')
    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('高一（2）班')
  })

  it('空名字时提交按钮不可用，不会打服务端', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    await wrapper.get('[data-testid="group-rename-open"]').trigger('click')
    await wrapper.get('[data-testid="rename-name"]').setValue('   ')

    expect(
      wrapper.get('[data-testid="rename-submit"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('服务端拒绝时把错误码渲染成文案，对话框保持打开', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))
    vi.mocked(api.renameGroup).mockRejectedValue(new ApiError('invalid_group_name', 400))

    await wrapper.get('[data-testid="group-rename-open"]').trigger('click')
    await wrapper.get('[data-testid="rename-name"]').setValue('新名字')
    await wrapper.get('[data-testid="rename-dialog"] form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[data-testid="rename-error"]').text()).toContain('组名称不合法')
    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(true)
  })
})








describe('GroupDetailView 解散组', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.deleteGroup).mockReset()
  })

  
  function memberOf(role: GroupRole, selfId: string): CurrentUser {
    return {
      user_id: selfId,
      display_name: '李老师',
      groups: [
        {
          group_id: GROUP_ID,
          name: '高一（1）班 · 教学楼301',
          owner_user_id: OWNER_ID,
          created_at: '2026-03-12T00:00:00Z',
          role,
        },
      ],
    }
  }

  it('admin 看不到解散入口：只有创建者能解散', async () => {
    const { wrapper } = await mountView(memberOf('admin', 'user_admin_9'))

    
    expect(wrapper.find('[data-testid="group-danger-zone"]').exists()).toBe(false)
  })

  it('owner 看到危险区，打开对话框后提交按钮在组名输对之前不可用', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    await wrapper.get('[data-testid="group-delete-open"]').trigger('click')

    const dialog = wrapper.get('[data-testid="delete-dialog"]')
    
    expect(dialog.text()).toContain('高一（1）班 · 教学楼301')

    const submit = wrapper.get('[data-testid="delete-submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    
    await wrapper.get('[data-testid="delete-confirm-name"]').setValue('高一（1）班')
    expect(submit.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="delete-mismatch"]').exists()).toBe(true)

    await wrapper.get('[data-testid="delete-confirm-name"]').setValue('高一（1）班 · 教学楼301')
    expect(submit.attributes('disabled')).toBeUndefined()
  })

  it('输错组名时不会打服务端', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    await wrapper.get('[data-testid="group-delete-open"]').trigger('click')
    
    await wrapper.get('[data-testid="delete-confirm-name"]').setValue('别的组')
    await wrapper.get('[data-testid="delete-dialog"] form').trigger('submit')
    await flushPromises()

    expect(api.deleteGroup).not.toHaveBeenCalled()
  })

  it('输对组名后确认：调用服务端、重拉会话并跳回「我的组」', async () => {
    const { wrapper, session, router } = await mountView(userWith('owner', '张老师'))

    
    const afterDelete: CurrentUser = { user_id: OWNER_ID, display_name: '张老师', groups: [] }
    vi.mocked(api.session).mockImplementation(async () => {
      session.user = afterDelete
      return afterDelete
    })
    vi.mocked(api.deleteGroup).mockResolvedValue(undefined)

    await wrapper.get('[data-testid="group-delete-open"]').trigger('click')
    await wrapper.get('[data-testid="delete-confirm-name"]').setValue('高一（1）班 · 教学楼301')
    await wrapper.get('[data-testid="delete-dialog"] form').trigger('submit')
    await flushPromises()

    expect(api.deleteGroup).toHaveBeenCalledWith(GROUP_ID)
    expect(api.session).toHaveBeenCalled()
    
    expect(router.currentRoute.value.path).toBe('/console/groups')
  })

  it('组名两侧的空格不算输错（组名入库前已被 Trim）', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    await wrapper.get('[data-testid="group-delete-open"]').trigger('click')
    await wrapper.get('[data-testid="delete-confirm-name"]').setValue('  高一（1）班 · 教学楼301  ')

    expect(
      wrapper.get('[data-testid="delete-submit"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('组记录说我是创建者、成员角色却不是 owner 时，服务端拒绝的文案要显示出来', async () => {
    
    
    const { wrapper } = await mountView(userWith('admin', '张老师'))
    vi.mocked(api.deleteGroup).mockRejectedValue(new ApiError('insufficient_role', 403))

    await wrapper.get('[data-testid="group-delete-open"]').trigger('click')
    await wrapper.get('[data-testid="delete-confirm-name"]').setValue('高一（1）班 · 教学楼301')
    await wrapper.get('[data-testid="delete-dialog"] form').trigger('submit')
    await flushPromises()

    
    expect(wrapper.get('[data-testid="delete-error"]').text()).toContain('角色不足')
    
    expect(wrapper.find('[data-testid="delete-dialog"]').exists()).toBe(true)
  })
})

describe('GroupDetailView 节点页签', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.renameGroup).mockReset()
  })

  





  it('没有节点时只给空态，不画能力清单卡片', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    const text = wrapper.text()
    expect(text).not.toContain('按节点声明的能力裁剪')
    expect(text).not.toContain('是否允许被集控')
    expect(text).not.toContain('断网也生效')

    
    expect(text).not.toContain('能力清单：')

    
    
    expect(wrapper.get('[data-testid="tab-nodes"]').text()).toBe('节点')
    expect(text).toContain('还没有节点加入这个组')
  })
})

describe('GroupDetailView 转让创建者', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.renameGroup).mockReset()
    vi.mocked(api.pendingTransfer).mockReset()
  })

  
  function otherMember(role: GroupRole, selfId: string): CurrentUser {
    return {
      user_id: selfId,
      display_name: '李老师',
      groups: [
        {
          group_id: GROUP_ID,
          name: '高一（1）班 · 教学楼301',
          owner_user_id: OWNER_ID,
          created_at: '2026-03-12T00:00:00Z',
          role,
        },
      ],
    }
  }

  function pendingTransfer(overrides: Partial<TransferDto> = {}): TransferDto {
    return {
      transfer_id: 'tr_01',
      group_id: GROUP_ID,
      from_user_id: OWNER_ID,
      to_user_id: 'user_recipient_2',
      created_at: '2026-03-12T00:00:00Z',
      expires_at: '2026-03-14T00:00:00Z',
      status: 'pending',
      demoted_to: 'admin',
      ...overrides,
    }
  }

  




  it('受让方（非 owner）也能看到「接受 / 拒绝」', async () => {
    
    const { wrapper } = await mountView(otherMember('admin', 'user_recipient_2'))
    vi.mocked(api.pendingTransfer).mockResolvedValue(pendingTransfer())

    await wrapper.get('[data-testid="tab-members"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="transfer-accept"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="transfer-reject"]').exists()).toBe(true)
    
    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(false)
  })

  it('与本次转让无关的成员不显示转让面板', async () => {
    const { wrapper } = await mountView(otherMember('viewer', 'user_other_9'))
    vi.mocked(api.pendingTransfer).mockResolvedValue({
      transfer_id: 'tr_01',
      expires_at: '2026-03-14T00:00:00Z',
      restricted: true,
    })

    await wrapper.get('[data-testid="tab-members"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="transfer-accept"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(false)
  })

  it('owner 看到发起入口', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    await wrapper.get('[data-testid="tab-members"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(true)
  })

  








  it('组记录说我是创建者时，即使成员角色不是 owner 也显示卡片', async () => {
    const { wrapper } = await mountView(userWith('admin', '张老师'))

    await wrapper.get('[data-testid="tab-members"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(true)
  })

  



  it('切回成员页签重新读取：请求结束后给出结论而不是静默变回表单', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))
    vi.mocked(api.pendingTransfer).mockResolvedValue(
      pendingTransfer({ from_user_id: OWNER_ID, to_user_id: 'user_recipient_2' }),
    )

    await wrapper.get('[data-testid="tab-members"]').trigger('click')
    await flushPromises()
    
    expect(wrapper.text()).toContain('等待')
    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(false)

    
    vi.mocked(api.pendingTransfer).mockResolvedValue(null)
    await wrapper.get('[data-testid="tab-nodes"]').trigger('click')
    await wrapper.get('[data-testid="tab-members"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="transfer-ended"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="transfer-restart"]').exists()).toBe(true)
  })
})

describe('GroupDetailView 节点列表', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.renameGroup).mockReset()
    vi.mocked(api.listNodes).mockReset()
  })

  function nodeView(overrides: Partial<NodeView> = {}): NodeView {
    return {
      node_id: '2d1f06129e9e417b94b87de934f4104b',
      group_id: GROUP_ID,
      platform: 'windows',
      version: 'v3.0.1',
      capabilities: ['node.status.read', 'draw.lock', 'draw.trigger'],
      local_remote_allowed: true,
      last_heartbeat_at: '2026-10-04T13:20:00Z',
      registered_at: '2026-10-04T13:00:00Z',
      online: true,
      draw_locked: false,
      ...overrides,
    }
  }

  



  it('渲染服务端返回的节点：平台版本、在线状态与详情入口', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [
      nodeView(),
      nodeView({ node_id: 'node_offline_1', online: false, local_remote_allowed: false }),
    ])

    const online = wrapper.get('[data-testid="node-2d1f06129e9e417b94b87de934f4104b"]')
    expect(online.text()).toContain('2d1f06129e9e417b94b87de934f4104b')
    
    expect(online.text()).toContain('windows · 3.0.1')
    expect(online.text()).toContain('在线')

    const offline = wrapper.get('[data-testid="node-node_offline_1"]')
    expect(offline.text()).toContain('离线')
    
    expect(offline.text()).toContain('本机已禁用远控')
  })

  





  it('设备名：有则显示，无则回落到 node_id 而不是空白标题', async () => {
    const named = nodeView({ display_name: '301班讲台机' })
    const unnamed = nodeView({ node_id: 'node_no_name', display_name: null })

    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [named, unnamed])

    const namedRow = wrapper.get(`[data-testid="node-${named.node_id}"]`)
    expect(namedRow.get(`[data-testid="node-name-${named.node_id}"]`).text()).toBe('301班讲台机')
    expect(namedRow.text()).toContain(named.node_id)

    
    expect(wrapper.find('[data-testid="node-name-node_no_name"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="node-node_no_name"]').text()).toContain('node_no_name')
  })

  it('展开详情里同时给出设备名与 node_id，缺名时写明去哪里设置', async () => {
    const named = nodeView({ display_name: '301班讲台机' })
    const unnamed = nodeView({ node_id: 'node_no_name', display_name: null })

    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [named, unnamed])

    await wrapper.get(`[data-testid="node-expand-${named.node_id}"]`).trigger('click')
    const namedDetail = wrapper.get(`[data-testid="node-detail-${named.node_id}"]`)
    expect(namedDetail.text()).toContain('设备名')
    expect(namedDetail.text()).toContain('301班讲台机')
    expect(namedDetail.text()).toContain(named.node_id)

    await wrapper.get('[data-testid="node-expand-node_no_name"]').trigger('click')
    const unnamedDetail = wrapper.get('[data-testid="node-detail-node_no_name"]')
    expect(unnamedDetail.text()).toContain('未命名')
    expect(unnamedDetail.text()).toContain('node_no_name')
  })

  it('没有任何节点时显示空态提示', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'))

    expect(wrapper.text()).toContain('还没有节点加入这个组')
    expect(wrapper.text()).toContain('选择加入本组后即可出现在这里')
  })

  





  it('能力清单放在单节点展开详情里，列表行上不出现协议常量', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [nodeView()])

    const row = wrapper.get('[data-testid="node-2d1f06129e9e417b94b87de934f4104b"]')
    expect(row.text()).not.toContain('node.status.read')

    await wrapper.get('[data-testid="node-expand-2d1f06129e9e417b94b87de934f4104b"]').trigger('click')

    const detail = wrapper.get('[data-testid="node-detail-2d1f06129e9e417b94b87de934f4104b"]')
    
    expect(detail.text()).toContain('读取状态')
    expect(detail.text()).not.toContain('node.status.read')
  })

  




  it('已锁定与设备禁用远控是两个不同的徽章', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [
      nodeView({ draw_locked: true }),
      nodeView({ node_id: 'node_both', draw_locked: true, local_remote_allowed: false }),
    ])

    const locked = wrapper.get('[data-testid="node-2d1f06129e9e417b94b87de934f4104b"]')
    expect(locked.get('[data-testid="node-draw-locked"]').text()).toContain('禁止抽取中')
    expect(locked.text()).not.toContain('本机已禁用远控')

    const both = wrapper.get('[data-testid="node-node_both"]')
    expect(both.find('[data-testid="node-draw-locked"]').exists()).toBe(true)
    expect(both.text()).toContain('本机已禁用远控')
  })

  
  it('页头「禁止抽取中」统计卡用真实计数', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [
      nodeView({ draw_locked: true }),
      nodeView({ node_id: 'node_offline_1', online: false }),
    ])

    const text = wrapper.text()
    expect(text).toContain('节点总数2')
    expect(text).toContain('在线1')
    expect(text).toContain('禁止抽取中1')
  })
})









describe('GroupDetailView 单节点展开区', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.listNodes).mockReset()
    vi.mocked(api.setDrawLock).mockReset()
    vi.mocked(api.removeNode).mockReset()
  })

  function node(overrides: Partial<NodeView> = {}): NodeView {
    return {
      node_id: 'node_lab_1',
      group_id: GROUP_ID,
      platform: 'windows',
      version: '3.1.2',
      capabilities: ['node.status.read', 'draw.lock', 'draw.trigger'],
      local_remote_allowed: true,
      last_heartbeat_at: '2026-10-04T13:20:00Z',
      registered_at: '2026-10-04T13:00:00Z',
      online: true,
      draw_locked: false,
      ...overrides,
    }
  }

  async function expandFirstNode(role: GroupRole, nodes: NodeView[]): Promise<VueWrapper> {
    const { wrapper } = await mountView(userWith(role, '张老师'), [], nodes)
    await wrapper.get(`[data-testid="node-expand-${nodes[0]!.node_id}"]`).trigger('click')
    return wrapper
  }

  it('展开区不再显示「禁止抽取」与「立即抽取」', async () => {
    const wrapper = await expandFirstNode('operator', [node()])

    const detail = wrapper.get('[data-testid="node-detail-node_lab_1"]')
    expect(detail.find('[data-testid="node-draw-lock-node_lab_1"]').exists()).toBe(false)
    expect(detail.find('[data-testid="node-trigger-node_lab_1"]').exists()).toBe(false)
    
    expect(detail.text()).toContain('读取状态')
    expect(detail.text()).toContain('触发一次抽取')
  })

  











  it('三段能力名也翻成人话，不把协议常量显示给用户', async () => {
    const wrapper = await expandFirstNode('operator', [
      node({ capabilities: ['node.status.read', 'draw.lock', 'draw.trigger.conditions'] }),
    ])

    const detail = wrapper.get('[data-testid="node-detail-node_lab_1"]')
    expect(detail.text()).toContain('抽奖筛选条件')
    expect(detail.text()).not.toContain('draw.trigger.conditions')
    expect(detail.text()).not.toContain('capabilities.')
  })

  





  it('「移除节点」左边有「详情页」按钮，点了就进这台设备的详情页', async () => {
    const wrapper = await expandFirstNode('owner', [node()])

    const detail = wrapper.get('[data-testid="node-detail-node_lab_1"]')
    const open = detail.get('[data-testid="node-open-detail-page-node_lab_1"]')

    expect(open.text()).toContain('详情页')
    expect(open.attributes('href')).toBe(`/console/groups/${GROUP_ID}/nodes/node_lab_1`)

    
    const remove = detail.get('[data-testid="node-remove-node_lab_1"]')
    expect(
      open.element.compareDocumentPosition(remove.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('viewer 也能进详情页，但看不到任何下发入口', async () => {
    const wrapper = await expandFirstNode('viewer', [node()])

    const detail = wrapper.get('[data-testid="node-detail-node_lab_1"]')
    expect(detail.find('[data-testid="node-open-detail-page-node_lab_1"]').exists()).toBe(true)
    expect(detail.find('[data-testid="node-draw-lock-node_lab_1"]').exists()).toBe(false)
    expect(detail.find('[data-testid="node-trigger-node_lab_1"]').exists()).toBe(false)
    expect(detail.find('[data-testid="node-remove-node_lab_1"]').exists()).toBe(false)
  })

  



  it('服务端拒绝移除时把错误码渲染成文案', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      vi.mocked(api.removeNode).mockRejectedValue(new ApiError('insufficient_role', 403))

      const wrapper = await expandFirstNode('owner', [node()])
      await wrapper.get('[data-testid="node-remove-node_lab_1"]').trigger('click')
      await flushPromises()

      const result = wrapper.get('[data-testid="nodes-result"]')
      expect(result.text()).toContain('失败')
      expect(result.text()).toContain('你的角色不足以执行这个操作')
      expect(wrapper.get('[data-testid="node-feedback-node_lab_1"]').text()).toContain('失败')
    } finally {
      confirmSpy.mockRestore()
    }
  })
})

describe('GroupDetailView 批量管理', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.listNodes).mockReset()
    vi.mocked(api.setDrawLock).mockReset()
  })

  function node(overrides: Partial<NodeView> = {}): NodeView {
    return {
      node_id: 'node_lab_1',
      group_id: GROUP_ID,
      platform: 'windows',
      version: '3.1.2',
      capabilities: ['node.status.read', 'draw.lock'],
      local_remote_allowed: true,
      last_heartbeat_at: '2026-10-04T13:20:00Z',
      registered_at: '2026-10-04T13:00:00Z',
      online: true,
      draw_locked: false,
      ...overrides,
    }
  }

  const THREE_NODES = (): NodeView[] => [
    node(),
    node({ node_id: 'node_lab_2' }),
    node({ node_id: 'node_lab_3', online: false }),
  ]

  function stubSetDrawLock(): void {
    vi.mocked(api.setDrawLock).mockImplementation(async (_groupId, nodeId, drawLocked) => ({
      node_id: nodeId,
      revision: 1791121498024,
      draw_locked: drawLocked,
      delivered: true,
    }))
  }

  it('全选后批量禁止抽取：每台各下一次期望状态', async () => {
    stubSetDrawLock()
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], THREE_NODES())

    await wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
    await flushPromises()

    expect(wrapper.get('[data-testid="nodes-batch-bar"]').text()).toContain('已选 3')

    await wrapper.get('[data-testid="nodes-batch-lock"]').trigger('click')
    await flushPromises()

    expect(api.setDrawLock).toHaveBeenCalledTimes(3)
    expect(api.setDrawLock).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1', true)
    expect(api.setDrawLock).toHaveBeenCalledWith(GROUP_ID, 'node_lab_3', true)
    expect(wrapper.get('[data-testid="nodes-result"]').text()).toContain('已完成：3 台')
  })

  it('按「只看在线」筛选后全选，离线的那台不会被下发', async () => {
    stubSetDrawLock()
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], THREE_NODES())

    await wrapper.get('[data-testid="nodes-filter-online"]').setValue(true)
    await flushPromises()

    
    expect(wrapper.find('[data-testid="node-node_lab_3"]').exists()).toBe(false)

    await wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
    await wrapper.get('[data-testid="nodes-batch-lock"]').trigger('click')
    await flushPromises()

    expect(api.setDrawLock).toHaveBeenCalledTimes(2)
    expect(api.setDrawLock).not.toHaveBeenCalledWith(GROUP_ID, 'node_lab_3', true)
  })

  it('只勾选一台时批量只作用到那一台', async () => {
    stubSetDrawLock()
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], THREE_NODES())

    await wrapper.get('[data-testid="node-select-node_lab_2"]').setValue(true)
    await flushPromises()

    expect(wrapper.get('[data-testid="nodes-batch-bar"]').text()).toContain('已选 1')

    await wrapper.get('[data-testid="nodes-batch-unlock"]').trigger('click')
    await flushPromises()

    expect(api.setDrawLock).toHaveBeenCalledTimes(1)
    expect(api.setDrawLock).toHaveBeenCalledWith(GROUP_ID, 'node_lab_2', false)
  })

  



  it('跳过没有声明 draw.lock 的机器，并给出跳过数量', async () => {
    stubSetDrawLock()
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [
      node(),
      node({ node_id: 'node_no_cap', capabilities: ['node.status.read'] }),
    ])

    await wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
    await flushPromises()

    
    expect(wrapper.get('[data-testid="nodes-batch-bar"]').text()).toContain('已选 1')

    
    await wrapper.get('[data-testid="node-select-node_no_cap"]').setValue(true)
    await flushPromises()

    expect(wrapper.get('[data-testid="nodes-skipped-hint"]').text()).toContain('1')

    await wrapper.get('[data-testid="nodes-batch-lock"]').trigger('click')
    await flushPromises()

    expect(api.setDrawLock).toHaveBeenCalledTimes(1)
    expect(api.setDrawLock).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1', true)
  })

  it('viewer 看不到批量工具栏', async () => {
    const { wrapper } = await mountView(userWith('viewer', '张老师'), [], THREE_NODES())

    
    expect(wrapper.find('[data-testid="nodes-select-all"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nodes-batch-bar"]').exists()).toBe(false)
  })

  it('「只看禁止抽取中」只留下已锁定的机器', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [
      node({ node_id: 'node_locked', draw_locked: true }),
      node({ node_id: 'node_free' }),
    ])

    await wrapper.get('[data-testid="nodes-filter-locked"]').setValue(true)
    await flushPromises()

    expect(wrapper.find('[data-testid="node-node_locked"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="node-node_free"]').exists()).toBe(false)
  })
})








describe('GroupDetailView 节点行动作与批量播报 / 移除', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.listNodes).mockReset()
    vi.mocked(api.setDrawLock).mockReset()
    vi.mocked(api.playMedia).mockReset()
    vi.mocked(api.removeNode).mockReset()
  })

  function node(overrides: Partial<NodeView> = {}): NodeView {
    return {
      node_id: 'node_lab_1',
      group_id: GROUP_ID,
      platform: 'windows',
      version: '3.1.2',
      capabilities: ['node.status.read', 'draw.lock', 'draw.trigger', 'media.play'],
      local_remote_allowed: true,
      last_heartbeat_at: '2026-10-04T13:20:00Z',
      registered_at: '2026-10-04T13:00:00Z',
      online: true,
      draw_locked: false,
      ...overrides,
    }
  }

  function command(nodeId: string): NodeCommandDto {
    return {
      command_id: 'cmd_media_1',
      target_node_id: nodeId,
      capability: 'media.play',
      kind: 'action',
      status: 'delivered',
      issued_at: '2026-10-04T13:20:00Z',
      expires_at: '2026-10-04T13:22:00Z',
    }
  }

  it('节点 ID 链接到这台设备的详情页', async () => {
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [node()])

    const link = wrapper.get('[data-testid="node-link-node_lab_1"]')
    expect(link.attributes('href')).toBe(`/console/groups/${GROUP_ID}/nodes/node_lab_1`)
  })

  





  it('批量栏只作用到一台时，结果写在该行上', async () => {
    vi.mocked(api.setDrawLock).mockResolvedValue({
      node_id: 'node_lab_1',
      revision: 1791121498024,
      draw_locked: true,
      delivered: true,
    })
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [node()])

    await wrapper.get('[data-testid="node-expand-node_lab_1"]').trigger('click')
    await wrapper.get('[data-testid="node-select-node_lab_1"]').setValue(true)
    await flushPromises()
    await wrapper.get('[data-testid="nodes-batch-lock"]').trigger('click')
    await flushPromises()

    expect(api.setDrawLock).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1', true)
    expect(wrapper.get('[data-testid="node-feedback-node_lab_1"]').text()).toContain('已下发')
  })

  



  it('admin 能在展开区逐台移除节点', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      vi.mocked(api.removeNode).mockResolvedValue(undefined)
      const { wrapper } = await mountView(userWith('admin', '张老师'), [], [node()])

      await wrapper.get('[data-testid="node-expand-node_lab_1"]').trigger('click')
      await wrapper.get('[data-testid="node-remove-node_lab_1"]').trigger('click')
      await flushPromises()

      expect(api.removeNode).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1')
    } finally {
      confirmSpy.mockRestore()
    }
  })

  it('批量播报：每台各下发一次，并给出数量结论', async () => {
    vi.mocked(api.playMedia).mockImplementation(async (_groupId, nodeId) => command(nodeId))
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [
      node(),
      node({ node_id: 'node_lab_2' }),
    ])

    await wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
    await flushPromises()

    await wrapper.get('[data-testid="nodes-batch-announce"]').trigger('click')
    await wrapper.get('[data-testid="nodes-batch-announce-text"]').setValue('请第一组上台')
    await wrapper.get('[data-testid="nodes-batch-announce-send"]').trigger('click')
    await flushPromises()

    
    expect(api.playMedia).toHaveBeenCalledTimes(2)
    expect(api.playMedia).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1', 'announce', '请第一组上台')
    expect(api.playMedia).toHaveBeenCalledWith(GROUP_ID, 'node_lab_2', 'announce', '请第一组上台')
    expect(wrapper.get('[data-testid="nodes-result"]').text()).toContain('已完成：2 台')
  })

  it('批量播报跳过没有声明「播报」能力的机器，并说明跳过了几台', async () => {
    vi.mocked(api.playMedia).mockImplementation(async (_groupId, nodeId) => command(nodeId))
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [
      node(),
      node({ node_id: 'node_no_media', capabilities: ['node.status.read', 'draw.lock'] }),
    ])

    await wrapper.get('[data-testid="node-select-node_lab_1"]').setValue(true)
    await wrapper.get('[data-testid="node-select-node_no_media"]').setValue(true)
    await wrapper.get('[data-testid="nodes-batch-announce"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="nodes-skipped-media-hint"]').text()).toContain('1')

    await wrapper.get('[data-testid="nodes-batch-announce-text"]').setValue('上课了')
    await wrapper.get('[data-testid="nodes-batch-announce-send"]').trigger('click')
    await flushPromises()

    expect(api.playMedia).toHaveBeenCalledTimes(1)
    expect(api.playMedia).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1', 'announce', '上课了')
  })

  it('空内容时播报按钮不可用，不会打服务端', async () => {
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [node()])

    await wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
    await wrapper.get('[data-testid="nodes-batch-announce"]').trigger('click')
    await flushPromises()

    expect(
      wrapper.get('[data-testid="nodes-batch-announce-send"]').attributes('disabled'),
    ).toBeDefined()
    expect(api.playMedia).not.toHaveBeenCalled()
  })

  it('operator 看不到批量移除，admin 能逐台移除', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      vi.mocked(api.removeNode).mockResolvedValue(undefined)

      const asOperator = await mountView(userWith('operator', '张老师'), [], [node()])
      await asOperator.wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
      await flushPromises()
      
      expect(asOperator.wrapper.find('[data-testid="nodes-batch-remove"]').exists()).toBe(false)

      const asAdmin = await mountView(userWith('admin', '张老师'), [], [
        node(),
        node({ node_id: 'node_lab_2' }),
      ])
      await asAdmin.wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
      await flushPromises()
      await asAdmin.wrapper.get('[data-testid="nodes-batch-remove"]').trigger('click')
      await flushPromises()

      expect(api.removeNode).toHaveBeenCalledTimes(2)
      expect(api.removeNode).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1')
      expect(api.removeNode).toHaveBeenCalledWith(GROUP_ID, 'node_lab_2')
    } finally {
      confirmSpy.mockRestore()
    }
  })

  it('用户取消确认时不会移除任何机器', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    try {
      const { wrapper } = await mountView(userWith('owner', '张老师'), [], [node()])

      await wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
      await wrapper.get('[data-testid="nodes-batch-remove"]').trigger('click')
      await flushPromises()

      expect(api.removeNode).not.toHaveBeenCalled()
    } finally {
      confirmSpy.mockRestore()
    }
  })

  



  it('部分失败时列出失败的 node_id', async () => {
    vi.mocked(api.setDrawLock).mockImplementation(async (_groupId, nodeId, drawLocked) => {
      if (nodeId === 'node_lab_3') throw new ApiError('insufficient_role', 403)
      return { node_id: nodeId, revision: 1, draw_locked: drawLocked, delivered: true }
    })
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [
      node(),
      node({ node_id: 'node_lab_2' }),
      node({ node_id: 'node_lab_3' }),
    ])

    await wrapper.get('[data-testid="nodes-select-all"]').setValue(true)
    await wrapper.get('[data-testid="nodes-batch-lock"]').trigger('click')
    await flushPromises()

    const result = wrapper.get('[data-testid="nodes-result"]')
    expect(result.text()).toContain('部分完成：成功 2 台，失败 1 台')
    expect(wrapper.get('[data-testid="nodes-result-failed-ids"]').text()).toContain('node_lab_3')
  })
})













describe('GroupDetailView 在线状态自动刷新', () => {
  let visibility: DocumentVisibilityState = 'visible'
  let mounted: VueWrapper | undefined

  


  class StubEventSource {
    static instances: StubEventSource[] = []

    readonly listeners = new Map<string, Set<() => void>>()
    readyState = 1

    constructor(readonly url: string) {
      StubEventSource.instances.push(this)
    }

    addEventListener(type: string, handler: () => void): void {
      const set = this.listeners.get(type) ?? new Set<() => void>()
      set.add(handler)
      this.listeners.set(type, set)
    }

    removeEventListener(type: string, handler: () => void): void {
      this.listeners.get(type)?.delete(handler)
    }

    close(): void {
      this.readyState = 2
    }

    emit(type: string): void {
      for (const handler of [...(this.listeners.get(type) ?? [])]) handler()
    }
  }

  beforeEach(() => {
    visibility = 'visible'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    })

    StubEventSource.instances = []
    vi.stubGlobal('EventSource', StubEventSource)

    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.listNodes).mockReset()
  })

  afterEach(() => {
    
    mounted?.unmount()
    mounted = undefined
    visibility = 'visible'
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  function node(online: boolean): NodeView {
    return {
      node_id: 'node_lab_1',
      group_id: GROUP_ID,
      platform: 'windows',
      version: '3.1.2',
      capabilities: ['node.status.read', 'draw.lock'],
      local_remote_allowed: true,
      last_heartbeat_at: '2026-10-04T13:20:00Z',
      registered_at: '2026-10-04T13:00:00Z',
      online,
      draw_locked: false,
    }
  }

  it('到间隔自动重新拉取，页头的在线数跟着变', async () => {
    vi.useFakeTimers()

    const harness = await mountView(userWith('owner', '张老师'), [], [node(true)])
    mounted = harness.wrapper
    expect(harness.wrapper.text()).toContain('在线1')

    
    vi.mocked(api.listNodes).mockResolvedValue([node(false)])

    await vi.advanceTimersByTimeAsync(NODE_REFRESH_INTERVAL_MS)
    await flushPromises()

    expect(harness.wrapper.text()).toContain('在线0')
    expect(harness.wrapper.get(`[data-testid="node-${node(true).node_id}"]`).text()).toContain(
      '离线',
    )
  })

  it('后台标签页不拉取，切回前台立刻补一次', async () => {
    vi.useFakeTimers()

    const harness = await mountView(userWith('owner', '张老师'), [], [node(true)])
    mounted = harness.wrapper
    expect(harness.wrapper.text()).toContain('在线1')

    
    vi.mocked(api.listNodes).mockResolvedValue([node(false)])

    
    visibility = 'hidden'
    await vi.advanceTimersByTimeAsync(NODE_REFRESH_INTERVAL_MS * 3)
    await flushPromises()
    expect(harness.wrapper.text()).toContain('在线1')

    
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()

    expect(harness.wrapper.text()).toContain('在线0')
  })

  



  it('服务端推来「有变化」时立刻重拉，不等下一个间隔', async () => {
    vi.useFakeTimers()

    const harness = await mountView(userWith('owner', '张老师'), [], [node(true)])
    mounted = harness.wrapper
    expect(harness.wrapper.text()).toContain('在线1')

    
    expect(StubEventSource.instances.at(-1)?.url).toBe(`/v1/groups/${GROUP_ID}/events`)

    vi.mocked(api.listNodes).mockResolvedValue([node(false)])

    StubEventSource.instances.at(-1)?.emit('nodes')
    await flushPromises()

    expect(harness.wrapper.text()).toContain('在线0')
  })
})









describe('GroupDetailView 关闭成员功能时', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.pendingTransfer).mockReset()
  })

  it('成员与邀请页签不出现，仍保留节点与审计', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [], {
      membershipEnabled: false,
    })

    expect(wrapper.find('[data-testid="tab-nodes"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-audit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-members"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="tab-invites"]').exists()).toBe(false)
  })

  it('成员数统计卡整块去掉，而不是永远显示 0', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [], {
      membershipEnabled: false,
    })

    
    
    const grid = wrapper.get('[data-testid="group-stats"]')
    const stats = grid.text()
    expect(stats).not.toContain(zhCN.group.memberCount)
    
    expect(grid.findAll('.console-stat__value')).toHaveLength(3)

    
    expect(stats).toContain(zhCN.group.nodeCount)
    expect(stats).toContain(zhCN.group.online)
    expect(stats).toContain(zhCN.group.drawLocked)
  })

  it('不查成员表，也不查待确认转让', async () => {
    await mountView(userWith('owner', '张老师'), [member('owner')], [], {
      membershipEnabled: false,
    })

    expect(api.listMembers).not.toHaveBeenCalled()
    expect(api.pendingTransfer).not.toHaveBeenCalled()
  })

  it('即使服务端给出待确认转让，也不显示转让面板', async () => {
    
    
    vi.mocked(api.pendingTransfer).mockResolvedValue({
      transfer_id: 'tr_1',
      group_id: GROUP_ID,
      from_user_id: 'user_other',
      to_user_id: OWNER_ID,
      created_at: '2026-03-12T00:00:00Z',
      expires_at: '2026-03-14T00:00:00Z',
      status: 'pending',
      demoted_to: 'admin',
    })

    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [], {
      membershipEnabled: false,
    })

    expect(wrapper.find('[data-testid="transfer-request"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="transfer-accept"]').exists()).toBe(false)
  })

  it('成员面板与邀请面板都不渲染，页面停在节点页', async () => {
    const { wrapper } = await mountView(userWith('admin', '张老师'), [], [], {
      membershipEnabled: false,
    })

    expect(wrapper.find('[data-testid="members-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="invites-error"]').exists()).toBe(false)
    
    expect(wrapper.find('[data-testid="nodes-refresh"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="tab-nodes"]').attributes('data-active')).toBe('true')
  })
})

describe('GroupDetailView 设备接入面板', () => {
  beforeEach(() => {
    vi.mocked(api.session).mockReset()
    vi.mocked(api.listMembers).mockReset()
    vi.mocked(api.listNodes).mockReset()
    vi.mocked(api.listEnrollmentCodes).mockReset()
    vi.mocked(api.serverMeta).mockReset()
  })

  it('本地模式下成员功能关着，接入码面板照样出现', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [], {
      membershipEnabled: false,
      nodeEnrollment: true,
    })

    expect(wrapper.find('[data-testid="enrollment-create"]').exists()).toBe(true)
    expect(wrapper.text()).toContain(zhCN.group.enrollment.title)
    expect(wrapper.find('[data-testid="tab-members"]').exists()).toBe(false)
  })

  it('服务端没有声明 node_enrollment 时不渲染接入码面板', async () => {
    const { wrapper } = await mountView(userWith('owner', '张老师'), [], [], {
      nodeEnrollment: false,
    })

    expect(wrapper.find('[data-testid="enrollment-create"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nodes-refresh"]').exists()).toBe(true)
  })

  it('普通成员看不到接入码面板', async () => {
    const { wrapper } = await mountView(userWith('operator', '张老师'), [], [], {
      nodeEnrollment: true,
    })

    expect(wrapper.find('[data-testid="enrollment-create"]').exists()).toBe(false)
  })
})