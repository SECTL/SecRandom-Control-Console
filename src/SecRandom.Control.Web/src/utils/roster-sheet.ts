












import * as XLSX from 'xlsx'

import type { NodeRosterMemberDto, RosterKind } from '@/api/protocol'



export type RosterColumn =
  | 'id'
  | 'name'
  | 'gender'
  | 'group'
  | 'enabled'
  | 'count'
  | 'weight'
  | 'tags'


export interface RosterSheet {
  name: string
  rows: string[][]
}

export interface RosterWorkbook {
  sheets: RosterSheet[]
}





export interface RosterColumnCandidate {
  column: RosterColumn
  index: number
  score: number
}







export interface RosterRegionSpec {
  sheetIndex: number
  headerRow: number | null
  
  firstDataRow: number
  
  lastDataRow: number | null
  columns: Partial<Record<RosterColumn, number>>
}

export interface RosterImportDraft {
  members: RosterMemberLike[]
  mapping: Partial<Record<RosterColumn, number>>
  skippedRows: number
  problems: RosterProblem[]
}

export interface RosterProblem {
  
  code: string
  row?: number
  column?: string
}









export interface RosterMemberLike extends Omit<NodeRosterMemberDto, 'tags'> {
  tags?: string[] | null
}




const ROSTER_COLUMNS: readonly RosterColumn[] = [
  'id',
  'name',
  'gender',
  'group',
  'enabled',
  'count',
  'weight',
  'tags',
]

interface ColumnKeywords {
  words: readonly string[]
  
  preferred: Partial<Record<RosterKind, readonly string[]>>
}
















const COLUMN_KEYWORDS: Record<RosterColumn, ColumnKeywords> = {
  id: {
    words: normalizeWords([
      '学号', '学籍号', '学员编号', '学生id', '编号', '序号', '考号', '座号', '座位号',
      '奖品id', 'id', 'sid', 'no', '号', 'number',
      'serialno', 'serialnumber', 'memberid', 'membernumber', 'studentid', 'studentnumber',
      'rollno', 'rollnumber', 'sequence', '番号', 'メンバーid',
    ]),
    preferred: {},
  },
  name: {
    words: normalizeWords([
      '姓名', '名字', '学生', '学生名', '学生姓名', '名称', '奖项', '奖品', '奖品名称',
      'name', 'membername', 'studentname', 'fullname', 'prizename', '名前',
    ]),
    preferred: {
      students: normalizeWords(['姓名', '名字', '学生']),
      prizes: normalizeWords(['奖项', '奖品', '名称']),
    },
  },
  gender: {
    words: normalizeWords(['性别', '性別', '男女', 'gender', 'sex', 'male', 'female', 'm/f']),
    preferred: {},
  },
  group: {
    words: normalizeWords([
      '班级', '班', '小组', '分组', '组别', '队伍', '组',
      'group', 'groupname', 'team', 'teamname', 'class',
    ]),
    preferred: {},
  },
  enabled: {
    words: normalizeWords(['启用', '存在', '是否', '有效', 'enabled', 'exists', 'active', 'status']),
    preferred: {},
  },
  count: {
    words: normalizeWords(['数量', '个数', '份数', '库存', '数', 'count', 'qty', 'quantity', 'amount']),
    preferred: {},
  },
  weight: {
    words: normalizeWords(['权重', '比例', '概率', 'weight', 'ratio', 'probability']),
    preferred: {},
  },
  tags: {
    words: normalizeWords(['标签', '标记', '类别', '分类', 'tag', 'tags', 'label', 'category']),
    preferred: {},
  },
}


const HEADER_SCAN_ROWS = 10


const HEADER_MIN_SCORE = 2


function normalizeWords(words: readonly string[]): readonly string[] {
  return words.map(normalizeKeywordText)
}


function normalizeKeywordText(value: string): string {
  return value.replace(/[\s_]/g, '').toLowerCase()
}










function bestKeywordScore(normalized: string, words: readonly string[]): number {
  let best = 0
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    if (word === undefined || word.length === 0) continue
    const score = normalized === word ? 100 - index : normalized.includes(word) ? 50 - index : 0
    if (score > best) best = score
  }
  return best
}







function cellColumnScore(cell: string, column: RosterColumn, kind: RosterKind): number {
  const normalized = normalizeKeywordText(cell)
  if (normalized.length === 0) return 0

  const { words, preferred } = COLUMN_KEYWORDS[column]
  const base = bestKeywordScore(normalized, words)
  if (base === 0) return 0
  return bestKeywordScore(normalized, preferred[kind] ?? []) > 0 ? base + 20 : base
}




function cellToText(cell: unknown): string {
  if (cell === null || cell === undefined) return ''
  return String(cell).trim()
}







function normalizeRows(raw: readonly (readonly unknown[])[]): string[][] {
  const cells = raw
    .map((row) => row.map(cellToText))
    .filter((row) => row.some((cell) => cell.length > 0))

  let width = 0
  for (const row of cells) width = Math.max(width, row.length)

  return cells.map((row) =>
    row.length === width ? row : [...row, ...Array<string>(width - row.length).fill('')],
  )
}

function worksheetToRows(worksheet: XLSX.WorkSheet): string[][] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })
  return normalizeRows(matrix)
}







export function parseWorkbook(data: ArrayBuffer): RosterWorkbook | null {
  
  
  if (data.byteLength === 0) return null

  try {
    const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
    const sheets: RosterSheet[] = []
    for (const name of workbook.SheetNames) {
      const worksheet = workbook.Sheets[name]
      
      
      sheets.push({ name, rows: worksheet === undefined ? [] : worksheetToRows(worksheet) })
    }
    return { sheets }
  } catch {
    return null
  }
}


const DEFAULT_CSV_SHEET_NAME = 'CSV'








function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        current += char
      }
      continue
    }

    if (char === '"' && current.trim().length === 0) {
      quoted = true
      continue
    }
    if (char === ',') {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  cells.push(current.trim())
  return cells
}








export function parseCsvWorkbook(text: string, sheetName?: string): RosterWorkbook {
  const rows: string[][] = []
  for (const line of text.split(/\r\n|\n|\r/)) {
    if (line.trim().length === 0) continue
    rows.push(splitCsvLine(line))
  }

  const trimmed = sheetName?.trim() ?? ''
  return {
    sheets: [
      {
        name: trimmed.length > 0 ? trimmed : DEFAULT_CSV_SHEET_NAME,
        rows: normalizeRows(rows),
      },
    ],
  }
}










export function suggestHeaderRow(sheet: RosterSheet, kind: RosterKind): number | null {
  const limit = Math.min(sheet.rows.length, HEADER_SCAN_ROWS)
  let best: number | null = null
  let bestScore = 0

  for (let index = 0; index < limit; index += 1) {
    const row = sheet.rows[index]
    if (row === undefined) continue
    let score = 0
    for (const cell of row) {
      if (ROSTER_COLUMNS.some((column) => cellColumnScore(cell, column, kind) > 0)) score += 1
    }
    
    if (score > bestScore) {
      bestScore = score
      best = index
    }
  }

  return bestScore >= HEADER_MIN_SCORE ? best : null
}








export function suggestMapping(
  headerCells: readonly string[],
  kind: RosterKind,
): Partial<Record<RosterColumn, number>> {
  const candidates: RosterColumnCandidate[] = []
  for (const column of ROSTER_COLUMNS) {
    for (let index = 0; index < headerCells.length; index += 1) {
      const cell = headerCells[index]
      if (cell === undefined) continue
      const score = cellColumnScore(cell, column, kind)
      if (score > 0) candidates.push({ column, index, score })
    }
  }

  candidates.sort(
    (left, right) =>
      right.score - left.score ||
      ROSTER_COLUMNS.indexOf(left.column) - ROSTER_COLUMNS.indexOf(right.column) ||
      left.index - right.index,
  )

  const mapping: Partial<Record<RosterColumn, number>> = {}
  const used = new Set<number>()
  for (const candidate of candidates) {
    if (mapping[candidate.column] !== undefined) continue
    if (used.has(candidate.index)) continue
    mapping[candidate.column] = candidate.index
    used.add(candidate.index)
  }
  return mapping
}







export const ROSTER_MAX_ROWS = 2000


const POSITIONAL_COLUMNS: Record<RosterKind, readonly RosterColumn[]> = {
  students: ['id', 'name', 'gender', 'group', 'enabled'],
  prizes: ['id', 'name', 'count', 'weight', 'enabled'],
}


const TRUE_CELLS = ['1', 'true', 'yes', 'y', 'on', '是', '启用']
const FALSE_CELLS = ['0', 'false', 'no', 'n', 'off', '否', '禁用']


const TAG_SEPARATOR = /[,，;；|/\s]+/


function cellAt(cells: readonly string[], index: number | undefined): string {
  if (index === undefined) return ''
  return (cells[index] ?? '').trim()
}

function nullableText(value: string): string | null {
  return value.length > 0 ? value : null
}







function parseEnabledCell(cell: string): boolean {
  const value = cell.trim().toLowerCase()
  if (TRUE_CELLS.includes(value)) return true
  if (FALSE_CELLS.includes(value)) return false
  return true
}








function parseTags(cell: string): string[] | null {
  if (cell.length === 0) return null
  const tags = cell.split(TAG_SEPARATOR).filter((tag) => tag.length > 0)
  return tags.length > 0 ? tags : null
}


function clampRowIndex(value: number, total: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.trunc(value), 0), total - 1)
}


function effectiveMapping(
  spec: RosterRegionSpec,
  kind: RosterKind,
): Partial<Record<RosterColumn, number>> {
  const declared: Partial<Record<RosterColumn, number>> = {}
  for (const column of ROSTER_COLUMNS) {
    const index = spec.columns[column]
    if (typeof index === 'number' && Number.isFinite(index) && index >= 0) {
      declared[column] = Math.trunc(index)
    }
  }
  if (Object.keys(declared).length > 0) return declared

  if (spec.headerRow === null) {
    const positional: Partial<Record<RosterColumn, number>> = {}
    POSITIONAL_COLUMNS[kind].forEach((column, index) => {
      positional[column] = index
    })
    return positional
  }

  
  return declared
}













export function buildRosterImportDraft(
  sheet: RosterSheet,
  spec: RosterRegionSpec,
  kind: RosterKind,
): RosterImportDraft {
  try {
    const mapping = effectiveMapping(spec, kind)
    if (Object.keys(mapping).length === 0) {
      return { members: [], mapping, skippedRows: 0, problems: [{ code: 'no_columns' }] }
    }

    const total = sheet.rows.length
    if (total === 0) {
      return { members: [], mapping, skippedRows: 0, problems: [{ code: 'empty_region' }] }
    }

    const first = clampRowIndex(spec.firstDataRow, total)
    const last = spec.lastDataRow === null ? total - 1 : clampRowIndex(spec.lastDataRow, total)
    if (first > last) {
      return { members: [], mapping, skippedRows: 0, problems: [{ code: 'empty_region' }] }
    }

    const members: RosterMemberLike[] = []
    const problems: RosterProblem[] = []
    const seenIds = new Set<string>()
    let skippedRows = 0

    for (let row = first; row <= last; row += 1) {
      const cells = sheet.rows[row] ?? []
      const id = cellAt(cells, mapping.id)
      const name = cellAt(cells, mapping.name)

      
      if (id.length === 0 && name.length === 0) {
        skippedRows += 1
        continue
      }

      const number = (column: RosterColumn): number | null => {
        const text = cellAt(cells, mapping[column])
        if (text.length === 0) return null
        const parsed = Number(text)
        if (Number.isFinite(parsed)) return parsed
        problems.push({ code: 'bad_number', row, column })
        return null
      }

      
      
      if (id.length > 0) {
        if (seenIds.has(id)) problems.push({ code: 'duplicate_id', row, column: 'id' })
        else seenIds.add(id)
      }

      members.push({
        id: id.length > 0 ? id : null,
        name: name.length > 0 ? name : null,
        gender: nullableText(cellAt(cells, mapping.gender)),
        group: nullableText(cellAt(cells, mapping.group)),
        count: number('count'),
        weight: number('weight'),
        enabled: parseEnabledCell(cellAt(cells, mapping.enabled)),
        tags: parseTags(cellAt(cells, mapping.tags)),
      })
    }

    
    
    if (members.length === 0) problems.push({ code: 'empty_region' })

    return { members, mapping, skippedRows, problems }
  } catch {
    return { members: [], mapping: {}, skippedRows: 0, problems: [{ code: 'internal_error' }] }
  }
}
