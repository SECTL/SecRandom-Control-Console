import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import GroupAuditPanel from './GroupAuditPanel.vue'
import { api } from '@/api/client'
import { createAppI18n } from '@/i18n'
import { pickOption } from '@/components/client/fluent/client-select.test-utils'
import type { AuditEventDto, AuditFacetsDto, AuditPageDto } from '@/api/protocol'










vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, api: { ...actual.api, listAudit: vi.fn(), auditFacets: vi.fn() } }
})

const GROUP_ID = 'grp_01ab30b332e6'
const ACTOR_ID = '69c78f81003173a586ca'

function event(overrides: Partial<AuditEventDto> = {}): AuditEventDto {
  return {
    event_id: 'evt_1',
    at: '2026-10-04T11:51:22Z',
    actor_user_id: ACTOR_ID,
    action: 'group.create',
    outcome: 'success',
    ...overrides,
  }
}


const systemEvent: AuditEventDto = {
  event_id: 'evt_2',
  at: '2026-10-04T12:00:00Z',
  action: 'transfer.expire',
  outcome: 'success',
}


function auditPage(items: AuditEventDto[], total = items.length, page = 1): AuditPageDto {
  return { items, total, page, limit: 50 }
}


function facets(overrides: Partial<AuditFacetsDto> = {}): AuditFacetsDto {
  return {
    actor_devices: { items: [], truncated: false },
    target_nodes: { items: [], truncated: false },
    actors: { items: [], truncated: false },
    ...overrides,
  }
}

async function mountPanel(
  items: AuditEventDto[],
  options: { total?: number; facets?: AuditFacetsDto | null; groupName?: string } = {},
): Promise<VueWrapper> {
  
  
  
  vi.mocked(api.listAudit).mockImplementation((_groupId: string, query = {}) =>
    Promise.resolve(auditPage(items, options.total ?? items.length, query.page ?? 1)),
  )

  if (options.facets === null) {
    
    vi.mocked(api.auditFacets).mockRejectedValue(new Error('facets unavailable'))
  } else {
    vi.mocked(api.auditFacets).mockResolvedValue(options.facets ?? facets())
  }

  const wrapper = mount(GroupAuditPanel, {
    props: { groupId: GROUP_ID, groupName: options.groupName ?? null },
    global: { plugins: [createAppI18n('zh-CN')] },
  })

  await flushPromises()
  return wrapper
}


function page(count: number): AuditEventDto[] {
  return Array.from({ length: count }, (_, index) =>
    event({
      event_id: `evt_${String(index).padStart(3, '0')}`,
      at: `2026-10-04T11:${String(Math.floor(index / 60)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}Z`,
    }),
  )
}


function lastQuery(): Record<string, unknown> | undefined {
  return vi.mocked(api.listAudit).mock.calls.at(-1)?.[1] as Record<string, unknown> | undefined
}







function mockDownload() {
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock')
  Object.defineProperty(URL, 'createObjectURL', {
    value: createObjectURL,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true, writable: true })
  return createObjectURL
}

describe('GroupAuditPanel 操作人', () => {
  beforeEach(() => {
    vi.mocked(api.listAudit).mockReset()
    vi.mocked(api.auditFacets).mockReset()
  })

  it('有昵称时显示昵称，同时保留裸 user_id 便于取证', async () => {
    const wrapper = await mountPanel([event({ actor_display_name: '黎泽毅_Aionflux' })])

    const cell = wrapper.get('[data-testid="audit-actor"]')
    expect(cell.text()).toContain('黎泽毅_Aionflux')
    
    expect(cell.text()).toContain(ACTOR_ID)
  })

  it('解析不出昵称时显示裸 user_id，而不是空白', async () => {
    const wrapper = await mountPanel([event()])

    const cell = wrapper.get('[data-testid="audit-actor"]')
    expect(cell.text()).toContain(ACTOR_ID)
  })

  it('没有操作人（系统事件）时显示占位符', async () => {
    const wrapper = await mountPanel([systemEvent])

    expect(wrapper.get('[data-testid="audit-actor"]').text()).toContain('—')
  })
})








describe('GroupAuditPanel 对象与明细', () => {
  beforeEach(() => {
    vi.mocked(api.listAudit).mockReset()
    vi.mocked(api.auditFacets).mockReset()
  })

  it('对象列给出类型、展示名与不可变的裸 ID', async () => {
    const wrapper = await mountPanel([
      event({
        action: 'member.role_change',
        target_id: 'user_5d0712345678',
        target_display_name: '李老师',
        detail: 'Operator->Admin',
      }),
    ])

    const cell = wrapper.get('[data-testid="audit-target"]')
    expect(cell.text()).toContain('成员')
    expect(cell.text()).toContain('李老师')
    
    expect(cell.text()).toContain('user_5d0712345678')
  })

  it('明细列同时给出人话与原始 token', async () => {
    const wrapper = await mountPanel([
      event({ action: 'member.role_change', detail: 'Owner->Admin' }),
    ])

    const cell = wrapper.get('[data-testid="audit-detail"]')
    expect(cell.text()).toContain('角色 创建者 → 管理员')
    expect(cell.text()).toContain('Owner->Admin')
  })

  it('能力下发：明细把能力名说出来，而不是只显示 draw.lock:action', async () => {
    const wrapper = await mountPanel([
      event({
        action: 'node.policy_change',
        target_id: 'node_1',
        target_display_name: '301班讲台机',
        detail: 'draw.lock:action',
      }),
    ])

    expect(wrapper.get('[data-testid="audit-detail"]').text()).toContain('下发 禁止 / 允许抽取')
    expect(wrapper.get('[data-testid="audit-target"]').text()).toContain('301班讲台机')
  })

  it('被拒的操作显示原因，而不是只显示一个"被拒绝"徽章', async () => {
    const wrapper = await mountPanel([
      event({
        action: 'transfer.request',
        outcome: 'denied',
        target_id: 'trf_1',
        detail: 'insufficient_role',
      }),
    ])

    expect(wrapper.get('[data-testid="audit-detail"]').text()).toContain(
      '你的角色不足以执行这个操作',
    )
    expect(wrapper.get('[data-testid="audit-outcome"]').text()).toContain('被拒绝')
  })

  it('既没有对象也没有明细时显示占位符，而不是空白格子', async () => {
    const wrapper = await mountPanel([event({ action: 'mystery.event' })])

    expect(wrapper.get('[data-testid="audit-target"]').text()).toContain('—')
    expect(wrapper.get('[data-testid="audit-detail"]').text()).toContain('—')
  })
})







describe('GroupAuditPanel 筛选', () => {
  beforeEach(() => {
    vi.mocked(api.listAudit).mockReset()
    vi.mocked(api.auditFacets).mockReset()
  })

  it('事件类型筛选发给服务端，而不是在浏览器里筛当前这一页', async () => {
    const wrapper = await mountPanel([])

    await pickOption(wrapper.get('[data-testid="audit-filter-kind"]'), '成员')
    await flushPromises()

    expect(lastQuery()).toMatchObject({ actionPrefix: 'member', limit: 50 })
  })

  it('结果与时间范围同样发给服务端', async () => {
    const wrapper = await mountPanel([])

    await pickOption(wrapper.get('[data-testid="audit-filter-outcome"]'), '被拒绝')
    await flushPromises()
    expect(lastQuery()).toMatchObject({ outcome: 'denied' })

    await pickOption(wrapper.get('[data-testid="audit-filter-range"]'), '近 7 天')
    await flushPromises()

    const from = lastQuery()?.['from'] as string
    const expected = Date.now() - 7 * 24 * 60 * 60 * 1000
    expect(Math.abs(new Date(from).getTime() - expected)).toBeLessThan(60_000)
  })

  it('来源设备 / 被操作设备 / 操作者三个筛选都发给服务端', async () => {
    const wrapper = await mountPanel([event()], {
      facets: facets({
        actor_devices: { items: [{ device_id: 'web:ab12cd', count: 30 }], truncated: false },
        target_nodes: {
          items: [{ node_id: 'node_3f1a', display_name: '301班讲台机', count: 5 }],
          truncated: false,
        },
        actors: {
          items: [{ user_id: 'user_5d07', display_name: '李老师', count: 12 }],
          truncated: false,
        },
      }),
    })

    await pickOption(
      wrapper.get('[data-testid="audit-filter-actor-device"]'),
      '浏览器会话 · web:ab12cd（30）',
    )
    await flushPromises()
    expect(lastQuery()).toMatchObject({ actorDevice: 'web:ab12cd' })

    await pickOption(
      wrapper.get('[data-testid="audit-filter-target-node"]'),
      '301班讲台机（5）',
    )
    await flushPromises()
    expect(lastQuery()).toMatchObject({ targetId: 'node_3f1a' })

    await pickOption(wrapper.get('[data-testid="audit-filter-actor"]'), '李老师（12）')
    await flushPromises()
    expect(lastQuery()).toMatchObject({
      actor: 'user_5d07',
      actorDevice: 'web:ab12cd',
      targetId: 'node_3f1a',
    })
  })

  it('操作者候选解析不出昵称时回落裸 user_id，不编造名字', async () => {
    const wrapper = await mountPanel([event()], {
      facets: facets({
        actors: { items: [{ user_id: 'user_gone', display_name: null, count: 3 }], truncated: false },
      }),
    })

    await pickOption(wrapper.get('[data-testid="audit-filter-actor"]'), 'user_gone（3）')
    await flushPromises()

    expect(lastQuery()).toMatchObject({ actor: 'user_gone' })
  })

  it('候选为空时不画那个下拉（只有「全部」的筛选器是噪音）', async () => {
    const wrapper = await mountPanel([event()])

    expect(wrapper.find('[data-testid="audit-filter-actor-device"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="audit-filter-target-node"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="audit-filter-actor"]').exists()).toBe(false)
  })

  it('候选拉不到时审计照常显示（聚合查询坏了不能连带看不了审计）', async () => {
    const wrapper = await mountPanel([event()], { facets: null })

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.find('[data-testid="audit-filter-actor"]').exists()).toBe(false)
  })

  it('候选被上限截断过就说一声', async () => {
    const wrapper = await mountPanel([event()], {
      facets: facets({
        actor_devices: { items: [{ device_id: 'web:x', count: 1 }], truncated: true },
      }),
    })

    expect(wrapper.get('[data-testid="audit-facets-truncated"]').text()).toContain('前 500 项')
  })

  it('换筛选从第一页重来，不把新结果接到旧页后面', async () => {
    vi.mocked(api.listAudit)
      .mockReset()
      .mockResolvedValueOnce(auditPage(page(50), 250, 1))
      .mockResolvedValueOnce(auditPage([event({ event_id: 'evt_filtered' })], 1, 1))
    vi.mocked(api.auditFacets).mockResolvedValue(facets())

    const wrapper = await mountPanel([])
    expect(wrapper.findAll('tbody tr')).toHaveLength(50)

    await pickOption(wrapper.get('[data-testid="audit-filter-kind"]'), '成员')
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(lastQuery()).toMatchObject({ page: 1 })
  })

  it('筛完没有记录与本来就没有记录分开说', async () => {
    const wrapper = await mountPanel([])
    expect(wrapper.get('.console-empty').text()).toContain('还没有审计记录')

    await pickOption(wrapper.get('[data-testid="audit-filter-outcome"]'), '被拒绝')
    await flushPromises()

    expect(wrapper.get('.console-empty').text()).toContain('没有符合条件的记录')
  })
})

describe('GroupAuditPanel 页码翻页', () => {
  beforeEach(() => {
    vi.mocked(api.listAudit).mockReset()
    vi.mocked(api.auditFacets).mockReset()
  })

  it('顶部给出总条数，底部页码条给出当前页与总页数', async () => {
    const wrapper = await mountPanel(page(50), { total: 250 })

    expect(wrapper.text()).toContain('共 250 条')
    expect(wrapper.get('[data-testid="audit-page-summary"]').text()).toContain('第 1 / 5 页')
  })

  it('点页码跳到那一页，并把 page 交给服务端', async () => {
    const wrapper = await mountPanel(page(50), { total: 250 })

    await wrapper.get('[data-testid="audit-page-2"]').trigger('click')
    await flushPromises()

    expect(lastQuery()).toMatchObject({ page: 2 })
    expect(wrapper.get('[data-testid="audit-page-summary"]').text()).toContain('第 2 / 5 页')
  })

  it('上一页 / 下一页按位置禁用，并在加载中锁住（防连点）', async () => {
    const wrapper = await mountPanel(page(50), { total: 250 })

    
    expect(wrapper.get('[data-testid="audit-prev-page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="audit-next-page"]').attributes('disabled')).toBeUndefined()

    await wrapper.get('[data-testid="audit-next-page"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="audit-page-summary"]').text()).toContain('第 2 / 5 页')

    
    await wrapper.get('[data-testid="audit-page-5"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="audit-next-page"]').attributes('disabled')).toBeDefined()
  })

  it('只有一页时不画页码条', async () => {
    const wrapper = await mountPanel(page(3))

    expect(wrapper.find('[data-testid="audit-pager"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('共 3 条')
  })

  it('采纳服务端回显的页码：页码越界时不会被卡在一条不存在的页上', async () => {
    vi.mocked(api.listAudit)
      .mockReset()
      .mockResolvedValueOnce(auditPage(page(50), 250, 1))
      
      .mockResolvedValueOnce(auditPage(page(50), 150, 3))
    vi.mocked(api.auditFacets).mockResolvedValue(facets())

    const wrapper = await mountPanel([])
    await wrapper.get('[data-testid="audit-page-5"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="audit-page-summary"]').text()).toContain('第 3 / 3 页')
  })
})

describe('GroupAuditPanel 导出 CSV', () => {
  beforeEach(() => {
    vi.mocked(api.listAudit).mockReset()
    vi.mocked(api.auditFacets).mockReset()
  })

  it('导出的是当前筛选下的记录，并且带上人话列', async () => {
    const createObjectURL = mockDownload()
    const clickSpy = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {})

    try {
      const wrapper = await mountPanel([], { groupName: '物理实验室' })
      vi.mocked(api.listAudit)
        .mockReset()
        .mockResolvedValueOnce(
          auditPage([
            event({
              action: 'member.role_change',
              target_id: 'user_5d07',
              detail: 'Operator->Admin',
            }),
          ]),
        )
        
        .mockResolvedValue(auditPage([]))

      await wrapper.get('[data-testid="audit-export"]').trigger('click')
      await flushPromises()

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      const csv = await (createObjectURL.mock.calls[0]?.[0] as Blob).text()
      expect(csv.split('\r\n')[0]).toBe(
        'time,event_id,action,action_label,outcome,outcome_label,target_kind,target_id,target_display_name,detail,detail_label,actor_user_id,actor_display_name,actor_device_id',
      )
      expect(csv).toContain('member.role_change,变更角色,success,成功,member,user_5d07')
      expect(csv).toContain('Operator->Admin,角色 操作者 → 管理员')

      expect(wrapper.get('[data-testid="audit-export-notice"]').text()).toContain('已导出 1 条')
    } finally {
      clickSpy.mockRestore()
    }
  })

  it('导出按筛选条件逐页取回全部记录，而不是只导当前这一页', async () => {
    const createObjectURL = mockDownload()
    const clickSpy = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {})

    try {
      const wrapper = await mountPanel([])

      vi.mocked(api.listAudit)
        .mockReset()
        .mockResolvedValueOnce(auditPage(page(500)))
        .mockResolvedValueOnce(auditPage([event({ event_id: 'evt_last' })]))
        
        .mockResolvedValue(auditPage([]))

      await wrapper.get('[data-testid="audit-export"]').trigger('click')
      await flushPromises()

      const calls = vi.mocked(api.listAudit).mock.calls
      expect(calls).toHaveLength(3)
      expect(calls[0]?.[1]).toMatchObject({ limit: 500 })
      
      
      expect(calls[1]?.[1]).toMatchObject({ limit: 500, beforeId: 'evt_499' })
      expect(calls[2]?.[1]).toMatchObject({ beforeId: 'evt_last' })
      expect(wrapper.get('[data-testid="audit-export-notice"]').text()).toContain('已导出 501 条')

      const csv = await (createObjectURL.mock.calls[0]?.[0] as Blob).text()
      
      expect(csv.split('\r\n').filter((line) => line.length > 0)).toHaveLength(502)
    } finally {
      clickSpy.mockRestore()
    }
  })

  





  it('服务端每页给的比请求的少时，仍然取到底', async () => {
    const createObjectURL = mockDownload()
    const clickSpy = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {})

    try {
      const wrapper = await mountPanel([])
      vi.mocked(api.listAudit)
        .mockReset()
        .mockResolvedValueOnce(auditPage(page(3)))
        .mockResolvedValueOnce(auditPage(page(3)))
        .mockResolvedValue(auditPage([]))

      await wrapper.get('[data-testid="audit-export"]').trigger('click')
      await flushPromises()

      expect(vi.mocked(api.listAudit).mock.calls).toHaveLength(3)
      expect(wrapper.get('[data-testid="audit-export-notice"]').text()).toContain('已导出 6 条')
      const csv = await (createObjectURL.mock.calls[0]?.[0] as Blob).text()
      expect(csv.split('\r\n').filter((line) => line.length > 0)).toHaveLength(7)
    } finally {
      clickSpy.mockRestore()
    }
  })

  it('导出时冻结筛选条件：中途改筛选不会让文件里混两种口径', async () => {
    mockDownload()
    const clickSpy = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(() => {})

    try {
      const wrapper = await mountPanel([])

      const pending: ((value: AuditPageDto) => void)[] = []
      vi.mocked(api.listAudit)
        .mockReset()
        .mockImplementation(() => new Promise<AuditPageDto>((resolve) => pending.push(resolve)))

      void wrapper.get('[data-testid="audit-export"]').trigger('click')
      await flushPromises()

      
      await pickOption(wrapper.get('[data-testid="audit-filter-outcome"]'), '被拒绝')
      await flushPromises()

      
      pending[0]?.(auditPage([event()]))
      await flushPromises()

      expect(vi.mocked(api.listAudit).mock.calls[0]?.[1]).not.toHaveProperty('outcome')
    } finally {
      clickSpy.mockRestore()
    }
  })

  it('当前筛选没有记录时不下载，只说明原因', async () => {
    const createObjectURL = mockDownload()

    const wrapper = await mountPanel([])
    await wrapper.get('[data-testid="audit-export"]').trigger('click')
    await flushPromises()

    expect(createObjectURL).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="audit-export-notice"]').text()).toContain('没有可导出的内容')
  })

  it('导出中途失败时说清楚失败，并且不落地半个文件', async () => {
    const createObjectURL = mockDownload()

    const wrapper = await mountPanel([])
    vi.mocked(api.listAudit)
      .mockReset()
      .mockResolvedValueOnce(auditPage(page(500)))
      .mockRejectedValueOnce(new Error('boom'))

    await wrapper.get('[data-testid="audit-export"]').trigger('click')
    await flushPromises()

    expect(createObjectURL).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="audit-export-notice"]').text()).toContain('导出中断')
  })
})
