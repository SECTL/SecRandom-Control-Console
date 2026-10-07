<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import {
  ArrowLeft,
  LoaderCircle,
  Lock,
  LockOpen,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Trash2,
  Zap,
} from '@lucide/vue'
import { api, ApiError } from '@/api/client'
import {
  DRAW_CONDITIONS_VERSION,
  DRAW_MAX_COUNT,
  NodeCapability,
  type DesiredStateResult,
  type DrawConditionsRequest,
  type DrawResetTarget,
  type DrawTarget,
  type DrawTriggerRequest,
  type MediaPlayOptions,
  type NodeCommandDto,
  type NodeRosterListDto,
  type NodeRosterMemberDto,
  type NodeSettingCategoryDto,
  type NodeSettingFieldDto,
  type NodeView,
  type RosterKind,
} from '@/api/protocol'
import {
  READABLE_SETTING_CATEGORIES,
  buildRosterPush,
  buildSettingsPatch,
  describeCommandFeedback,
  parseRosterSnapshot,
  parseSettingsSnapshot,
  rosterDraftOf,
  settingsDraftsOf,
  splitTags,
  type CommandFeedbackLine,
  type CommandFeedbackView,
  type SettingPatchProblem,
} from '@/utils/command-feedback'
import {
  drawDeniedReasonKey,
  formatDrawnMembers,
  parseDrawReceipt,
  type DrawReceipt,
} from '@/utils/draw-receipt'
import { genderOptions, groupOptions, precheckDraw, precheckNotice } from '@/utils/draw-trigger'
import { rosterCsvFileName, toRosterCsv } from '@/utils/roster-export'
import { NODE_REFRESH_INTERVAL_MS, useAutoRefresh } from '@/composables/useAutoRefresh'
import { usePresenceEvents } from '@/composables/usePresenceEvents'
import { useSessionStore } from '@/stores/session'
import { formatVersion } from '@/utils/version'
import ClientSettingsPanel from '@/components/client/fluent/ClientSettingsPanel.vue'
import ClientRosterPanel from '@/components/client/fluent/ClientRosterPanel.vue'
import ClientImportDrawer from '@/components/client/fluent/ClientImportDrawer.vue'
import ClientSelect from '@/components/client/fluent/ClientSelect.vue'
import ClientBroadcastDialog from '@/components/client/fluent/ClientBroadcastDialog.vue'
import { CLIENT_SETTINGS_PAGES } from '@/data/client-settings-pages'
import { useCapabilityLabel } from '@/i18n'
import type { ClientSettingRow, ClientSettingsPage } from '@/data/client-settings-pages'
import type { ClientRosterPanelState, ClientSettingsPanelState, PanelNotice } from '@/components/client/fluent/client-model'


















const props = withDefaults(
  defineProps<{
    groupId: string
    nodeId: string
    pollDelaysMs?: number[]
    
    refreshIntervalMs?: number
  }>(),
  {
    






    pollDelaysMs: () => [1000, 2000, 4000],
    refreshIntervalMs: NODE_REFRESH_INTERVAL_MS,
  },
)

const { t, te, tm, locale } = useI18n()
const router = useRouter()
const session = useSessionStore()





const canOperate = computed(() => session.canIn(props.groupId, 'operator'))

const canManage = computed(() => session.canIn(props.groupId, 'admin'))

function hasCapability(capability: string): boolean {
  return node.value?.capabilities.includes(capability) ?? false
}

const canLock = computed(() => canOperate.value && hasCapability(NodeCapability.DrawLock))
const canTrigger = computed(() => canOperate.value && hasCapability(NodeCapability.DrawTrigger))
const canAnnounce = computed(() => canOperate.value && hasCapability(NodeCapability.MediaPlay))





const canReadSettings = computed(
  () => canOperate.value && hasCapability(NodeCapability.SettingsRead),
)
const canWriteSettings = computed(
  () => canManage.value && hasCapability(NodeCapability.SettingsWrite),
)

const canReadRoster = computed(() => canManage.value && hasCapability(NodeCapability.RosterRead))
const canPushRoster = computed(() => canManage.value && hasCapability(NodeCapability.RosterWrite))








const capabilityText = useCapabilityLabel((key) => tm(key))



const node = ref<NodeView | null>(null)
const loading = ref(false)
const errorCode = ref<string | null>(null)

const errorMessage = computed(() => {
  if (!errorCode.value) return null
  const key = `errors.${errorCode.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})


function resolveCode(caught: unknown): string {
  return caught instanceof ApiError ? caught.code : 'network_error'
}


function errorCodeText(code: string): string {
  const key = `errors.${code}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
}









async function loadNode(options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true

  
  if (silent && loading.value) return

  if (!silent) {
    loading.value = true
    errorCode.value = null
  }

  try {
    const all = await api.listNodes(props.groupId)
    node.value = all.find((item) => item.node_id === props.nodeId) ?? null
    errorCode.value = null
  } catch (caught) {
    
    if (!silent) errorCode.value = resolveCode(caught)
  } finally {
    if (!silent) loading.value = false
  }
}


const displayName = computed(() => node.value?.display_name?.trim() ?? '')

function formatTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '—'
}










type Tab = 'overview' | 'settings' | 'roster' | 'commands'

const activeTab = ref<Tab>('overview')

const tabs = computed<{ id: Tab; label: string }[]>(() => [
  { id: 'overview', label: t('nodeDetail.tabs.overview') },
  { id: 'settings', label: t('nodeDetail.tabs.settings') },
  { id: 'roster', label: t('nodeDetail.tabs.roster') },
  { id: 'commands', label: t('nodeDetail.tabs.commands') },
])



type BusyAction = 'lock' | 'trigger' | 'media' | 'remove' | 'settings' | 'roster' | 'prizes' | 'reset'

const busyAction = ref<BusyAction | null>(null)
const isBusy = computed(() => busyAction.value !== null)


const feedback = ref<{ kind: 'ok' | 'fail'; code: string | undefined } | null>(null)












const TERMINAL_STATUSES = new Set(['completed', 'rejected', 'failed', 'revoked'])


const command = ref<NodeCommandDto | null>(null)
const polling = ref(false)












const commandLog = ref<NodeCommandDto[]>([])

function recordCommand(next: NodeCommandDto): void {
  const index = commandLog.value.findIndex((item) => item.command_id === next.command_id)
  commandLog.value =
    index < 0
      ? [next, ...commandLog.value]
      : commandLog.value.map((item, position) => (position === index ? next : item))
}

function applyCommand(next: NodeCommandDto): void {
  command.value = next
  recordCommand(next)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}










async function dispatch(run: () => Promise<NodeCommandDto>): Promise<NodeCommandDto> {
  const issued = await run()
  applyCommand(issued)
  if (TERMINAL_STATUSES.has(issued.status)) return issued

  polling.value = true
  try {
    await pollCommand(issued.command_id)
  } finally {
    polling.value = false
  }
  return command.value ?? issued
}

async function pollCommand(commandId: string): Promise<void> {
  for (const delay of props.pollDelaysMs) {
    if (disposed) return
    if (command.value !== null && TERMINAL_STATUSES.has(command.value.status)) return

    await sleep(delay)
    
    if (disposed) return

    try {
      const latest = await api.getCommand(props.groupId, commandId)
      
      
      
      if (command.value !== null && TERMINAL_STATUSES.has(command.value.status)) return
      applyCommand(latest)
    } catch {
      
      return
    }
  }
}


function statusLabel(status: string): string {
  const key = `nodeDetail.statuses.${status}`
  return te(key) ? t(key) : status
}

const statusText = computed(() => (command.value === null ? null : statusLabel(command.value.status)))








const feedbackView = computed(() => describeCommandFeedback(command.value))










function feedbackText(view: CommandFeedbackView): string {
  const params: Record<string, string | number> = { ...view.params }
  if (view.capability !== null && 'capability' in params) {
    params['capability'] = capabilityText(view.capability)
  }
  return t(view.messageKey, { ...params, ...feedbackRawText(view.rawParams, view.messageKey) })
}





function lineText(line: CommandFeedbackLine): string {
  return t(line.key, { ...line.params, ...feedbackRawText(line.rawParams, line.key) })
}

const feedbackViewText = computed(() =>
  feedbackView.value === null ? null : feedbackText(feedbackView.value),
)

const feedbackToneClass = computed(() => {
  const tone = feedbackView.value?.tone
  if (tone === 'ok') return 'border-border-base bg-surface-2 text-text-muted'
  if (tone === 'warn') return 'border-warn/40 bg-warn/12 text-warn'
  return 'border-danger/30 bg-danger/12 text-[#f5a9b0]'
})







function statusToneClass(status: string | undefined): string {
  if (status === 'completed') return 'text-brand-bright'
  if (status === 'rejected' || status === 'failed') return 'text-[#f5a9b0]'
  if (status === 'revoked') return 'text-warn'
  return 'text-text-muted'
}


function statusPillClass(status: string): string {
  if (status === 'completed') return 'bg-brand/15 text-brand-bright'
  if (status === 'rejected' || status === 'failed') return 'bg-danger/12 text-[#f5a9b0]'
  if (status === 'revoked') return 'bg-warn/12 text-warn'
  return 'bg-surface-3 text-text-muted'
}

const statusTone = computed(() => statusToneClass(command.value?.status))












const REVOKE_ARM_MS = 4000
const armedRevokeId = ref<string | null>(null)
let revokeArmTimer: ReturnType<typeof setTimeout> | null = null

function disarmRevoke(): void {
  armedRevokeId.value = null
  if (revokeArmTimer !== null) {
    clearTimeout(revokeArmTimer)
    revokeArmTimer = null
  }
}

function armRevoke(commandId: string): void {
  disarmRevoke()
  armedRevokeId.value = commandId
  revokeArmTimer = setTimeout(disarmRevoke, REVOKE_ARM_MS)
}


const revokingId = ref<string | null>(null)







const revokeOutcome = ref<{ commandId: string; kind: 'ok' | 'fail'; code: string | undefined } | null>(
  null,
)








function revokeNotice(commandId: string): { text: string; toneClass: string } | null {
  const outcome = revokeOutcome.value
  if (outcome === null || outcome.commandId !== commandId) return null

  if (outcome.kind === 'ok') {
    return { text: t('nodeDetail.commands.revokeDone'), toneClass: 'text-text-muted' }
  }
  return {
    text: t('nodeDetail.commands.revokeFailed', {
      reason: errorCodeText(outcome.code ?? 'unknown'),
    }),
    toneClass: 'text-[#f5a9b0]',
  }
}


const overviewRevokeNotice = computed(() =>
  command.value === null ? null : revokeNotice(command.value.command_id),
)












async function revokeCommandEntry(entry: NodeCommandDto): Promise<void> {
  if (!canOperate.value || entry.status !== 'queued' || revokingId.value !== null) return

  if (armedRevokeId.value !== entry.command_id) {
    armRevoke(entry.command_id)
    return
  }

  disarmRevoke()
  revokingId.value = entry.command_id
  revokeOutcome.value = null
  try {
    applyCommand(await api.revokeCommand(props.groupId, entry.command_id))
    revokeOutcome.value = { commandId: entry.command_id, kind: 'ok', code: undefined }
  } catch (caught) {
    revokeOutcome.value = {
      commandId: entry.command_id,
      kind: 'fail',
      code: resolveCode(caught),
    }
  } finally {
    revokingId.value = null
  }
}




const desired = ref<DesiredStateResult | null>(null)

async function toggleDrawLock(): Promise<void> {
  const current = node.value
  if (current === null || isBusy.value) return

  busyAction.value = 'lock'
  feedback.value = null
  try {
    const result = await api.setDrawLock(props.groupId, current.node_id, !current.draw_locked)
    desired.value = result
    
    node.value = { ...current, draw_locked: result.draw_locked }
    feedback.value = { kind: 'ok', code: undefined }
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
  } finally {
    busyAction.value = null
  }
}









const TRIGGER_ARM_MS = 4000
const triggerArmed = ref(false)
let armTimer: ReturnType<typeof setTimeout> | null = null

function disarmTrigger(): void {
  triggerArmed.value = false
  if (armTimer !== null) {
    clearTimeout(armTimer)
    armTimer = null
  }
}

function armTrigger(): void {
  disarmTrigger()
  triggerArmed.value = true
  armTimer = setTimeout(disarmTrigger, TRIGGER_ARM_MS)
}

async function triggerDraw(): Promise<void> {
  const current = node.value
  if (current === null || isBusy.value || !canTrigger.value) return

  if (!triggerArmed.value) {
    armTrigger()
    return
  }

  disarmTrigger()
  busyAction.value = 'trigger'
  feedback.value = null
  try {
    
    
    await dispatch(() => api.triggerDraw(props.groupId, current.node_id))
    feedback.value = { kind: 'ok', code: undefined }
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
  } finally {
    busyAction.value = null
  }
}
















const drawScope = ref<DrawTarget>('quick')


const drawListName = ref('')

const drawGender = ref('')

const drawGroup = ref('')

const drawCount = ref(1)








const canUseDrawConditions = computed(() => hasCapability(NodeCapability.DrawTriggerConditions))


const conditionTags = ref<string[]>([])

const conditionStudentList = ref('')

const conditionGender = ref('')
const conditionGroup = ref('')


const conditionTagOptions = computed<string[]>(() => {
  const tags = new Set<string>()
  for (const member of drawList.value?.members ?? []) {
    for (const tag of member.tags ?? []) {
      const trimmed = tag.trim()
      if (trimmed.length > 0) tags.add(trimmed)
    }
  }
  return [...tags].sort((left, right) => left.localeCompare(right))
})







const conditionStudentOptions = computed(() => studentsReader.state.lists)


const conditionStudentRoster = computed<NodeRosterListDto | null>(
  () => conditionStudentOptions.value.find((list) => list.name === conditionStudentList.value) ?? null,
)


const conditionGenderOptions = computed(() =>
  genderOptions(conditionStudentRoster.value?.members ?? []),
)
const conditionGroupOptions = computed(() =>
  groupOptions(conditionStudentRoster.value?.members ?? []),
)
const conditionGenderSelectOptions = computed(() => anyPlusOptions(conditionGenderOptions.value))
const conditionGroupSelectOptions = computed(() => anyPlusOptions(conditionGroupOptions.value))


function toggleConditionTag(tag: string): void {
  conditionTags.value = conditionTags.value.includes(tag)
    ? conditionTags.value.filter((item) => item !== tag)
    : [...conditionTags.value, tag]
}


const conditionStudentListOptions = computed<{ value: string; label: string }[]>(() => [
  { value: '', label: t('nodeDetail.draw.conditions.studentListNone') },
  ...conditionStudentOptions.value.map((list) => ({
    value: list.name,
    label: `${list.name}（${t('nodeDetail.rosterRead.members', { count: list.count })}）`,
  })),
])





watch(conditionStudentList, () => {
  conditionGender.value = ''
  conditionGroup.value = ''
})


async function readConditionStudents(): Promise<void> {
  await studentsReader.read()
  const preferred =
    studentsReader.state.lists.find((item) => item.is_default) ?? studentsReader.state.lists[0]
  if (conditionStudentList.value.trim().length === 0 && preferred !== undefined) {
    conditionStudentList.value = preferred.name
  }
}








function buildDrawConditions(): DrawConditionsRequest | null {
  if (!canUseDrawConditions.value) return null

  const tags = conditionTags.value
  const studentList = conditionStudentList.value.trim()
  if (tags.length === 0 && studentList.length === 0) return null

  const conditions: DrawConditionsRequest = { version: DRAW_CONDITIONS_VERSION }
  if (tags.length > 0) conditions.prize_tags = [...tags]

  if (studentList.length > 0) {
    conditions.student_list = studentList
    const gender = conditionGender.value.trim()
    if (gender.length > 0) conditions.gender = gender
    const group = conditionGroup.value.trim()
    if (group.length > 0) conditions.group = group
  }

  return conditions
}


const hasDrawConditions = computed(() => buildDrawConditions() !== null)


const activeDrawReader = computed(() => (drawScope.value === 'lottery' ? prizesReader : studentsReader))








const drawListOptions = computed(() => activeDrawReader.value.state.lists)


const drawList = computed<NodeRosterListDto | null>(
  () => drawListOptions.value.find((list) => list.name === drawListName.value) ?? null,
)








const drawAdvancedOpen = ref(false)


const drawLegend = computed(() => {
  if (drawScope.value === 'quick') return t('nodeDetail.draw.scopeQuick')

  const scopeLabel =
    drawScope.value === 'lottery'
      ? t('nodeDetail.draw.scopeLottery')
      : t('nodeDetail.draw.scopeRollCall')

  const parts = [scopeLabel, drawListName.value.trim() || t('nodeDetail.draw.listNone')]
  
  if (drawScope.value === 'roll_call') {
    if (drawGender.value.trim().length > 0) parts.push(drawGender.value.trim())
    if (drawGroup.value.trim().length > 0) parts.push(drawGroup.value.trim())
  }
  
  if (drawScope.value === 'lottery' && hasDrawConditions.value) {
    parts.push(t('nodeDetail.draw.conditions.title'))
  }
  parts.push(t('nodeDetail.draw.legendCount', { count: drawCount.value }))

  return parts.join(' · ')
})







function selectDrawScope(scope: DrawTarget): void {
  drawScope.value = scope
  drawListName.value = ''
  drawGender.value = ''
  drawGroup.value = ''
  
  
  conditionTags.value = []
  conditionStudentList.value = ''
  conditionGender.value = ''
  conditionGroup.value = ''
}











async function readDrawRoster(): Promise<void> {
  const reader = activeDrawReader.value
  await reader.read()
  if (reader.state.status !== 'ready') return

  
  
  if (drawListName.value.trim().length > 0) return
  const preferred = reader.state.lists.find((item) => item.is_default) ?? reader.state.lists[0]
  if (preferred !== undefined) drawListName.value = preferred.name
}


const canPickDrawList = computed(() => canReadRoster.value)


const drawGenderOptions = computed(() => genderOptions(drawList.value?.members ?? []))
const drawGroupOptions = computed(() => groupOptions(drawList.value?.members ?? []))











const drawListSelectOptions = computed<{ value: string; label: string }[]>(() => [
  { value: '', label: t('nodeDetail.draw.listNone') },
  ...drawListOptions.value.map((list) => ({
    value: list.name,
    
    label: `${list.name}（${
      drawScope.value === 'lottery'
        ? t('nodeDetail.rosterRead.membersPrizes', { count: list.count })
        : t('nodeDetail.rosterRead.members', { count: list.count })
    }）`,
  })),
])


function anyPlusOptions(values: readonly string[]): { value: string; label: string }[] {
  return [
    { value: '', label: t('nodeDetail.draw.conditionAny') },
    ...values.map((value) => ({ value, label: value })),
  ]
}

const drawGenderSelectOptions = computed(() => anyPlusOptions(drawGenderOptions.value))
const drawGroupSelectOptions = computed(() => anyPlusOptions(drawGroupOptions.value))


const DRAW_COUNT_MIN = 1


const drawCountValid = computed(
  () =>
    Number.isInteger(drawCount.value) &&
    drawCount.value >= DRAW_COUNT_MIN &&
    drawCount.value <= DRAW_MAX_COUNT,
)












const drawPrecheck = computed(() =>
  precheckDraw({
    list: drawScope.value === 'roll_call' ? drawList.value : null,
    gender: drawGender.value,
    group: drawGroup.value,
    
    count: drawScope.value === 'roll_call' ? drawCount.value : null,
  }),
)


const drawCheckNotice = computed<{ key: string; params: Record<string, string | number> } | null>(() => {
  if (drawScope.value !== 'roll_call') return null

  const precheck = drawPrecheck.value
  if (precheck.ok) return precheckNotice(precheck, drawList.value)

  return { key: precheck.key, params: precheck.params }
})











const drawBlocked = computed<{ key: string; params: Record<string, string | number> } | null>(() => {
  if (drawScope.value === 'quick') return null

  if (!canPickDrawList.value || activeDrawReader.value.state.status !== 'ready') {
    return {
      key:
        drawScope.value === 'lottery'
          ? 'nodeDetail.draw.listNeedsReadPrizes'
          : 'nodeDetail.draw.listNeedsRead',
      params: {},
    }
  }
  if (drawListName.value.trim().length === 0) {
    return { key: 'nodeDetail.draw.listNone', params: {} }
  }
  if (!drawCountValid.value) {
    return { key: 'nodeDetail.draw.countHint', params: { max: DRAW_MAX_COUNT } }
  }

  if (drawScope.value === 'lottery') return null

  const precheck = drawPrecheck.value
  return precheck.ok ? null : { key: precheck.key, params: precheck.params }
})

const canSubmitDraw = computed(
  () => drawScope.value !== 'quick' && drawBlocked.value === null,
)











function drawRequest(): DrawTriggerRequest {
  if (drawScope.value === 'quick') return {}

  const request: DrawTriggerRequest = { target: drawScope.value }

  const listName = drawListName.value.trim()
  if (listName.length > 0) request.list_name = listName

  if (drawScope.value === 'roll_call') {
    const gender = drawGender.value.trim()
    if (gender.length > 0) request.gender = gender

    const group = drawGroup.value.trim()
    if (group.length > 0) request.group = group
  }

  if (drawScope.value === 'lottery') {
    
    
    
    const conditions = buildDrawConditions()
    if (conditions !== null) request.conditions = conditions
  }

  request.count = drawCount.value

  return request
}


async function triggerParameterizedDraw(): Promise<void> {
  const current = node.value
  if (current === null || isBusy.value || !canTrigger.value || !canSubmitDraw.value) return

  busyAction.value = 'trigger'
  feedback.value = null
  try {
    await dispatch(() => api.triggerDraw(props.groupId, current.node_id, drawRequest()))
    feedback.value = { kind: 'ok', code: undefined }
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
  } finally {
    busyAction.value = null
  }
}







const drawReceipt = computed<DrawReceipt | null>(() => {
  const current = command.value
  if (current === null) return null
  const receipt = parseDrawReceipt(current.result_context ?? null)
  return receipt.recognized ? receipt : null
})


const drawnMembersText = computed(() => {
  const receipt = drawReceipt.value
  if (receipt === null || receipt.drawn.length === 0) return null
  return formatDrawnMembers(receipt.drawn)
})














function feedbackRawText(
  rawParams: Record<string, string> | undefined,
  messageKey: string,
): Record<string, string> {
  const record = rawParams ?? {}
  const text: Record<string, string> = {}

  const reason = record['reason']
  if (typeof reason === 'string' && reason.length > 0) {
    text['reason'] = drawDeniedReasonText(reason)
  }

  








  const picked =
    messageKey === 'nodeDetail.feedback.localCheckGender' ||
    messageKey === 'nodeDetail.feedback.drawNoMatching'
      ? drawGender.value.trim()
      : messageKey === 'nodeDetail.feedback.localCheckGroup'
        ? drawGroup.value.trim()
        : ''

  const fallback = record['value'] ?? ''
  if (picked.length > 0 || fallback.length > 0) {
    text['value'] = picked.length > 0 ? picked : fallback
  }

  return text
}








function drawDeniedReasonText(reason: string): string {
  const key = drawDeniedReasonKey(reason)
  return key === null ? reason : t(key)
}














const drawFailureText = computed(() => {
  const current = command.value
  if (current === null || current.capability !== NodeCapability.DrawTrigger) return null

  const detail = (current.result_detail ?? '').trim()
  if (detail === 'draw_locked') return t('nodeDetail.draw.failedLocked')
  if (detail === 'list_name:not_found') return t('nodeDetail.draw.failedListNotFound')

  
  
  if (
    detail === 'invalid_value:gender:not_applicable' ||
    detail === 'invalid_value:group:not_applicable'
  ) {
    return t('nodeDetail.draw.failedLotteryCondition')
  }

  return drawConditionsFailureText(detail)
})













function drawConditionsFailureText(detail: string): string | null {
  if (detail.endsWith(':no_matching_member')) return t('nodeDetail.draw.conditions.failedNoMatching')

  if (detail === 'invalid_command:conditions:version_unsupported') {
    return t('nodeDetail.draw.conditions.failedVersion')
  }
  if (detail === 'invalid_command:conditions:unsupported_field') {
    return t('nodeDetail.draw.conditions.failedUnsupportedField')
  }
  if (detail === 'invalid_command:student_list:required') {
    return t('nodeDetail.draw.conditions.failedStudentListRequired')
  }
  if (detail === 'invalid_value:student_list:not_found') {
    return t('nodeDetail.draw.conditions.failedStudentListNotFound')
  }
  if (detail === 'invalid_value:prize_tags:not_in_list') {
    return t('nodeDetail.draw.conditions.failedTagsNotInList')
  }
  if (detail === 'invalid_value:gender:not_in_list' || detail === 'invalid_value:group:not_in_list') {
    return t('nodeDetail.draw.conditions.failedValueNotInList')
  }

  return null
}












const canResetDraw = computed(() => canOperate.value && hasCapability(NodeCapability.DrawReset))

const resetTarget = ref<DrawResetTarget>('roll_call')

const resetListName = ref('')
const resetArmed = ref(false)
let resetArmTimer: ReturnType<typeof setTimeout> | null = null

function disarmReset(): void {
  resetArmed.value = false
  if (resetArmTimer !== null) {
    clearTimeout(resetArmTimer)
    resetArmTimer = null
  }
}

function armReset(): void {
  disarmReset()
  resetArmed.value = true
  resetArmTimer = setTimeout(disarmReset, TRIGGER_ARM_MS)
}







const resetListOptions = computed<NodeRosterListDto[]>(() =>
  resetTarget.value === 'lottery' ? prizesReader.state.lists : studentsReader.state.lists,
)











const resetTargetSelectOptions = computed<{ value: string; label: string }[]>(() => [
  { value: 'roll_call', label: t('nodeDetail.drawReset.targetRollCall') },
  { value: 'lottery', label: t('nodeDetail.drawReset.targetLottery') },
  { value: 'quick', label: t('nodeDetail.drawReset.targetQuick') },
])

const resetListSelectOptions = computed<{ value: string; label: string }[]>(() => [
  { value: '', label: t('nodeDetail.drawReset.listNone') },
  ...resetListOptions.value.map((list) => ({ value: list.name, label: list.name })),
])


function changeResetTarget(target: DrawResetTarget): void {
  resetTarget.value = target
  resetListName.value = ''
}


const resetReceipt = ref<{ cleared: number } | null>(null)








function parseResetReceipt(command: NodeCommandDto | null): { cleared: number } | null {
  if (command === null) return null

  const context = command.result_context
  let source: Record<string, unknown> | null =
    context !== null && typeof context === 'object' && !Array.isArray(context)
      ? (context as Record<string, unknown>)
      : null

  if (source === null && typeof command.result_detail === 'string') {
    const raw = command.result_detail.trim()
    if (raw.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
          source = parsed as Record<string, unknown>
        }
      } catch {
        source = null
      }
    }
  }

  const cleared = source?.['cleared']
  if (typeof cleared !== 'number' || !Number.isFinite(cleared)) return null
  return { cleared }
}









const resetFailureText = computed(() => {
  const current = command.value
  if (current === null || current.capability !== NodeCapability.DrawReset) return null

  const detail = (current.result_detail ?? '').trim()
  if (detail.startsWith('invalid_value:target')) {
    const why = detail.split(':').slice(2).join(':')
    return t('nodeDetail.drawReset.failedTarget', { reason: why.length > 0 ? why : '—' })
  }
  if (detail === 'list_name:not_found') return t('nodeDetail.drawReset.failedList')
  return null
})

async function resetDrawRound(): Promise<void> {
  const current = node.value
  if (current === null || isBusy.value || !canResetDraw.value) return

  if (!resetArmed.value) {
    armReset()
    return
  }

  disarmReset()
  busyAction.value = 'reset'
  feedback.value = null
  resetReceipt.value = null
  try {
    const listName = resetListName.value.trim()
    const result = await dispatch(() =>
      api.resetDraw(
        props.groupId,
        current.node_id,
        resetTarget.value,
        listName.length > 0 ? listName : undefined,
      ),
    )
    resetReceipt.value = parseResetReceipt(result)
    feedback.value = { kind: 'ok', code: undefined }
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
  } finally {
    busyAction.value = null
  }
}




const MAX_ANNOUNCE_LENGTH = 200

const announceText = ref('')








const mediaProblem = computed(() => {
  const text = announceText.value.trim()
  if (text.length === 0) return 'nodeDetail.mediaEmpty'
  if (text.length > MAX_ANNOUNCE_LENGTH) return 'nodeDetail.mediaTooLong'
  return null
})

const mediaProblemText = computed(() =>
  mediaProblem.value === null ? null : t(mediaProblem.value),
)








const broadcastOpen = ref(false)








const lastAnnounceOptions = ref<MediaPlayOptions>({ show_quick_draw_window: false })


function openBroadcast(): void {
  if (node.value === null || isBusy.value || !canAnnounce.value) return
  if (mediaProblem.value !== null) return
  broadcastOpen.value = true
}

function confirmBroadcast(options: MediaPlayOptions): void {
  
  broadcastOpen.value = false
  void sendAnnounce(options)
}

async function sendAnnounce(options: MediaPlayOptions): Promise<void> {
  const current = node.value
  const text = announceText.value.trim()
  if (current === null || isBusy.value || !canAnnounce.value) return
  if (mediaProblem.value !== null || text.length > MAX_ANNOUNCE_LENGTH) return

  lastAnnounceOptions.value = options
  busyAction.value = 'media'
  feedback.value = null
  try {
    await dispatch(() =>
      api.playMedia(props.groupId, current.node_id, 'announce', text, options),
    )
    feedback.value = { kind: 'ok', code: undefined }
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
  } finally {
    busyAction.value = null
  }
}












async function enableVoiceThenAnnounce(): Promise<void> {
  const current = node.value
  if (current === null || isBusy.value || !canWriteSettings.value) return

  busyAction.value = 'settings'
  feedback.value = null
  try {
    await dispatch(() => api.patchSettings(props.groupId, props.nodeId, { 'voice.enable': true }))
    feedback.value = { kind: 'ok', code: undefined }

    const text = announceText.value.trim()
    if (text.length === 0 || !canAnnounce.value) return

    busyAction.value = 'media'
    await dispatch(() =>
      api.playMedia(props.groupId, props.nodeId, 'announce', text, lastAnnounceOptions.value),
    )
    feedback.value = { kind: 'ok', code: undefined }
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
  } finally {
    busyAction.value = null
  }
}









async function removeNode(): Promise<void> {
  const current = node.value
  if (current === null || isBusy.value) return
  if (!window.confirm(t('group.removeNodeConfirm'))) return

  busyAction.value = 'remove'
  feedback.value = null
  try {
    await api.removeNode(props.groupId, current.node_id)
    await router.push({ name: 'console-group-detail', params: { groupId: props.groupId } })
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
  } finally {
    busyAction.value = null
  }
}













interface SettingsReadState {
  status: 'idle' | 'ready' | 'unavailable' | 'failed'
  reading: boolean
  categories: NodeSettingCategoryDto[]
  drafts: Record<string, string | number | boolean>
  problems: SettingPatchProblem[]
  
  command: NodeCommandDto | null
  reason: string | null
  
  refreshed: boolean
  






  batched: boolean
  
  batchFailed: boolean
}

const settingsRead = reactive<SettingsReadState>({
  status: 'idle',
  reading: false,
  categories: [],
  drafts: {},
  problems: [],
  command: null,
  reason: null,
  refreshed: false,
  batched: false,
  batchFailed: false,
})

const settingsFields = computed(() => settingsRead.categories.flatMap((category) => category.fields))


const settingsReadFeedback = computed(() => describeCommandFeedback(settingsRead.command))








const settingsReadHint = computed(() => {
  if (canReadSettings.value) return ''
  return canOperate.value
    ? t('nodeDetail.settingsRead.unsupported')
    : t('nodeDetail.settingsRead.operatorRequired')
})











const settingsActivePageId = ref(CLIENT_SETTINGS_PAGES[0]?.id ?? '')

function selectSettingsPage(id: string): void {
  settingsActivePageId.value = id
}


const settingsFieldsByPath = computed<Record<string, NodeSettingFieldDto>>(() => {
  const fields: Record<string, NodeSettingFieldDto> = {}
  for (const category of settingsRead.categories) {
    for (const field of category.fields) fields[field.path] = field
  }
  return fields
})


const settingsPlan = computed(() => buildSettingsPatch(settingsFields.value, settingsRead.drafts))


const settingsDirtyCount = computed(() => settingsPlan.value.changed)


function problemText(problem: SettingPatchProblem): string {
  if (problem.kind === 'notNumber') {
    return t('nodeDetail.settingsRead.notNumber', { path: problem.path })
  }
  if (problem.kind === 'range') {
    return t('nodeDetail.settingsRead.range', {
      path: problem.path,
      min: problem.min ?? '—',
      max: problem.max ?? '—',
    })
  }
  return t('nodeDetail.settingsRead.notOption', {
    path: problem.path,
    options: problem.options.join(', '),
  })
}








const settingsNotices = computed<readonly PanelNotice[]>(() => {
  const notices: PanelNotice[] = []

  





  if (!canManage.value) {
    notices.push({
      tone: 'warn',
      text: t('nodeDetail.adminRequired'),
      testId: 'node-detail-settings-note',
    })
  } else if (!canWriteSettings.value) {
    notices.push({
      tone: 'warn',
      text: t('nodeDetail.settingsUnsupported'),
      testId: 'node-detail-settings-unsupported',
    })
  }

  
  notices.push({
    tone: 'info',
    text: t('nodeDetail.settingsNote'),
    testId: 'node-detail-settings-note',
  })

  












  if (settingsRead.reading) return notices

  
  
  
  if (settingsRead.status === 'idle' && canReadSettings.value) {
    notices.push({
      tone: 'info',
      text: t('nodeDetail.settingsRead.readFirst'),
      testId: 'node-detail-settings-read-first',
    })
  }

  if (settingsRead.status === 'unavailable') {
    if (settingsRead.batchFailed) {
      
      notices.push({
        tone: 'warn',
        text: t('nodeDetail.settingsRead.tooLarge'),
        testId: 'node-detail-settings-read-too-large',
      })
    } else {
      notices.push({
        tone: 'warn',
        text: t('nodeDetail.settingsRead.unsupported'),
        testId: 'node-detail-settings-read-unsupported',
      })
    }

    
    const feedback = settingsReadFeedback.value
    if (feedback !== null) {
      notices.push({
        tone: 'info',
        text: feedbackText(feedback),
        testId: 'node-detail-settings-read-reason',
      })
    }
  }

  if (settingsRead.status === 'failed') {
    notices.push({
      tone: 'fail',
      text: t('nodeDetail.settingsRead.failed', {
        reason: errorCodeText(settingsRead.reason ?? 'unknown'),
      }),
      testId: 'node-detail-settings-read-error',
    })
  }

  if (settingsRead.refreshed && settingsRead.status === 'ready') {
    notices.push({
      tone: 'ok',
      text: t('nodeDetail.settingsRead.refreshed'),
      testId: 'node-detail-settings-refreshed',
    })
  }

  if (settingsRead.batched) {
    notices.push({
      tone: 'info',
      text: t('nodeDetail.settingsRead.batched'),
      testId: 'node-detail-settings-batched',
    })
  }

  
  if (settingsRead.problems.length > 0) {
    notices.push({
      tone: 'fail',
      text: settingsRead.problems.map((problem) => problemText(problem)).join('；'),
      testId: 'node-detail-settings-read-problems',
    })
  }

  return notices
})


const settingsPanelState = computed<ClientSettingsPanelState>(() => ({
  status: settingsRead.reading ? 'reading' : settingsRead.status,
  canRead: canReadSettings.value,
  
  
  
  canWrite: canWriteSettings.value && settingsRead.status === 'ready',
  busy: isBusy.value,
  dirtyCount: settingsDirtyCount.value,
  notices: settingsNotices.value,
}))











const settingsExpanded = ref<Record<string, boolean>>({})







const settingsPages = computed<readonly ClientSettingsPage[]>(() =>
  CLIENT_SETTINGS_PAGES.map((page) => ({
    ...page,
    sections: page.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => withExpanded(row)),
    })),
  })),
)

function withExpanded(row: ClientSettingRow): ClientSettingRow {
  
  if (row.kind === 'container') {
    const nested = row.rows.map((child) => withExpanded(child))
    return { ...row, rows: nested }
  }

  const expanded = settingsExpanded.value[row.path]
  const next: ClientSettingRow = expanded === undefined ? { ...row } : { ...row, expanded }
  if (row.rows !== undefined && row.rows.length > 0) {
    next.rows = row.rows.map((child) => withExpanded(child))
  }
  return next
}


function syncExpandedFromDevice(): void {
  const next: Record<string, boolean> = {}
  for (const page of CLIENT_SETTINGS_PAGES) {
    for (const section of page.sections) {
      for (const row of section.rows) {
        
        if (row.kind === 'container') continue
        if (row.rows === undefined || row.rows.length === 0) continue
        next[row.path] = settingsFieldsByPath.value[row.path]?.value === true
      }
    }
  }
  settingsExpanded.value = next
}

async function readSettingsFromDevice(): Promise<void> {
  if (node.value === null || isBusy.value || !canReadSettings.value) return

  busyAction.value = 'settings'
  settingsRead.reading = true
  settingsRead.problems = []
  settingsRead.refreshed = false
  settingsRead.batched = false
  settingsRead.batchFailed = false
  feedback.value = null
  try {
    const categories = await readSettingsCategories(READABLE_SETTING_CATEGORIES)

    if (categories === null) {
      
      
      settingsRead.status = 'unavailable'
      settingsRead.categories = []
      settingsRead.drafts = {}
      settingsRead.reason = settingsRead.command?.result_detail ?? null
      return
    }

    settingsRead.categories = categories
    settingsRead.drafts = settingsDraftsOf(categories)
    settingsRead.reason = null
    
    settingsRead.status = 'ready'
    
    syncExpandedFromDevice()
  } catch (caught) {
    settingsRead.status = 'failed'
    settingsRead.reason = resolveCode(caught)
    settingsRead.categories = []
    settingsRead.drafts = {}
  } finally {
    settingsRead.reading = false
    busyAction.value = null
  }
}










async function readSettingsCategories(
  categories: readonly string[],
): Promise<NodeSettingCategoryDto[] | null> {
  const whole = await dispatch(() =>
    api.readSettings(props.groupId, props.nodeId, categories, locale.value),
  )
  settingsRead.command = whole

  const parsed = parseSettingsSnapshot(whole.result_payload)
  if (parsed !== null) return parsed

  
  if (whole.result_detail !== 'payload_too_large' || categories.length <= 1) return null

  settingsRead.batched = true

  const merged: NodeSettingCategoryDto[] = []
  for (const category of categories) {
    const one = await dispatch(() =>
      api.readSettings(props.groupId, props.nodeId, [category], locale.value),
    )
    settingsRead.command = one

    const chunk = parseSettingsSnapshot(one.result_payload)
    if (chunk === null) {
      
      settingsRead.batchFailed = true
      return null
    }

    merged.push(...chunk)
  }

  return merged
}








async function submitSettingsChanges(): Promise<void> {
  if (node.value === null || isBusy.value || !canWriteSettings.value) return

  const plan = buildSettingsPatch(settingsFields.value, settingsRead.drafts)
  settingsRead.problems = plan.problems
  
  
  if (plan.problems.length > 0) return

  settingsRead.refreshed = false
  busyAction.value = 'settings'
  feedback.value = null
  try {
    await dispatch(() => api.patchSettings(props.groupId, props.nodeId, plan.patch))
    feedback.value = { kind: 'ok', code: undefined }
  } catch (caught) {
    feedback.value = { kind: 'fail', code: resolveCode(caught) }
    return
  } finally {
    busyAction.value = null
  }

  
  
  await readSettingsFromDevice()
  settingsRead.refreshed = settingsRead.status === 'ready'
}









interface RosterReadState {
  status: 'idle' | 'ready' | 'unavailable' | 'failed'
  reading: boolean
  lists: NodeRosterListDto[]
  
  selected: string | null
  
  draft: NodeRosterMemberDto[]
  mode: 'replace' | 'merge'
  activate: boolean
  error: string | null
  reason: string | null
  
  command: NodeCommandDto | null
}

function createRosterReader(kind: RosterKind, busy: BusyAction) {
  const state = reactive<RosterReadState>({
    status: 'idle',
    reading: false,
    lists: [],
    selected: null,
    draft: [],
    
    
    mode: 'merge',
    activate: false,
    error: null,
    reason: null,
    command: null,
  })

  function selectList(name: string | null): void {
    state.selected = name
    state.error = null
    const list = state.lists.find((item) => item.name === name) ?? null
    state.draft = list === null ? [] : rosterDraftOf(list)
    
    
    state.mode = 'merge'
  }

  async function read(): Promise<void> {
    if (node.value === null || isBusy.value || !canReadRoster.value) return

    busyAction.value = busy
    state.reading = true
    state.error = null
    feedback.value = null
    try {
      const result = await dispatch(() =>
        api.readRoster(props.groupId, props.nodeId, {
          roster_kind: kind,
          
          
          include_disabled: true,
        }),
      )
      state.command = result

      const snapshot = parseRosterSnapshot(result.result_payload)
      if (snapshot === null) {
        state.status = 'unavailable'
        state.lists = []
        state.selected = null
        state.draft = []
        state.reason = result.result_detail ?? null
        return
      }

      state.lists = snapshot.lists
      state.reason = null
      state.status = 'ready'
      
      selectList(
        (snapshot.lists.find((item) => item.is_default) ?? snapshot.lists[0])?.name ?? null,
      )
    } catch (caught) {
      state.status = 'failed'
      state.reason = resolveCode(caught)
      state.lists = []
      state.selected = null
      state.draft = []
    } finally {
      state.reading = false
      busyAction.value = null
    }
  }

  




  function addRow(member: NodeRosterMemberDto): void {
    state.draft = [...state.draft, member]
  }

  function removeRow(index: number): void {
    state.draft = state.draft.filter((_, position) => position !== index)
  }

  
  function setNumber(index: number, key: 'count' | 'weight', event: Event): void {
    const member = state.draft[index]
    if (member === undefined) return
    const raw = (event.target as HTMLInputElement).value.trim()
    if (raw.length === 0) {
      member[key] = null
      return
    }
    const value = Number(raw)
    member[key] = Number.isFinite(value) ? value : null
  }

  









  function setTags(index: number, event: Event): void {
    const member = state.draft[index]
    if (member === undefined) return
    member.tags = splitTags((event.target as HTMLInputElement).value) ?? []
  }

  









  function mergeMember(index: number, patch: Record<string, unknown>): void {
    const member = state.draft[index]
    if (member === undefined) return
    if ('id' in patch) member.id = (patch['id'] as string | null) ?? null
    if ('name' in patch) member.name = (patch['name'] as string | null) ?? null
    if ('gender' in patch) member.gender = (patch['gender'] as string | null) ?? null
    if ('group' in patch) member.group = (patch['group'] as string | null) ?? null
    if ('count' in patch) member.count = (patch['count'] as number | null) ?? null
    if ('weight' in patch) member.weight = (patch['weight'] as number | null) ?? null
    if ('enabled' in patch) member.enabled = patch['enabled'] === true
    if ('tags' in patch) member.tags = (patch['tags'] as string[] | null) ?? []
  }

  





  async function submit(): Promise<void> {
    if (node.value === null || isBusy.value || !canPushRoster.value) return
    if (state.selected === null) {
      state.error = t('nodeDetail.rosterRead.pickList')
      return
    }

    busyAction.value = busy
    state.error = null
    feedback.value = null
    let sent = false
    try {
      const payload = buildRosterPush(kind, state.selected, state.mode, state.activate, state.draft)
      await dispatch(() => api.pushRoster(props.groupId, props.nodeId, payload))
      feedback.value = { kind: 'ok', code: undefined }
      sent = true
    } catch (caught) {
      feedback.value = { kind: 'fail', code: resolveCode(caught) }
    } finally {
      busyAction.value = null
    }

    if (sent) await read()
  }

  return {
    kind,
    state,
    read,
    selectList,
    addRow,
    removeRow,
    setNumber,
    setTags,
    mergeMember,
    submit,
  }
}

type RosterReader = ReturnType<typeof createRosterReader>

const studentsReader = createRosterReader('students', 'roster')
const prizesReader = createRosterReader('prizes', 'prizes')






const rosterKind = ref<RosterKind>('students')


const activeReader = computed<RosterReader>(() =>
  rosterKind.value === 'prizes' ? prizesReader : studentsReader,
)







const activeReaderList = computed<NodeRosterListDto | null>(
  () =>
    activeReader.value.state.lists.find((list) => list.name === activeReader.value.state.selected) ??
    null,
)








function switchRosterKind(kind: RosterKind): void {
  rosterKind.value = kind
  const reader = kind === 'prizes' ? prizesReader : studentsReader
  if (reader.state.status === 'idle' && !isBusy.value) void reader.read()
}


const activeReaderFeedback = computed(() => describeCommandFeedback(activeReader.value.state.command))









const rosterImportOpen = ref(false)


const rosterNotice = ref<string | null>(null)







const rosterNotices = computed<readonly PanelNotice[]>(() => {
  const reader = activeReader.value
  const notices: PanelNotice[] = []

  




  if (!reader.state.reading) {
    if (reader.state.status === 'unavailable') {
      notices.push({
        tone: 'warn',
        text: t('nodeDetail.rosterRead.unsupported'),
        testId: 'node-detail-roster-read-unsupported',
      })

      const feedback = activeReaderFeedback.value
      if (feedback !== null) {
        notices.push({
          tone: 'info',
          text: feedbackText(feedback),
          testId: 'node-detail-roster-read-reason',
        })
      }
    }

    if (reader.state.status === 'failed') {
      notices.push({
        tone: 'fail',
        text: t('nodeDetail.rosterRead.failed', {
          reason: errorCodeText(reader.state.reason ?? 'unknown'),
        }),
        testId: 'node-detail-roster-read-error',
      })
    }
  }

  
  if (reader.state.error !== null) {
    notices.push({ tone: 'fail', text: reader.state.error, testId: 'node-detail-roster-draft-error' })
  }

  if (rosterNotice.value !== null) {
    notices.push({
      tone: 'ok',
      text: rosterNotice.value,
      testId: 'node-detail-roster-notice',
    })
  }

  return notices
})


const rosterReadHint = computed(() => {
  if (canReadRoster.value) return ''
  return canManage.value
    ? t('nodeDetail.rosterRead.unsupported')
    : t('nodeDetail.rosterRead.adminRequired')
})


const rosterPanelState = computed<ClientRosterPanelState>(() => ({
  status: activeReader.value.state.reading ? 'reading' : activeReader.value.state.status,
  canRead: canReadRoster.value,
  canPush: canPushRoster.value,
  busy: isBusy.value,
  notices: rosterNotices.value,
}))

function selectRosterList(name: string): void {
  activeReader.value.selectList(name)
  rosterNotice.value = null
}


function addRosterRow(member: NodeRosterMemberDto): void {
  rosterNotice.value = null
  activeReader.value.addRow(member)
}


function exportRoster(): void {
  rosterNotice.value = null
  exportActiveRoster()
}







function openRosterImport(): void {
  const reader = activeReader.value
  rosterNotice.value = null

  if (reader.state.selected === null) {
    reader.state.error = t('nodeDetail.rosterRead.importNeedsList')
    return
  }

  rosterImportOpen.value = true
}













function applyImportedRoster(members: NodeRosterMemberDto[]): void {
  const reader = activeReader.value
  rosterImportOpen.value = false

  if (reader.state.selected === null) {
    reader.state.error = t('nodeDetail.rosterRead.importNeedsList')
    return
  }

  reader.state.draft = [...members]

  const list = activeReaderList.value
  if (list?.truncated === true) {
    
    reader.state.mode = 'merge'
  } else {
    reader.state.mode = 'replace'
  }

  reader.state.error = null
  rosterNotice.value = null
}








function downloadText(fileName: string, text: string): void {
  if (typeof URL.createObjectURL !== 'function') return

  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.rel = 'noopener'
    document.body.append(link)
    link.click()
    link.remove()
  } finally {
    if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url)
  }
}


function exportActiveRoster(): void {
  const reader = activeReader.value
  const csv = toRosterCsv(reader.state.draft, reader.kind)
  if (csv.length === 0) {
    rosterNotice.value = t('nodeDetail.client.roster.exportEmpty')
    return
  }

  downloadText(rosterCsvFileName(reader.kind, reader.state.selected), csv)
  rosterNotice.value = t('nodeDetail.client.roster.exported', { count: reader.state.draft.length })
}









const commandLogViews = computed(() =>
  commandLog.value.map((item) => ({
    command: item,
    feedback: describeCommandFeedback(item),
    revokeNotice: revokeNotice(item.command_id),
  })),
)




let disposed = false









useAutoRefresh(() => loadNode({ silent: true }), {
  intervalMs: props.refreshIntervalMs,
  canRefresh: () => !isBusy.value,
})







usePresenceEvents(() => props.groupId, () => loadNode({ silent: true }), {
  canRefresh: () => !isBusy.value,
})

onMounted(loadNode)
onBeforeUnmount(() => {
  disposed = true
  disarmTrigger()
  disarmReset()
  disarmRevoke()
})
</script>

<template>
  
  <div class="mx-auto flex w-full max-w-(--cn-console-page-max-width) flex-1 flex-col gap-4 p-5">
    <RouterLink
      :to="{ name: 'console-group-detail', params: { groupId } }"
      class="inline-flex w-fit items-center gap-1.5 text-[12.5px] text-text-muted transition hover:text-brand-bright"
      data-testid="node-detail-back"
    >
      <ArrowLeft class="icon" />
      {{ t('nodeDetail.backToGroup') }}
    </RouterLink>

    <div v-if="loading && node === null" class="text-[13px] text-text-muted">
      {{ t('common.loading') }}
    </div>

    
    <div
      v-else-if="node === null"
      data-testid="node-detail-not-found"
      class="rounded-card border border-border-base bg-surface px-5 py-6"
    >
      <h2 class="text-[15px] font-semibold">{{ t('nodeDetail.notFound') }}</h2>
      <p class="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">
        {{ errorMessage ?? t('nodeDetail.notFoundHint') }}
      </p>
      <p class="mt-2 font-mono text-[11.5px] text-text-faint">{{ nodeId }}</p>
    </div>

    <template v-else>
      
      <section class="rounded-card border border-border-base bg-surface">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-3">
          <h1 class="text-[19px] font-semibold tracking-wide" data-testid="node-detail-name">
            {{ displayName || t('group.displayNameUnset') }}
          </h1>

          <span
            class="rounded-full px-2 py-0.5 text-[11px]"
            :class="node.online ? 'bg-brand/15 text-brand-bright' : 'bg-surface-3 text-text-faint'"
            data-testid="node-detail-presence"
          >
            {{ node.online ? t('group.online') : t('group.offline') }}
          </span>

          <span
            v-if="node.draw_locked"
            data-testid="node-detail-draw-locked"
            class="inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/15 px-2 py-0.5 text-[11px] text-warn"
          >
            <Lock class="icon" />
            {{ t('group.drawLocked') }}
          </span>

          <span
            v-if="!node.local_remote_allowed"
            data-testid="node-detail-local-remote"
            class="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted"
          >
            {{ t('group.localRemoteDisabled') }}
          </span>

          <button
            type="button"
            data-testid="node-detail-refresh"
            class="press ml-auto inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] transition hover:bg-surface-3 disabled:opacity-45"
            :disabled="loading"
            @click="loadNode()"
          >
            <RefreshCw class="icon" :class="loading ? 'animate-spin' : ''" />
            {{ t('common.refresh') }}
          </button>
        </div>

        <p class="px-4 pb-2 font-mono text-[12px] text-text-faint">
          {{ node.node_id }} · {{ node.platform }} ·
          {{ formatVersion(node.version) || node.version }}
        </p>

        <dl class="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-border-base px-4 py-3 text-[12px] sm:grid-cols-2">
          <div class="flex gap-2">
            <dt class="shrink-0 text-text-faint">{{ t('group.lastHeartbeat') }}</dt>
            <dd class="text-text-muted">{{ formatTime(node.last_heartbeat_at) }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="shrink-0 text-text-faint">{{ t('group.registeredAt') }}</dt>
            <dd class="text-text-muted">{{ formatTime(node.registered_at) }}</dd>
          </div>
          <div class="flex flex-wrap gap-2 sm:col-span-2">
            <dt class="shrink-0 text-text-faint">{{ t('group.capabilities') }}</dt>
            <dd class="flex flex-wrap gap-1">
              <span
                v-for="capability in node.capabilities"
                :key="capability"
                class="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted"
              >
                {{ capabilityText(capability) }}
              </span>
              <span v-if="node.capabilities.length === 0" class="text-text-faint">—</span>
            </dd>
          </div>
        </dl>
      </section>

      
      <div class="flex flex-wrap gap-1.5 border-b border-border-base">
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          :data-testid="`tab-${item.id}`"
          class="press -mb-px border-b-2 px-3 py-2 text-[13px] transition"
          :class="
            activeTab === item.id
              ? 'border-brand font-medium text-brand-bright'
              : 'border-transparent text-text-muted hover:text-text-base'
          "
          @click="activeTab = item.id"
        >
          {{ item.label }}
        </button>
      </div>

      
      <div
        v-if="feedback"
        data-testid="node-detail-feedback"
        class="rounded-card border px-4 py-2 text-[12px]"
        :class="
          feedback.kind === 'ok'
            ? 'border-brand/30 bg-brand/10 text-brand-bright'
            : 'border-danger/30 bg-danger/10 text-[#f5a9b0]'
        "
      >
        {{
          feedback.kind === 'ok'
            ? t('group.rowOk')
            : t('group.rowFailed', { reason: errorCodeText(feedback.code ?? 'unknown') })
        }}
      </div>

      
      <template v-if="activeTab === 'overview'">
        
        <section class="rounded-card border border-border-base bg-surface">
          <div class="border-b border-border-base px-4 py-3">
            <h2 class="text-[14px] font-semibold">{{ t('nodeDetail.summary.title') }}</h2>
          </div>

          <dl
            data-testid="node-detail-summary"
            class="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 text-[12px] sm:grid-cols-2"
          >
            <div class="flex gap-2">
              <dt class="shrink-0 text-text-faint">{{ t('nodeDetail.summary.connection') }}</dt>
              <dd :class="node.online ? 'text-brand-bright' : 'text-text-muted'">
                {{ node.online ? t('group.online') : t('group.offline') }}
              </dd>
            </div>
            <div class="flex gap-2">
              <dt class="shrink-0 text-text-faint">{{ t('nodeDetail.summary.desiredLock') }}</dt>
              <dd :class="node.draw_locked ? 'text-warn' : 'text-text-muted'">
                {{ node.draw_locked ? t('group.drawLocked') : t('group.unlockDraw') }}
              </dd>
            </div>
            <div class="flex gap-2">
              <dt class="shrink-0 text-text-faint">{{ t('nodeDetail.summary.localRemote') }}</dt>
              <dd class="text-text-muted">
                {{
                  node.local_remote_allowed
                    ? t('nodeDetail.summary.localRemoteAllowed')
                    : t('group.localRemoteDisabled')
                }}
              </dd>
            </div>
            <div class="flex gap-2">
              <dt class="shrink-0 text-text-faint">{{ t('nodeDetail.summary.lastCommand') }}</dt>
              <dd class="text-text-muted">{{ statusText ?? '—' }}</dd>
            </div>
          </dl>

          
          <div
            v-if="desired"
            data-testid="node-detail-desired"
            class="border-t border-border-base px-4 py-2.5 text-[11.5px] leading-relaxed text-text-muted"
          >
            {{ t('nodeDetail.desiredState') }} ·
            {{ desired.draw_locked ? t('group.drawLocked') : t('group.unlockDraw') }} ·
            {{ t('nodeDetail.revisionLabel') }} {{ desired.revision }} ·
            {{ desired.delivered ? t('nodeDetail.delivered') : t('nodeDetail.notDelivered') }}
          </div>
        </section>

        
        <section class="rounded-card border border-border-base bg-surface">
          <div class="border-b border-border-base px-4 py-3">
            <h2 class="text-[14px] font-semibold">{{ t('nodeDetail.actions') }}</h2>
          </div>

          <div class="flex flex-wrap items-center gap-2 px-4 py-3">
            
            <button
              v-if="canOperate"
              type="button"
              data-testid="node-detail-lock"
              class="press inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-[12px] font-medium transition disabled:opacity-45"
              :class="
                node.draw_locked
                  ? 'border-border-strong bg-surface-2 hover:bg-surface-3'
                  : 'border-warn/40 bg-warn/15 text-warn hover:bg-warn/25'
              "
              :disabled="isBusy || !canLock"
              :title="canLock ? t('group.drawLockHint') : t('group.drawLockUnsupported')"
              @click="toggleDrawLock"
            >
              <LoaderCircle v-if="busyAction === 'lock'" class="icon animate-spin" />
              <LockOpen v-else-if="node.draw_locked" class="icon" />
              <Lock v-else class="icon" />
              {{ node.draw_locked ? t('group.unlockDraw') : t('group.lockDraw') }}
            </button>

            
            <button
              v-if="canOperate"
              type="button"
              data-testid="node-detail-trigger"
              class="press inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-[12px] font-medium transition disabled:opacity-45"
              :class="
                triggerArmed
                  ? 'border-danger/50 bg-danger/15 text-[#f5a9b0]'
                  : 'border-border-strong bg-surface-2 hover:bg-surface-3'
              "
              :disabled="isBusy || !canTrigger"
              :title="canTrigger ? t('group.triggerHint') : t('group.triggerUnsupported')"
              @click="triggerDraw"
            >
              <LoaderCircle v-if="busyAction === 'trigger'" class="icon animate-spin" />
              <Zap v-else class="icon" />
              {{ triggerArmed ? t('group.triggerConfirm') : t('group.triggerDraw') }}
            </button>

            
            <button
              v-if="canOperate"
              type="button"
              data-testid="node-detail-reset"
              class="press inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-[12px] font-medium transition disabled:opacity-45"
              :class="
                resetArmed
                  ? 'border-danger/50 bg-danger/15 text-[#f5a9b0]'
                  : 'border-border-strong bg-surface-2 hover:bg-surface-3'
              "
              :disabled="isBusy || !canResetDraw"
              :title="canResetDraw ? t('nodeDetail.drawReset.hint') : t('nodeDetail.drawReset.unsupported')"
              @click="resetDrawRound"
            >
              <LoaderCircle v-if="busyAction === 'reset'" class="icon animate-spin" />
              <RotateCcw v-else class="icon" />
              {{ resetArmed ? t('nodeDetail.drawReset.confirm') : t('nodeDetail.drawReset.button') }}
            </button>

            <button
              v-if="canManage"
              type="button"
              data-testid="node-detail-remove"
              class="press ml-auto inline-flex items-center gap-1.5 rounded-control border border-danger/40 bg-danger/12 px-2.5 py-1.5 text-[12px] font-medium text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
              :disabled="isBusy"
              :title="t('group.removeNodeHint')"
              @click="removeNode"
            >
              <LoaderCircle v-if="busyAction === 'remove'" class="icon animate-spin" />
              <Trash2 v-else class="icon" />
              {{ t('group.removeNode') }}
            </button>
          </div>

          
          <div
            v-if="canOperate"
            data-testid="node-detail-reset-panel"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-base px-4 py-2.5"
          >
            <span class="text-[12px] font-medium">{{ t('nodeDetail.drawReset.title') }}</span>
            <span class="text-[11.5px] leading-relaxed text-text-faint">
              {{ t('nodeDetail.drawReset.hint') }}
            </span>

            <label class="flex items-center gap-1.5 text-[12px]">
              <span class="text-text-muted">{{ t('nodeDetail.drawReset.targetLabel') }}</span>
              <ClientSelect
                :model-value="resetTarget"
                :options="resetTargetSelectOptions"
                :disabled="isBusy"
                :label="t('nodeDetail.drawReset.targetLabel')"
                data-testid="node-detail-reset-target"
                @update:model-value="(target) => changeResetTarget(target as DrawResetTarget)"
              />
            </label>

            <label class="flex items-center gap-1.5 text-[12px]">
              <span class="text-text-muted">{{ t('nodeDetail.drawReset.listLabel') }}</span>
              <ClientSelect
                v-model="resetListName"
                :options="resetListSelectOptions"
                :disabled="isBusy || resetListOptions.length === 0"
                :label="t('nodeDetail.drawReset.listLabel')"
                data-testid="node-detail-reset-list"
              />
            </label>

            <span
              v-if="!canResetDraw"
              data-testid="node-detail-reset-unsupported"
              class="text-[11.5px] text-text-faint"
            >
              {{ t('nodeDetail.drawReset.unsupported') }}
            </span>

            <span
              v-else-if="resetListOptions.length === 0"
              data-testid="node-detail-reset-list-hint"
              class="text-[11.5px] text-text-faint"
            >
              {{ t('nodeDetail.drawReset.listNeedsRead') }}
            </span>

            
            <span
              v-if="resetReceipt"
              data-testid="node-detail-reset-result"
              class="text-[11.5px] text-brand-bright"
            >
              {{ t('nodeDetail.drawReset.success', { count: resetReceipt.cleared }) }} ·
              {{ t('nodeDetail.drawReset.historyNote') }}
            </span>

            
            <span
              v-if="resetFailureText"
              data-testid="node-detail-reset-failure"
              class="text-[11.5px] text-[#f5a9b0]"
            >
              {{ resetFailureText }}
            </span>
          </div>

          
          <div v-if="canOperate" class="border-t border-border-base px-4 py-3">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-[13px] font-semibold">{{ t('nodeDetail.draw.title') }}</h3>
              
              <span data-testid="node-detail-draw-legend" class="text-[11.5px] text-text-faint">
                {{ drawLegend }}
              </span>
              <button
                type="button"
                data-testid="node-detail-draw-toggle"
                class="press ml-auto inline-flex items-center gap-1 rounded-control border border-border-strong bg-surface-2 px-2 py-1 text-[11.5px] text-text-muted transition hover:bg-surface-3"
                :aria-expanded="drawAdvancedOpen"
                @click="drawAdvancedOpen = !drawAdvancedOpen"
              >
                {{ drawAdvancedOpen ? t('nodeDetail.draw.collapse') : t('nodeDetail.draw.advanced') }}
              </button>
            </div>

            <template v-if="drawAdvancedOpen">
              <p class="mt-1 text-[11.5px] leading-relaxed text-text-faint">
                {{ t('nodeDetail.draw.hint') }}
              </p>

              
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span class="text-[11px] text-text-faint">{{ t('nodeDetail.draw.targetLabel') }}</span>
                <div class="inline-flex overflow-hidden rounded-control border border-border-strong">
                <button
                  type="button"
                  data-testid="node-detail-draw-scope-quick"
                  class="press px-2.5 py-1 text-[12px] font-medium transition"
                  :class="
                    drawScope === 'quick'
                      ? 'bg-brand text-white'
                      : 'bg-surface-2 text-text-muted hover:bg-surface-3'
                  "
                  :disabled="isBusy"
                  @click="selectDrawScope('quick')"
                >
                  {{ t('nodeDetail.draw.scopeQuick') }}
                </button>
                <button
                  type="button"
                  data-testid="node-detail-draw-scope-roll-call"
                  class="press px-2.5 py-1 text-[12px] font-medium transition"
                  :class="
                    drawScope === 'roll_call'
                      ? 'bg-brand text-white'
                      : 'bg-surface-2 text-text-muted hover:bg-surface-3'
                  "
                  :disabled="isBusy"
                  @click="selectDrawScope('roll_call')"
                >
                  {{ t('nodeDetail.draw.scopeRollCall') }}
                </button>
                <button
                  type="button"
                  data-testid="node-detail-draw-scope-lottery"
                  class="press px-2.5 py-1 text-[12px] font-medium transition"
                  :class="
                    drawScope === 'lottery'
                      ? 'bg-brand text-white'
                      : 'bg-surface-2 text-text-muted hover:bg-surface-3'
                  "
                  :disabled="isBusy"
                  @click="selectDrawScope('lottery')"
                >
                  {{ t('nodeDetail.draw.scopeLottery') }}
                </button>
              </div>
              <span class="text-[11.5px] text-text-faint">
                {{
                  drawScope === 'quick'
                    ? t('nodeDetail.draw.scopeQuickHint')
                    : drawScope === 'lottery'
                      ? t('nodeDetail.draw.scopeLotteryHint')
                      : t('nodeDetail.draw.targetLabel')
                }}
              </span>
            </div>

            
            <p
              v-if="drawScope === 'quick'"
              data-testid="node-detail-draw-quick-note"
              class="mt-2 text-[11.5px] leading-relaxed text-text-faint"
            >
              {{ t('nodeDetail.draw.scopeQuickHint') }}
            </p>

            <template v-else>
              
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="node-detail-draw-read-roster"
                  class="press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3 disabled:opacity-45"
                  :disabled="isBusy || !canPickDrawList"
                  :title="canPickDrawList ? t('nodeDetail.draw.readRoster') : t('nodeDetail.draw.listNeedsRead')"
                  @click="readDrawRoster"
                >
                  <LoaderCircle v-if="activeDrawReader.state.reading" class="icon animate-spin" />
                  <RefreshCw v-else class="icon" />
                  {{
                    activeDrawReader.state.reading
                      ? t('nodeDetail.draw.reading')
                      : t('nodeDetail.draw.readRoster')
                  }}
                </button>
                <span
                  v-if="!canPickDrawList"
                  data-testid="node-detail-draw-read-hint"
                  class="text-[11.5px] text-text-faint"
                >
                  {{ t('nodeDetail.draw.listNeedsRead') }}
                </span>
                
                <span
                  v-else-if="activeDrawReader.state.status === 'unavailable' || activeDrawReader.state.status === 'failed'"
                  data-testid="node-detail-draw-read-error"
                  class="text-[11.5px] text-text-faint"
                >
                  {{ t('nodeDetail.rosterRead.unsupported') }}
                </span>
              </div>

              <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label class="flex flex-col gap-1 text-[11px] text-text-faint">
                  <span>{{ t('nodeDetail.draw.listLabel') }}</span>
                  <ClientSelect
                    v-model="drawListName"
                    :options="drawListSelectOptions"
                    :disabled="isBusy || !canPickDrawList"
                    :label="t('nodeDetail.draw.listLabel')"
                    data-testid="node-detail-draw-list"
                  />
                </label>

                
                <label
                  v-if="drawScope === 'roll_call'"
                  class="flex flex-col gap-1 text-[11px] text-text-faint"
                >
                  <span>{{ t('nodeDetail.draw.genderLabel') }}</span>
                  <ClientSelect
                    v-model="drawGender"
                    :options="drawGenderSelectOptions"
                    :disabled="isBusy || drawList === null"
                    :label="t('nodeDetail.draw.genderLabel')"
                    data-testid="node-detail-draw-gender"
                  />
                </label>

                <label
                  v-if="drawScope === 'roll_call'"
                  class="flex flex-col gap-1 text-[11px] text-text-faint"
                >
                  <span>{{ t('nodeDetail.draw.groupLabel') }}</span>
                  <ClientSelect
                    v-model="drawGroup"
                    :options="drawGroupSelectOptions"
                    :disabled="isBusy || drawList === null"
                    :label="t('nodeDetail.draw.groupLabel')"
                    data-testid="node-detail-draw-group"
                  />
                </label>

                <label class="flex flex-col gap-1 text-[11px] text-text-faint">
                  <span>{{ t('nodeDetail.draw.countLabel') }}</span>
                  <input
                    v-model.number="drawCount"
                    type="number"
                    data-testid="node-detail-draw-count"
                    class="rounded-control border border-border-strong bg-surface-2 px-2 py-1.5 text-[12.5px] text-text-base outline-none focus:border-brand disabled:opacity-45"
                    :min="DRAW_COUNT_MIN"
                    :max="DRAW_MAX_COUNT"
                    :disabled="isBusy"
                  />
                </label>
              </div>

              
              <div
                v-if="drawScope === 'lottery'"
                data-testid="node-detail-draw-conditions"
                class="mt-2 rounded-control border border-border-base bg-surface-2 px-3 py-2"
              >
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span class="text-[12px] font-medium">
                    {{ t('nodeDetail.draw.conditions.title') }}
                  </span>
                  <span class="text-[11px] leading-relaxed text-text-faint">
                    {{
                      canUseDrawConditions
                        ? t('nodeDetail.draw.conditions.hint')
                        : t('nodeDetail.draw.conditions.unsupported')
                    }}
                  </span>
                </div>

                <p
                  v-if="!canUseDrawConditions"
                  data-testid="node-detail-draw-conditions-unsupported"
                  class="mt-1 text-[11px] leading-relaxed text-text-faint"
                >
                  {{ t('nodeDetail.draw.conditions.unsupported') }}
                </p>

                <template v-if="canUseDrawConditions">
                  
                  <div class="mt-2 flex flex-col gap-1">
                    <span class="text-[11px] text-text-faint">
                      {{ t('nodeDetail.draw.conditions.tagsLabel') }} ·
                      {{ t('nodeDetail.draw.conditions.tagsHint') }}
                    </span>

                    <span
                      v-if="conditionTagOptions.length === 0"
                      data-testid="node-detail-draw-conditions-tags-empty"
                      class="text-[11px] text-text-faint"
                    >
                      {{ t('nodeDetail.draw.conditions.tagsEmpty') }}
                    </span>

                    <div
                      v-else
                      data-testid="node-detail-draw-conditions-tags"
                      class="flex flex-wrap gap-1"
                    >
                      <button
                        v-for="tag in conditionTagOptions"
                        :key="tag"
                        type="button"
                        :data-testid="`node-detail-draw-condition-tag-${tag}`"
                        class="press rounded-full border px-2 py-0.5 text-[11px] transition disabled:opacity-45"
                        :class="
                          conditionTags.includes(tag)
                            ? 'border-brand bg-brand/15 text-brand-bright'
                            : 'border-border-strong bg-surface text-text-muted hover:bg-surface-3'
                        "
                        :disabled="isBusy"
                        @click="toggleConditionTag(tag)"
                      >
                        {{ tag }}
                      </button>
                    </div>
                  </div>

                  
                  <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <label class="flex flex-col gap-1 text-[11px] text-text-faint">
                      <span>{{ t('nodeDetail.draw.conditions.studentListLabel') }}</span>
                      <ClientSelect
                        v-model="conditionStudentList"
                        :options="conditionStudentListOptions"
                        :disabled="isBusy || conditionStudentOptions.length === 0"
                        :label="t('nodeDetail.draw.conditions.studentListLabel')"
                        data-testid="node-detail-draw-condition-student-list"
                      />
                    </label>

                    
                    <label
                      v-if="conditionStudentList.trim().length > 0"
                      class="flex flex-col gap-1 text-[11px] text-text-faint"
                    >
                      <span>{{ t('nodeDetail.draw.genderLabel') }}</span>
                      <ClientSelect
                        v-model="conditionGender"
                        :options="conditionGenderSelectOptions"
                        :disabled="isBusy"
                        :label="t('nodeDetail.draw.genderLabel')"
                        data-testid="node-detail-draw-condition-gender"
                      />
                    </label>

                    <label
                      v-if="conditionStudentList.trim().length > 0"
                      class="flex flex-col gap-1 text-[11px] text-text-faint"
                    >
                      <span>{{ t('nodeDetail.draw.groupLabel') }}</span>
                      <ClientSelect
                        v-model="conditionGroup"
                        :options="conditionGroupSelectOptions"
                        :disabled="isBusy"
                        :label="t('nodeDetail.draw.groupLabel')"
                        data-testid="node-detail-draw-condition-group"
                      />
                    </label>
                  </div>

                  
                  <div
                    v-if="conditionStudentOptions.length === 0"
                    class="mt-1 flex flex-wrap items-center gap-2"
                  >
                    <button
                      type="button"
                      data-testid="node-detail-draw-condition-read-students"
                      class="press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[11.5px] transition hover:bg-surface-3 disabled:opacity-45"
                      :disabled="isBusy || !canPickDrawList"
                      @click="readConditionStudents"
                    >
                      <LoaderCircle v-if="studentsReader.state.reading" class="icon animate-spin" />
                      <RefreshCw v-else class="icon" />
                      {{ t('nodeDetail.draw.conditions.readStudents') }}
                    </button>
                    <span class="text-[11px] leading-relaxed text-text-faint">
                      {{ t('nodeDetail.draw.conditions.studentListNeedsRead') }}
                    </span>
                  </div>

                  
                  <p
                    v-if="conditionStudentList.trim().length > 0"
                    data-testid="node-detail-draw-conditions-recipient-note"
                    class="mt-1 text-[11px] leading-relaxed text-text-faint"
                  >
                    {{ t('nodeDetail.draw.conditions.recipientNote') }}
                  </p>
                </template>
              </div>

              <p class="mt-1 text-[11px] text-text-faint">
                {{ t('nodeDetail.draw.countHint', { max: DRAW_MAX_COUNT }) }}
              </p>

              
              <p
                v-if="drawCheckNotice !== null"
                data-testid="node-detail-draw-check"
                class="mt-1.5 text-[11.5px] text-text-faint"
              >
                {{ t(drawCheckNotice.key, drawCheckNotice.params) }}
              </p>

              
              <p
                v-if="drawFailureText !== null"
                data-testid="node-detail-draw-failure"
                class="mt-1.5 text-[11.5px] leading-relaxed text-[#f5a9b0]"
              >
                {{ drawFailureText }}
              </p>

              <div class="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="node-detail-draw-submit"
                  class="press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
                  :disabled="isBusy || !canTrigger || !canSubmitDraw"
                  :title="drawBlocked === null ? t('group.triggerHint') : t(drawBlocked.key, drawBlocked.params)"
                  @click="triggerParameterizedDraw"
                >
                  <LoaderCircle v-if="busyAction === 'trigger'" class="icon animate-spin" />
                  <Zap v-else class="icon" />
                  {{ t('nodeDetail.draw.submit') }}
                </button>
                <span v-if="drawBlocked !== null" class="text-[11.5px] text-text-faint">
                  {{ t(drawBlocked.key, drawBlocked.params) }}
                </span>
              </div>
              </template>
            </template>
          </div>

          
          <div class="border-t border-border-base px-4 py-3">
            <h3 class="text-[13px] font-semibold">{{ t('nodeDetail.mediaTitle') }}</h3>
            <p class="mt-1 text-[11.5px] leading-relaxed text-text-faint">
              {{ canAnnounce ? t('nodeDetail.mediaHint') : t('nodeDetail.mediaUnsupported') }}
            </p>

            <div v-if="canOperate" class="mt-2 flex flex-wrap items-center gap-2">
              <input
                v-model="announceText"
                type="text"
                data-testid="node-detail-announce-text"
                class="min-w-0 flex-1 rounded-control border border-border-strong bg-surface-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-brand"
                :maxlength="MAX_ANNOUNCE_LENGTH"
                :placeholder="t('nodeDetail.mediaPlaceholder')"
                :disabled="isBusy || !canAnnounce"
                autocomplete="off"
              />
              <span class="text-[11px] text-text-faint">
                {{ announceText.length }}/{{ MAX_ANNOUNCE_LENGTH }}
              </span>
              <button
                type="button"
                data-testid="node-detail-announce-send"
                class="press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
                :disabled="isBusy || !canAnnounce || mediaProblem !== null"
                @click="openBroadcast"
              >
                <LoaderCircle v-if="busyAction === 'media'" class="icon animate-spin" />
                <Megaphone v-else class="icon" />
                {{ t('nodeDetail.mediaSend') }}
              </button>
            </div>

            <p
              v-if="canOperate && mediaProblemText"
              data-testid="node-detail-media-problem"
              class="mt-1.5 text-[11.5px] text-text-faint"
            >
              {{ mediaProblemText }}
            </p>
          </div>
        </section>

        
        <section class="rounded-card border border-border-base bg-surface">
          <div class="border-b border-border-base px-4 py-3">
            <h2 class="text-[14px] font-semibold">{{ t('nodeDetail.commandStatus') }}</h2>
          </div>

          <div class="px-4 py-3">
            <p v-if="command === null" class="text-[11.5px] text-text-faint">—</p>
            <template v-else>
              <p
                data-testid="node-detail-command-status"
                class="flex flex-wrap items-center gap-2 text-[12.5px]"
                :class="statusTone"
              >
                <LoaderCircle v-if="polling" class="icon animate-spin" />
                {{ statusText }}
                <span class="font-mono text-[11px] text-text-faint">
                  {{ command.command_id }}
                </span>
              </p>
              <p v-if="polling" class="mt-1 text-[11.5px] text-text-faint">
                {{ t('nodeDetail.awaitingResult') }}
              </p>

              
              <div
                v-if="command.status === 'queued'"
                data-testid="node-detail-queued-hint"
                class="mt-1.5 rounded-control border border-warn/40 bg-warn/12 px-2.5 py-2 text-[11.5px] leading-relaxed text-warn"
              >
                <p>{{ t('nodeDetail.commands.revokeQueuedHint') }}</p>

                <button
                  v-if="canOperate"
                  type="button"
                  data-testid="node-detail-overview-revoke"
                  class="press mt-2 inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-[12px] font-medium transition disabled:opacity-45"
                  :class="
                    armedRevokeId === command.command_id
                      ? 'border-danger/50 bg-danger/15 text-[#f5a9b0]'
                      : 'border-warn/40 bg-warn/15 text-warn hover:bg-warn/25'
                  "
                  :disabled="revokingId !== null"
                  @click="revokeCommandEntry(command)"
                >
                  <LoaderCircle v-if="revokingId === command.command_id" class="icon animate-spin" />
                  {{
                    revokingId === command.command_id
                      ? t('nodeDetail.commands.revoking')
                      : armedRevokeId === command.command_id
                        ? t('nodeDetail.commands.revokeConfirm')
                        : t('nodeDetail.commands.revoke')
                  }}
                </button>

                <p
                  v-if="overviewRevokeNotice"
                  data-testid="node-detail-overview-revoke-notice"
                  class="mt-1.5"
                  :class="overviewRevokeNotice.toneClass"
                >
                  {{ overviewRevokeNotice.text }}
                </p>
              </div>

              
              <div
                v-if="feedbackView"
                data-testid="node-detail-command-detail"
                class="mt-1.5 rounded-control border px-2.5 py-2 text-[11.5px] leading-relaxed"
                :class="feedbackToneClass"
              >
                <p>{{ t('nodeDetail.resultDetailLabel') }} · {{ feedbackViewText }}</p>

                <p
                  v-for="line in feedbackView.lines"
                  :key="line.key"
                  class="mt-1 text-text-muted"
                >
                  {{ lineText(line) }}
                </p>

                
                <div
                  v-if="feedbackView.supportedCapabilities.length > 0"
                  class="mt-1 flex flex-wrap items-center gap-1 text-text-muted"
                >
                  <span>{{ t('nodeDetail.feedback.supportedLabel') }}</span>
                  <span
                    v-for="capability in feedbackView.supportedCapabilities"
                    :key="capability"
                    class="rounded-full bg-surface-3 px-2 py-0.5 text-[11px]"
                  >
                    {{ capabilityText(capability) }}
                  </span>
                </div>

                
                <details v-if="feedbackView.rawContext" class="mt-1.5">
                  <summary class="cursor-pointer text-[11px] text-text-faint">
                    {{ t('nodeDetail.feedback.rawContextLabel') }}
                  </summary>
                  <pre
                    data-testid="node-detail-command-context"
                    class="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-text-muted"
                  >{{ feedbackView.rawContext }}</pre>
                </details>
                
                <div v-if="feedbackView.fix" class="mt-2">
                  <button
                    v-if="canWriteSettings"
                    type="button"
                    data-testid="node-detail-voice-fix"
                    class="press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
                    :disabled="isBusy"
                    @click="enableVoiceThenAnnounce"
                  >
                    <LoaderCircle v-if="busyAction === 'settings'" class="icon animate-spin" />
                    {{ t('nodeDetail.feedback.voiceEnableFix') }}
                  </button>
                  <p
                    v-else
                    data-testid="node-detail-voice-fix-hint"
                    class="text-[11px] text-text-faint"
                  >
                    {{ t('nodeDetail.feedback.voiceEnableNeedsSettings') }}
                  </p>
                </div>
              </div>
              
              <div
                v-if="drawReceipt !== null"
                data-testid="node-detail-draw-result"
                class="mt-1.5 rounded-control border border-border-base px-2.5 py-2 text-[11.5px] leading-relaxed text-text-muted"
              >
                <p class="font-medium text-text-base">{{ t('nodeDetail.draw.drawnTitle') }}</p>

                <p v-if="drawnMembersText !== null" data-testid="node-detail-draw-drawn">
                  {{ t('nodeDetail.feedback.drawnMembers', { names: drawnMembersText }) }}
                </p>
                <p v-else class="text-text-faint">{{ t('nodeDetail.draw.drawnEmpty') }}</p>

                <p v-if="drawReceipt.listName !== null" class="text-text-faint">
                  {{ t('nodeDetail.draw.drawnList', { list: drawReceipt.listName }) }}
                </p>
                <p v-if="drawReceipt.count !== null" class="text-text-faint">
                  {{ t('nodeDetail.draw.drawnCount', { count: drawReceipt.count }) }}
                </p>
              </div>
            </template>
          </div>
        </section>
      </template>

      
      <section v-else-if="activeTab === 'settings'" class="flex flex-col gap-3">
        
        
        <div data-testid="node-detail-settings-read" class="rounded-card border border-border-base bg-surface p-4">
          <ClientSettingsPanel
            :pages="settingsPages"
            :active-page-id="settingsActivePageId"
            :fields="settingsFieldsByPath"
            :drafts="settingsRead.drafts"
            :state="settingsPanelState"
            :read-hint="settingsReadHint"
            @select-page="selectSettingsPage"
            @update-draft="(path, value) => (settingsRead.drafts[path] = value)"
            @read="readSettingsFromDevice"
            @submit="submitSettingsChanges"
          />
        </div>
      </section>
      
      <template v-else-if="activeTab === 'roster'">
        <section class="flex flex-col gap-3" data-testid="node-detail-roster-read">
          <ClientRosterPanel
            :kind="rosterKind"
            :lists="activeReader.state.lists"
            :selected-list-name="activeReader.state.selected"
            :members="activeReader.state.draft"
            :state="rosterPanelState"
            :read-hint="rosterReadHint"
            @read="activeReader.read()"
            @select-list="selectRosterList"
            @switch-kind="switchRosterKind"
            @update-member="(index, patch) => activeReader.mergeMember(index, patch)"
            @add-row="addRosterRow"
            @remove-row="(index) => activeReader.removeRow(index)"
            @import="openRosterImport"
            @export="exportRoster"
            @submit="activeReader.submit()"
          />
        </section>

        
        <ClientImportDrawer
          v-if="rosterImportOpen"
          :kind="activeReader.kind"
          @confirm="applyImportedRoster"
          @close="rosterImportOpen = false"
        />
      </template>

      
      <section v-else-if="activeTab === 'commands'" class="rounded-card border border-border-base bg-surface">
        <div class="border-b border-border-base px-4 py-3">
          <h2 class="text-[14px] font-semibold">{{ t('nodeDetail.commands.title') }}</h2>
          <p class="mt-1 text-[11.5px] leading-relaxed text-text-faint">
            {{ t('nodeDetail.commands.sessionNote') }}
          </p>
        </div>

        <div
          v-if="commandLogViews.length === 0"
          data-testid="node-detail-command-log-empty"
          class="px-4 py-6 text-[12.5px] text-text-muted"
        >
          {{ t('nodeDetail.commands.empty') }}
        </div>

        <ul v-else data-testid="node-detail-command-log" class="divide-y divide-border-base">
          <li
            v-for="entry in commandLogViews"
            :key="entry.command.command_id"
            :data-testid="`node-detail-command-${entry.command.command_id}`"
            class="px-4 py-3"
          >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
              <span
                class="rounded-full px-2 py-0.5 text-[11px]"
                :class="statusPillClass(entry.command.status)"
              >
                {{ statusLabel(entry.command.status) }}
              </span>
              <span class="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted">
                {{ capabilityText(entry.command.capability) }}
              </span>
              <span class="font-mono text-[11px] text-text-faint">
                {{ entry.command.kind }}
              </span>
              <span class="font-mono text-[11px] text-text-faint">
                {{ entry.command.command_id }}
              </span>
              <span class="ml-auto text-[11px] text-text-faint">
                {{ formatTime(entry.command.issued_at) }}
              </span>
            </div>

            <p v-if="entry.command.result_detail" class="mt-1 font-mono text-[11px] text-text-faint">
              {{ entry.command.result_detail }}
            </p>

            
            <div
              v-if="entry.feedback"
              class="mt-1.5 rounded-control border border-border-base bg-surface-2 px-2.5 py-2 text-[11.5px] leading-relaxed text-text-muted"
            >
              {{ feedbackText(entry.feedback) }}
              <details v-if="entry.feedback.rawContext" class="mt-1">
                <summary class="cursor-pointer text-[11px] text-text-faint">
                  {{ t('nodeDetail.feedback.rawContextLabel') }}
                </summary>
                <pre
                  class="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]"
                >{{ entry.feedback.rawContext }}</pre>
              </details>
            </div>

            
            <div
              v-if="entry.command.status === 'queued' && canOperate"
              class="mt-2 flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                data-testid="node-detail-command-revoke"
                class="press inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-[12px] font-medium transition disabled:opacity-45"
                :class="
                  armedRevokeId === entry.command.command_id
                    ? 'border-danger/50 bg-danger/15 text-[#f5a9b0]'
                    : 'border-warn/40 bg-warn/15 text-warn hover:bg-warn/25'
                "
                :disabled="revokingId !== null"
                @click="revokeCommandEntry(entry.command)"
              >
                <LoaderCircle
                  v-if="revokingId === entry.command.command_id"
                  class="icon animate-spin"
                />
                {{
                  revokingId === entry.command.command_id
                    ? t('nodeDetail.commands.revoking')
                    : armedRevokeId === entry.command.command_id
                      ? t('nodeDetail.commands.revokeConfirm')
                      : t('nodeDetail.commands.revoke')
                }}
              </button>
            </div>

            
            <p
              v-if="entry.revokeNotice"
              data-testid="node-detail-command-revoke-notice"
              class="mt-1.5 text-[11.5px] leading-relaxed"
              :class="entry.revokeNotice.toneClass"
            >
              {{ entry.revokeNotice.text }}
            </p>
          </li>
        </ul>
      </section>

      
      <ClientBroadcastDialog
        v-if="broadcastOpen"
        @confirm="confirmBroadcast"
        @close="broadcastOpen = false"
      />
    </template>
  </div>
</template>
