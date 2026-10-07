import { describe, expect, it } from 'vitest'
import { ROSTER_CSV_COLUMNS, rosterCsvFileName, toRosterCsv } from './roster-export'
import {
  buildRosterImportDraft,
  parseCsvWorkbook,
  suggestHeaderRow,
  suggestMapping,
} from './roster-sheet'
import type { NodeRosterMemberDto } from '@/api/protocol'






function student(overrides: Partial<NodeRosterMemberDto> = {}): NodeRosterMemberDto {
  return {
    id: '01',
    name: '张三',
    gender: '男',
    group: 'A',
    count: null,
    weight: null,
    enabled: true,
    ...overrides,
  }
}

function prize(overrides: Partial<NodeRosterMemberDto> = {}): NodeRosterMemberDto {
  return {
    id: 'p1',
    name: '一等奖',
    gender: null,
    group: null,
    count: 2,
    weight: 1.5,
    enabled: true,
    ...overrides,
  }
}


function rows(csv: string): string[] {
  return csv
    .replace(/^\uFEFF/, '')
    .split('\r\n')
    .filter((line) => line.length > 0)
}

describe('toRosterCsv', () => {
  it('表头按客户端名单表格的列序，学生与奖项各一套', () => {
    expect(rows(toRosterCsv([student()], 'students'))[0]).toBe('enabled,id,name,gender,group,tags')
    expect(rows(toRosterCsv([prize()], 'prizes'))[0]).toBe('enabled,id,name,count,weight,tags')
    
    expect(ROSTER_CSV_COLUMNS.students).not.toContain('count')
    expect(ROSTER_CSV_COLUMNS.prizes).not.toContain('gender')
  })

  it('学生：启用写成 1/0，空字段留空单元，标签用逗号加空格连接', () => {
    const csv = toRosterCsv(
      [
        student({ tags: ['班长', '数学课代表'] }),
        student({ id: null, name: '李四', gender: null, group: null, enabled: false }),
      ],
      'students',
    )

    expect(rows(csv)[1]).toBe('1,01,张三,男,A,"班长, 数学课代表"')
    expect(rows(csv)[2]).toBe('0,,李四,,,')
  })

  it('奖项：数量与权重按数字导出', () => {
    const csv = toRosterCsv([prize(), prize({ id: 'p2', count: null, weight: null })], 'prizes')
    expect(rows(csv)[1]).toBe('1,p1,一等奖,2,1.5,')
    expect(rows(csv)[2]).toBe('1,p2,一等奖,,,')
  })

  it('标签里带引号时按 RFC 4180 翻倍转义', () => {
    const csv = toRosterCsv([student({ name: '带"引号"的人', tags: ['a"b'] })], 'students')
    expect(rows(csv)[1]).toBe('1,01,"带""引号""的人",男,A,"a""b"')
  })

  it('名称里有逗号或换行时整格加引号', () => {
    const csv = toRosterCsv([student({ name: '张三,李四' }), student({ name: '两\n行' })], 'students')
    expect(rows(csv)).toContain('1,01,"张三,李四",男,A,')
    expect(csv).toContain('"两\n行"')
  })

  it('以 CRLF 结束每一行（RFC 4180），文件末尾也是', () => {
    const csv = toRosterCsv([student()], 'students')
    expect(csv.endsWith('\r\n')).toBe(true)
    expect(csv.split('\r\n')).toHaveLength(3)
  })

  it('空草稿不给文件：只带表头的 CSV 会被当成"导成功了但没内容"', () => {
    expect(toRosterCsv([], 'students')).toBe('')
    expect(toRosterCsv([], 'prizes')).toBe('')
  })

  it('带 UTF-8 BOM：Excel 否则会按代码页猜，中文姓名变乱码', () => {
    expect(toRosterCsv([student()], 'students').startsWith('\uFEFF')).toBe(true)
    
    expect(toRosterCsv([], 'students')).toBe('')
  })

  it('导出的文件能原样导回来（BOM 被逐格 trim 吃掉）', () => {
    const members = [
      student({ tags: ['班长', '数学课代表'] }),
      student({ id: null, name: '李四', gender: null, group: null, enabled: false }),
    ]
    const csv = toRosterCsv(members, 'students')

    const sheet = parseCsvWorkbook(csv, '导出的名单').sheets[0]
    expect(sheet).toBeDefined()

    const headerRow = suggestHeaderRow(sheet!, 'students')
    expect(headerRow).toBe(0)

    const draft = buildRosterImportDraft(
      sheet!,
      {
        sheetIndex: 0,
        headerRow,
        firstDataRow: (headerRow ?? 0) + 1,
        lastDataRow: null,
        columns: suggestMapping(sheet!.rows[0] ?? [], 'students'),
      },
      'students',
    )

    expect(draft.problems).toEqual([])
    expect(draft.members).toHaveLength(2)
    expect(draft.members[0]?.enabled).toBe(true)
    expect(draft.members[0]?.tags).toEqual(['班长', '数学课代表'])
    
    expect(draft.members[1]?.enabled).toBe(false)
    expect(draft.members[1]?.name).toBe('李四')
  })
})

describe('rosterCsvFileName', () => {
  it('带上种类与名单名', () => {
    expect(rosterCsvFileName('students', '高一（1）班')).toBe('roster-students-高一（1）班.csv')
    expect(rosterCsvFileName('prizes', '元旦奖池')).toBe('roster-prizes-元旦奖池.csv')
  })

  it('名单名里的非法字符换成下划线，绝不拼出空片段', () => {
    expect(rosterCsvFileName('students', 'a/b:c*?')).toBe('roster-students-a_b_c__.csv')
    expect(rosterCsvFileName('students', '   ')).toBe('roster-students.csv')
    expect(rosterCsvFileName('prizes', null)).toBe('roster-prizes.csv')
  })
})
