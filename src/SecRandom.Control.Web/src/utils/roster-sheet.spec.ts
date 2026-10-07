import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import {
  ROSTER_MAX_ROWS,
  buildRosterImportDraft,
  parseCsvWorkbook,
  parseWorkbook,
  suggestHeaderRow,
  suggestMapping,
} from './roster-sheet'
import type { RosterRegionSpec, RosterSheet } from './roster-sheet'










function xlsxOf(
  sheets: readonly { name: string; rows: unknown[][] }[],
  bookType: 'xlsx' | 'xls' = 'xlsx',
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name)
  }
  return XLSX.write(workbook, { type: 'array', bookType }) as ArrayBuffer
}

function sheetOf(rows: string[][]): RosterSheet {
  return { name: '名单', rows }
}

function regionOf(overrides: Partial<RosterRegionSpec> = {}): RosterRegionSpec {
  return {
    sheetIndex: overrides.sheetIndex ?? 0,
    
    headerRow: overrides.headerRow === undefined ? 0 : overrides.headerRow,
    firstDataRow: overrides.firstDataRow ?? 1,
    lastDataRow: overrides.lastDataRow === undefined ? null : overrides.lastDataRow,
    columns: overrides.columns ?? {},
  }
}

describe('parseWorkbook', () => {
  it('多个工作表都读回来（表名与内容一一对应）', () => {
    const workbook = parseWorkbook(
      xlsxOf([
        { name: '高一(1)班', rows: [['学号', '姓名'], [1001, '张三']] },
        { name: '高一(2)班', rows: [['学号', '姓名'], [2001, '李四']] },
      ]),
    )

    expect(workbook?.sheets.map((sheet) => sheet.name)).toEqual(['高一(1)班', '高一(2)班'])
    expect(workbook?.sheets[0]?.rows).toEqual([
      ['学号', '姓名'],
      ['1001', '张三'],
    ])
    expect(workbook?.sheets[1]?.rows).toEqual([
      ['学号', '姓名'],
      ['2001', '李四'],
    ])
  })

  it('数字单元格按文本读：学号 1001 与「007」都保持原样，不再当数字', () => {
    const workbook = parseWorkbook(xlsxOf([{ name: 'S', rows: [['0010', 1001, 1.5]] }]))

    expect(workbook?.sheets[0]?.rows).toEqual([['0010', '1001', '1.5']])
  })

  it('参差的行补齐成矩形，整行为空的行丢掉', () => {
    const workbook = parseWorkbook(
      xlsxOf([{ name: 'S', rows: [['学号', '姓名', '性别'], [1001], [], ['', ' ', ''], [1002, '李四']] }]),
    )

    
    expect(workbook?.sheets[0]?.rows).toEqual([
      ['学号', '姓名', '性别'],
      ['1001', '', ''],
      ['1002', '李四', ''],
    ])
  })

  it('.xls（BIFF8）走同一条路', () => {
    const workbook = parseWorkbook(
      xlsxOf([{ name: 'S', rows: [['学号', '姓名'], [1001, '张三']] }], 'xls'),
    )

    expect(workbook?.sheets[0]?.rows).toEqual([
      ['学号', '姓名'],
      ['1001', '张三'],
    ])
  })

  it('有工作表但一行都没有：是空表，不是读失败', () => {
    const workbook = parseWorkbook(xlsxOf([{ name: '空表', rows: [[]] }]))

    expect(workbook?.sheets.map((sheet) => sheet.name)).toEqual(['空表'])
    expect(workbook?.sheets[0]?.rows).toEqual([])
  })

  it('读不了的文件返回 null，而不是一份空名单', () => {
    const good = xlsxOf([{ name: 'S', rows: [['学号'], [1001]] }])

    
    expect(parseWorkbook(good.slice(0, 80))).toBeNull()
    expect(parseWorkbook(new ArrayBuffer(0))).toBeNull()
  })
})

describe('parseCsvWorkbook', () => {
  it('双引号包裹 + "" 转义 + CRLF 行尾', () => {
    const workbook = parseCsvWorkbook('学号,姓名\r\n1001,"张""三"\r\n1002,李四\r\n', '高一(1)班')

    expect(workbook.sheets).toHaveLength(1)
    expect(workbook.sheets[0]?.name).toBe('高一(1)班')
    expect(workbook.sheets[0]?.rows).toEqual([
      ['学号', '姓名'],
      ['1001', '张"三'],
      ['1002', '李四'],
    ])
  })

  it('引号里的逗号不拆列；空行与末尾空字段不产生假列', () => {
    const workbook = parseCsvWorkbook('id,name\n1,"张三, 男"\n\n2,\n')

    expect(workbook.sheets[0]?.rows).toEqual([
      ['id', 'name'],
      ['1', '张三, 男'],
      ['2', ''],
    ])
  })

  it('引号里的换行会被拆成两行（已知限制：不做字段内换行）', () => {
    
    const workbook = parseCsvWorkbook('a,"x\ny",b')

    expect(workbook.sheets[0]?.rows).toHaveLength(2)
  })

  it('没给表名时用默认名：界面上的标签页总要有东西显示', () => {
    expect(parseCsvWorkbook('a,b').sheets[0]?.name).toBe('CSV')
  })
})

describe('suggestHeaderRow', () => {
  it('表头就在第 0 行', () => {
    const sheet = sheetOf([
      ['学号', '姓名', '性别'],
      ['1001', '张三', '男'],
    ])

    expect(suggestHeaderRow(sheet, 'students')).toBe(0)
  })

  it('英文表头同样认', () => {
    expect(suggestHeaderRow(sheetOf([['ID', 'Name', 'Gender']]), 'students')).toBe(0)
  })

  it('前面几行是题头时认出第 3 行', () => {
    const sheet = sheetOf([
      ['某某中学 2024 秋季名单'],
      ['导出时间：2024-09-01'],
      ['备注：仅作示例'],
      ['学号', '姓名', '性别'],
      ['1001', '张三', '男'],
    ])

    expect(suggestHeaderRow(sheet, 'students')).toBe(3)
  })

  it('没有任何一行像表头时返回 null（而不是硬指第 0 行）', () => {
    const sheet = sheetOf([
      ['张三', '一班', '男'],
      ['李四', '二班', '女'],
    ])

    expect(suggestHeaderRow(sheet, 'students')).toBeNull()
  })

  it('只有一格像关键词时不算表头：阈值是两个', () => {
    
    expect(suggestHeaderRow(sheetOf([['序号', '备注'], ['1', 'x']]), 'students')).toBeNull()
  })

  it('只在最前面 10 行里找', () => {
    const rows = Array.from({ length: 10 }, (_, index) => [`标题${index}`])
    rows.push(['学号', '姓名'])

    expect(suggestHeaderRow(sheetOf(rows), 'students')).toBeNull()
  })
})

describe('suggestMapping', () => {
  it('中文表头：每一列都落在自己的单元格上', () => {
    expect(suggestMapping(['学号', '姓名', '性别', '班级', '启用'], 'students')).toEqual({
      id: 0,
      name: 1,
      gender: 2,
      group: 3,
      enabled: 4,
    })
  })

  it('英文表头：八列全中', () => {
    expect(
      suggestMapping(
        ['id', 'name', 'gender', 'group', 'enabled', 'count', 'weight', 'tags'],
        'prizes',
      ),
    ).toEqual({ id: 0, name: 1, gender: 2, group: 3, enabled: 4, count: 5, weight: 6, tags: 7 })
  })

  it('奖品表与学生表对"名字列"的偏好不同', () => {
    const headers = ['名称', '姓名', '数量', '权重']

    
    expect(suggestMapping(headers, 'students')).toEqual({ name: 1, count: 2, weight: 3 })
    expect(suggestMapping(headers, 'prizes')).toEqual({ name: 0, count: 2, weight: 3 })
  })

  it('另一种类的名字词仍然能映射：加权只影响优先级，不改变命中', () => {
    
    expect(suggestMapping(['奖项', '数量'], 'students')).toEqual({ name: 0, count: 1 })
  })

  it('一个单元格只喂给一列', () => {
    
    expect(suggestMapping(['学生数'], 'students')).toEqual({ name: 0 })
  })

  it('认不出的表头不进映射', () => {
    expect(suggestMapping(['备注', '联系方式'], 'students')).toEqual({})
  })
})

describe('buildRosterImportDraft', () => {
  it('按区域读出一份完整草稿（含标签与宽容的启用列）', () => {
    const sheet = sheetOf([
      ['学号', '姓名', '性别', '班级', '启用', '数量', '权重', '标签'],
      ['1001', '张三', '男', '一班', '是', '2', '0.5', '尖子, 组长'],
      ['1002', '李四', '', '', '否', '', '', ''],
    ])
    const columns = { id: 0, name: 1, gender: 2, group: 3, enabled: 4, count: 5, weight: 6, tags: 7 }

    const draft = buildRosterImportDraft(sheet, regionOf({ columns }), 'students')

    expect(draft.problems).toEqual([])
    expect(draft.skippedRows).toBe(0)
    expect(draft.mapping).toEqual(columns)
    expect(draft.members).toEqual([
      {
        id: '1001',
        name: '张三',
        gender: '男',
        group: '一班',
        count: 2,
        weight: 0.5,
        enabled: true,
        tags: ['尖子', '组长'],
      },
      {
        id: '1002',
        name: '李四',
        gender: null,
        group: null,
        count: null,
        weight: null,
        enabled: false,
        tags: null,
      },
    ])
  })

  it('表头识别 → 映射 → 草稿，一条链走通', () => {
    const sheet = sheetOf([
      ['学号', '姓名', '性别'],
      ['1001', '张三', '男'],
      ['1002', '李四', '女'],
    ])

    const headerRow = suggestHeaderRow(sheet, 'students')
    const columns = suggestMapping(headerRow === null ? [] : (sheet.rows[headerRow] ?? []), 'students')
    const draft = buildRosterImportDraft(
      sheet,
      regionOf({ headerRow, firstDataRow: (headerRow ?? 0) + 1, columns }),
      'students',
    )

    expect(draft.members.map((member) => member.name)).toEqual(['张三', '李四'])
    expect(draft.members.map((member) => member.gender)).toEqual(['男', '女'])
  })

  it('没有表头又没给映射时，按该种类的固定列序读', () => {
    const sheet = sheetOf([
      ['1001', '张三', '男', '一班', ''],
      ['1002', '李四', '女', '二班', '否'],
    ])

    const draft = buildRosterImportDraft(
      sheet,
      regionOf({ headerRow: null, firstDataRow: 0, columns: {} }),
      'students',
    )

    expect(draft.mapping).toEqual({ id: 0, name: 1, gender: 2, group: 3, enabled: 4 })
    expect(draft.members[0]).toMatchObject({ id: '1001', name: '张三', gender: '男', group: '一班', enabled: true })
    expect(draft.members[1]).toMatchObject({ id: '1002', enabled: false })
  })

  it('奖品的固定列序是 数量/权重', () => {
    const sheet = sheetOf([
      ['p1', '一等奖', '3', '0.2'],
      ['p2', '二等奖', '1', '0.8'],
    ])

    const draft = buildRosterImportDraft(
      sheet,
      regionOf({ headerRow: null, firstDataRow: 0, columns: {} }),
      'prizes',
    )

    expect(draft.mapping).toEqual({ id: 0, name: 1, count: 2, weight: 3, enabled: 4 })
    expect(draft.members[0]).toMatchObject({ count: 3, weight: 0.2 })
  })

  it('有表头却一列都没映射 → no_columns，不猜一份名单出来', () => {
    const sheet = sheetOf([
      ['学号', '姓名'],
      ['1001', '张三'],
    ])

    const draft = buildRosterImportDraft(sheet, regionOf({ columns: {} }), 'students')

    expect(draft.problems).toEqual([{ code: 'no_columns' }])
    expect(draft.members).toEqual([])
  })

  it('学号与姓名都空的行计入 skippedRows，但不报问题', () => {
    const sheet = sheetOf([
      ['学号', '姓名', '数量'],
      ['1001', '张三', '2'],
      ['', '', '合计'],
    ])

    const draft = buildRosterImportDraft(sheet, regionOf({ columns: { id: 0, name: 1 } }), 'students')

    expect(draft.skippedRows).toBe(1)
    expect(draft.members.map((member) => member.name)).toEqual(['张三'])
    expect(draft.problems).toEqual([])
  })

  it('区域里的行一个成员都产不出时报 empty_region', () => {
    
    const sheet = sheetOf([
      ['学号', '姓名', '数量'],
      ['1001', '张三', '2'],
      ['', '', '合计'],
    ])

    const draft = buildRosterImportDraft(
      sheet,
      regionOf({ firstDataRow: 2, columns: { id: 0, name: 1 } }),
      'students',
    )

    expect(draft.members).toEqual([])
    expect(draft.skippedRows).toBe(1)
    expect(draft.problems).toEqual([{ code: 'empty_region' }])
  })

  it('空表 → empty_region', () => {
    const draft = buildRosterImportDraft(sheetOf([]), regionOf({ columns: { id: 0, name: 1 } }), 'students')

    expect(draft.problems).toEqual([{ code: 'empty_region' }])
  })

  it('区域越界时夹到表内（拖到表尾之外是最常见的误操作）', () => {
    const sheet = sheetOf([
      ['1001', '张三'],
      ['1002', '李四'],
      ['1003', '王五'],
    ])
    const columns = { id: 0, name: 1 }

    const above = buildRosterImportDraft(
      sheet,
      regionOf({ headerRow: null, firstDataRow: -5, columns }),
      'students',
    )
    expect(above.members.map((member) => member.id)).toEqual(['1001', '1002', '1003'])

    const below = buildRosterImportDraft(
      sheet,
      regionOf({ headerRow: null, firstDataRow: 99, lastDataRow: 200, columns }),
      'students',
    )
    expect(below.members.map((member) => member.id)).toEqual(['1003'])
  })

  it('区域起点在终点之后 → empty_region', () => {
    const sheet = sheetOf([
      ['学号', '姓名'],
      ['1001', '张三'],
      ['1002', '李四'],
    ])

    const draft = buildRosterImportDraft(
      sheet,
      regionOf({ firstDataRow: 2, lastDataRow: 1, columns: { id: 0, name: 1 } }),
      'students',
    )

    expect(draft.problems).toEqual([{ code: 'empty_region' }])
  })

  it('学号重复：两行都留着，但要报出来（静默丢一行等于替用户改名单）', () => {
    const sheet = sheetOf([
      ['学号', '姓名'],
      ['1001', '张三'],
      ['1001', '张三丰'],
      ['1002', '李四'],
    ])

    const draft = buildRosterImportDraft(sheet, regionOf({ columns: { id: 0, name: 1 } }), 'students')

    expect(draft.members.map((member) => member.name)).toEqual(['张三', '张三丰', '李四'])
    expect(draft.problems).toEqual([{ code: 'duplicate_id', row: 2, column: 'id' }])
  })

  it('学号全空的行不算重复（两个没有学号的人不该互相顶掉）', () => {
    const sheet = sheetOf([
      ['学号', '姓名'],
      ['', '张三'],
      ['', '李四'],
    ])

    const draft = buildRosterImportDraft(sheet, regionOf({ columns: { id: 0, name: 1 } }), 'students')

    expect(draft.members.map((member) => member.name)).toEqual(['张三', '李四'])
    expect(draft.problems).toEqual([])
  })

  it('数量/权重读不出来时报 bad_number 并留 null（0 是会被当真的取值）', () => {
    const sheet = sheetOf([
      ['学号', '姓名', '数量', '权重'],
      ['1001', '张三', 'abc', '1.5'],
      ['1002', '李四', '2', 'x'],
    ])

    const draft = buildRosterImportDraft(
      sheet,
      regionOf({ columns: { id: 0, name: 1, count: 2, weight: 3 } }),
      'prizes',
    )

    expect(draft.members[0]).toMatchObject({ count: null, weight: 1.5 })
    expect(draft.members[1]).toMatchObject({ count: 2, weight: null })
    expect(draft.problems).toEqual([
      { code: 'bad_number', row: 1, column: 'count' },
      { code: 'bad_number', row: 2, column: 'weight' },
    ])
  })

  it('启用列宽容解析：认不出的写法一律按启用（拼错不该把人摘出名单）', () => {
    const sheet = sheetOf([
      ['学号', '姓名', '启用'],
      ['1', 'a', '是'],
      ['2', 'b', '否'],
      ['3', 'c', ''],
      ['4', 'd', 'maybe'],
      ['5', 'e', '0'],
      ['6', 'f', 'ON'],
    ])

    const draft = buildRosterImportDraft(
      sheet,
      regionOf({ columns: { id: 0, name: 1, enabled: 2 } }),
      'students',
    )

    expect(draft.members.map((member) => member.enabled)).toEqual([true, false, true, true, false, true])
  })

  it('标签按中英文逗号/分号/竖线/斜杠/空白拆开；没有标签列时是 null', () => {
    const sheet = sheetOf([
      ['学号', '姓名', '标签'],
      ['1001', '张三', ' 尖子,组长；三好|住宿/值日 第一组 '],
    ])

    const withTags = buildRosterImportDraft(
      sheet,
      regionOf({ columns: { id: 0, name: 1, tags: 2 } }),
      'students',
    )
    expect(withTags.members[0]?.tags).toEqual(['尖子', '组长', '三好', '住宿', '值日', '第一组'])

    const withoutTags = buildRosterImportDraft(
      sheet,
      regionOf({ columns: { id: 0, name: 1 } }),
      'students',
    )
    expect(withoutTags.members[0]?.tags).toBeNull()
  })

  it('ROSTER_MAX_ROWS 与设备侧 roster.write 的上限一致', () => {
    
    expect(ROSTER_MAX_ROWS).toBe(2000)
  })
})






describe('列关键词与客户端导入器对齐', () => {
  it.each([
    ['学籍号', 'id'],
    ['座号', 'id'],
    ['Sequence / ID', 'id'],
    ['番号 / ID', 'id'],
    ['メンバーid', 'id'],
    ['学生姓名', 'name'],
    ['名前', 'name'],
    ['prize name', 'name'],
    ['性別', 'gender'],
    ['Male', 'gender'],
    ['班', 'group'],
    ['Team Name', 'group'],
    ['库存', 'count'],
    ['amount', 'count'],
    ['probability', 'weight'],
    ['分类', 'tags'],
    ['category', 'tags'],
  ])('表头「%s」能认成 %s 列', (header, column) => {
    const mapping = suggestMapping([header], 'students')
    expect(mapping[column as keyof typeof mapping]).toBe(0)
  })

  it('等值匹配压过包含匹配：Team Name 是分组，不是姓名', () => {
    
    
    const mapping = suggestMapping(['Team Name', 'Member Name'], 'students')
    expect(mapping.group).toBe(0)
    expect(mapping.name).toBe(1)
  })

  it('单字性别词不进关键词表：数据行不该被误判成表头', () => {
    
    
    const sheet = sheetOf([
      ['张三', '男', 'A组'],
      ['李四', '女', 'B组'],
    ])
    expect(suggestHeaderRow(sheet, 'students')).toBeNull()
  })
})
