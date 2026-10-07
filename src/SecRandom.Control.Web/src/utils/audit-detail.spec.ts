import { describe, expect, it } from 'vitest'
import { createAppI18n } from '@/i18n'
import type { AuditEventDto } from '@/api/protocol'
import {
  auditTargetKind,
  describeAuditAction,
  describeAuditDetail,
  describeAuditTarget,
  type AuditTranslator,
} from './audit-detail'








const app = createAppI18n('zh-CN')
const zh: AuditTranslator = {
  t: (key, params) => app.global.t(key, params as never) as string,
  te: (key) => app.global.te(key),
  tm: (key) => app.global.tm(key),
}

function event(overrides: Partial<AuditEventDto> = {}): AuditEventDto {
  return {
    event_id: 'evt_1',
    at: '2026-10-04T11:51:22Z',
    actor_user_id: 'user_actor',
    action: 'group.create',
    outcome: 'success',
    ...overrides,
  }
}

const MEMBER_ID = 'user_5d0712345678'

describe('auditTargetKind 事件作用在哪一类对象上', () => {
  it('按事件名前缀分类', () => {
    expect(auditTargetKind('member.role_change', 'success')).toBe('member')
    expect(auditTargetKind('node.policy_change', 'denied')).toBe('node')
    expect(auditTargetKind('invite.create', 'success')).toBe('invite')
    expect(auditTargetKind('transfer.request', 'success')).toBe('transfer')
    expect(auditTargetKind('group.rename', 'success')).toBe('group')
  })

  



  it('member.join 成功时对象是人，被拒时对象是邀请码', () => {
    expect(auditTargetKind('member.join', 'success')).toBe('member')
    expect(auditTargetKind('member.join', 'denied')).toBe('invite')
  })

  it('不认识的事件返回 null，由界面显示占位符', () => {
    expect(auditTargetKind('something.else', 'success')).toBeNull()
  })
})

describe('describeAuditTarget 对象列', () => {
  it('成员：有展示名时同时给出裸 user_id', () => {
    const view = describeAuditTarget(
      event({
        action: 'member.role_change',
        target_id: MEMBER_ID,
        target_display_name: '黎泽毅_Aionflux',
      }),
    )

    expect(view?.kind).toBe('member')
    expect(view?.labelKey).toBe('audit.targetMember')
    expect(view?.name).toBe('黎泽毅_Aionflux')
    expect(view?.id).toBe(MEMBER_ID)
  })

  it('解析不出展示名时只给裸 user_id，不编造名字', () => {
    const view = describeAuditTarget(event({ action: 'member.remove', target_id: MEMBER_ID }))

    expect(view?.name).toBeNull()
    expect(view?.id).toBe(MEMBER_ID)
  })

  it('节点：显示设备名与 node_id', () => {
    const view = describeAuditTarget(
      event({
        action: 'node.policy_change',
        outcome: 'denied',
        target_id: 'node_3f1a',
        target_display_name: '301班讲台机',
      }),
    )

    expect(view?.kind).toBe('node')
    expect(view?.name).toBe('301班讲台机')
    expect(view?.id).toBe('node_3f1a')
  })

  



  it('转让：展示名不挂到转让 ID 上', () => {
    const view = describeAuditTarget(
      event({
        action: 'transfer.request',
        target_id: 'trf_01ab30b332e6',
        detail: 'user_recipient',
        target_display_name: '李老师',
      }),
    )

    expect(view?.kind).toBe('transfer')
    expect(view?.name).toBeNull()
    expect(view?.id).toBe('trf_01ab30b332e6')
  })

  it('本组事件没有对象标识时也不崩：给出类型标签、id 为空', () => {
    const view = describeAuditTarget(event({ action: 'group.create' }))

    expect(view?.labelKey).toBe('audit.targetGroup')
    expect(view?.id).toBe('')
  })

  it('不认识的事件返回 null', () => {
    expect(describeAuditTarget(event({ action: 'mystery.event' }))).toBeNull()
  })
})

describe('describeAuditDetail 明细列', () => {
  it('角色变更：把 Owner->Admin 说成"角色 创建者 → 管理员"', () => {
    const view = describeAuditDetail(
      event({ action: 'member.role_change', target_id: MEMBER_ID, detail: 'Owner->Admin' }),
      zh,
    )

    expect(view?.text).toBe('角色 创建者 → 管理员')
    
    expect(view?.raw).toBe('Owner->Admin')
  })

  it('移除成员：带上被移除时的角色', () => {
    const view = describeAuditDetail(
      event({ action: 'member.remove', target_id: MEMBER_ID, detail: 'Operator' }),
      zh,
    )

    expect(view?.text).toBe('被移除时的角色：操作者')
  })

  it('加入组：邀请角色', () => {
    const view = describeAuditDetail(
      event({ action: 'member.join', outcome: 'success', target_id: 'user_new', detail: 'Viewer' }),
      zh,
    )

    expect(view?.text).toBe('以 查看者 身份加入')
  })

  it('加入组被拒：内部原因码也有说法', () => {
    const view = describeAuditDetail(
      event({
        action: 'member.join',
        outcome: 'denied',
        target_id: 'ABCD2345',
        detail: 'expected_user_mismatch',
      }),
      zh,
    )

    expect(view?.text).toContain('指定账号')
    expect(view?.raw).toBe('expected_user_mismatch')
  })

  it('加入组被拒：错误码走 errors 的既有译文', () => {
    const view = describeAuditDetail(
      event({ action: 'member.join', outcome: 'denied', detail: 'already_member' }),
      zh,
    )

    expect(view?.text).toBe('你已经是该组成员')
  })

  it('创建邀请：角色', () => {
    const view = describeAuditDetail(
      event({ action: 'invite.create', target_id: 'ABCD2345', detail: 'Admin' }),
      zh,
    )

    expect(view?.text).toBe('邀请角色：管理员')
  })

  it('改名：新组名', () => {
    const view = describeAuditDetail(event({ action: 'group.rename', detail: '物理实验室' }), zh)

    expect(view?.text).toBe('改名为「物理实验室」')
    
    expect(view?.raw).toBeNull()
  })

  it('下发策略：能力名翻成人话', () => {
    const view = describeAuditDetail(
      event({ action: 'node.policy_change', target_id: 'node_1', detail: 'draw.lock:action' }),
      zh,
    )

    expect(view?.text).toBe('下发 禁止 / 允许抽取')
    expect(view?.raw).toBe('draw.lock:action')
  })

  it('读取能力：查询型命令说"读取"', () => {
    const view = describeAuditDetail(
      event({ action: 'node.policy_change', target_id: 'node_1', detail: 'node.status.read:query' }),
      zh,
    )

    expect(view?.text).toBe('读取 读取状态')
  })

  it('期望状态：布尔值翻成是/否', () => {
    const on = describeAuditDetail(
      event({ action: 'node.policy_change', target_id: 'node_1', detail: 'draw_locked=True' }),
      zh,
    )
    const off = describeAuditDetail(
      event({ action: 'node.policy_change', target_id: 'node_1', detail: 'draw_locked=False' }),
      zh,
    )

    expect(on?.text).toBe('期望状态：禁止抽取 = 是')
    expect(off?.text).toBe('期望状态：禁止抽取 = 否')
  })

  



  it('被拒的能力下发：枚举形式的原因码也能读', () => {
    const view = describeAuditDetail(
      event({ action: 'node.policy_change', outcome: 'denied', detail: 'draw.lock:InsufficientRole' }),
      zh,
    )

    expect(view?.text).toBe('尝试 禁止 / 允许抽取 被拒：你的角色不足以执行这个操作')
    expect(view?.raw).toBe('draw.lock:InsufficientRole')
  })

  it('被拒的能力下发：授权门自己的原因单独有说法', () => {
    const view = describeAuditDetail(
      event({ action: 'node.policy_change', outcome: 'denied', detail: 'draw.lock:NotAGroupMember' }),
      zh,
    )

    expect(view?.text).toBe('尝试 禁止 / 允许抽取 被拒：操作者不是该组成员')
  })

  it('帧超限：把实际字节与上限一起给出来', () => {
    const view = describeAuditDetail(
      event({
        action: 'node.policy_change',
        outcome: 'failed',
        detail: 'roster.write:payload_too_large:2048>65536',
      }),
      zh,
    )

    expect(view?.text).toContain('帧过大（2048>65536）')
  })

  it('转让确认：对手方是详情里那个 user_id', () => {
    const view = describeAuditDetail(
      event({
        action: 'transfer.confirm',
        target_id: 'trf_1',
        detail: 'user_owner',
        target_display_name: '张老师',
      }),
      zh,
    )

    expect(view?.text).toBe('原创建者：张老师')
    expect(view?.raw).toBe('user_owner')
  })

  it('转让发起：解析不出对手方名字时回落裸 user_id', () => {
    const view = describeAuditDetail(
      event({ action: 'transfer.request', target_id: 'trf_1', detail: 'user_recipient' }),
      zh,
    )

    expect(view?.text).toBe('受让方：user_recipient')
  })

  it('节点登记：四种方式各有文案', () => {
    const text = (detail: string): string | undefined =>
      describeAuditDetail(event({ action: 'node.register', detail }), zh)?.text

    expect(text('auto')).toBe('设备上线时自动登记')
    expect(text('new')).toBe('首次登记')
    expect(text('update')).toBe('设备信息更新')
    expect(text('unregister')).toBe('注销登记')
  })

  it('被拒的操作：明细就是错误码，直接复用 errors 的译文', () => {
    const view = describeAuditDetail(
      event({ action: 'member.remove', outcome: 'denied', detail: 'owner_cannot_be_removed' }),
      zh,
    )

    expect(view?.text).toBe('创建者不能被移除，否则组会变成无主状态')
    expect(view?.raw).toBe('owner_cannot_be_removed')
  })

  




  it('认不出来的明细原样显示，不吞掉', () => {
    const view = describeAuditDetail(event({ action: 'member.join', detail: 'brand_new_reason' }), zh)

    expect(view?.text).toBe('brand_new_reason')
    expect(view?.raw).toBeNull()
  })

  it('没有明细时返回 null', () => {
    expect(describeAuditDetail(event({ action: 'invite.revoke' }), zh)).toBeNull()
    expect(describeAuditDetail(event({ action: 'invite.revoke', detail: '   ' }), zh)).toBeNull()
  })

  it('英文语言包同样能读（新键真的被翻译，不是回落中文）', () => {
    const en = createAppI18n('en-US')
    const translator: AuditTranslator = {
      t: (key, params) => en.global.t(key, params as never) as string,
      te: (key) => en.global.te(key),
      tm: (key) => en.global.tm(key),
    }

    const view = describeAuditDetail(
      event({ action: 'member.role_change', detail: 'Owner->Admin' }),
      translator,
    )

    expect(view?.text).toBe('Role Owner → Admin')
  })

  



  it('撤销命令：事件名翻成人话，不是原始动作码', () => {
    expect(describeAuditAction('node.command_revoke', zh)).toBe('撤销命令')
  })

  



  it('撤销命令：能力名翻成人话，命令 ID 原样保留', () => {
    const view = describeAuditDetail(
      event({
        action: 'node.command_revoke',
        target_id: 'node_1',
        detail: 'draw.trigger:revoke:cmd_01ab30b332e6',
      }),
      zh,
    )

    expect(view?.text).toBe(
      '撤销了 触发一次抽取 的排队命令（cmd_01ab30b332e6），设备上线后不会执行它',
    )
    
    expect(view?.raw).toBe('draw.trigger:revoke:cmd_01ab30b332e6')
  })

  







  it('三段能力名（draw.trigger.conditions）翻成人话，不是原始 key', () => {
    const policy = describeAuditDetail(
      event({ action: 'node.policy_change', target_id: 'node_1', detail: 'draw.trigger.conditions:action' }),
      zh,
    )
    expect(policy?.text).toContain('抽奖筛选条件')
    expect(policy?.text).not.toContain('draw.trigger.conditions')

    const revoked = describeAuditDetail(
      event({
        action: 'node.command_revoke',
        target_id: 'node_1',
        detail: 'draw.trigger.conditions:revoke:cmd_9f8e7d6c5b4a',
      }),
      zh,
    )
    expect(revoked?.text).toContain('抽奖筛选条件')
    expect(revoked?.text).not.toContain('draw.trigger.conditions')
    
    expect(revoked?.raw).toBe('draw.trigger.conditions:revoke:cmd_9f8e7d6c5b4a')
  })

  



  it('认不出的能力名原样回落，不返回空串', () => {
    const view = describeAuditDetail(
      event({ action: 'node.policy_change', target_id: 'node_1', detail: 'brand_new_capability:action' }),
      zh,
    )
    expect(view?.text).toContain('brand_new_capability')
  })

  



  it('撤销命令：明细形状不认识时原样显示，不编造', () => {
    const view = describeAuditDetail(
      event({ action: 'node.command_revoke', target_id: 'node_1', detail: 'draw.trigger:revoke' }),
      zh,
    )

    expect(view?.text).toBe('draw.trigger:revoke')
    expect(view?.raw).toBeNull()
  })
})
