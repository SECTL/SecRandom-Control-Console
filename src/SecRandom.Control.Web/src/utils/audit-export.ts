import type { AuditEventDto } from '@/api/protocol'
import {
  describeAuditAction,
  describeAuditDetail,
  describeAuditOutcome,
  describeAuditTarget,
  type AuditTranslator,
} from '@/utils/audit-detail'




















export const AUDIT_CSV_COLUMNS = [
  'time',
  'event_id',
  'action',
  'action_label',
  'outcome',
  'outcome_label',
  'target_kind',
  'target_id',
  'target_display_name',
  'detail',
  'detail_label',
  'actor_user_id',
  'actor_display_name',
  'actor_device_id',
] as const

export type AuditCsvColumn = (typeof AUDIT_CSV_COLUMNS)[number]


function csvCell(value: string): string {
  return /["\r\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}














function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

function cellOf(event: AuditEventDto, column: AuditCsvColumn, i18n: AuditTranslator): string {
  const target = describeAuditTarget(event)
  const detail = describeAuditDetail(event, i18n)

  switch (column) {
    case 'time':
      
      return event.at
    case 'event_id':
      return event.event_id
    case 'action':
      return event.action
    case 'action_label':
      return describeAuditAction(event.action, i18n)
    case 'outcome':
      return event.outcome
    case 'outcome_label':
      return describeAuditOutcome(event.outcome, i18n)
    case 'target_kind':
      
      return target?.kind ?? ''
    case 'target_id':
      return event.target_id ?? ''
    case 'target_display_name':
      return event.target_display_name ?? ''
    case 'detail':
      return event.detail ?? ''
    case 'detail_label':
      
      return detail?.text ?? ''
    case 'actor_user_id':
      return event.actor_user_id ?? ''
    case 'actor_display_name':
      return event.actor_display_name ?? ''
    case 'actor_device_id':
      return event.actor_device_id ?? ''
  }
}

const UTF8_BOM = '\uFEFF'







export function toAuditCsv(events: readonly AuditEventDto[], i18n: AuditTranslator): string {
  if (events.length === 0) return ''

  const lines = [AUDIT_CSV_COLUMNS.join(',')]
  for (const event of events) {
    lines.push(
      AUDIT_CSV_COLUMNS.map((column) => csvCell(neutralizeFormula(cellOf(event, column, i18n)))).join(
        ',',
      ),
    )
  }
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`
}


const UNSAFE_FILE_CHARS = /[\\/:*?"<>|]/g

function safeName(value: string | null): string {
  return (value ?? '')
    .replace(UNSAFE_FILE_CHARS, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 64)
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}









export function auditCsvFileName(groupName: string | null, now: Date): string {
  const base = safeName(groupName)
  const stamp =
    `${now.getFullYear()}${twoDigits(now.getMonth() + 1)}${twoDigits(now.getDate())}` +
    `-${twoDigits(now.getHours())}${twoDigits(now.getMinutes())}`

  return base.length > 0 ? `audit-${base}-${stamp}.csv` : `audit-${stamp}.csv`
}
