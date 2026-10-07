import { describe, expect, it } from 'vitest'
import { AUDIT_CSV_COLUMNS, auditCsvFileName, toAuditCsv } from './audit-export'
import type { AuditTranslator } from './audit-detail'
import { createAppI18n } from '@/i18n'
import type { AuditEventDto } from '@/api/protocol'







const app = createAppI18n('zh-CN')
const zh: AuditTranslator = {
  t: (key, params) => app.global.t(key, params as never) as string,
  te: (key) => app.global.te(key),
  tm: (key) => app.global.tm(key),
}

function event(overrides: Partial<AuditEventDto> = {}): AuditEventDto {
  return {
    event_id: 'evt_1',
    at: '2026-10-05T06:03:22.123+00:00',
    actor_user_id: 'user_actor',
    actor_device_id: 'web:ab12cd',
    action: 'member.role_change',
    outcome: 'success',
    target_id: 'user_5d07',
    target_display_name: '李老师',
    detail: 'Operator->Admin',
    ...overrides,
  }
}


function rows(csv: string): string[] {
  return csv
    .replace(/^\uFEFF/, '')
    .split('\r\n')
    .filter((line) => line.length > 0)
}


function columns(csv: string): Record<string, string> {
  const [header, first] = rows(csv)
  const names = header!.split(',')
  const values = first!.split(',')
  return Object.fromEntries(names.map((name, index) => [name, values[index] ?? '']))
}

describe('toAuditCsv 表头与列', () => {
  it('表头只能是英文列名（列名是数据格式，不是界面文案）', () => {
    const csv = toAuditCsv([event()], zh)
    expect(rows(csv)[0]).toBe(AUDIT_CSV_COLUMNS.join(','))
  })

  it('每条记录一行，机器列与人话列都给出来', () => {
    const csv = toAuditCsv([event()], zh)

    expect(rows(csv)).toHaveLength(2)
    expect(columns(csv)).toEqual({
      time: '2026-10-05T06:03:22.123+00:00',
      event_id: 'evt_1',
      action: 'member.role_change',
      action_label: '变更角色',
      outcome: 'success',
      outcome_label: '成功',
      target_kind: 'member',
      target_id: 'user_5d07',
      target_display_name: '李老师',
      
      detail: 'Operator->Admin',
      detail_label: '角色 操作者 → 管理员',
      actor_user_id: 'user_actor',
      actor_display_name: '',
      actor_device_id: 'web:ab12cd',
    })
  })

  it('被拒事件的对象类型按"邀请码"算，与界面上的「对象」列一致', () => {
    const csv = toAuditCsv(
      [
        event({
          action: 'member.join',
          outcome: 'denied',
          target_id: 'ABCD2345',
          detail: 'already_member',
          target_display_name: null,
        }),
      ],
      zh,
    )

    expect(columns(csv)['target_kind']).toBe('invite')
    expect(columns(csv)['detail_label']).toBe('你已经是该组成员')
  })

  it('翻不出来的明细原样进 CSV，而不是"未知"', () => {
    const csv = toAuditCsv([event({ action: 'member.join', detail: 'brand_new_reason' })], zh)

    expect(columns(csv)['detail_label']).toBe('brand_new_reason')
  })

  it('空记录返回空串：一个只有表头的文件比没有文件更让人困惑', () => {
    expect(toAuditCsv([], zh)).toBe('')
  })
})

describe('toAuditCsv 文件格式', () => {
  it('带 UTF-8 BOM 且以 CRLF 结尾（Excel 才不会把中文当乱码）', () => {
    const csv = toAuditCsv([event()], zh)

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('含逗号 / 引号 / 换行的单元格按 RFC 4180 转义', () => {
    const csv = toAuditCsv([event({ action: 'group.rename', detail: '高二,3"班"\n下一行' })], zh)

    expect(csv).toContain('"高二,3""班""\n下一行"')
  })

  



  it('以 = + - @ 开头的单元格被加前导单引号，Excel 不会当公式执行', () => {
    const csv = toAuditCsv(
      [
        event({ action: 'group.create', detail: '=HYPERLINK("http://evil","点我")' }),
        event({ event_id: 'evt_2', action: 'group.rename', detail: '+41' }),
        event({ event_id: 'evt_3', action: 'group.rename', detail: '@SUM(1)' }),
        event({ event_id: 'evt_4', action: 'group.rename', detail: '-2+3' }),
      ],
      zh,
    )

    expect(csv).toContain("'=HYPERLINK")
    expect(csv).toContain("'+41")
    expect(csv).toContain("'@SUM(1)")
    expect(csv).toContain("'-2+3")
    
    expect(csv).toContain('组名「=HYPERLINK')
  })

  it('昵称里的公式同样被挡住（昵称是成员自己设的）', () => {
    const csv = toAuditCsv([event({ actor_display_name: '=cmd|calc' })], zh)

    expect(csv).toContain("'=cmd|calc")
  })
})

describe('auditCsvFileName', () => {
  const at = new Date(2026, 9, 5, 14, 3)

  it('组名与时间戳都在文件名里（同一天导多次不会互相覆盖）', () => {
    expect(auditCsvFileName('物理实验室', at)).toBe('audit-物理实验室-20261005-1403.csv')
  })

  it('月/日/时/分补零', () => {
    expect(auditCsvFileName(null, new Date(2026, 0, 2, 3, 4))).toBe('audit-20260102-0304.csv')
  })

  it('组名取不到时只留时间戳，不拼出 audit--.csv', () => {
    expect(auditCsvFileName(null, at)).toBe('audit-20261005-1403.csv')
    expect(auditCsvFileName('   ', at)).toBe('audit-20261005-1403.csv')
  })

  it('文件名里不能出现的字符被替换', () => {
    expect(auditCsvFileName('a/b:c*?', at)).toBe('audit-a_b_c__-20261005-1403.csv')
  })
})
