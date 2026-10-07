<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { LoaderCircle } from '@lucide/vue'
import { api, ApiError } from '@/api/client'
import { NodeCapability, type NodeCommandDto, type NodeView } from '@/api/protocol'
import { describeCommandFeedback, type CommandFeedbackView } from '@/utils/command-feedback'
import { useSessionStore } from '@/stores/session'
import { NODE_REFRESH_INTERVAL_MS, useAutoRefresh } from '@/composables/useAutoRefresh'
import { usePresenceEvents } from '@/composables/usePresenceEvents'
import { formatVersion } from '@/utils/version'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import { useCapabilityLabel } from '@/i18n'

const props = withDefaults(
  defineProps<{
    groupId: string
    
    refreshIntervalMs?: number
  }>(),
  { refreshIntervalMs: NODE_REFRESH_INTERVAL_MS },
)

const emit = defineEmits<{
  



  (event: 'counts', payload: { total: number; online: number; drawLocked: number }): void
}>()

const { t, tm } = useI18n()
const session = useSessionStore()
const router = useRouter()

const nodes = ref<NodeView[]>([])
const loading = ref(false)
const errorCode = ref<string | null>(null)

const errorMessage = computed(() => {
  if (!errorCode.value) return null
  const key = `errors.${errorCode.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})










const canOperate = computed(() => session.canIn(props.groupId, 'operator'))


const canRemove = computed(() => session.canIn(props.groupId, 'admin'))

function hasCapability(node: NodeView, capability: string): boolean {
  return node.capabilities.includes(capability)
}







function isLockable(node: NodeView): boolean {
  return canOperate.value && hasCapability(node, NodeCapability.DrawLock)
}







function isMediaCapable(node: NodeView): boolean {
  return canOperate.value && hasCapability(node, NodeCapability.MediaPlay)
}





const canConfigure = computed(() => session.canIn(props.groupId, 'admin'))








const settingsSelected = computed(() =>
  selectedNodes.value.filter((node) => hasCapability(node, NodeCapability.SettingsWrite)),
)







function openBatchConfig(): void {
  const ids = selectedNodes.value.map((node) => node.node_id)
  if (ids.length === 0) return

  void router.push({
    name: 'console-group-batch-config',
    params: { groupId: props.groupId },
    query: { nodes: ids.join(',') },
  })
}











async function loadNodes(options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true

  
  if (silent && loading.value) return

  if (!silent) {
    loading.value = true
    errorCode.value = null
  }

  try {
    nodes.value = await api.listNodes(props.groupId)
    errorCode.value = null
    
    pruneSelection()
  } catch (caught) {
    
    if (!silent) errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    if (!silent) loading.value = false
  }
}

const drawLockedCount = computed(() => nodes.value.filter((node) => node.draw_locked).length)





const onlineCount = computed(() => nodes.value.filter((node) => node.online).length)

watch(
  () => [props.groupId, nodes.value.length, onlineCount.value, drawLockedCount.value] as const,
  () =>
    emit('counts', {
      total: nodes.value.length,
      online: onlineCount.value,
      drawLocked: drawLockedCount.value,
    }),
  { immediate: true },
)



const onlineOnly = ref(false)

const lockedOnly = ref(false)

const filteredNodes = computed(() =>
  nodes.value.filter(
    (node) => (!onlineOnly.value || node.online) && (!lockedOnly.value || node.draw_locked),
  ),
)

const hasFilter = computed(() => onlineOnly.value || lockedOnly.value)

function clearFilters(): void {
  onlineOnly.value = false
  lockedOnly.value = false
}








const selectedIds = ref<Set<string>>(new Set())


const selectedNodes = computed(() => nodes.value.filter((node) => selectedIds.value.has(node.node_id)))
const actionableSelected = computed(() => selectedNodes.value.filter(isLockable))

const mediaSelected = computed(() => selectedNodes.value.filter(isMediaCapable))


const allFilteredSelected = computed(
  () =>
    filteredNodes.value.length > 0 &&
    filteredNodes.value.every((node) => selectedIds.value.has(node.node_id)),
)


function toggleSelected(nodeId: string, checked: boolean): void {
  const next = new Set(selectedIds.value)
  if (checked) next.add(nodeId)
  else next.delete(nodeId)
  selectedIds.value = next
}


function toggleSelectAll(checked: boolean): void {
  const next = new Set(selectedIds.value)
  for (const node of filteredNodes.value) {
    if (checked && isLockable(node)) next.add(node.node_id)
    else if (!checked) next.delete(node.node_id)
  }
  selectedIds.value = next
}

function clearSelection(): void {
  selectedIds.value = new Set()
}


function pruneSelection(): void {
  if (selectedIds.value.size === 0) return
  const alive = new Set(nodes.value.map((node) => node.node_id))
  const next = new Set([...selectedIds.value].filter((id) => alive.has(id)))
  if (next.size !== selectedIds.value.size) selectedIds.value = next
}













interface NodeActionResult {
  kind: 'ok' | 'partial' | 'fail'
  succeeded: number
  failed: number
  failedIds: string[]
  code: string | undefined
}

const result = ref<NodeActionResult | null>(null)









interface RowFeedback {
  kind: 'ok' | 'fail'
  code: string | undefined
  command: NodeCommandDto | null
}

const rowFeedback = ref<Record<string, RowFeedback>>({})


const rowFeedbackText = computed<Record<string, { kind: 'ok' | 'fail'; text: string }>>(() => {
  const entries: Record<string, { kind: 'ok' | 'fail'; text: string }> = {}
  for (const [nodeId, item] of Object.entries(rowFeedback.value)) {
    entries[nodeId] = {
      kind: item.kind,
      text:
        item.kind === 'ok'
          ? t('group.rowOk')
          : t('group.rowFailed', { reason: errorText(item.code ?? 'unknown') }),
    }
  }
  return entries
})












const capabilityText = useCapabilityLabel((key) => tm(key))







function feedbackText(view: CommandFeedbackView): string {
  const params: Record<string, string | number> = { ...view.params }
  if (view.capability !== null && 'capability' in params) {
    params['capability'] = capabilityText(view.capability)
  }
  return t(view.messageKey, params)
}


const rowFeedbackViews = computed<Record<string, { text: string; rawContext: string | null }>>(
  () => {
    const entries: Record<string, { text: string; rawContext: string | null }> = {}
    for (const [nodeId, item] of Object.entries(rowFeedback.value)) {
      const view = describeCommandFeedback(item.command)
      if (view !== null) entries[nodeId] = { text: feedbackText(view), rawContext: view.rawContext }
    }
    return entries
  },
)


const resultFeedback = ref<CommandFeedbackView | null>(null)

function firstFeedback(commands: NodeCommandDto[]): CommandFeedbackView | null {
  for (const item of commands) {
    const view = describeCommandFeedback(item)
    if (view !== null) return view
  }
  return null
}


const busyIds = ref<Set<string>>(new Set())

const isBusy = computed(() => busyIds.value.size > 0)

function setBusy(nodeIds: string[], busy: boolean): void {
  const next = new Set(busyIds.value)
  for (const id of nodeIds) {
    if (busy) next.add(id)
    else next.delete(id)
  }
  busyIds.value = next
}

function errorText(code: string): string {
  const key = `errors.${code}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
}










const expandedId = ref<string | null>(null)

function toggleExpanded(nodeId: string): void {
  expandedId.value = expandedId.value === nodeId ? null : nodeId
}














async function fanOut(
  nodeIds: string[],
  run: (nodeId: string) => Promise<unknown>,
): Promise<NodeActionResult> {
  const settled = await Promise.allSettled(nodeIds.map((nodeId) => run(nodeId)))

  const failedIds = nodeIds.filter((_, index) => settled[index]!.status === 'rejected')
  const succeeded = nodeIds.length - failedIds.length
  const code = firstReason(settled.find((item) => item.status === 'rejected'))

  if (failedIds.length === 0) return { kind: 'ok', succeeded, failed: 0, failedIds, code: undefined }
  if (succeeded === 0) return { kind: 'fail', succeeded: 0, failed: failedIds.length, failedIds, code }
  return { kind: 'partial', succeeded, failed: failedIds.length, failedIds, code }
}

function firstReason(settled: PromiseSettledResult<unknown> | undefined): string | undefined {
  if (settled === undefined || settled.status !== 'rejected') return undefined
  return settled.reason instanceof ApiError ? settled.reason.code : 'network_error'
}


function applyRowOutcome(
  nodeId: string,
  outcome: NodeActionResult,
  command: NodeCommandDto | null = null,
): void {
  result.value = outcome
  rowFeedback.value = {
    ...rowFeedback.value,
    [nodeId]: {
      kind: outcome.kind === 'ok' ? 'ok' : 'fail',
      code: outcome.code,
      command,
    },
  }
}


async function setDrawLock(nodeIds: string[], drawLocked: boolean): Promise<void> {
  if (nodeIds.length === 0 || isBusy.value) return

  setBusy(nodeIds, true)
  result.value = null
  resultFeedback.value = null
  try {
    
    
    const outcome = await fanOut(nodeIds, (nodeId) =>
      api.setDrawLock(props.groupId, nodeId, drawLocked),
    )

    
    
    const failed = new Set(outcome.failedIds)
    nodes.value = nodes.value.map((node) =>
      failed.has(node.node_id) ? node : { ...node, draw_locked: drawLocked },
    )

    
    if (nodeIds.length === 1) applyRowOutcome(nodeIds[0]!, outcome)
    else result.value = outcome
  } finally {
    setBusy(nodeIds, false)
  }

  
  await loadNodes()
}











async function removeNode(node: NodeView): Promise<void> {
  if (!window.confirm(t('group.removeNodeConfirm'))) return

  setBusy([node.node_id], true)
  result.value = null
  resultFeedback.value = null
  try {
    await api.removeNode(props.groupId, node.node_id)
    applyRowOutcome(node.node_id, {
      kind: 'ok',
      succeeded: 1,
      failed: 0,
      failedIds: [],
      code: undefined,
    })
    if (expandedId.value === node.node_id) expandedId.value = null
    await loadNodes()
  } catch (caught) {
    applyRowOutcome(node.node_id, {
      kind: 'fail',
      succeeded: 0,
      failed: 1,
      failedIds: [node.node_id],
      code: caught instanceof ApiError ? caught.code : 'network_error',
    })
  } finally {
    setBusy([node.node_id], false)
  }
}









async function runBatch(drawLocked: boolean): Promise<void> {
  const targets = actionableSelected.value.map((node) => node.node_id)
  if (targets.length === 0 || isBusy.value) return

  await setDrawLock(targets, drawLocked)
}




const MAX_ANNOUNCE_LENGTH = 200

const announceOpen = ref(false)
const announceText = ref('')

const trimmedAnnounce = computed(() => announceText.value.trim())


const canBatchAnnounce = computed(() => mediaSelected.value.length > 0)


const skippedMediaCount = computed(() => selectedNodes.value.length - mediaSelected.value.length)







async function runBatchAnnounce(): Promise<void> {
  const text = trimmedAnnounce.value
  const targets = mediaSelected.value.map((node) => node.node_id)
  if (text.length === 0 || text.length > MAX_ANNOUNCE_LENGTH) return
  if (targets.length === 0 || isBusy.value) return

  setBusy(targets, true)
  result.value = null
  resultFeedback.value = null
  const issued: NodeCommandDto[] = []
  try {
    result.value = await fanOut(targets, async (nodeId) => {
      const command = await api.playMedia(props.groupId, nodeId, 'announce', text)
      issued.push(command)
      return command
    })
    
    resultFeedback.value = firstFeedback(issued)
  } finally {
    setBusy(targets, false)
  }

  await loadNodes()
}






async function runBatchRemove(): Promise<void> {
  const targets = selectedNodes.value.map((node) => node.node_id)
  if (targets.length === 0 || isBusy.value) return
  if (!window.confirm(t('group.batchRemoveConfirm', { count: targets.length }))) return

  setBusy(targets, true)
  result.value = null
  resultFeedback.value = null
  try {
    result.value = await fanOut(targets, (nodeId) => api.removeNode(props.groupId, nodeId))
  } finally {
    setBusy(targets, false)
  }

  await loadNodes()
}


const skippedCount = computed(() => selectedNodes.value.length - actionableSelected.value.length)








function nodeDisplayName(node: NodeView): string {
  return node.display_name?.trim() ?? ''
}

function formatTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '—'
}













useAutoRefresh(() => loadNodes({ silent: true }), {
  intervalMs: props.refreshIntervalMs,
  canRefresh: () => !isBusy.value,
})







usePresenceEvents(() => props.groupId, () => loadNodes({ silent: true }), {
  canRefresh: () => !isBusy.value,
})

onMounted(loadNodes)








watch(
  () => props.groupId,
  () => {
    clearSelection()
    clearFilters()
    expandedId.value = null
    result.value = null
    resultFeedback.value = null
    rowFeedback.value = {}
    announceOpen.value = false
    announceText.value = ''
    void loadNodes()
  },
)

defineExpose({ reload: loadNodes })
</script>

<template>
  <div class="console-panel rounded-card border border-border-base bg-surface">
    
    <div class="flex flex-wrap items-center gap-2 border-b border-border-base px-4 py-3">
      <ConsoleIcon name="Monitor" class="icon text-text-faint" />
      <h2 class="text-[14px] font-semibold">{{ t('console.nodes') }}</h2>
      <span class="console-badge rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted">
        {{ nodes.length }}{{ t('group.units') }}
      </span>

      <button
        type="button"
        data-testid="nodes-refresh"
        class="console-btn press ml-auto inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3 disabled:opacity-45"
        :disabled="loading"
        @click="loadNodes()"
      >
        <LoaderCircle v-if="loading" class="icon animate-spin" />
        <ConsoleIcon v-else name="RefreshCw" class="icon" />
        {{ t('common.refresh') }}
      </button>
    </div>

    
    <div v-if="nodes.length === 0" class="px-4 py-8 text-center">
      <p class="text-[13px] text-text-muted">
        {{ loading ? t('common.loading') : t('group.noNodes') }}
      </p>
      <p
        v-if="!loading"
        class="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-text-faint"
      >
        {{ errorMessage ?? t('group.noNodesHint') }}
      </p>
    </div>

    <template v-else>
      
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-base px-4 py-2.5">
        
        <template v-if="canOperate">
          <label
            class="flex cursor-pointer items-center gap-1.5 text-[12px] text-text-muted"
            :class="isBusy ? 'opacity-60' : ''"
          >
            <input
              type="checkbox"
              data-testid="nodes-select-all"
              class="size-3.5 accent-brand"
              :checked="allFilteredSelected"
              :disabled="isBusy"
              @change="toggleSelectAll(($event.target as HTMLInputElement).checked)"
            />
            {{ t('group.selectAll') }}
          </label>

          <span class="h-4 w-px bg-border-base" />
        </template>

        <label class="flex cursor-pointer items-center gap-1.5 text-[12px] text-text-muted">
          <input
            v-model="onlineOnly"
            type="checkbox"
            data-testid="nodes-filter-online"
            class="size-3.5 accent-brand"
          />
          {{ t('group.filterOnline') }}
        </label>

        <label class="flex cursor-pointer items-center gap-1.5 text-[12px] text-text-muted">
          <input
            v-model="lockedOnly"
            type="checkbox"
            data-testid="nodes-filter-locked"
            class="size-3.5 accent-brand"
          />
          {{ t('group.filterLocked') }}
        </label>

        <button
          v-if="hasFilter"
          type="button"
          data-testid="nodes-filter-clear"
          class="console-btn press rounded-control border border-border-strong bg-surface-2 px-2 py-1 text-[11.5px] transition hover:bg-surface-3"
          @click="clearFilters"
        >
          {{ t('group.clearFilter') }}
        </button>

        
        <div
          v-if="canOperate && selectedIds.size > 0"
          data-testid="nodes-batch-bar"
          class="ml-auto flex flex-wrap items-center gap-2"
        >
          <span class="text-[12px] text-text-muted">
            {{ t('group.selected') }} {{ selectedIds.size }}
          </span>

          <button
            type="button"
            data-testid="nodes-batch-lock"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-warn/40 bg-warn/15 px-2.5 py-1.5 text-[12px] font-medium text-warn transition hover:bg-warn/25 disabled:opacity-45"
            :disabled="isBusy || actionableSelected.length === 0"
            @click="runBatch(true)"
          >
            <LoaderCircle v-if="isBusy" class="icon animate-spin" />
            <ConsoleIcon v-else name="Lock" class="icon" />
            {{ t('group.batchLock') }}
          </button>

          <button
            type="button"
            data-testid="nodes-batch-unlock"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3 disabled:opacity-45"
            :disabled="isBusy || actionableSelected.length === 0"
            @click="runBatch(false)"
          >
            <ConsoleIcon name="LockOpen" class="icon" />
            {{ t('group.batchUnlock') }}
          </button>

          
          <button
            type="button"
            data-testid="nodes-batch-announce"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3 disabled:opacity-45"
            :disabled="isBusy || !canBatchAnnounce"
            :title="canBatchAnnounce ? t('group.batchAnnounceHint') : t('group.skippedMediaNodes', { count: skippedMediaCount })"
            @click="announceOpen = !announceOpen"
          >
            <ConsoleIcon name="Megaphone" class="icon" />
            {{ t('group.batchAnnounce') }}
          </button>

          
          <button
            v-if="canConfigure"
            type="button"
            data-testid="nodes-batch-config"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3 disabled:opacity-45"
            :disabled="isBusy || settingsSelected.length === 0"
            :title="
              settingsSelected.length === 0
                ? t('group.batchConfigNoTargets', { count: selectedNodes.length })
                : t('group.batchConfigHint')
            "
            @click="openBatchConfig"
          >
            <ConsoleIcon name="Settings" class="icon" />
            {{ t('group.batchConfig') }}
          </button>

          
          <button
            v-if="canRemove"
            type="button"
            data-testid="nodes-batch-remove"
            class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/40 bg-danger/12 px-2.5 py-1.5 text-[12px] font-medium text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
            :disabled="isBusy"
            @click="runBatchRemove"
          >
            <ConsoleIcon name="Trash2" class="icon" />
            {{ t('group.batchRemove') }}
          </button>

          <button
            type="button"
            data-testid="nodes-batch-clear"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] transition hover:bg-surface-3"
            :disabled="isBusy"
            @click="clearSelection"
          >
            {{ t('group.clearSelection') }}
          </button>
        </div>
      </div>

      
      <div
        v-if="canOperate && announceOpen && selectedIds.size > 0"
        data-testid="nodes-batch-announce-panel"
        class="flex flex-wrap items-center gap-2 border-b border-border-base bg-surface-2 px-4 py-2.5"
      >
        <input
          v-model="announceText"
          type="text"
          data-testid="nodes-batch-announce-text"
          class="console-input min-w-0 flex-1 rounded-control border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] outline-none focus:border-brand"
          :maxlength="MAX_ANNOUNCE_LENGTH"
          :placeholder="t('group.batchAnnouncePlaceholder')"
          autocomplete="off"
        />
        <span class="text-[11px] text-text-faint">
          {{ announceText.length }}/{{ MAX_ANNOUNCE_LENGTH }}
        </span>
        <button
          type="button"
          data-testid="nodes-batch-announce-send"
          class="console-btn console-btn--accent press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
          :disabled="isBusy || trimmedAnnounce.length === 0 || !canBatchAnnounce"
          :title="t('group.batchAnnounceHint')"
          @click="runBatchAnnounce"
        >
          <LoaderCircle v-if="isBusy" class="icon animate-spin" />
          <ConsoleIcon v-else name="Megaphone" class="icon" />
          {{ t('group.batchAnnounceSend') }}
        </button>
      </div>

      
      <p
        v-if="canOperate && announceOpen && selectedIds.size > 0 && skippedMediaCount > 0"
        data-testid="nodes-skipped-media-hint"
        class="border-b border-border-base bg-surface-2 px-4 py-2 text-[11.5px] leading-relaxed text-text-faint"
      >
        {{ t('group.skippedMediaNodes', { count: skippedMediaCount }) }}
      </p>

      
      <p
        v-if="selectedIds.size > 0 && skippedCount > 0"
        data-testid="nodes-skipped-hint"
        class="border-b border-border-base bg-surface-2 px-4 py-2 text-[11.5px] leading-relaxed text-text-faint"
      >
        {{ t('group.skippedNodes', { count: skippedCount }) }}
      </p>

      
      <div
        v-if="result"
        data-testid="nodes-result"
        class="border-b border-border-base px-4 py-2 text-[12px] leading-relaxed"
        :class="
          result.kind === 'ok'
            ? 'bg-brand/10 text-brand-bright'
            : result.kind === 'partial'
              ? 'bg-warn/10 text-warn'
              : 'bg-danger/10 text-[#f5a9b0]'
        "
      >
        {{
          result.kind === 'ok'
            ? t('group.batchOk', { count: result.succeeded })
            : result.kind === 'partial'
              ? t('group.batchPartial', { ok: result.succeeded, failed: result.failed })
              : t('group.batchFailed', { count: result.failed })
        }}
        <span v-if="result.code" class="text-text-faint">（{{ errorText(result.code) }}）</span>
        
        <span
          v-if="result.failedIds.length > 0"
          data-testid="nodes-result-failed-ids"
          class="mt-0.5 block font-mono text-[11px] text-text-faint"
        >
          {{ t('group.batchFailedIds', { ids: result.failedIds.join('、') }) }}
        </span>
      </div>

      
      <div
        v-if="resultFeedback"
        data-testid="nodes-result-detail"
        class="border-b border-border-base bg-surface-2 px-4 py-2 text-[11.5px] leading-relaxed text-text-muted"
      >
        {{ feedbackText(resultFeedback) }}
        <details v-if="resultFeedback.rawContext" class="mt-1">
          <summary class="cursor-pointer text-[11px] text-text-faint">
            {{ t('nodeDetail.feedback.rawContextLabel') }}
          </summary>
          <pre
            class="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]"
          >{{ resultFeedback.rawContext }}</pre>
        </details>
      </div>

      
      <div v-if="filteredNodes.length === 0" class="px-4 py-8 text-center">
        <p class="text-[13px] text-text-muted">{{ t('group.noMatchingNodes') }}</p>
      </div>

      
      <ul v-else class="console-divide divide-y divide-border-base">
        <li
          v-for="node in filteredNodes"
          :key="node.node_id"
          :data-testid="`node-${node.node_id}`"
          class="console-list__row"
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <input
              v-if="canOperate"
              type="checkbox"
              class="size-3.5 shrink-0 accent-brand"
              :data-testid="`node-select-${node.node_id}`"
              :checked="selectedIds.has(node.node_id)"
              :disabled="isBusy"
              @change="toggleSelected(node.node_id, ($event.target as HTMLInputElement).checked)"
            />

            <span
              class="size-2 shrink-0 rounded-full"
              :class="[node.online ? 'bg-brand-bright' : 'bg-text-faint', canOperate ? '' : 'ml-1.5']"
              :title="node.online ? t('group.online') : t('group.offline')"
            />

            <div class="min-w-0">
              
              <p
                v-if="nodeDisplayName(node)"
                :data-testid="`node-name-${node.node_id}`"
                class="truncate text-[12.5px] font-medium"
              >
                {{ nodeDisplayName(node) }}
              </p>
              
              <RouterLink
                :to="{
                  name: 'console-node-detail',
                  params: { groupId: props.groupId, nodeId: node.node_id },
                }"
                :data-testid="`node-link-${node.node_id}`"
                :title="t('group.viewNodeDetail')"
                class="block truncate font-mono text-[12.5px] transition hover:text-brand-bright hover:underline"
                :class="nodeDisplayName(node) ? 'text-[11px] text-text-faint' : ''"
              >
                {{ node.node_id }}
              </RouterLink>
              <p class="mt-0.5 text-[11.5px] text-text-faint">
                {{ node.platform }} · {{ formatVersion(node.version) }}
              </p>
            </div>

            <span
              class="rounded-full bg-surface-3 px-2 py-0.5 text-[11px]"
              :class="node.online ? 'text-brand-bright' : 'text-text-faint'"
            >
              {{ node.online ? t('group.online') : t('group.offline') }}
            </span>

            
            <span
              v-if="node.draw_locked"
              data-testid="node-draw-locked"
              class="console-badge inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/15 px-2 py-0.5 text-[11px] text-warn"
            >
              <ConsoleIcon name="Lock" class="icon" />
              {{ t('group.drawLocked') }}
            </span>

            <span
              v-if="!node.local_remote_allowed"
              class="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted"
            >
              {{ t('group.localRemoteDisabled') }}
            </span>

            <div class="ml-auto flex flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                :data-testid="`node-expand-${node.node_id}`"
                class="console-btn press inline-flex items-center gap-1 rounded-control border border-border-strong bg-surface-2 px-2 py-1 text-[11.5px] transition hover:bg-surface-3"
                @click="toggleExpanded(node.node_id)"
              >
                <ConsoleIcon v-if="expandedId === node.node_id" name="ChevronDown" class="icon" />
                <ConsoleIcon v-else name="ChevronRight" class="icon" />
                {{ t('group.details') }}
              </button>
            </div>
          </div>

          
          <div
            v-if="expandedId === node.node_id"
            :data-testid="`node-detail-${node.node_id}`"
            class="border-t border-border-base bg-surface-2 px-4 py-3"
          >
            <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-[12px] sm:grid-cols-2">
              <div class="flex gap-2">
                <dt class="shrink-0 text-text-faint">{{ t('group.displayName') }}</dt>
                <dd class="text-text-muted">
                  <template v-if="nodeDisplayName(node)">{{ nodeDisplayName(node) }}</template>
                  <template v-else>{{ t('group.displayNameUnset') }}</template>
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-text-faint">{{ t('group.nodeIdLabel') }}</dt>
                <dd class="font-mono text-text-muted">
                  <RouterLink
                    :to="{
                      name: 'console-node-detail',
                      params: { groupId: props.groupId, nodeId: node.node_id },
                    }"
                    :data-testid="`node-open-detail-${node.node_id}`"
                    class="transition hover:text-brand-bright hover:underline"
                  >
                    {{ node.node_id }}
                  </RouterLink>
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-text-faint">{{ t('group.lastHeartbeat') }}</dt>
                <dd class="text-text-muted">{{ formatTime(node.last_heartbeat_at) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-text-faint">{{ t('group.registeredAt') }}</dt>
                <dd class="text-text-muted">{{ formatTime(node.registered_at) }}</dd>
              </div>
              <div class="flex gap-2">
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

            
            <div class="mt-3 flex flex-wrap items-center gap-2">
              
              <RouterLink
                :to="{
                  name: 'console-node-detail',
                  params: { groupId: props.groupId, nodeId: node.node_id },
                }"
                :data-testid="`node-open-detail-page-${node.node_id}`"
                class="console-btn press ml-auto inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3"
                :title="t('group.viewNodeDetail')"
              >
                <ConsoleIcon name="ArrowRight" class="icon" />
                {{ t('group.detailPage') }}
              </RouterLink>

              <button
                v-if="canRemove"
                type="button"
                :data-testid="`node-remove-${node.node_id}`"
                class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/40 bg-danger/12 px-2.5 py-1.5 text-[12px] font-medium text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
                :disabled="isBusy"
                :title="t('group.removeNodeHint')"
                @click="removeNode(node)"
              >
                <ConsoleIcon name="Trash2" class="icon" />
                {{ t('group.removeNode') }}
              </button>
            </div>

            
            <p
              v-if="rowFeedbackText[node.node_id]"
              :data-testid="`node-feedback-${node.node_id}`"
              class="mt-2 text-[11.5px]"
              :class="
                rowFeedbackText[node.node_id]?.kind === 'ok'
                  ? 'text-brand-bright'
                  : 'text-[#f5a9b0]'
              "
            >
              {{ rowFeedbackText[node.node_id]?.text }}
            </p>

            
            <div
              v-if="rowFeedbackViews[node.node_id]"
              :data-testid="`node-feedback-detail-${node.node_id}`"
              class="mt-1.5 rounded-control border border-border-base bg-surface px-2.5 py-2 text-[11.5px] leading-relaxed text-text-muted"
            >
              {{ rowFeedbackViews[node.node_id]?.text }}
              <details v-if="rowFeedbackViews[node.node_id]?.rawContext" class="mt-1">
                <summary class="cursor-pointer text-[11px] text-text-faint">
                  {{ t('nodeDetail.feedback.rawContextLabel') }}
                </summary>
                <pre
                  class="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]"
                >{{ rowFeedbackViews[node.node_id]?.rawContext }}</pre>
              </details>
            </div>
          </div>
        </li>
      </ul>
    </template>

    
    <div
      v-if="errorMessage && nodes.length > 0"
      data-testid="nodes-error"
      class="border-t border-border-base px-4 py-2.5 text-[12.5px] text-[#f5a9b0]"
    >
      {{ errorMessage }}
    </div>

    
    <p class="border-t border-border-base px-4 py-2.5 text-[11.5px] leading-relaxed text-text-faint">
      {{ t('group.nodeControlNote') }}
    </p>
  </div>
</template>
