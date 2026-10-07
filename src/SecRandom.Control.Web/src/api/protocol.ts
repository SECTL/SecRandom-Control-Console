















export const GroupRole = {
  Viewer: 'viewer',
  Operator: 'operator',
  Admin: 'admin',
  Owner: 'owner',
} as const

export type GroupRole = (typeof GroupRole)[keyof typeof GroupRole]


export const GROUP_ROLE_RANK: Record<GroupRole, number> = {
  viewer: 0,
  operator: 10,
  admin: 30,
  owner: 40,
}

export function roleAtLeast(role: GroupRole, minimum: GroupRole): boolean {
  return GROUP_ROLE_RANK[role] >= GROUP_ROLE_RANK[minimum]
}


export const NodeCapability = {
  StatusRead: 'node.status.read',
  DrawLock: 'draw.lock',
  DrawTrigger: 'draw.trigger',
  





  DrawTriggerConditions: 'draw.trigger.conditions',
  





  DrawReset: 'draw.reset',
  RosterRead: 'roster.read',
  RosterWrite: 'roster.write',
  





  SettingsRead: 'settings.read',
  SettingsWrite: 'settings.write',
  ProofList: 'proof.list',
  MediaPlay: 'media.play',
} as const

export type NodeCapability = (typeof NodeCapability)[keyof typeof NodeCapability]

export interface GroupSummary {
  group_id: string
  name: string
  owner_user_id: string
  



  owner_display_name?: string | null
  created_at: string
  
  role: GroupRole
}

export interface MemberView {
  user_id: string
  role: GroupRole
  joined_at: string
  display_name?: string
}

export interface NodeView {
  node_id: string
  group_id: string
  platform: string
  version: string
  capabilities: string[]
  
  local_remote_allowed: boolean
  







  display_name?: string | null
  last_heartbeat_at?: string
  registered_at: string
  



  online: boolean
  




  draw_locked: boolean
}


export const MAX_ACTION_EXPIRES_SECONDS = 3600


export const DEFAULT_ACTION_EXPIRES_SECONDS = 120


export interface DesiredStateResult {
  node_id: string
  revision: number
  draw_locked: boolean
  
  delivered: boolean
}


export interface NodeCommandDto {
  command_id: string
  target_node_id: string
  capability: string
  kind: string
  









  status: string
  issued_at: string
  expires_at: string
  delivered_at?: string
  resolved_at?: string
  result_detail?: string
  










  result_context?: Record<string, unknown> | null
  









  result_payload?: unknown
}















export type MediaPlayAction = 'announce' | 'show'


export const MEDIA_VOLUME_MIN_PERCENT = 0
export const MEDIA_VOLUME_MAX_PERCENT = 100











export interface MediaPlayOptions {
  





  show_quick_draw_window?: boolean
  





  system_volume_percent?: number
  






  voice_volume_percent?: number
}


export interface MediaPlayPayload extends MediaPlayOptions {
  action: MediaPlayAction
  text: string
}


export interface RosterStudentInput {
  id?: string
  name?: string
  gender?: string
  group?: string
  enabled?: boolean
  






  tags?: string[]
}


export interface RosterPushRequest {
  list_name: string
  
  mode: 'replace' | 'merge'
  
  activate: boolean
  students: RosterStudentInput[]
}








export interface RosterPrizeInput {
  id?: string
  name?: string
  count?: number
  weight?: number
  enabled?: boolean
  
  tags?: string[]
}








export interface PrizeRosterPushRequest {
  list_name: string
  mode: 'replace' | 'merge'
  activate: boolean
  roster_kind: 'prizes'
  prizes: RosterPrizeInput[]
}


export type RosterPushPayload = RosterPushRequest | PrizeRosterPushRequest











export type NodeSettingType = 'bool' | 'int' | 'double' | 'string' | 'enum'











export type NodeLocalizedText = Partial<Record<'zh-CN' | 'en-US' | 'ja-JP', string>>








export interface NodeSettingFieldDto {
  
  path: string
  category: string
  type: string
  
  value: unknown
  






  writable: boolean
  min?: number | null
  max?: number | null
  
  options?: string[] | null
  








  label?: string | null
  
  description?: string | null
  







  labels?: NodeLocalizedText | null
  
  descriptions?: NodeLocalizedText | null
}

export interface NodeSettingCategoryDto {
  
  id: string
  
  label?: string | null
  description?: string | null
  
  labels?: NodeLocalizedText | null
  descriptions?: NodeLocalizedText | null
  fields: NodeSettingFieldDto[]
}


export interface NodeSettingsReadPayload {
  categories: NodeSettingCategoryDto[]
}








export interface SettingsReadRequest {
  categories?: string[]
  locale?: string
}


export type RosterKind = 'students' | 'prizes'







export interface RosterReadRequest {
  roster_kind: RosterKind
  list_name?: string
  include_disabled?: boolean
}







export interface NodeRosterMemberDto {
  id: string | null
  name: string | null
  gender: string | null
  group: string | null
  count: number | null
  weight: number | null
  enabled: boolean
  








  tags?: string[] | null
}


export interface NodeRosterListDto {
  name: string
  
  is_default: boolean
  
  count: number
  
  total: number
  




  truncated: boolean
  members: NodeRosterMemberDto[]
}


export interface NodeRosterReadPayload {
  roster_kind: string
  lists: NodeRosterListDto[]
}














export type DrawTarget = 'quick' | 'roll_call' | 'lottery'



















export interface DrawTriggerRequest {
  target?: DrawTarget
  
  list_name?: string
  
  count?: number
  
  gender?: string
  
  group?: string
  





  conditions?: DrawConditionsRequest
}


export const DRAW_CONDITIONS_VERSION = 1












export interface DrawConditionsRequest {
  version: number
  
  prize_tags?: string[]
  
  student_list?: string
  
  gender?: string
  
  group?: string
}







export const DRAW_MAX_COUNT = 200


export interface DrawDrawnMember {
  id?: string | null
  name?: string | null
}










export interface DrawTriggerDetail {
  target?: string
  list_name?: string | null
  
  count?: number
  drawn?: DrawDrawnMember[]
  
  draw_locked?: boolean
  
  drawing?: boolean
  
  reason?: string
  
  field?: string
  why?: string
}










export type DrawResetTarget = 'roll_call' | 'lottery' | 'quick'







export interface DrawResetRequest {
  target: DrawResetTarget
  list_name?: string
}







export interface DrawResetDetail {
  target?: string
  list_name?: string | null
  cleared?: number
}

export interface CurrentUser {
  user_id: string
  display_name?: string
  
  avatar_url?: string
  email?: string
  



  max_owned_groups?: number
  groups: GroupSummary[]
}


export type AuthSession = CurrentUser


export interface ServerMeta {
  service: string
  protocol: string
  server_version: string
  






  server_time?: string
  status: string
}


export interface ApiErrorBody {
  code: string
}







export interface GroupDto {
  group_id: string
  name: string
  owner_user_id: string
  
  owner_display_name?: string | null
  created_at: string
  
  role: GroupRole
}

export interface MemberDto {
  user_id: string
  display_name?: string
  



  avatar_url?: string | null
  role: GroupRole
  joined_at: string
  
  is_self: boolean
}

export type InviteStatus = 'pending' | 'used' | 'expired' | 'revoked'


export interface InviteDto {
  code: string
  display_code: string
  role: GroupRole
  created_by_user_id: string
  created_at: string
  expires_at: string
  status: InviteStatus
  used_by_user_id?: string
  used_at?: string
}

export interface RedeemResultDto {
  group_id: string
  role: GroupRole
  group_name: string
  already_member: boolean
}

export type TransferStatus = 'pending' | 'confirmed' | 'rejected' | 'expired'

export interface TransferDto {
  transfer_id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  created_at: string
  expires_at: string
  status: TransferStatus
  demoted_to: GroupRole
}


export interface PendingTransferBriefDto {
  transfer_id: string
  expires_at: string
  restricted: true
}





export type PendingTransfer = TransferDto | PendingTransferBriefDto


export type AuditAction =
  | 'group.create'
  | 'group.rename'
  | 'member.invite'
  | 'member.join'
  | 'member.role_change'
  | 'member.remove'
  | 'invite.create'
  | 'invite.revoke'
  | 'transfer.request'
  | 'transfer.confirm'
  | 'transfer.reject'
  | 'transfer.expire'
  | 'node.register'
  | 'node.policy_change'

export type AuditOutcome = 'success' | 'denied' | 'failed'

export interface AuditEventDto {
  event_id: string
  at: string
  actor_user_id?: string
  




  actor_display_name?: string | null
  
  actor_device_id?: string
  action: string
  outcome: string
  target_id?: string
  







  target_display_name?: string | null
  detail?: string
}








export interface AuditPageDto {
  items: AuditEventDto[]
  
  total: number
  
  page?: number | null
  
  limit: number
}


export interface AuditDeviceFacetDto {
  device_id: string
  count: number
}


export interface AuditNodeFacetDto {
  node_id: string
  
  display_name?: string | null
  count: number
}


export interface AuditActorFacetDto {
  user_id: string
  
  display_name?: string | null
  count: number
}














export interface AuditFacetsDto {
  actor_devices?: { items: AuditDeviceFacetDto[]; truncated: boolean }
  target_nodes?: { items: AuditNodeFacetDto[]; truncated: boolean }
  actors?: { items: AuditActorFacetDto[]; truncated: boolean }
}












export interface SetupMode {
  id: string
  
  display_name: string
  






  available: boolean
  
  requires_credentials: boolean
}


export interface SetupState {
  
  initialized: boolean
  
  mode: string | null
  
  display_name: string | null
  






  membership_enabled: boolean
  modes: SetupMode[]
}


export interface SetupSubmitRequest {
  
  setup_token: string
  mode: string
  
  display_name?: string
  
  admin_username?: string
  
  admin_password?: string
}


export interface SetupResult {
  ok: boolean
  mode: string
}
