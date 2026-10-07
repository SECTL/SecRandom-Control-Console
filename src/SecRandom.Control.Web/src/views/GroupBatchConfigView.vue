<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { api, ApiError } from '@/api/client'
import { NodeCapability, type NodeView } from '@/api/protocol'
import { CLIENT_SETTINGS_PAGES, isClientSettingContainer, type ClientSettingRow } from '@/data/client-settings-pages'
import {
  buildBatchConfigPlan,
  collectBatchConfigRows,
  type BatchConfigDraft,
  type BatchConfigProblem,
} from '@/utils/batch-config'
import { clientPageNavGroups, localizedSettingText } from '@/utils/client-settings-presenter'
import {
  describeCommandFeedback,
  type CommandFeedbackLine,
  type CommandFeedbackView,
} from '@/utils/command-feedback'
import { displayName } from '@/utils/display-name'
import { NODE_REFRESH_INTERVAL_MS, useAutoRefresh } from '@/composables/useAutoRefresh'
import { usePresenceEvents } from '@/composables/usePresenceEvents'
import { useSessionStore } from '@/stores/session'
import { useCapabilityLabel } from '@/i18n'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import FluentIcon from '@/components/client/fluent/FluentIcon.vue'
import ClientPageNav from '@/components/client/fluent/ClientPageNav.vue'
import ClientBatchSettingRow from '@/components/client/fluent/ClientBatchSettingRow.vue'
import '@/assets/client-theme.css'
















const props = defineProps<{
  groupId: string
  
  nodes: string
}>()

const { t, tm, locale } = useI18n()
const session = useSessionStore()


const capabilityText = useCapabilityLabel((key) => tm(key))


const group = computed(
  () => session.groups.find((item) => item.group_id === props.groupId) ?? null,
)





const canConfigure = computed(() => session.canIn(props.groupId, 'admin'))



const nodes = ref<NodeView[]>([])
const nodesError = ref<string | null>(null)







const nodesLoading = ref(true)








const selectedIds = computed(() => [
  ...new Set(
    props.nodes
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  ),
])

const nodesById = computed(() => new Map(nodes.value.map((node) => [node.node_id, node])))


const selectedNodes = computed(() =>
  selectedIds.value
    .map((id) => nodesById.value.get(id))
    .filter((node): node is NodeView => node !== undefined),
)


const unknownIds = computed(() => selectedIds.value.filter((id) => !nodesById.value.has(id)))

function supportsSettings(node: NodeView): boolean {
  return node.capabilities.includes(NodeCapability.SettingsWrite)
}








const targets = computed(() => selectedNodes.value.filter(supportsSettings))
const skippedUnsupported = computed(() => selectedNodes.value.length - targets.value.length)

const offlineTargets = computed(() => targets.value.filter((node) => !node.online))

function nodeName(node: NodeView): string {
  return node.display_name?.trim() ?? ''
}

function nodeLabel(node: NodeView): string {
  return displayName(node.display_name, node.node_id)
}








async function loadNodes(options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true
  
  if (silent && nodesLoading.value) return

  if (!silent) {
    nodesLoading.value = true
    nodesError.value = null
  }

  




  const requested = props.groupId

  try {
    const list = await api.listNodes(requested)
    if (requested !== props.groupId) return
    nodes.value = list
    if (!silent) nodesError.value = null
  } catch (caught) {
    if (requested !== props.groupId) return
    if (!silent) nodesError.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    if (!silent && requested === props.groupId) nodesLoading.value = false
  }
}

onMounted(() => void loadNodes())







useAutoRefresh(() => loadNodes({ silent: true }), {
  intervalMs: NODE_REFRESH_INTERVAL_MS,
  canRefresh: () => !pushing.value,
})
usePresenceEvents(() => props.groupId, () => loadNodes({ silent: true }), {
  canRefresh: () => !pushing.value,
})




const rows = collectBatchConfigRows()
const rowsByPath = computed(() => new Map(rows.map((row) => [row.path, row])))







const drafts = ref<Record<string, BatchConfigDraft>>({})


const hasDrafts = computed(() => Object.keys(drafts.value).length > 0)







function setValue(path: string, value: string | number | boolean): void {
  const row = rowsByPath.value.get(path)
  const current = drafts.value[path]
  
  const cleared =
    value === '' && row !== undefined && (row.control === 'text' || row.control === 'hotkey')

  drafts.value = {
    ...drafts.value,
    [path]: { include: current?.include ?? false, value, cleared },
  }
}

function setInclude(path: string, include: boolean): void {
  const current = drafts.value[path]
  drafts.value = {
    ...drafts.value,
    [path]: { include, value: current?.value ?? '', cleared: current?.cleared ?? false },
  }
}

function clearDrafts(): void {
  drafts.value = {}
}


const plan = computed(() => buildBatchConfigPlan(rows, drafts.value))

const pushing = ref(false)








const canSubmit = computed(
  () =>
    canConfigure.value &&
    targets.value.length > 0 &&
    plan.value.included > 0 &&
    plan.value.problems.length === 0 &&
    !pushing.value,
)



interface SummaryItem {
  path: string
  title: string
  value: string
}







const summary = computed<readonly SummaryItem[]>(() =>
  Object.entries(plan.value.patch).map(([path, value]) => ({
    path,
    title: titleOfPath(path),
    value: valueText(value),
  })),
)


function titleOfPath(path: string): string {
  const row = rowsByPath.value.get(path)
  return row === undefined ? path : localizedSettingText(row.labels, locale.value, path)
}

function valueText(value: unknown): string {
  if (typeof value === 'boolean') return value ? t('batchConfig.on') : t('batchConfig.off')
  
  if (value === '') return t('batchConfig.emptyValue')
  return String(value)
}

function problemText(problem: BatchConfigProblem): string {
  const path = titleOfPath(problem.path)
  if (problem.kind === 'notNumber') return t('batchConfig.problemNotNumber', { path })
  if (problem.kind === 'notOption') {
    return t('batchConfig.problemNotOption', { path, options: problem.options.join('、') })
  }
  return t('batchConfig.problemMissing', { path })
}


function errorText(code: string): string {
  const key = `errors.${code}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
}

interface BatchNotice {
  tone: 'info' | 'warn' | 'ok' | 'fail'
  text: string
  testId: string
}





const notices = computed<readonly BatchNotice[]>(() => {
  const list: BatchNotice[] = []

  if (!canConfigure.value) {
    list.push({
      tone: 'warn',
      text: t('batchConfig.adminRequired'),
      testId: 'batch-config-admin-required',
    })
  }

  if (nodesError.value !== null) {
    list.push({
      tone: 'fail',
      text: t('batchConfig.nodesFailed', { reason: errorText(nodesError.value) }),
      testId: 'batch-config-nodes-error',
    })
  }

  
  if (!nodesLoading.value && selectedIds.value.length > 0 && targets.value.length === 0) {
    list.push({
      tone: 'warn',
      text: t('batchConfig.noTargets'),
      testId: 'batch-config-no-targets',
    })
  }

  
  if (plan.value.problems.length > 0) {
    list.push({
      tone: 'fail',
      text: plan.value.problems.map((problem) => problemText(problem)).join('；'),
      testId: 'batch-config-problems',
    })
  }

  
  if (canConfigure.value && plan.value.included > 0 && plan.value.problems.length === 0) {
    list.push({
      tone: 'ok',
      text: t('batchConfig.ready', { count: plan.value.included }),
      testId: 'batch-config-ready',
    })
  }

  
  list.push({
    tone: 'info',
    text: t('batchConfig.note'),
    testId: 'batch-config-note',
  })

  if (plan.value.readonlyCount > 0) {
    list.push({
      tone: 'info',
      text: t('batchConfig.readonlyNote', { count: plan.value.readonlyCount }),
      testId: 'batch-config-readonly',
    })
  }

  return list
})



const activePageId = ref(CLIENT_SETTINGS_PAGES[0]?.id ?? '')
const navGroups = computed(() => clientPageNavGroups(CLIENT_SETTINGS_PAGES, (key) => t(key)))
const activePage = computed(() =>
  CLIENT_SETTINGS_PAGES.find((page) => page.id === activePageId.value),
)


function rowKey(row: ClientSettingRow): string {
  return isClientSettingContainer(row) ? `container:${row.id}` : row.path
}



interface PushOutcome {
  nodeId: string
  label: string
  ok: boolean
  
  code: string | undefined
  
  feedback: CommandFeedbackView | null
}

const outcomes = ref<readonly PushOutcome[]>([])

const pushedItems = ref(0)

const failedOutcomes = computed(() => outcomes.value.filter((item) => !item.ok))
const okCount = computed(() => outcomes.value.length - failedOutcomes.value.length)
const failedIds = computed(() => failedOutcomes.value.map((item) => item.nodeId))

const resultText = computed(() => {
  if (outcomes.value.length === 0) return ''
  if (failedOutcomes.value.length === 0) return t('group.batchOk', { count: okCount.value })
  if (okCount.value === 0) return t('group.batchFailed', { count: failedOutcomes.value.length })
  return t('group.batchPartial', { ok: okCount.value, failed: failedOutcomes.value.length })
})





function feedbackText(view: CommandFeedbackView): string {
  const params: Record<string, string | number> = { ...view.params }
  if (view.capability !== null && 'capability' in params) {
    params['capability'] = capabilityText(view.capability)
  }
  return t(view.messageKey, params)
}

function lineText(line: CommandFeedbackLine): string {
  return t(line.key, { ...line.params })
}











async function submit(): Promise<void> {
  if (!canSubmit.value) return

  const patch = plan.value.patch
  const items = plan.value.included
  const currentTargets = targets.value
  if (!window.confirm(t('batchConfig.confirm', { count: currentTargets.length, items }))) return

  pushing.value = true
  outcomes.value = []
  pushedItems.value = items
  try {
    const settled = await Promise.allSettled(
      currentTargets.map((node) => api.patchSettings(props.groupId, node.node_id, patch)),
    )

    outcomes.value = settled.map((item, index) => {
      const node = currentTargets[index]
      const nodeId = node?.node_id ?? ''
      const label = node === undefined ? nodeId : nodeLabel(node)

      if (item.status === 'fulfilled') {
        return {
          nodeId,
          label,
          ok: true,
          code: undefined,
          feedback: describeCommandFeedback(item.value),
        }
      }
      return {
        nodeId,
        label,
        ok: false,
        code: item.reason instanceof ApiError ? item.reason.code : 'network_error',
        feedback: null,
      }
    })
  } finally {
    pushing.value = false
  }

  




  if (outcomes.value.length > 0 && outcomes.value.every((item) => item.ok)) {
    clearDrafts()
  }
}



watch(
  () => props.groupId,
  () => {
    clearDrafts()
    outcomes.value = []
    pushedItems.value = 0
    void loadNodes()
  },
)
</script>

<template>
  <div class="console-page mx-auto flex w-full max-w-(--cn-console-page-max-width) flex-1 flex-col gap-4 p-5">
    
    <div
      v-if="!group && session.loaded"
      data-testid="batch-config-group-missing"
      class="console-card rounded-card border border-border-base bg-surface px-5 py-6"
    >
      <h2 class="text-[15px] font-semibold">{{ t('console.groupNotFound') }}</h2>
      <p class="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">
        {{ t('console.groupNotFoundDesc') }}
      </p>
      <p class="mt-2 font-mono text-[11.5px] text-text-faint">{{ groupId }}</p>
    </div>

    <template v-else-if="group">
      <div class="reveal" data-reveal>
        <RouterLink
          :to="{ name: 'console-group-detail', params: { groupId: props.groupId } }"
          data-testid="batch-config-back"
          class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3"
        >
          <ConsoleIcon name="ArrowLeft" class="icon" />
          {{ t('batchConfig.backToGroup') }}
        </RouterLink>

        <h1 class="console-page__title mt-2.5 text-[19px] font-semibold tracking-wide">
          {{ t('batchConfig.title') }}
        </h1>
        <p class="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-text-muted">
          {{ t('batchConfig.subtitle') }}
        </p>
      </div>

      
      <div
        data-testid="batch-config-targets"
        class="console-card rounded-card border border-border-base bg-surface px-4 py-3.5"
      >
        <div class="flex flex-wrap items-center gap-2">
          <ConsoleIcon name="Monitor" class="icon text-text-faint" />
          <h2 class="text-[13.5px] font-semibold">{{ t('batchConfig.targetsTitle') }}</h2>
          <span
            v-if="!nodesLoading"
            class="console-badge rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted"
          >
            {{ targets.length }}{{ t('group.units') }}
          </span>
          <span v-else class="text-[11.5px] text-text-faint">{{ t('common.loading') }}</span>
          <span v-if="!nodesLoading && skippedUnsupported > 0" class="text-[11.5px] text-warn">
            {{ t('batchConfig.skippedUnsupported', { count: skippedUnsupported }) }}
          </span>
        </div>

        <ul v-if="targets.length > 0" class="mt-2.5 flex flex-wrap gap-1.5">
          <li
            v-for="node in targets"
            :key="node.node_id"
            :data-testid="`batch-config-target-${node.node_id}`"
            class="flex items-center gap-1.5 rounded-full border border-border-base bg-surface-2 px-2.5 py-1 text-[11.5px]"
          >
            <span
              class="size-1.5 rounded-full"
              :class="node.online ? 'bg-brand-bright' : 'bg-text-faint'"
            />
            
            <span v-if="nodeName(node)" class="font-medium">{{ nodeName(node) }}</span>
            <span class="font-mono text-[11px] text-text-faint">{{ node.node_id }}</span>
          </li>
        </ul>

        <p
          v-if="!nodesLoading && unknownIds.length > 0"
          data-testid="batch-config-unknown-nodes"
          class="mt-2 text-[11.5px] leading-relaxed text-text-faint"
        >
          {{ t('batchConfig.skippedUnknown', { count: unknownIds.length }) }}
        </p>

        
        <p
          v-if="!nodesLoading && offlineTargets.length > 0"
          data-testid="batch-config-offline-hint"
          class="mt-2 text-[11.5px] leading-relaxed text-warn"
        >
          {{ t('batchConfig.offlineHint', { count: offlineTargets.length }) }}
        </p>
      </div>

      
      <div
        v-if="selectedIds.length === 0"
        data-testid="batch-config-empty"
        class="console-card rounded-card border border-border-base bg-surface px-4 py-4"
      >
        <h2 class="text-[13.5px] font-semibold">{{ t('batchConfig.emptySelection') }}</h2>
        <p class="mt-1.5 text-[12px] leading-relaxed text-text-muted">
          {{ t('batchConfig.emptySelectionHint') }}
        </p>
      </div>

      
      <div v-else class="client-ui rounded-card border border-border-base bg-surface p-3">
        <div class="cn-panel" data-testid="batch-config-panel">
          <ClientPageNav
            :groups="navGroups"
            :selected="activePageId"
            :label="t('nodeDetail.client.navLabel')"
            @select="activePageId = $event"
          />

          <div class="cn-panel__content">
            <h2 class="cn-page-title" data-testid="batch-config-page-title">
              {{ activePage?.title ?? '' }}
            </h2>

            
            <div class="cn-actionbar mx-[12px]">
              <button
                type="button"
                class="cn-btn cn-btn--accent"
                data-testid="batch-config-submit"
                :disabled="!canSubmit"
                @click="submit"
              >
                <FluentIcon name="checkmark" />
                <span>
                  {{
                    pushing
                      ? t('batchConfig.submitting')
                      : t('batchConfig.submit', { count: targets.length })
                  }}
                </span>
              </button>

              <button
                type="button"
                class="cn-btn"
                data-testid="batch-config-clear"
                :disabled="pushing || !hasDrafts"
                @click="clearDrafts"
              >
                <span>{{ t('batchConfig.clear') }}</span>
              </button>

              <span class="cn-actionbar__count" data-testid="batch-config-count">
                {{
                  plan.included > 0
                    ? t('batchConfig.pending', { count: plan.included })
                    : t('batchConfig.none')
                }}
              </span>
            </div>

            <div class="cn-page-scroll">
              <div class="cn-page">
                <ul
                  v-if="notices.length > 0"
                  class="cn-notices"
                  data-testid="batch-config-notices"
                >
                  <li
                    v-for="notice in notices"
                    :key="notice.testId"
                    class="cn-note"
                    :class="`cn-note--${notice.tone}`"
                    :data-testid="notice.testId"
                  >
                    {{ notice.text }}
                  </li>
                </ul>

                
                <section class="cn-section" data-testid="batch-config-summary">
                  <h2 class="cn-section__head">
                    <FluentIcon name="checkmark" :size="18" />
                    <span>{{ t('batchConfig.summaryTitle') }}</span>
                  </h2>

                  <ul v-if="summary.length > 0" class="cn-batch-summary">
                    <li
                      v-for="item in summary"
                      :key="item.path"
                      class="cn-batch-summary__item"
                      :data-testid="`batch-summary-${item.path}`"
                    >
                      <span class="cn-batch-summary__title">{{ item.title }}</span>
                      <span class="cn-batch-summary__path">{{ item.path }}</span>
                      <span class="cn-batch-summary__value">= {{ item.value }}</span>
                    </li>
                  </ul>
                  <p v-else class="cn-note cn-note--info" data-testid="batch-config-summary-empty">
                    {{ t('batchConfig.summaryEmpty') }}
                  </p>
                </section>

                
                <template v-for="(section, index) in activePage?.sections ?? []" :key="section.id">
                  <hr v-if="index > 0" class="cn-separator" />

                  <section class="cn-section">
                    <h2 class="cn-section__head" :data-testid="`batch-section-${section.id}`">
                      <FluentIcon v-if="section.icon" :name="section.icon" :size="18" />
                      <span>{{ section.title }}</span>
                    </h2>

                    <div class="cn-section__rows">
                      <ClientBatchSettingRow
                        v-for="row in section.rows"
                        :key="rowKey(row)"
                        :row="row"
                        :drafts="drafts"
                        :locked="!canConfigure"
                        @update-value="setValue"
                        @update-include="setInclude"
                      />
                    </div>
                  </section>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div
        v-if="outcomes.length > 0"
        data-testid="batch-config-result"
        class="console-card rounded-card border border-border-base bg-surface"
      >
        <div class="flex flex-wrap items-center gap-2 border-b border-border-base px-4 py-3">
          <ConsoleIcon name="Check" class="icon text-text-faint" />
          <h2 class="text-[13.5px] font-semibold">{{ t('batchConfig.resultTitle') }}</h2>
          <span
            class="console-badge rounded-full px-2 py-0.5 text-[11px]"
            :class="
              failedOutcomes.length === 0
                ? 'bg-brand/15 text-brand-bright'
                : okCount > 0
                  ? 'bg-warn/15 text-warn'
                  : 'bg-danger/12 text-[#f5a9b0]'
            "
            data-testid="batch-config-result-summary"
          >
            {{ resultText }}
          </span>
          <span class="text-[11.5px] text-text-faint">
            {{ t('batchConfig.resultItems', { items: pushedItems }) }}
          </span>
        </div>

        <p
          v-if="failedIds.length > 0"
          data-testid="batch-config-result-failed-ids"
          class="border-b border-border-base px-4 py-2 font-mono text-[11px] text-text-faint"
        >
          {{ t('group.batchFailedIds', { ids: failedIds.join('、') }) }}
        </p>

        <ul class="divide-y divide-border-base">
          <li
            v-for="row in outcomes"
            :key="row.nodeId"
            :data-testid="`batch-config-result-${row.nodeId}`"
            class="px-4 py-2.5"
          >
            <div class="flex flex-wrap items-center gap-2 text-[12px]">
              <span :class="row.ok ? 'text-brand-bright' : 'text-[#f5a9b0]'">
                {{
                  row.ok
                    ? t('group.rowOk')
                    : t('group.rowFailed', {
                        reason: row.code === undefined ? t('errors.unknown') : errorText(row.code),
                      })
                }}
              </span>
              <span v-if="row.label !== row.nodeId" class="text-text-muted">{{ row.label }}</span>
              <span class="font-mono text-[11px] text-text-faint">{{ row.nodeId }}</span>
            </div>

            <div
              v-if="row.feedback"
              class="mt-1 text-[11.5px] leading-relaxed text-text-muted"
            >
              {{ feedbackText(row.feedback) }}
              <p v-for="line in row.feedback.lines" :key="line.key" class="mt-0.5">
                {{ lineText(line) }}
              </p>
              <details v-if="row.feedback.rawContext" class="mt-1">
                <summary class="cursor-pointer text-[11px] text-text-faint">
                  {{ t('nodeDetail.feedback.rawContextLabel') }}
                </summary>
                <pre
                  class="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]"
                >{{ row.feedback.rawContext }}</pre>
              </details>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <div v-else class="text-[13px] text-text-muted">{{ t('common.loading') }}</div>
  </div>
</template>
