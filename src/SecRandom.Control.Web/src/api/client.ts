import type {
  ApiErrorBody,
  AuditFacetsDto,
  AuditPageDto,
  AuthSession,
  GroupDto,
  GroupRole,
  InviteDto,
  DesiredStateResult,
  MemberDto,
  MediaPlayAction,
  MediaPlayOptions,
  MediaPlayPayload,
  NodeCommandDto,
  NodeView,
  PendingTransferBriefDto,
  RedeemResultDto,
  RosterPushPayload,
  RosterReadRequest,
  ServerMeta,
  TransferDto,
  DrawTriggerRequest,
  DrawResetTarget,
  DrawConditionsRequest,
  SetupResult,
  SetupState,
  SetupSubmitRequest,
} from './protocol'
import { DEFAULT_ACTION_EXPIRES_SECONDS, DRAW_CONDITIONS_VERSION } from './protocol'






export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, status: number, message?: string) {
    super(message ?? code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}









async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    ...(options.signal ? { signal: options.signal } : {}),
  })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const payload: unknown = text.length > 0 ? safeParse(text) : undefined

  if (!response.ok) {
    const code = extractErrorCode(payload) ?? `http_${response.status}`
    throw new ApiError(code, response.status)
  }

  return payload as T
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function extractErrorCode(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const code = (payload as ApiErrorBody).code
    if (typeof code === 'string' && code.length > 0) return code
  }
  return undefined
}








export function buildMediaPlayPayload(
  action: MediaPlayAction,
  text: string,
  options: MediaPlayOptions = {},
): MediaPlayPayload {
  const payload: MediaPlayPayload = { action, text }

  if (options.show_quick_draw_window !== undefined) {
    payload.show_quick_draw_window = options.show_quick_draw_window
  }
  if (typeof options.system_volume_percent === 'number') {
    payload.system_volume_percent = options.system_volume_percent
  }
  if (typeof options.voice_volume_percent === 'number') {
    payload.voice_volume_percent = options.voice_volume_percent
  }

  return payload
}













export function compactDrawPayload(request: DrawTriggerRequest): DrawTriggerRequest {
  const payload: DrawTriggerRequest = {}

  if (request.target !== undefined) payload.target = request.target
  if (request.count !== undefined) payload.count = request.count

  const listName = request.list_name?.trim() ?? ''
  if (listName.length > 0) payload.list_name = listName

  const gender = request.gender?.trim() ?? ''
  if (gender.length > 0) payload.gender = gender

  const group = request.group?.trim() ?? ''
  if (group.length > 0) payload.group = group

  const conditions = compactDrawConditions(request.conditions)
  if (conditions !== null) payload.conditions = conditions

  return payload
}











export function compactDrawConditions(
  conditions: DrawConditionsRequest | undefined,
): DrawConditionsRequest | null {
  if (conditions === undefined) return null

  const tags = (conditions.prize_tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
  const studentList = conditions.student_list?.trim() ?? ''
  const gender = conditions.gender?.trim() ?? ''
  const group = conditions.group?.trim() ?? ''

  if (tags.length === 0 && studentList.length === 0) return null

  const compacted: DrawConditionsRequest = { version: DRAW_CONDITIONS_VERSION }
  if (tags.length > 0) compacted.prize_tags = tags

  if (studentList.length > 0) {
    compacted.student_list = studentList
    if (gender.length > 0) compacted.gender = gender
    if (group.length > 0) compacted.group = group
  }

  return compacted
}













export interface AuditQuery {
  limit?: number
  
  page?: number
  
  beforeAt?: string
  
  beforeId?: string
  
  action?: string
  
  actionPrefix?: string
  
  outcome?: string
  
  actor?: string
  
  actorDevice?: string
  
  targetId?: string
  
  from?: string
  
  to?: string
}

export const api = {
  
  session: (signal?: AbortSignal) =>
    request<AuthSession>('/api/auth/session', signal ? { signal } : {}),

  
  serverMeta: (signal?: AbortSignal) =>
    request<ServerMeta>('/v1/meta', signal ? { signal } : {}),

  
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  

  





  setupStatus: (signal?: AbortSignal) =>
    request<SetupState>('/api/setup/status', signal ? { signal } : {}),

  









  setup: (payload: SetupSubmitRequest) =>
    request<SetupResult>('/api/setup', { method: 'POST', body: payload }),

  





  passwordLogin: (username: string, password: string) =>
    request<{ ok: boolean }>('/api/auth/password-login', {
      method: 'POST',
      body: { username, password },
    }),

  

  
  listGroups: (signal?: AbortSignal) =>
    request<GroupDto[]>('/v1/groups', signal ? { signal } : {}),

  getGroup: (groupId: string, signal?: AbortSignal) =>
    request<GroupDto>(`/v1/groups/${encodeURIComponent(groupId)}`, signal ? { signal } : {}),

  createGroup: (name: string) =>
    request<GroupDto>('/v1/groups', { method: 'POST', body: { name } }),

  renameGroup: (groupId: string, name: string) =>
    request<GroupDto>(`/v1/groups/${encodeURIComponent(groupId)}`, {
      method: 'PATCH',
      body: { name },
    }),

  










  deleteGroup: (groupId: string) =>
    request<void>(`/v1/groups/${encodeURIComponent(groupId)}`, { method: 'DELETE' }),

  




  saveGroupOrder: (groupIds: string[]) =>
    request<void>('/v1/users/me/group-order', { method: 'PUT', body: { group_ids: groupIds } }),

  

  







  listNodes: (groupId: string, signal?: AbortSignal) =>
    request<NodeView[]>(`/v1/groups/${encodeURIComponent(groupId)}/nodes`, signal ? { signal } : {}),

  





  removeNode: (groupId: string, nodeId: string) =>
    request<void>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}`,
      { method: 'DELETE' },
    ),

  





  setDrawLock: (groupId: string, nodeId: string, drawLocked: boolean) =>
    request<DesiredStateResult>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: { capability: 'draw.lock', kind: 'set_desired_state', payload: { draw_locked: drawLocked } },
      },
    ),

  

















  triggerDraw: (
    groupId: string,
    nodeId: string,
    payload?: DrawTriggerRequest,
    expiresInSeconds: number = DEFAULT_ACTION_EXPIRES_SECONDS,
  ) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: {
          capability: 'draw.trigger',
          kind: 'action',
          expires_in_seconds: expiresInSeconds,
          
          ...(payload === undefined ? {} : { payload: compactDrawPayload(payload) }),
        },
      },
    ),

  










  resetDraw: (
    groupId: string,
    nodeId: string,
    target: DrawResetTarget,
    listName?: string,
    expiresInSeconds: number = DEFAULT_ACTION_EXPIRES_SECONDS,
  ) => {
    const trimmed = listName?.trim() ?? ''
    return request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: {
          capability: 'draw.reset',
          kind: 'action',
          expires_in_seconds: expiresInSeconds,
          
          payload: trimmed.length === 0 ? { target } : { target, list_name: trimmed },
        },
      },
    )
  },

  










  playMedia: (
    groupId: string,
    nodeId: string,
    action: MediaPlayAction,
    text: string,
    options: MediaPlayOptions = {},
    expiresInSeconds: number = DEFAULT_ACTION_EXPIRES_SECONDS,
  ) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: {
          capability: 'media.play',
          kind: 'action',
          expires_in_seconds: expiresInSeconds,
          payload: buildMediaPlayPayload(action, text, options),
        },
      },
    ),

  






  patchSettings: (
    groupId: string,
    nodeId: string,
    patch: Record<string, unknown>,
    expiresInSeconds: number = DEFAULT_ACTION_EXPIRES_SECONDS,
  ) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: {
          capability: 'settings.write',
          kind: 'action',
          expires_in_seconds: expiresInSeconds,
          payload: { patch },
        },
      },
    ),

  








  pushRoster: (
    groupId: string,
    nodeId: string,
    payload: RosterPushPayload,
    expiresInSeconds = 300,
  ) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: {
          capability: 'roster.write',
          kind: 'action',
          expires_in_seconds: expiresInSeconds,
          payload,
        },
      },
    ),

  








  getCommand: (groupId: string, commandId: string, signal?: AbortSignal) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/commands/${encodeURIComponent(commandId)}`,
      signal ? { signal } : {},
    ),

  









  revokeCommand: (groupId: string, commandId: string) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/commands/${encodeURIComponent(commandId)}`,
      { method: 'DELETE' },
    ),

  










  readSettings: (
    groupId: string,
    nodeId: string,
    categories?: readonly string[],
    locale?: string,
    expiresInSeconds = 30,
  ) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: {
          capability: 'settings.read',
          kind: 'query',
          expires_in_seconds: expiresInSeconds,
          ...(categories === undefined && locale === undefined
            ? {}
            : {
                payload: {
                  ...(categories === undefined ? {} : { categories: [...categories] }),
                  
                  
                  ...(locale === undefined ? {} : { locale }),
                },
              }),
        },
      },
    ),

  






  readRoster: (groupId: string, nodeId: string, payload: RosterReadRequest, expiresInSeconds = 30) =>
    request<NodeCommandDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/nodes/${encodeURIComponent(nodeId)}/commands`,
      {
        method: 'POST',
        body: {
          capability: 'roster.read',
          kind: 'query',
          expires_in_seconds: expiresInSeconds,
          payload,
        },
      },
    ),

  

  listMembers: (groupId: string, signal?: AbortSignal) =>
    request<MemberDto[]>(`/v1/groups/${encodeURIComponent(groupId)}/members`, signal ? { signal } : {}),

  
  changeMemberRole: (groupId: string, userId: string, role: GroupRole) =>
    request<{ user_id: string; role: GroupRole }>(
      `/v1/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
      { method: 'PATCH', body: { role } },
    ),

  removeMember: (groupId: string, userId: string) =>
    request<void>(
      `/v1/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    ),

  

  listInvites: (groupId: string, signal?: AbortSignal) =>
    request<InviteDto[]>(`/v1/groups/${encodeURIComponent(groupId)}/invites`, signal ? { signal } : {}),

  createInvite: (groupId: string, role: GroupRole, expectedUserId?: string) =>
    request<InviteDto>(`/v1/groups/${encodeURIComponent(groupId)}/invites`, {
      method: 'POST',
      
      body: expectedUserId === undefined ? { role } : { role, expected_user_id: expectedUserId },
    }),

  revokeInvite: (groupId: string, code: string) =>
    request<void>(
      `/v1/groups/${encodeURIComponent(groupId)}/invites/${encodeURIComponent(code)}`,
      { method: 'DELETE' },
    ),

  
  redeemInvite: (code: string) =>
    request<RedeemResultDto>('/v1/invites/redeem', { method: 'POST', body: { code } }),

  

  






  listAudit: (groupId: string, query: AuditQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams()
    if (query.limit !== undefined) params.set('limit', String(query.limit))
    
    if (query.page !== undefined) params.set('page', String(query.page))
    
    
    if (query.beforeAt !== undefined) params.set('before', query.beforeAt)
    if (query.beforeId !== undefined) params.set('before_id', query.beforeId)
    if (query.action !== undefined) params.set('action', query.action)
    if (query.actionPrefix !== undefined) params.set('action_prefix', query.actionPrefix)
    if (query.outcome !== undefined) params.set('outcome', query.outcome)
    if (query.actor !== undefined) params.set('actor', query.actor)
    if (query.actorDevice !== undefined) params.set('actor_device', query.actorDevice)
    if (query.targetId !== undefined) params.set('target_id', query.targetId)
    if (query.from !== undefined) params.set('from', query.from)
    if (query.to !== undefined) params.set('to', query.to)
    const suffix = params.toString()
    return request<AuditPageDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/audit${suffix ? `?${suffix}` : ''}`,
      signal ? { signal } : {},
    )
  },

  
  auditFacets: (groupId: string, signal?: AbortSignal) =>
    request<AuditFacetsDto>(
      `/v1/groups/${encodeURIComponent(groupId)}/audit/facets`,
      signal ? { signal } : {},
    ),

  

  requestTransfer: (groupId: string, toUserId: string) =>
    request<TransferDto>(`/v1/groups/${encodeURIComponent(groupId)}/transfers`, {
      method: 'POST',
      body: { to_user_id: toUserId },
    }),

  
  pendingTransfer: (groupId: string, signal?: AbortSignal) =>
    request<TransferDto | PendingTransferBriefDto | null>(
      `/v1/groups/${encodeURIComponent(groupId)}/transfers/pending`,
      signal ? { signal } : {},
    ),

  confirmTransfer: (groupId: string, transferId: string) =>
    request<{ group_id: string; owner_user_id: string }>(
      `/v1/groups/${encodeURIComponent(groupId)}/transfers/${encodeURIComponent(transferId)}/confirm`,
      { method: 'POST' },
    ),

  rejectTransfer: (groupId: string, transferId: string) =>
    request<void>(
      `/v1/groups/${encodeURIComponent(groupId)}/transfers/${encodeURIComponent(transferId)}/reject`,
      { method: 'POST' },
    ),
}


export function buildLoginUrl(returnTo: string): string {
  return `/api/auth/login?return_to=${encodeURIComponent(returnTo)}`
}
