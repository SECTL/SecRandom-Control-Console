import {
  CLIENT_SETTINGS_PAGES,
  isClientSettingContainer,
  type ClientSettingOptionEntry,
  type ClientSettingRow,
  type ClientSettingText,
  type ClientSettingValueRow,
  type ClientSettingsPage,
} from '@/data/client-settings-pages'






















export function isBatchChoiceControl(control: ClientSettingValueRow['control']): boolean {
  return control === 'toggle' || control === 'select'
}


export function needsBatchInclude(control: ClientSettingValueRow['control']): boolean {
  return !isBatchChoiceControl(control)
}








export interface BatchConfigRow {
  
  path: string
  pageId: string
  sectionId: string
  control: ClientSettingValueRow['control']
  





  readonly: boolean
  
  options: readonly ClientSettingOptionEntry[]
  labels: ClientSettingText
}














export function collectBatchConfigRows(
  pages: readonly ClientSettingsPage[] = CLIENT_SETTINGS_PAGES,
): readonly BatchConfigRow[] {
  const rows: BatchConfigRow[] = []

  const walk = (row: ClientSettingRow, pageId: string, sectionId: string): void => {
    if (!isClientSettingContainer(row)) {
      rows.push({
        path: row.path,
        pageId,
        sectionId,
        control: row.control,
        readonly: row.readonly === true || row.control === 'readonly',
        options: row.options ?? [],
        labels: row.labels,
      })
    }

    
    for (const child of row.rows ?? []) walk(child, pageId, sectionId)
  }

  for (const page of pages) {
    for (const section of page.sections) {
      for (const row of section.rows) walk(row, page.id, section.id)
    }
  }

  return rows
}


export function batchOptionValues(row: BatchConfigRow): readonly string[] {
  return row.options.map((entry) => (typeof entry === 'string' ? entry : entry.value))
}














export interface BatchConfigDraft {
  
  include: boolean
  value: string | number | boolean
  
  cleared: boolean
}


export function emptyBatchConfigDraft(): BatchConfigDraft {
  return { include: false, value: '', cleared: false }
}








export interface BatchDraftTarget {
  control: ClientSettingValueRow['control']
  
  readonly?: boolean
}


export function isBatchReadonlyRow(row: BatchDraftTarget): boolean {
  return row.readonly === true || row.control === 'readonly'
}


export function batchDraftIncluded(
  row: BatchDraftTarget,
  draft: BatchConfigDraft | undefined,
): boolean {
  if (isBatchReadonlyRow(row) || draft === undefined) return false
  if (isBatchChoiceControl(row.control)) return draft.value !== ''
  return draft.include
}


export type BatchConfigProblemKind = 'missing' | 'notNumber' | 'notOption'

export interface BatchConfigProblem {
  path: string
  kind: BatchConfigProblemKind
  
  options: readonly string[]
}

export interface BatchConfigPlan {
  
  patch: Record<string, unknown>
  problems: readonly BatchConfigProblem[]
  






  included: number
  
  readonlyCount: number
}











export function buildBatchConfigPlan(
  rows: readonly BatchConfigRow[],
  drafts: Record<string, BatchConfigDraft>,
): BatchConfigPlan {
  const patch: Record<string, unknown> = {}
  const problems: BatchConfigProblem[] = []
  let included = 0
  let readonlyCount = 0

  for (const row of rows) {
    if (row.readonly) {
      readonlyCount += 1
      continue
    }

    const draft = drafts[row.path]
    if (draft === undefined || !batchDraftIncluded(row, draft)) continue

    included += 1

    switch (row.control) {
      case 'toggle': {
        if (typeof draft.value !== 'boolean') {
          problems.push({ path: row.path, kind: 'missing', options: [] })
          break
        }
        patch[row.path] = draft.value
        break
      }

      case 'select': {
        const value = typeof draft.value === 'string' ? draft.value : ''
        const allowed = batchOptionValues(row)
        if (value.length === 0) {
          problems.push({ path: row.path, kind: 'missing', options: [] })
          break
        }
        if (allowed.length > 0 && !allowed.includes(value)) {
          problems.push({ path: row.path, kind: 'notOption', options: allowed })
          break
        }
        patch[row.path] = value
        break
      }

      case 'number': {
        const raw = String(draft.value).trim()
        const value = typeof draft.value === 'number' ? draft.value : Number(raw)
        if (raw.length === 0) {
          problems.push({ path: row.path, kind: 'missing', options: [] })
          break
        }
        if (!Number.isFinite(value)) {
          problems.push({ path: row.path, kind: 'notNumber', options: [] })
          break
        }
        patch[row.path] = value
        break
      }

      default: {
        
        const text = typeof draft.value === 'string' ? draft.value : String(draft.value)
        if (text.trim().length === 0 && !draft.cleared) {
          problems.push({ path: row.path, kind: 'missing', options: [] })
          break
        }
        
        patch[row.path] = draft.cleared ? '' : text.trim()
        break
      }
    }
  }

  return { patch, problems, included, readonlyCount }
}
