import type { AuditEventDto } from '@/api/protocol'
import { displayName } from '@/utils/display-name'
import { useCapabilityLabel } from '@/i18n'



















export interface AuditTranslator {
  
  t: (key: string, params?: Record<string, unknown>) => string
  
  te: (key: string) => boolean
  






  tm: (key: string) => unknown
}


export type AuditTargetKind = 'member' | 'node' | 'invite' | 'transfer' | 'group'

const TARGET_LABEL_KEYS: Record<AuditTargetKind, string> = {
  member: 'audit.targetMember',
  node: 'audit.targetNode',
  invite: 'audit.targetInvite',
  transfer: 'audit.targetTransfer',
  group: 'audit.targetGroup',
}


export interface AuditTargetView {
  kind: AuditTargetKind
  
  labelKey: string
  
  id: string
  
  name: string | null
}


export interface AuditDetailView {
  
  text: string
  



  raw: string | null
}








export function auditTargetKind(action: string, outcome: string): AuditTargetKind | null {
  if (action === 'member.join') return outcome === 'success' ? 'member' : 'invite'

  switch (action.split('.')[0]) {
    case 'member':
      return 'member'
    case 'node':
      return 'node'
    case 'invite':
      return 'invite'
    case 'transfer':
      return 'transfer'
    case 'group':
      return 'group'
    default:
      return null
  }
}


export function describeAuditTarget(event: AuditEventDto): AuditTargetView | null {
  const kind = auditTargetKind(event.action, event.outcome)
  if (kind === null) return null

  return {
    kind,
    labelKey: TARGET_LABEL_KEYS[kind],
    id: event.target_id?.trim() ?? '',
    
    
    
    name: kind === 'member' || kind === 'node' ? trimmedOrNull(event.target_display_name) : null,
  }
}








export function describeAuditAction(action: string, i18n: AuditTranslator): string {
  const key = `actions.${action.replace(/[._](\w)/g, (_, char: string) => char.toUpperCase())}`
  return i18n.te(key) ? i18n.t(key) : action
}


export function describeAuditOutcome(outcome: string, i18n: AuditTranslator): string {
  if (outcome === 'success') return i18n.t('audit.outcomeSuccess')
  if (outcome === 'denied') return i18n.t('audit.outcomeDenied')
  return i18n.t('audit.outcomeFailed')
}


export function describeAuditDetail(
  event: AuditEventDto,
  i18n: AuditTranslator,
): AuditDetailView | null {
  const detail = event.detail?.trim()
  if (!detail) return null

  const humanized = humanize(event, detail, i18n)
  if (humanized === null) return { text: detail, raw: null }

  
  
  return { text: humanized, raw: humanized.includes(detail) ? null : detail }
}


function humanize(event: AuditEventDto, detail: string, i18n: AuditTranslator): string | null {
  
  
  
  
  
  
  
  
  if (event.outcome !== 'success' && event.action !== 'node.policy_change') {
    const reason = errorText(detail, i18n)
    if (reason !== null) return reason
  }

  switch (event.action) {
    case 'node.policy_change':
      return humanizeNodePolicy(detail, i18n)

    case 'node.register':
      return nodeRegisterText(detail, i18n)

    case 'node.command_revoke':
      return humanizeCommandRevoke(event, detail, i18n)

    case 'member.role_change': {
      
      const transition = /^([A-Za-z]+)->([A-Za-z]+)$/.exec(detail)
      
      
      const from = transition?.[1]
      const to = transition?.[2]
      const fromText = from === undefined ? null : roleText(from, i18n)
      const toText = to === undefined ? null : roleText(to, i18n)
      if (fromText !== null && toText !== null) {
        return i18n.t('auditDetail.roleChanged', { from: fromText, to: toText })
      }
      return errorText(detail, i18n)
    }

    case 'member.remove': {
      const role = roleText(detail, i18n)
      return role === null ? null : i18n.t('auditDetail.removedRole', { role })
    }

    case 'member.join': {
      
      
      if (detail === 'expected_user_mismatch') return i18n.t('auditDetail.expectedUserMismatch')
      const reason = errorText(detail, i18n)
      if (reason !== null) return reason

      const role = roleText(detail, i18n)
      return role === null ? null : i18n.t('auditDetail.joinedRole', { role })
    }

    case 'invite.create': {
      const role = roleText(detail, i18n)
      return role === null ? null : i18n.t('auditDetail.inviteRole', { role })
    }

    case 'invite.revoke':
      
      return errorText(detail, i18n)

    case 'group.create':
      return i18n.t('auditDetail.groupCreated', { name: detail })

    case 'group.rename':
      return i18n.t('auditDetail.groupRenamed', { name: detail })

    case 'transfer.request':
      return i18n.t('auditDetail.transferTo', {
        name: displayName(event.target_display_name, detail),
      })

    case 'transfer.confirm':
      return i18n.t('auditDetail.transferFrom', {
        name: displayName(event.target_display_name, detail),
      })

    default:
      
      return errorText(detail, i18n)
  }
}








function humanizeNodePolicy(detail: string, i18n: AuditTranslator): string | null {
  const drawLocked = /^draw_locked=(true|false)$/i.exec(detail)?.[1]
  if (drawLocked !== undefined) {
    const on = drawLocked.toLowerCase() === 'true'
    return i18n.t('auditDetail.drawLocked', { value: on ? i18n.t('common.yes') : i18n.t('common.no') })
  }

  const parts = detail.split(':')
  const rawCapability = parts[0]
  const kind = parts[1]
  if (rawCapability === undefined || kind === undefined) return null
  const capability = capabilityText(rawCapability, i18n)

  if (kind === 'action' || kind === 'query') {
    return i18n.t(
      kind === 'query' ? 'auditDetail.capabilityQuery' : 'auditDetail.capabilityAction',
      { capability },
    )
  }

  if (kind === 'payload_too_large') {
    
    return i18n.t('auditDetail.payloadTooLarge', { capability, size: parts[2] ?? '' })
  }

  return i18n.t('auditDetail.capabilityDenied', {
    capability,
    reason: denialReasonText(kind, i18n),
  })
}










const DENIAL_REASON_KEYS: Record<string, string> = {
  NotAGroupMember: 'auditDetail.denialNotAGroupMember',
  NodeNotInGroup: 'auditDetail.denialNodeNotInGroup',
  UnknownCapability: 'auditDetail.denialUnknownCapability',
  NodeDoesNotSupportCapability: 'auditDetail.denialCapabilityUnsupported',
}

function denialReasonText(reason: string, i18n: AuditTranslator): string {
  const key = DENIAL_REASON_KEYS[reason]
  if (key !== undefined && i18n.te(key)) return i18n.t(key)
  return errorText(reason, i18n) ?? reason
}


function nodeRegisterText(detail: string, i18n: AuditTranslator): string | null {
  const key = `auditDetail.nodeRegister.${detail}`
  return i18n.te(key) ? i18n.t(key) : null
}















function humanizeCommandRevoke(
  event: AuditEventDto,
  detail: string,
  i18n: AuditTranslator,
): string | null {
  const parts = detail.split(':')
  const rawCapability = parts[0]
  const verb = parts[1]
  const commandId = parts[2]
  if (rawCapability === undefined || verb === undefined) return null

  
  if (event.outcome !== 'success') return errorText(verb, i18n)

  
  if (verb !== 'revoke' || parts.length !== 3) return null
  if (commandId === undefined || commandId.length === 0) return null

  return i18n.t('auditDetail.commandRevoked', {
    capability: capabilityText(rawCapability, i18n),
    commandId,
  })
}


function roleText(role: string, i18n: AuditTranslator): string | null {
  const key = `roles.${role.trim().toLowerCase()}`
  
  
  
  return i18n.te(key) ? i18n.t(key) : null
}









function capabilityText(capability: string, i18n: AuditTranslator): string {
  return useCapabilityLabel((key) => i18n.tm(key))(capability)
}


function errorText(code: string, i18n: AuditTranslator): string | null {
  const direct = `errors.${code}`
  if (i18n.te(direct)) return i18n.t(direct)

  
  
  
  const snake = toSnakeCase(code)
  const normalized = `errors.${snake}`
  if (snake !== code && i18n.te(normalized)) return i18n.t(normalized)

  return null
}


function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

function trimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : null
}
