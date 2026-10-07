import type {
  NodeCommandDto,
  NodeLocalizedText,
  NodeRosterListDto,
  NodeRosterMemberDto,
  NodeRosterReadPayload,
  NodeSettingCategoryDto,
  NodeSettingFieldDto,
  PrizeRosterPushRequest,
  RosterKind,
  RosterPrizeInput,
  RosterPushRequest,
  RosterStudentInput,
} from '@/api/protocol'
import { describeDrawFailure } from '@/utils/draw-receipt'





























export type CommandFeedbackTone = 'ok' | 'warn' | 'fail'


export interface CommandFeedbackLine {
  key: string
  params: Record<string, string | number>
  
  rawParams?: Record<string, string>
}


export interface CommandFeedbackFix {
  kind: 'voice_enable'
}


export interface CommandFeedbackView {
  
  code: string
  tone: CommandFeedbackTone
  
  messageKey: string
  
  params: Record<string, string | number>
  








  rawParams?: Record<string, string>
  
  lines: CommandFeedbackLine[]
  
  capability: string | null
  
  supportedCapabilities: string[]
  
  writablePaths: string[]
  
  rawContext: string | null
  fix: CommandFeedbackFix | null
  
  unknown: boolean
}


export const DEFAULT_MAX_TEXT_LENGTH = 200







export type CommandFeedbackInput = Pick<NodeCommandDto, 'result_detail' | 'result_context'> &
  Partial<Pick<NodeCommandDto, 'capability' | 'status'>>

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}







function asDetail(value: unknown): string | null {
  if (typeof value === 'string') return value.length > 0 ? value : null
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return String(value)
  return null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}







function rawContextOf(
  context: Record<string, unknown> | null,
  consumed: ReadonlySet<string>,
): string | null {
  if (context === null) return null

  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (!consumed.has(key)) rest[key] = value
  }
  if (Object.keys(rest).length === 0) return null
  return JSON.stringify(rest, null, 2)
}

interface Draft {
  code: string
  tone: CommandFeedbackTone
  messageKey: string
  params: Record<string, string | number>
  lines: CommandFeedbackLine[]
  capability: string | null
  supportedCapabilities: string[]
  writablePaths: string[]
  rawContext: string | null
  fix: CommandFeedbackFix | null
  unknown: boolean
}







export function describeCommandFeedback(
  command: CommandFeedbackInput | null | undefined,
): CommandFeedbackView | null {
  const detail = (command?.result_detail ?? '').trim()
  const record = asRecord(command?.result_context)
  
  
  const context = record !== null && Object.keys(record).length > 0 ? record : null

  const separator = detail.indexOf(':')
  const code = (separator >= 0 ? detail.slice(0, separator) : detail).trim()
  const suffix = separator >= 0 ? detail.slice(separator + 1) : ''

  if (code.length === 0 && context === null) return null

  











  if (code === 'revoked' && context === null) return null

  const failed = command?.status === 'rejected' || command?.status === 'failed'
  const consumed = new Set<string>()

  









  const drawFailure = describeDrawFailure(code, detail, context)
  if (drawFailure !== null) {
    
    if (code === 'draw_denied') consumed.add('reason')
    if (code === 'invalid_value') {
      consumed.add('field')
      consumed.add('why')
      consumed.add('reason')
    }
    if (code === 'busy') consumed.add('drawing')
    if (code === 'draw_locked') consumed.add('draw_locked')

    return {
      code,
      tone: drawFailure.tone,
      messageKey: drawFailure.key,
      params: drawFailure.params,
      ...(drawFailure.rawParams === undefined ? {} : { rawParams: drawFailure.rawParams }),
      lines: [],
      capability: null,
      supportedCapabilities: [],
      writablePaths: [],
      rawContext: rawContextOf(context, consumed),
      fix: null,
      
      
      unknown: false,
    }
  }

  const draft: Draft = {
    code,
    
    
    tone: failed ? 'warn' : 'ok',
    messageKey: 'nodeDetail.feedback.unknown',
    params: {},
    lines: [],
    capability: null,
    supportedCapabilities: [],
    writablePaths: [],
    rawContext: null,
    fix: null,
    unknown: true,
  }

  switch (code) {
    case 'media_disabled': {
      
      consumed.add('voice_enable')
      draft.tone = 'fail'
      draft.messageKey = 'nodeDetail.feedback.mediaDisabled'
      draft.unknown = false
      draft.fix = { kind: 'voice_enable' }
      break
    }

    case 'text_too_long': {
      consumed.add('max_text_length')
      const max = asNumber(context?.['max_text_length'])
      draft.tone = 'fail'
      draft.unknown = false
      if (max === null) {
        draft.messageKey = 'nodeDetail.feedback.textTooLongUnknown'
      } else {
        draft.messageKey = 'nodeDetail.feedback.textTooLong'
        draft.params = { max }
      }
      break
    }

    case 'capability_unsupported': {
      consumed.add('capability')
      consumed.add('supported')
      const capability = asString(context?.['capability']) ?? asString(command?.capability)
      const supported = asStringArray(context?.['supported'])

      draft.tone = 'fail'
      draft.unknown = false
      draft.capability = capability
      draft.supportedCapabilities = supported
      if (capability === null) {
        draft.messageKey = 'nodeDetail.feedback.capabilityUnsupportedUnknown'
      } else {
        draft.messageKey = 'nodeDetail.feedback.capabilityUnsupported'
        draft.params = { capability }
      }
      break
    }

    case 'local_remote_disabled': {
      
      consumed.add('remote_control_enabled')
      draft.tone = 'fail'
      draft.messageKey = 'nodeDetail.feedback.localRemoteDisabled'
      draft.unknown = false
      break
    }

    case 'rate_limited': {
      consumed.add('max_commands')
      consumed.add('window_seconds')
      const max = asNumber(context?.['max_commands'])
      const window = asNumber(context?.['window_seconds'])

      draft.tone = 'warn'
      draft.unknown = false
      if (max === null && window === null) {
        draft.messageKey = 'nodeDetail.feedback.rateLimitedUnknown'
      } else {
        draft.messageKey = 'nodeDetail.feedback.rateLimited'
        draft.params = { max: max ?? '—', window: window ?? '—' }
      }
      break
    }

    case 'not_writable': {
      consumed.add('path')
      consumed.add('writable_paths')
      
      const path = asString(context?.['path']) ?? (suffix.length > 0 ? suffix : null)
      const writable = asStringArray(context?.['writable_paths'])

      draft.tone = 'fail'
      draft.unknown = false
      draft.writablePaths = writable
      if (path === null) {
        draft.messageKey = 'nodeDetail.feedback.notWritable'
      } else {
        draft.messageKey = 'nodeDetail.reasonNotWritable'
        draft.params = { path }
      }
      if (writable.length > 0) {
        draft.lines.push({
          key: 'nodeDetail.feedback.writablePaths',
          params: { paths: writable.join(', ') },
        })
      }
      break
    }

    case 'invalid_value': {
      consumed.add('path')
      consumed.add('detail')
      consumed.add('value')
      const path = asString(context?.['path']) ?? (suffix.length > 0 ? suffix : null)
      const detailValue =
        asDetail(context?.['detail']) ??
        asDetail(context?.['value']) ??
        asDetail(context?.['reason'])

      draft.tone = 'fail'
      draft.unknown = false
      if (path === null) {
        draft.messageKey = 'nodeDetail.feedback.invalidValueNoPath'
      } else {
        draft.messageKey = 'nodeDetail.feedback.invalidValue'
        draft.params = { path }
      }
      if (detailValue !== null) {
        draft.lines.push({
          key: 'nodeDetail.feedback.invalidValueDetail',
          params: { detail: detailValue },
        })
      }
      break
    }

    case 'busy': {
      draft.tone = 'warn'
      draft.messageKey = 'nodeDetail.reasonBusy'
      draft.unknown = false
      break
    }

    case 'unsupported_action': {
      draft.tone = 'fail'
      draft.messageKey = 'nodeDetail.reasonUnsupportedAction'
      draft.unknown = false
      
      if (suffix.length > 0) {
        draft.lines.push({
          key: 'nodeDetail.feedback.unsupportedActionName',
          params: { action: suffix },
        })
      }
      break
    }

    case 'expired': {
      draft.tone = 'warn'
      draft.messageKey = 'nodeDetail.feedback.expired'
      draft.unknown = false
      break
    }

    case 'invalid_command': {
      draft.tone = 'fail'
      draft.unknown = false

      








      const unsupported = asString(context?.['unsupported_field'])
      const field = asString(context?.['field'])

      if (unsupported !== null) {
        consumed.add('unsupported_field')
        draft.messageKey = 'nodeDetail.feedback.unsupportedField'
        draft.params = { field: unsupported }
      } else if (field !== null) {
        consumed.add('field')
        draft.messageKey = 'nodeDetail.feedback.invalidCommandField'
        draft.params = { field }
      } else {
        draft.messageKey = 'nodeDetail.feedback.invalidCommand'
      }
      break
    }

    default: {
      
      if (code.length === 0) {
        draft.messageKey = 'nodeDetail.feedback.contextOnly'
      } else {
        draft.params = { code }
      }
      break
    }
  }

  
  
  draft.rawContext = rawContextOf(context, consumed)

  return {
    code: draft.code,
    tone: draft.tone,
    messageKey: draft.messageKey,
    params: draft.params,
    lines: draft.lines,
    capability: draft.capability,
    supportedCapabilities: draft.supportedCapabilities,
    writablePaths: draft.writablePaths,
    rawContext: draft.rawContext,
    fix: draft.fix,
    unknown: draft.unknown,
  }
}





























export const READABLE_SETTING_CATEGORIES = [
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
] as const

function asObject(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asTrimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}


const TAG_SEPARATORS = /[,，;；|/\\、\s]+/


export function splitTags(value: unknown): string[] | null {
  const raw: unknown[] = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  const tags: string[] = []

  for (const item of raw) {
    if (typeof item !== 'string') continue
    for (const piece of item.split(TAG_SEPARATORS)) {
      const text = piece.trim()
      if (text.length > 0 && !tags.includes(text)) tags.push(text)
    }
  }

  return tags.length > 0 ? tags : null
}















function readTags(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (!Array.isArray(value)) return null
  return splitTags(value)
}


const LOCALIZED_KEYS = ['zh-CN', 'en-US', 'ja-JP'] as const







function asLocalizedText(value: unknown): NodeLocalizedText | null {
  const source = asObject(value)
  if (source === null) return null

  const map: NodeLocalizedText = {}
  for (const key of LOCALIZED_KEYS) {
    const text = asTrimmed(source[key])
    if (text.length > 0) map[key] = text
  }

  return Object.keys(map).length > 0 ? map : null
}











export function localizedText(
  entry: { label?: string | null; labels?: NodeLocalizedText | null },
  locale: string,
): string | null {
  
  
  const clean = (value: unknown): string | null => {
    if (typeof value !== 'string') return null
    const text = value.trim()
    return text.length > 0 ? text : null
  }

  const map = entry.labels ?? null
  if (map !== null) {
    const exact = clean(map[locale as (typeof LOCALIZED_KEYS)[number]])
    if (exact !== null) return exact
  }

  const device = clean(entry.label)
  if (device !== null) return device

  if (map !== null) {
    for (const key of LOCALIZED_KEYS) {
      const text = clean(map[key])
      if (text !== null) return text
    }
  }

  return null
}


export function localizedLabel(
  entry: { label?: string | null; labels?: NodeLocalizedText | null },
  locale: string,
  fallbackPath: string,
): string {
  return localizedText(entry, locale) ?? humanizeSettingPath(fallbackPath)
}







export function localizedDescription(
  entry: { description?: string | null; descriptions?: NodeLocalizedText | null },
  locale: string,
): string | null {
  return localizedText(
    { label: entry.description ?? null, labels: entry.descriptions ?? null },
    locale,
  )
}











export function parseSettingsSnapshot(payload: unknown): NodeSettingCategoryDto[] | null {
  const root = asObject(payload)
  if (root === null) return null

  const rawCategories = root['categories']
  if (!Array.isArray(rawCategories)) return null

  const categories: NodeSettingCategoryDto[] = []
  for (const rawCategory of rawCategories) {
    const category = asObject(rawCategory)
    if (category === null) continue

    const id = asTrimmed(category['id'])
    const rawFields = category['fields']
    if (id.length === 0 || !Array.isArray(rawFields)) continue

    const fields: NodeSettingFieldDto[] = []
    for (const rawField of rawFields) {
      const field = asObject(rawField)
      if (field === null) continue

      const path = asTrimmed(field['path'])
      const type = asTrimmed(field['type'])
      if (path.length === 0 || type.length === 0) continue

      const options = Array.isArray(field['options'])
        ? field['options'].filter((item): item is string => typeof item === 'string')
        : null

      const parsed: NodeSettingFieldDto = {
        path,
        category: asTrimmed(field['category']) || id,
        type,
        value: field['value'] ?? null,
        
        
        writable: field['writable'] === true,
        min: nullableNumber(field['min']),
        max: nullableNumber(field['max']),
        options: options !== null && options.length > 0 ? options : null,
        label: nullableText(field['label']),
        description: nullableText(field['description']),
      }

      
      const labels = asLocalizedText(field['labels'])
      if (labels !== null) parsed.labels = labels
      const descriptions = asLocalizedText(field['descriptions'])
      if (descriptions !== null) parsed.descriptions = descriptions

      fields.push(parsed)
    }

    if (fields.length > 0) {
      const parsedCategory: NodeSettingCategoryDto = {
        id,
        label: nullableText(category['label']),
        description: nullableText(category['description']),
        fields,
      }

      const categoryLabels = asLocalizedText(category['labels'])
      if (categoryLabels !== null) parsedCategory.labels = categoryLabels
      const categoryDescriptions = asLocalizedText(category['descriptions'])
      if (categoryDescriptions !== null) parsedCategory.descriptions = categoryDescriptions

      categories.push(parsedCategory)
    }
  }

  return categories
}










export function humanizeSettingPath(path: string): string {
  const words = path
    .split(/[._]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0)

  if (words.length === 0) return path
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}






export function settingLabel(label: unknown, path: string): string {
  const text = typeof label === 'string' ? label.trim() : ''
  return text.length > 0 ? text : humanizeSettingPath(path)
}


export function settingDraftValue(field: NodeSettingFieldDto): string | number | boolean {
  if (field.type === 'bool') return field.value === true
  if (field.type === 'int' || field.type === 'double') {
    return typeof field.value === 'number' && Number.isFinite(field.value) ? field.value : 0
  }
  if (typeof field.value === 'string') return field.value
  if (typeof field.value === 'number' || typeof field.value === 'boolean') return String(field.value)
  return ''
}


export function settingsDraftsOf(
  categories: readonly NodeSettingCategoryDto[],
): Record<string, string | number | boolean> {
  const drafts: Record<string, string | number | boolean> = {}
  for (const category of categories) {
    for (const field of category.fields) drafts[field.path] = settingDraftValue(field)
  }
  return drafts
}


export function isSettingUnchanged(field: NodeSettingFieldDto, draft: unknown): boolean {
  if (field.type === 'bool') return (draft === true) === (field.value === true)

  if (field.type === 'int' || field.type === 'double') {
    const current = nullableNumber(field.value)
    const next = typeof draft === 'number' ? draft : Number(String(draft))
    if (current === null || !Number.isFinite(next)) return false
    return current === next
  }

  const current = field.value === null || field.value === undefined ? '' : String(field.value)
  return String(draft ?? '') === current
}


export interface SettingPatchProblem {
  path: string
  kind: 'notNumber' | 'range' | 'notOption'
  min: number | null
  max: number | null
  options: string[]
}

export interface SettingPatchPlan {
  
  patch: Record<string, unknown>
  
  problems: SettingPatchProblem[]
  





  changed: number
  
  skipped: number
}













export function buildSettingsPatch(
  fields: readonly NodeSettingFieldDto[],
  drafts: Record<string, string | number | boolean>,
): SettingPatchPlan {
  const patch: Record<string, unknown> = {}
  const problems: SettingPatchProblem[] = []
  let changed = 0
  let skipped = 0

  for (const field of fields) {
    const draft = drafts[field.path]
    if (draft === undefined || isSettingUnchanged(field, draft)) continue

    if (!field.writable) {
      skipped += 1
      continue
    }
    changed += 1

    switch (field.type) {
      case 'bool': {
        patch[field.path] = draft === true
        break
      }

      case 'int':
      case 'double': {
        const value = typeof draft === 'number' ? draft : Number(String(draft).trim())
        if (String(draft).trim().length === 0 || !Number.isFinite(value)) {
          problems.push({ path: field.path, kind: 'notNumber', min: null, max: null, options: [] })
          break
        }
        if (field.type === 'int' && !Number.isInteger(value)) {
          problems.push({ path: field.path, kind: 'notNumber', min: null, max: null, options: [] })
          break
        }
        const min = field.min ?? null
        const max = field.max ?? null
        if ((min !== null && value < min) || (max !== null && value > max)) {
          problems.push({ path: field.path, kind: 'range', min, max, options: [] })
          break
        }
        patch[field.path] = value
        break
      }

      case 'enum': {
        const options = field.options ?? []
        const value = String(draft)
        if (options.length > 0 && !options.includes(value)) {
          problems.push({ path: field.path, kind: 'notOption', min: null, max: null, options })
          break
        }
        patch[field.path] = value
        break
      }

      default: {
        
        
        patch[field.path] = String(draft)
        break
      }
    }
  }

  return { patch, problems, changed, skipped }
}










export function parseRosterSnapshot(payload: unknown): NodeRosterReadPayload | null {
  const root = asObject(payload)
  if (root === null) return null

  const rawLists = root['lists']
  if (!Array.isArray(rawLists)) return null

  const lists: NodeRosterListDto[] = []
  for (const rawList of rawLists) {
    const list = asObject(rawList)
    if (list === null) continue

    const name = asTrimmed(list['name'])
    if (name.length === 0) continue

    const members: NodeRosterMemberDto[] = []
    const rawMembers = list['members']
    if (Array.isArray(rawMembers)) {
      for (const rawMember of rawMembers) {
        const member = asObject(rawMember)
        if (member === null) continue
        const parsed: NodeRosterMemberDto = {
          id: nullableText(member['id']),
          name: nullableText(member['name']),
          gender: nullableText(member['gender']),
          group: nullableText(member['group']),
          count: nullableNumber(member['count']),
          weight: nullableNumber(member['weight']),
          
          
          enabled: member['enabled'] !== false,
        }

        
        
        
        const tags = readTags(member['tags'])
        if (tags !== undefined) parsed.tags = tags

        members.push(parsed)
      }
    }

    const count = nullableNumber(list['count']) ?? members.length
    const total = nullableNumber(list['total']) ?? count

    lists.push({
      name,
      is_default: list['is_default'] === true,
      count,
      total,
      truncated: list['truncated'] === true || count < total,
      members,
    })
  }

  return { roster_kind: asTrimmed(root['roster_kind']), lists }
}








export function toStudentInputs(members: readonly NodeRosterMemberDto[]): RosterStudentInput[] {
  return members.map((member) => {
    const student: RosterStudentInput = { enabled: member.enabled }
    if (member.id !== null && member.id.length > 0) student.id = member.id
    if (member.name !== null && member.name.length > 0) student.name = member.name
    if (member.gender !== null && member.gender.length > 0) student.gender = member.gender
    if (member.group !== null && member.group.length > 0) student.group = member.group
    
    
    
    if (Array.isArray(member.tags)) student.tags = [...member.tags]
    return student
  })
}


export function toPrizeInputs(members: readonly NodeRosterMemberDto[]): RosterPrizeInput[] {
  return members.map((member) => {
    const prize: RosterPrizeInput = { enabled: member.enabled }
    if (member.id !== null && member.id.length > 0) prize.id = member.id
    if (member.name !== null && member.name.length > 0) prize.name = member.name
    if (member.count !== null) prize.count = member.count
    if (member.weight !== null) prize.weight = member.weight
    if (Array.isArray(member.tags)) prize.tags = [...member.tags]
    return prize
  })
}


export function rosterDraftOf(list: NodeRosterListDto): NodeRosterMemberDto[] {
  return list.members.map((member) => ({ ...member }))
}







export function buildRosterPush(
  kind: RosterKind,
  listName: string,
  mode: 'replace' | 'merge',
  activate: boolean,
  members: readonly NodeRosterMemberDto[],
): RosterPushRequest | PrizeRosterPushRequest {
  if (kind === 'prizes') {
    return {
      list_name: listName,
      mode,
      activate,
      roster_kind: 'prizes',
      prizes: toPrizeInputs(members),
    }
  }
  return { list_name: listName, mode, activate, students: toStudentInputs(members) }
}




const CSV_COLUMNS: Record<RosterKind, readonly string[]> = {
  students: ['id', 'name', 'gender', 'group', 'enabled'],
  prizes: ['id', 'name', 'count', 'weight', 'enabled'],
}

const CSV_KNOWN_COLUMNS = ['id', 'name', 'gender', 'group', 'enabled', 'count', 'weight', 'tags']


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
      cells.push(current)
      current = ''
      continue
    }
    current += char
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  for (const rawLine of text.split(/\r?\n/)) {
    if (rawLine.trim().length === 0) continue
    rows.push(splitCsvLine(rawLine))
  }
  return rows
}

function parseEnabled(cell: string | undefined, fallback: boolean): boolean {
  const value = (cell ?? '').trim().toLowerCase()
  if (value.length === 0) return fallback
  if (['1', 'true', 'yes', 'y', 'on', '是', '启用'].includes(value)) return true
  if (['0', 'false', 'no', 'n', 'off', '否', '禁用'].includes(value)) return false
  return fallback
}

function parseOptionalNumber(cell: string | undefined): number | null {
  const value = (cell ?? '').trim()
  if (value.length === 0) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}


function memberFromCells(
  cells: readonly string[],
  columns: readonly string[],
): NodeRosterMemberDto | null {
  const pick = (column: string): string => {
    const index = columns.indexOf(column)
    return index >= 0 ? (cells[index] ?? '').trim() : ''
  }

  const id = pick('id')
  const name = pick('name')
  if (id.length === 0 && name.length === 0) return null

  const tags = splitTags(pick('tags'))

  return {
    id: id.length > 0 ? id : null,
    name: name.length > 0 ? name : null,
    gender: pick('gender').length > 0 ? pick('gender') : null,
    group: pick('group').length > 0 ? pick('group') : null,
    count: parseOptionalNumber(pick('count')),
    weight: parseOptionalNumber(pick('weight')),
    enabled: parseEnabled(pick('enabled'), true),
    
    
    ...(tags === null && !columns.includes('tags') ? {} : { tags }),
  }
}










export function parseRosterImport(text: string, kind: RosterKind, fileName = ''): NodeRosterMemberDto[] | null {
  const trimmed = text.trim()
  if (trimmed.length === 0) return null

  const looksLikeJson =
    fileName.toLowerCase().endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')

  if (looksLikeJson) {
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return null
    }
    const array = Array.isArray(parsed) ? parsed : null
    if (array === null) return null

    const members: NodeRosterMemberDto[] = []
    for (const item of array) {
      const source = asObject(item)
      if (source === null) return null
      const id = asTrimmed(source['id'])
      const name = asTrimmed(source['name'])
      if (id.length === 0 && name.length === 0) continue
      const member: NodeRosterMemberDto = {
        id: id.length > 0 ? id : null,
        name: name.length > 0 ? name : null,
        gender: nullableText(source['gender']),
        group: nullableText(source['group']),
        count: nullableNumber(source['count']),
        weight: nullableNumber(source['weight']),
        enabled: source['enabled'] !== false,
      }
      
      
      
      if (source['tags'] !== undefined) member.tags = splitTags(source['tags'])
      members.push(member)
    }
    return members
  }

  const rows = parseCsvRows(trimmed)
  if (rows.length === 0) return null

  const first = rows[0] ?? []
  const hasHeader = first.some((cell) => CSV_KNOWN_COLUMNS.includes(cell.toLowerCase()))
  const columns = hasHeader
    ? first.map((cell) => cell.toLowerCase())
    : CSV_COLUMNS[kind]
  const dataRows = hasHeader ? rows.slice(1) : rows

  const members: NodeRosterMemberDto[] = []
  for (const row of dataRows) {
    const member = memberFromCells(row, columns)
    if (member !== null) members.push(member)
  }
  return members
}
