import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NodeEnrollmentPanel from './NodeEnrollmentPanel.vue'
import { ApiError, api } from '@/api/client'
import { createAppI18n } from '@/i18n'
import zhCN from '@/i18n/locales/zh-CN'
import { NODE_REFRESH_INTERVAL_MS } from '@/composables/useAutoRefresh'
import type { EnrollmentCodeDto, NodeView, ServerMeta } from '@/api/protocol'

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      serverMeta: vi.fn(),
      listEnrollmentCodes: vi.fn(),
      listNodes: vi.fn(),
      createEnrollmentCode: vi.fn(),
      revokeEnrollmentCode: vi.fn(),
      issueNodeToken: vi.fn(),
      revokeNodeToken: vi.fn(),
    },
  }
})

const GROUP_ID = 'grp_01ab30b332e6'

function meta(nodeEnrollment?: boolean): ServerMeta {
  return {
    service: 'secrandom-control',
    protocol: '1',
    server_version: '0.1.0',
    status: 'ready',
    ...(nodeEnrollment === undefined ? {} : { node_enrollment: nodeEnrollment }),
  }
}

function node(overrides: Partial<NodeView> & { node_id: string }): NodeView {
  return {
    group_id: GROUP_ID,
    platform: 'windows',
    version: '1.0.0',
    capabilities: [],
    local_remote_allowed: false,
    registered_at: '2026-03-12T00:00:00Z',
    online: false,
    draw_locked: false,
    ...overrides,
  }
}

function code(overrides: Partial<EnrollmentCodeDto> = {}): EnrollmentCodeDto {
  return {
    display_code: 'K7QM-3XZP',
    group_id: GROUP_ID,
    created_at: '2026-03-12T00:00:00Z',
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: 'pending',
    ...overrides,
  }
}

interface MountOptions {
  canManage?: boolean
  nodeEnrollment?: boolean | undefined
  codes?: EnrollmentCodeDto[]
  nodes?: NodeView[]
  fakeTimers?: boolean
}

async function mountPanel(options: MountOptions = {}): Promise<VueWrapper> {
  const pinia = createPinia()
  setActivePinia(pinia)

  vi.mocked(api.serverMeta).mockResolvedValue(meta(options.nodeEnrollment))
  vi.mocked(api.listEnrollmentCodes).mockResolvedValue(options.codes ?? [])
  vi.mocked(api.listNodes).mockResolvedValue(options.nodes ?? [])

  if (options.fakeTimers === true) vi.useFakeTimers()

  const wrapper = mount(NodeEnrollmentPanel, {
    props: { groupId: GROUP_ID, canManage: options.canManage !== false },
    global: { plugins: [pinia, createAppI18n('zh-CN')] },
  })

  if (options.fakeTimers === true) {
    await vi.advanceTimersByTimeAsync(0)
  } else {
    await flushPromises()
  }
  return wrapper
}

enableAutoUnmount(afterEach)

describe('NodeEnrollmentPanel 可见性', () => {
  beforeEach(() => {
    vi.mocked(api.serverMeta).mockReset()
    vi.mocked(api.listEnrollmentCodes).mockReset()
    vi.mocked(api.listNodes).mockReset()
  })

  it('不是管理员时不渲染面板，也不去问服务端能力', async () => {
    const wrapper = await mountPanel({ canManage: false, nodeEnrollment: true })

    expect(wrapper.find('[data-testid="enrollment-create"]').exists()).toBe(false)
    expect(api.serverMeta).not.toHaveBeenCalled()
  })

  it('服务端没有声明 node_enrollment 时保持隐藏', async () => {
    const wrapper = await mountPanel({ nodeEnrollment: undefined })

    expect(wrapper.find('[data-testid="enrollment-create"]').exists()).toBe(false)
    expect(api.listEnrollmentCodes).not.toHaveBeenCalled()
  })

  it('服务端声明 node_enrollment 后显示接入码与设备两块面板', async () => {
    const wrapper = await mountPanel({ nodeEnrollment: true })

    expect(wrapper.text()).toContain(zhCN.group.enrollment.title)
    expect(wrapper.text()).toContain(zhCN.group.enrollment.hint)
    expect(wrapper.text()).toContain(zhCN.group.enrollment.devicesTitle)
    expect(api.listEnrollmentCodes).toHaveBeenCalledWith(GROUP_ID)
    expect(api.listNodes).toHaveBeenCalledWith(GROUP_ID)
  })
})

describe('NodeEnrollmentPanel 设备状态', () => {
  const nodes: NodeView[] = [
    node({ node_id: 'node_lab_1', display_name: '实验一机', enrolled: true, online: true }),
    node({ node_id: 'node_lab_2', enrolled: true, online: false }),
    node({ node_id: 'node_lab_3', enrolled: false, token_state: 'revoked' }),
    node({ node_id: 'node_lab_4', enrolled: false, token_state: 'expired' }),
    node({ node_id: 'node_lab_5', enrolled: false, token_state: 'none' }),
  ]

  beforeEach(() => {
    vi.mocked(api.serverMeta).mockReset()
    vi.mocked(api.listEnrollmentCodes).mockReset()
    vi.mocked(api.listNodes).mockReset()
  })

  it('接入状态、在线、远控权限拆成三块独立徽标，不再混在说明句里', async () => {
    const wrapper = await mountPanel({
      nodeEnrollment: true,
      nodes: [
        node({
          node_id: 'node_lab_1',
          display_name: '实验一机',
          enrolled: true,
          online: true,
          local_remote_allowed: true,
        }),
        node({ node_id: 'node_lab_2', enrolled: true, online: false }),
        node({ node_id: 'node_lab_3', enrolled: false, token_state: 'revoked' }),
        node({ node_id: 'node_lab_4', enrolled: false, token_state: 'expired' }),
        node({ node_id: 'node_lab_5', enrolled: false, token_state: 'none' }),
      ],
    })

    const access = (nodeId: string) =>
      wrapper
        .get(`[data-testid="enrollment-node-${nodeId}"] [data-testid="enrollment-node-state"]`)
        .text()
    const online = (nodeId: string) => wrapper.get(`[data-testid="enrollment-node-online-${nodeId}"]`).text()
    const permission = (nodeId: string) =>
      wrapper.get(`[data-testid="enrollment-node-permission-${nodeId}"]`).text()

    expect(wrapper.find('[data-testid="enrollment-node-status"]').exists()).toBe(true)
    expect(access('node_lab_1')).toBe(zhCN.group.enrollment.accessEnrolled)
    expect(access('node_lab_2')).toBe(zhCN.group.enrollment.accessEnrolled)
    expect(access('node_lab_3')).toBe(zhCN.group.enrollment.accessRevoked)
    expect(access('node_lab_4')).toBe(zhCN.group.enrollment.accessExpired)
    expect(access('node_lab_5')).toBe(zhCN.group.enrollment.accessNone)

    expect(online('node_lab_1')).toBe(zhCN.group.enrollment.stateOnline)
    expect(online('node_lab_2')).toBe(zhCN.group.enrollment.stateOffline)

    expect(permission('node_lab_1')).toBe(zhCN.group.enrollment.permissionAllowed)
    expect(permission('node_lab_2')).toBe(zhCN.group.enrollment.permissionDenied)

    expect(wrapper.get('[data-testid="enrollment-access-enrolled"]').text()).toContain('2')
    expect(wrapper.get('[data-testid="enrollment-access-none"]').text()).toContain('3')
    expect(wrapper.get('[data-testid="enrollment-node-node_lab_1"]').text()).not.toContain(
      zhCN.group.enrollment.hint,
    )
    expect(wrapper.get('[data-testid="enrollment-node-node_lab_1"]').text()).toContain('实验一机')
    expect(wrapper.get('[data-testid="enrollment-node-node_lab_2"]').text()).toContain('node_lab_2')
  })

  it('每 10 秒静默刷新设备列表，在线状态跟着更新且不打扰用户', async () => {
    try {
      const wrapper = await mountPanel({
        nodeEnrollment: true,
        nodes: [node({ node_id: 'node_lab_1', enrolled: true, online: false })],
        fakeTimers: true,
      })

      expect(api.listNodes).toHaveBeenCalledTimes(1)
      expect(wrapper.get('[data-testid="enrollment-node-online-node_lab_1"]').text()).toBe(
        zhCN.group.enrollment.stateOffline,
      )

      vi.mocked(api.listNodes).mockResolvedValue([
        node({ node_id: 'node_lab_1', enrolled: true, online: true }),
      ])
      await vi.advanceTimersByTimeAsync(NODE_REFRESH_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(0)

      expect(api.listNodes).toHaveBeenCalledTimes(2)
      expect(wrapper.get('[data-testid="enrollment-node-online-node_lab_1"]').text()).toBe(
        zhCN.group.enrollment.stateOnline,
      )
      expect(wrapper.find('[data-testid="enrollment-error"]').exists()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('未接入的设备给「签发令牌」，已接入的给「重发令牌」', async () => {
    const wrapper = await mountPanel({ nodeEnrollment: true, nodes })

    expect(wrapper.get('[data-testid="enrollment-token-issue-node_lab_5"]').text()).toBe(
      zhCN.group.enrollment.issueToken,
    )
    expect(wrapper.get('[data-testid="enrollment-token-issue-node_lab_1"]').text()).toBe(
      zhCN.group.enrollment.reissueToken,
    )
  })
})

describe('NodeEnrollmentPanel 接入码', () => {
  beforeEach(() => {
    vi.mocked(api.serverMeta).mockReset()
    vi.mocked(api.listEnrollmentCodes).mockReset()
    vi.mocked(api.listNodes).mockReset()
    vi.mocked(api.createEnrollmentCode).mockReset()
    vi.mocked(api.revokeEnrollmentCode).mockReset()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    })
  })

  it('生成接入码后大字显示明文并带上倒计时', async () => {
    const created = code()
    vi.mocked(api.createEnrollmentCode).mockResolvedValue(created)
    const wrapper = await mountPanel({ nodeEnrollment: true, codes: [] })

    await wrapper.get('[data-testid="enrollment-create"]').trigger('click')
    await flushPromises()

    expect(api.createEnrollmentCode).toHaveBeenCalledWith(GROUP_ID)
    expect(wrapper.get('[data-testid="enrollment-code-value"]').text()).toBe(created.display_code)
    expect(wrapper.get('[data-testid="enrollment-code-countdown"]').text()).toContain(
      zhCN.group.enrollment.remaining,
    )
    expect(wrapper.get('[data-testid="enrollment-code"]').text()).toContain(zhCN.group.enrollment.newCodeTitle)
  })

  it('复制接入码把明文交给剪贴板', async () => {
    vi.mocked(api.createEnrollmentCode).mockResolvedValue(code())
    const wrapper = await mountPanel({ nodeEnrollment: true })
    await wrapper.get('[data-testid="enrollment-create"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="enrollment-code-copy"]').trigger('click')
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('K7QM-3XZP')
    expect(wrapper.get('[data-testid="enrollment-code-copy"]').text()).toBe(zhCN.group.enrollment.copied)
  })

  it('撤销接入码要二次确认，提交时去掉横线', async () => {
    const listed = code()
    vi.mocked(api.createEnrollmentCode).mockResolvedValue(listed)
    vi.mocked(api.revokeEnrollmentCode).mockResolvedValue(undefined)
    const wrapper = await mountPanel({ nodeEnrollment: true, codes: [] })

    await wrapper.get('[data-testid="enrollment-create"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="enrollment-code-revoke"]').trigger('click')
    expect(wrapper.find('[data-testid="enrollment-code-revoke-confirm"]').exists()).toBe(true)
    expect(api.revokeEnrollmentCode).not.toHaveBeenCalled()

    vi.mocked(api.listEnrollmentCodes).mockResolvedValue([])
    await wrapper.get('[data-testid="enrollment-code-revoke-confirm-yes"]').trigger('click')
    await flushPromises()

    expect(api.revokeEnrollmentCode).toHaveBeenCalledWith(GROUP_ID, 'K7QM3XZP')
  })

  it('列表里的码按状态显示文案', async () => {
    const wrapper = await mountPanel({
      nodeEnrollment: true,
      codes: [
        code(),
        code({ display_code: 'AB23-CD45', status: 'used', used_by_node_id: 'node_lab_1' }),
        code({ display_code: 'EF45-GH67', status: 'expired' }),
        code({ display_code: 'JK67-MN89', status: 'revoked' }),
      ],
    })

    const labels = wrapper.findAll('[data-testid="enrollment-code-status"]').map((item) => item.text())
    expect(labels).toEqual([
      zhCN.group.enrollment.codePending,
      zhCN.group.enrollment.codeUsed,
      zhCN.group.enrollment.codeExpired,
      zhCN.group.enrollment.codeRevoked,
    ])
  })
})

describe('NodeEnrollmentPanel 令牌', () => {
  beforeEach(() => {
    vi.mocked(api.serverMeta).mockReset()
    vi.mocked(api.listEnrollmentCodes).mockReset()
    vi.mocked(api.listNodes).mockReset()
    vi.mocked(api.issueNodeToken).mockReset()
    vi.mocked(api.revokeNodeToken).mockReset()
  })

  it('签发令牌后显示明文，并可以关掉', async () => {
    const enrolled = node({ node_id: 'node_lab_5', enrolled: false, token_state: 'none' })
    vi.mocked(api.issueNodeToken).mockResolvedValue({
      node_id: 'node_lab_5',
      group_id: GROUP_ID,
      node_token: 'srn_tok_1_secret',
      expires_at: '2026-09-08T00:00:00Z',
    })
    const wrapper = await mountPanel({ nodeEnrollment: true, nodes: [enrolled] })

    await wrapper.get('[data-testid="enrollment-token-issue-node_lab_5"]').trigger('click')
    await flushPromises()

    expect(api.issueNodeToken).toHaveBeenCalledWith(GROUP_ID, 'node_lab_5')
    expect(wrapper.get('[data-testid="enrollment-token-value"]').text()).toBe('srn_tok_1_secret')

    await wrapper.get('[data-testid="enrollment-token-close"]').trigger('click')
    expect(wrapper.find('[data-testid="enrollment-token"]').exists()).toBe(false)
  })

  it('撤销设备令牌要二次确认', async () => {
    const enrolled = node({ node_id: 'node_lab_1', enrolled: true, online: true })
    vi.mocked(api.revokeNodeToken).mockResolvedValue(undefined)
    const wrapper = await mountPanel({ nodeEnrollment: true, nodes: [enrolled] })

    await wrapper.get('[data-testid="enrollment-token-revoke-node_lab_1"]').trigger('click')
    expect(wrapper.find('[data-testid="enrollment-token-revoke-confirm"]').exists()).toBe(true)
    expect(api.revokeNodeToken).not.toHaveBeenCalled()

    vi.mocked(api.listNodes).mockResolvedValue([])
    await wrapper.get('[data-testid="enrollment-token-revoke-confirm-yes"]').trigger('click')
    await flushPromises()

    expect(api.revokeNodeToken).toHaveBeenCalledWith(GROUP_ID, 'node_lab_1')
  })
})

describe('NodeEnrollmentPanel 错误提示', () => {
  beforeEach(() => {
    vi.mocked(api.serverMeta).mockReset()
    vi.mocked(api.listEnrollmentCodes).mockReset()
    vi.mocked(api.listNodes).mockReset()
    vi.mocked(api.createEnrollmentCode).mockReset()
  })

  it('限速与未启用按状态码给不同文案', async () => {
    vi.mocked(api.createEnrollmentCode).mockRejectedValue(new ApiError('too_many_attempts', 429))
    const limited = await mountPanel({ nodeEnrollment: true })
    await limited.get('[data-testid="enrollment-create"]').trigger('click')
    await flushPromises()
    expect(limited.get('[data-testid="enrollment-error"]').text()).toBe(zhCN.errors.too_many_attempts)

    vi.mocked(api.createEnrollmentCode).mockRejectedValue(new ApiError('enrollment_disabled', 503))
    const disabled = await mountPanel({ nodeEnrollment: true })
    await disabled.get('[data-testid="enrollment-create"]').trigger('click')
    await flushPromises()
    expect(disabled.get('[data-testid="enrollment-error"]').text()).toBe(zhCN.errors.enrollment_disabled)
  })

  it('非管理员操作给出角色不足文案', async () => {
    vi.mocked(api.createEnrollmentCode).mockRejectedValue(new ApiError('insufficient_role', 403))
    const wrapper = await mountPanel({ nodeEnrollment: true })

    await wrapper.get('[data-testid="enrollment-create"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="enrollment-error"]').text()).toBe(zhCN.errors.insufficient_role)
  })

  it('读不到接入码列表时按错误码提示', async () => {
    const wrapper = await mountPanel({ nodeEnrollment: true })

    vi.mocked(api.listEnrollmentCodes).mockRejectedValue(new ApiError('not_found', 404))
    await wrapper.get('[data-testid="enrollment-refresh"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="enrollment-error"]').text()).toBe(zhCN.errors.not_found)
  })
})
