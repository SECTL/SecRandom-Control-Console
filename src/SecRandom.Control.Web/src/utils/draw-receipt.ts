





















import type { DrawDrawnMember } from '@/api/protocol'


export interface DrawReceipt {
  
  target: string | null
  
  listName: string | null
  
  count: number | null
  
  drawn: DrawDrawnMember[]
  
  deniedReason: string | null
  
  invalidField: string | null
  
  invalidWhy: string | null
  








  invalidRange: { min: number; max: number } | null
  
  recognized: boolean
}












function describeInvalid(reason: string): {
  field: string | null
  why: string | null
  range: { min: number; max: number } | null
} {
  const prefix = 'invalid_value:'
  
  
  
  if (!reason.startsWith(prefix)) {
    return { field: null, why: null, range: null }
  }

  const parts = reason.slice(prefix.length).split(':')

  const field = parts[0]?.trim() ?? ''
  const whyPart = parts[1]?.trim() ?? ''
  
  const range = parseRange(whyPart) ?? parseRange(parts[2] ?? '')
  
  const why = whyPart.replace(/:\s*\d+\.\.\d+\s*$/, '').trim()

  return {
    field: field.length > 0 ? field : null,
    why: why.length > 0 ? why : null,
    range,
  }
}


function parseRange(text: string): { min: number; max: number } | null {
  const match = text.trim().match(/^(\d+)\.\.(\d+)$/)
  if (match === null) return null
  return { min: Number(match[1]), max: Number(match[2]) }
}

function asText(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim()
    return text.length > 0 ? text : null
  }
  return null
}

function asCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function asDrawnMembers(value: unknown): DrawDrawnMember[] {
  if (!Array.isArray(value)) return []

  const drawn: DrawDrawnMember[] = []
  for (const item of value) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) continue
    const record = item as Record<string, unknown>
    
    
    const id = asText(record['id'])
    const name = asText(record['name'])
    if (id === null && name === null) continue
    drawn.push({ id, name })
  }
  return drawn
}








export function parseDrawReceipt(context: Record<string, unknown> | null): DrawReceipt {
  const record = context ?? {}

  const drawn = asDrawnMembers(record['drawn'])
  const target = asText(record['target'])
  const listName = asText(record['list_name'])
  const count = asCount(record['count'])
  const deniedReason = asText(record['reason'])
  const rawField = asText(record['field'])
  const rawWhy = asText(record['why'])

  
  
  
  const parsed = rawField !== null || rawWhy !== null ? describeInvalid(`invalid_value:${rawField ?? ''}:${rawWhy ?? ''}`) : null

  const isDrawReceipt =
    target !== null ||
    rawField !== null ||
    rawWhy !== null ||
    typeof record['draw_locked'] === 'boolean' ||
    record['drawing'] === true ||
    
    
    
    deniedReason !== null

  return {
    target,
    listName,
    count,
    drawn,
    deniedReason,
    invalidField: parsed?.field ?? null,
    invalidWhy: parsed?.why ?? null,
    invalidRange: parsed?.range ?? null,
    recognized: isDrawReceipt || drawn.length > 0,
  }
}


export interface DrawFailureReason {
  key: string
  params: Record<string, string | number>
  






  rawParams?: Record<string, string>
  tone: 'warn' | 'fail'
}












export function describeDrawFailure(
  reason: string,
  detail: string,
  context: Record<string, unknown> | null,
): DrawFailureReason | null {
  
  
  if (reason.length === 0) return null

  const record = context ?? {}
  const receipt = parseDrawReceipt(context)

  switch (reason) {
    









    case 'draw_denied': {
      const cause = receipt.deniedReason

      if (cause === 'no_candidate') {
        return { key: 'nodeDetail.feedback.drawDeniedNoCandidate', params: {}, tone: 'fail' }
      }
      if (cause === 'blocked_by_class_time') {
        return { key: 'nodeDetail.feedback.drawDeniedClassTime', params: {}, tone: 'fail' }
      }
      if (cause === 'local_verification_required') {
        return { key: 'nodeDetail.feedback.drawDeniedNeedsLocal', params: {}, tone: 'fail' }
      }

      
      
      if (cause === 'draw_locked') {
        return { key: 'nodeDetail.feedback.drawLocked', params: {}, tone: 'fail' }
      }
      if (cause === 'busy') {
        return { key: 'nodeDetail.feedback.drawBusy', params: {}, tone: 'warn' }
      }
      if (cause === 'invalid_value') {
        return describeInvalidReason({ detail, receipt })
      }

      
      
      
      return {
        key: 'nodeDetail.feedback.drawDenied',
        params: {},
        rawParams: { reason: cause ?? detail },
        tone: 'fail',
      }
    }

    
    case 'draw_locked':
      return { key: 'nodeDetail.feedback.drawLocked', params: {}, tone: 'fail' }

    



    case 'busy':
      return {
        key: record['drawing'] === true ? 'nodeDetail.feedback.drawDrawing' : 'nodeDetail.feedback.drawBusy',
        params: {},
        tone: 'warn',
      }

    




    case 'invalid_value':
      return describeInvalidReason({ detail, receipt })

    default:
      return null
  }
}











function describeInvalidReason(input: {
  detail: string
  receipt: DrawReceipt
}): DrawFailureReason | null {
  const { detail, receipt } = input

  
  
  
  
  
  
  const fromDetail = describeInvalid(detail)
  const field = fromDetail.field ?? receipt.invalidField
  const why = fromDetail.why ?? receipt.invalidWhy
  const range = fromDetail.range ?? receipt.invalidRange
  if (field === null && why === null) return null

  
  if (field === 'list_name' && why === 'not_found') {
    
    
    
    return { key: 'nodeDetail.feedback.drawListNotFoundNoName', params: {}, tone: 'fail' }
  }

  
  if (field === 'list_name' && why === 'no_candidate') {
    return { key: 'nodeDetail.feedback.drawDeniedNoCandidate', params: {}, tone: 'fail' }
  }

  
  
  
  
  if (why === 'not_in_list' && (field === 'gender' || field === 'group')) {
    return field === 'gender'
      ? { key: 'nodeDetail.feedback.localCheckGender', params: { value: '' }, tone: 'fail' }
      : { key: 'nodeDetail.feedback.localCheckGroup', params: { value: '' }, tone: 'fail' }
  }

  
  if (why === 'no_matching_member' && (field === 'gender' || field === 'group')) {
    
    
    
    return { key: 'nodeDetail.feedback.drawNoMatching', params: { field, value: '' }, tone: 'fail' }
  }

  
  
  
  if (field === 'count' && why === 'out_of_range') {
    return range === null
      ? { key: 'nodeDetail.feedback.localCheckCount', params: { available: '' }, tone: 'fail' }
      : {
          key: 'nodeDetail.feedback.drawCountOutOfRange',
          params: { min: range.min, max: range.max },
          tone: 'fail',
        }
  }

  return null
}













export function drawDeniedReasonKey(reason: string): string | null {
  if (reason === 'draw_locked') return 'nodeDetail.feedback.drawLocked'
  if (reason === 'busy') return 'nodeDetail.feedback.drawBusy'
  if (reason === 'no_candidate') return 'nodeDetail.feedback.drawDeniedNoCandidate'
  return null
}









export function formatDrawnMembers(drawn: readonly DrawDrawnMember[]): string {
  return drawn
    .map((member) => [member.id?.trim() ?? '', member.name?.trim() ?? ''].filter((part) => part.length > 0).join(' '))
    .filter((text) => text.length > 0)
    .join(' · ')
}
