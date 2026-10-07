<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LoaderCircle } from '@lucide/vue'
import { api, ApiError, type AuditQuery } from '@/api/client'
import type { AuditEventDto, AuditFacetsDto } from '@/api/protocol'
import { displayName } from '@/utils/display-name'
import {
  describeAuditAction,
  describeAuditDetail,
  describeAuditOutcome,
  describeAuditTarget,
  type AuditDetailView,
  type AuditTargetView,
  type AuditTranslator,
} from '@/utils/audit-detail'
import { auditCsvFileName, toAuditCsv } from '@/utils/audit-export'
import { pageCount, pageWindow } from '@/utils/pager'
import ClientSelect from '@/components/client/fluent/ClientSelect.vue'
import ConsoleIcon from '@/components/ConsoleIcon.vue'

const props = defineProps<{ groupId: string; groupName?: string | null }>()

const { t, te, tm } = useI18n()










const auditText: AuditTranslator = {
  t: (key, params) => (params === undefined ? t(key) : t(key, params)),
  te: (key) => te(key),
  tm: (key) => tm(key),
}

const PAGE_SIZE = 50









const EXPORT_MAX_ROWS = 5000









const EXPORT_PAGE_SIZE = 500

const events = ref<AuditEventDto[]>([])
const loading = ref(false)
const errorCode = ref<string | null>(null)

const errorMessage = computed(() => {
  if (!errorCode.value) return null
  const key = `errors.${errorCode.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})

function outcomeClass(outcome: string): string {
  if (outcome === 'success') return 'border-brand/35 bg-brand/15 text-brand-bright'
  if (outcome === 'denied') return 'border-warn/35 bg-warn/15 text-warn'
  return 'border-danger/35 bg-danger/15 text-[#f5a9b0]'
}







function actorName(event: AuditEventDto): string {
  return displayName(event.actor_display_name, event.actor_user_id ?? '—')
}








function targetFor(event: AuditEventDto): AuditTargetView | null {
  return describeAuditTarget(event)
}







function detailFor(event: AuditEventDto): AuditDetailView | null {
  return describeAuditDetail(event, auditText)
}








interface AuditRow {
  event: AuditEventDto
  target: AuditTargetView | null
  detail: AuditDetailView | null
  actionLabel: string
  outcomeLabel: string
}

const rows = computed<AuditRow[]>(() =>
  events.value.map((event) => ({
    event,
    target: targetFor(event),
    detail: detailFor(event),
    
    
    actionLabel: describeAuditAction(event.action, auditText),
    outcomeLabel: describeAuditOutcome(event.outcome, auditText),
  })),
)



type AuditRange = 'all' | 'today' | '7d' | '30d'







const filterKind = ref('')
const filterOutcome = ref('')
const filterRange = ref<AuditRange>('all')

const filterActorDevice = ref('')

const filterTargetNode = ref('')

const filterActor = ref('')

const kindOptions = computed(() => [
  { value: '', label: t('audit.filterAll') },
  { value: 'group', label: t('audit.filterGroup') },
  { value: 'member', label: t('audit.targetMember') },
  { value: 'node', label: t('audit.targetNode') },
  { value: 'invite', label: t('audit.targetInvite') },
  { value: 'transfer', label: t('audit.targetTransfer') },
])

const outcomeOptions = computed(() => [
  { value: '', label: t('audit.filterAll') },
  { value: 'success', label: t('audit.outcomeSuccess') },
  { value: 'denied', label: t('audit.outcomeDenied') },
  { value: 'failed', label: t('audit.outcomeFailed') },
])

const rangeOptions = computed(() => [
  { value: 'all', label: t('audit.rangeAll') },
  { value: 'today', label: t('audit.rangeToday') },
  { value: '7d', label: t('audit.range7d') },
  { value: '30d', label: t('audit.range30d') },
])

const hasFilter = computed(
  () =>
    filterKind.value !== '' ||
    filterOutcome.value !== '' ||
    filterRange.value !== 'all' ||
    filterActorDevice.value !== '' ||
    filterTargetNode.value !== '' ||
    filterActor.value !== '',
)












const facets = ref<AuditFacetsDto | null>(null)

async function loadFacets(): Promise<void> {
  try {
    facets.value = await api.auditFacets(props.groupId)
  } catch {
    facets.value = null
  }
}








function sourceLabel(deviceId: string): string {
  const prefix = deviceId.split(':')[0]
  if (prefix === 'web') return `${t('audit.sourceWeb')} · ${deviceId}`
  if (prefix === 'app') return `${t('audit.sourceApp')} · ${deviceId}`
  return deviceId
}


function withCount(label: string, count: number): string {
  return `${label}（${count}）`
}

const actorDeviceOptions = computed(() => [
  { value: '', label: t('audit.filterAll') },
  ...(facets.value?.actor_devices?.items ?? []).map((item) => ({
    value: item.device_id,
    label: withCount(sourceLabel(item.device_id), item.count),
  })),
])

const targetNodeOptions = computed(() => [
  { value: '', label: t('audit.filterAll') },
  ...(facets.value?.target_nodes?.items ?? []).map((item) => ({
    value: item.node_id,
    label: withCount(displayName(item.display_name, item.node_id), item.count),
  })),
])

const actorOptions = computed(() => [
  { value: '', label: t('audit.filterAll') },
  ...(facets.value?.actors?.items ?? []).map((item) => ({
    value: item.user_id,
    label: withCount(displayName(item.display_name, item.user_id), item.count),
  })),
])


const facetsTruncated = computed(
  () =>
    facets.value?.actor_devices?.truncated === true ||
    facets.value?.target_nodes?.truncated === true ||
    facets.value?.actors?.truncated === true,
)








function rangeStart(range: AuditRange): string | undefined {
  if (range === 'all') return undefined
  if (range === 'today') {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  }
  const days = range === '7d' ? 7 : 30
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}


function auditQuery(extra: AuditQuery = {}): AuditQuery {
  const from = rangeStart(filterRange.value)

  return {
    ...(from === undefined ? {} : { from }),
    ...(filterKind.value === '' ? {} : { actionPrefix: filterKind.value }),
    ...(filterOutcome.value === '' ? {} : { outcome: filterOutcome.value }),
    ...(filterActorDevice.value === '' ? {} : { actorDevice: filterActorDevice.value }),
    ...(filterTargetNode.value === '' ? {} : { targetId: filterTargetNode.value }),
    ...(filterActor.value === '' ? {} : { actor: filterActor.value }),
    ...extra,
  }
}




const page = ref(1)

const total = ref(0)

const pages = computed(() => pageCount(total.value, PAGE_SIZE))
const pageItems = computed(() => pageWindow(page.value, pages.value))

const panel = useTemplateRef<HTMLElement>('auditPanel')







let loadToken = 0

async function load(): Promise<void> {
  const token = (loadToken += 1)
  loading.value = true
  errorCode.value = null

  try {
    const result = await api.listAudit(
      props.groupId,
      auditQuery({ limit: PAGE_SIZE, page: page.value }),
    )
    if (token !== loadToken) return

    events.value = result.items
    total.value = result.total
    
    
    if (typeof result.page === 'number' && result.page > 0) page.value = result.page
  } catch (caught) {
    if (token !== loadToken) return
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    if (token === loadToken) loading.value = false
  }
}


function reloadFromFirstPage(): void {
  page.value = 1
  void load()
}


function goToPage(target: number): void {
  const clamped = Math.min(Math.max(1, target), pages.value)
  if (clamped === page.value) return

  page.value = clamped
  void load()

  
  
  const node = panel.value
  if (node !== null && typeof node.scrollIntoView === 'function') {
    node.scrollIntoView({ block: 'start' })
  }
}


onMounted(() => {
  void load()
  void loadFacets()
})
watch(
  () => props.groupId,
  () => {
    page.value = 1
    void load()
    void loadFacets()
  },
)


watch(
  [filterKind, filterOutcome, filterRange, filterActorDevice, filterTargetNode, filterActor],
  reloadFromFirstPage,
)



const exporting = ref(false)
const exportNotice = ref<{ tone: 'ok' | 'warn' | 'fail'; text: string } | null>(null)

const noticeClass = computed(() => {
  switch (exportNotice.value?.tone) {
    case 'ok':
      return 'border-brand/35 bg-brand/12 text-brand-bright'
    case 'warn':
      return 'border-warn/35 bg-warn/12 text-warn'
    default:
      return 'border-danger/30 bg-danger/12 text-[#f5a9b0]'
  }
})









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













async function exportCsv(): Promise<void> {
  if (exporting.value) return

  exporting.value = true
  exportNotice.value = null

  try {
    const filters = auditQuery()
    const collected: AuditEventDto[] = []
    let cursor: { beforeAt: string; beforeId: string } | null = null
    let truncated = false

    while (collected.length < EXPORT_MAX_ROWS) {
      const result = await api.listAudit(props.groupId, {
        ...filters,
        limit: EXPORT_PAGE_SIZE,
        ...(cursor === null ? {} : cursor),
      })
      const page = result.items

      
      
      if (page.length === 0) break

      collected.push(...page)

      const last = page.at(-1)
      if (last === undefined) break
      cursor = { beforeAt: last.at, beforeId: last.event_id }

      if (collected.length >= EXPORT_MAX_ROWS) {
        truncated = true
        break
      }
    }

    const kept = truncated ? collected.slice(0, EXPORT_MAX_ROWS) : collected
    const csv = toAuditCsv(kept, auditText)

    
    if (csv.length === 0) {
      exportNotice.value = { tone: 'fail', text: t('audit.exportEmpty') }
      return
    }

    downloadText(auditCsvFileName(props.groupName ?? null, new Date()), csv)
    exportNotice.value = truncated
      ? { tone: 'warn', text: t('audit.exportTruncated', { count: kept.length }) }
      : { tone: 'ok', text: t('audit.exported', { count: kept.length }) }
  } catch {
    
    exportNotice.value = { tone: 'fail', text: t('audit.exportFailed') }
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div ref="auditPanel" class="console-panel rounded-card border border-border-base bg-surface">
    <div class="flex flex-wrap items-center gap-2 border-b border-border-base px-4 py-3">
      <ConsoleIcon name="FileText" class="icon text-text-faint" />
      <h2 class="text-[14px] font-semibold">{{ t('audit.title') }}</h2>
      
      <span
        v-if="!loading || total > 0"
        class="console-badge rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted"
      >
        {{ t('audit.total', { count: total }) }}
      </span>

      <span class="ml-auto text-[11px] text-text-faint">{{ t('audit.restrictedHint') }}</span>
      <button
        type="button"
        data-testid="audit-export"
        class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-3 py-1.5 text-[12px] font-medium transition hover:bg-surface-3 disabled:opacity-45"
        :disabled="exporting || loading"
        @click="exportCsv"
      >
        <LoaderCircle v-if="exporting" class="icon animate-spin" />
        {{ exporting ? t('audit.exporting') : t('audit.export') }}
      </button>
    </div>

    
    <div
      class="flex flex-wrap items-end gap-3 border-b border-border-base px-4 py-2.5"
      data-testid="audit-filters"
    >
      <label class="flex flex-col gap-1">
        <span class="text-[11px] text-text-faint">{{ t('audit.filterType') }}</span>
        <ClientSelect
          v-model="filterKind"
          :options="kindOptions"
          :label="t('audit.filterType')"
          data-testid="audit-filter-kind"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-[11px] text-text-faint">{{ t('audit.filterOutcome') }}</span>
        <ClientSelect
          v-model="filterOutcome"
          :options="outcomeOptions"
          :label="t('audit.filterOutcome')"
          data-testid="audit-filter-outcome"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-[11px] text-text-faint">{{ t('audit.filterRange') }}</span>
        <ClientSelect
          v-model="filterRange"
          :options="rangeOptions"
          :label="t('audit.filterRange')"
          data-testid="audit-filter-range"
        />
      </label>

      <label v-if="actorDeviceOptions.length > 1" class="flex flex-col gap-1">
        <span class="text-[11px] text-text-faint">{{ t('audit.filterActorDevice') }}</span>
        <ClientSelect
          v-model="filterActorDevice"
          :options="actorDeviceOptions"
          :label="t('audit.filterActorDevice')"
          data-testid="audit-filter-actor-device"
        />
      </label>

      <label v-if="targetNodeOptions.length > 1" class="flex flex-col gap-1">
        <span class="text-[11px] text-text-faint">{{ t('audit.filterTargetNode') }}</span>
        <ClientSelect
          v-model="filterTargetNode"
          :options="targetNodeOptions"
          :label="t('audit.filterTargetNode')"
          data-testid="audit-filter-target-node"
        />
      </label>

      <label v-if="actorOptions.length > 1" class="flex flex-col gap-1">
        <span class="text-[11px] text-text-faint">{{ t('audit.filterActor') }}</span>
        <ClientSelect
          v-model="filterActor"
          :options="actorOptions"
          :label="t('audit.filterActor')"
          data-testid="audit-filter-actor"
        />
      </label>
    </div>

    
    <div
      v-if="facetsTruncated"
      data-testid="audit-facets-truncated"
      class="border-b border-border-base px-4 py-2 text-[11.5px] text-text-faint"
    >
      {{ t('audit.facetsTruncated') }}
    </div>

    
    <div
      v-if="exportNotice"
      data-testid="audit-export-notice"
      class="console-note m-3 border"
      :class="noticeClass"
    >
      {{ exportNotice.text }}
    </div>

    <div v-if="loading && events.length === 0" class="px-4 py-8 text-center text-[13px] text-text-muted">
      {{ t('common.loading') }}
    </div>

    
    <div v-else-if="events.length === 0" class="console-empty m-3">
      <p class="text-[13px]">{{ hasFilter ? t('audit.emptyFiltered') : t('audit.empty') }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      
      <table class="w-full min-w-[880px]">
        <thead>
          <tr class="border-b border-border-base">
            <th class="px-3 py-2 text-left text-[11px] font-medium text-text-faint">
              {{ t('audit.time') }}
            </th>
            <th class="px-3 py-2 text-left text-[11px] font-medium text-text-faint">
              {{ t('audit.action') }}
            </th>
            <th class="px-3 py-2 text-left text-[11px] font-medium text-text-faint">
              {{ t('audit.target') }}
            </th>
            <th class="px-3 py-2 text-left text-[11px] font-medium text-text-faint">
              {{ t('audit.detail') }}
            </th>
            <th class="px-3 py-2 text-left text-[11px] font-medium text-text-faint">
              {{ t('audit.actor') }}
            </th>
            <th class="px-3 py-2 text-left text-[11px] font-medium text-text-faint">
              {{ t('audit.device') }}
            </th>
            <th class="px-3 py-2 text-left text-[11px] font-medium text-text-faint">
              {{ t('audit.outcome') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-base">
          <tr v-for="row in rows" :key="row.event.event_id">
            <td class="px-3 py-2 align-top font-mono text-[11.5px] whitespace-nowrap text-text-muted">
              {{ new Date(row.event.at).toLocaleString() }}
            </td>
            <td class="px-3 py-2 align-top text-[12.5px]">{{ row.actionLabel }}</td>

            
            <td class="px-3 py-2 align-top" data-testid="audit-target">
              <template v-if="row.target">
                <div class="text-[12.5px] text-text-muted">
                  {{ t(row.target.labelKey) }}<template v-if="row.target.name || row.target.id">
                    · {{ row.target.name ?? row.target.id }}</template>
                </div>
                <div
                  v-if="row.target.name"
                  class="font-mono text-[11px] break-all text-text-faint"
                >
                  {{ row.target.id }}
                </div>
              </template>
              <span v-else class="text-text-faint">—</span>
            </td>

            
            <td class="px-3 py-2 align-top" data-testid="audit-detail">
              <template v-if="row.detail">
                <div class="text-[12.5px] text-text-muted">{{ row.detail.text }}</div>
                <div v-if="row.detail.raw" class="font-mono text-[11px] break-all text-text-faint">
                  {{ row.detail.raw }}
                </div>
              </template>
              <span v-else class="text-text-faint">—</span>
            </td>

            <td class="px-3 py-2 align-top" data-testid="audit-actor">
              <div class="text-[12.5px] text-text-muted">{{ actorName(row.event) }}</div>
              
              <div
                v-if="row.event.actor_display_name"
                class="font-mono text-[11px] text-text-faint"
              >
                {{ row.event.actor_user_id }}
              </div>
            </td>
            
            <td class="px-3 py-2 align-top font-mono text-[11.5px] text-text-faint">
              {{ row.event.actor_device_id ?? '—' }}
            </td>
            <td class="px-3 py-2 align-top" data-testid="audit-outcome">
              <span
                class="console-badge rounded-full border px-2 py-0.5 text-[11px]"
                :class="outcomeClass(row.event.outcome)"
              >
                {{ row.outcomeLabel }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    
    <div
      v-if="pages > 1"
      data-testid="audit-pager"
      class="flex flex-wrap items-center gap-1.5 border-t border-border-base px-4 py-2.5"
    >
      <button
        type="button"
        data-testid="audit-prev-page"
        class="console-btn press rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[12px] transition hover:bg-surface-3 disabled:opacity-45"
        :disabled="loading || page <= 1"
        @click="goToPage(page - 1)"
      >
        {{ t('audit.prevPage') }}
      </button>

      <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
        <span v-if="item === 'gap'" class="px-1 text-[12px] text-text-faint">…</span>
        <button
          v-else
          type="button"
          :data-testid="`audit-page-${item}`"
          :data-active="item === page ? 'true' : 'false'"
          :aria-current="item === page ? 'page' : undefined"
          class="console-btn press min-w-[28px] rounded-control border px-2 py-1 text-[12px] tabular-nums transition disabled:opacity-100"
          :class="
            item === page
              ? 'border-brand bg-brand/15 font-medium text-brand-bright'
              : 'border-border-strong bg-surface-2 text-text-muted hover:bg-surface-3'
          "
          :disabled="loading || item === page"
          @click="goToPage(item)"
        >
          {{ item }}
        </button>
      </template>

      <button
        type="button"
        data-testid="audit-next-page"
        class="console-btn press rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[12px] transition hover:bg-surface-3 disabled:opacity-45"
        :disabled="loading || page >= pages"
        @click="goToPage(page + 1)"
      >
        {{ t('audit.nextPage') }}
      </button>

      
      <span data-testid="audit-page-summary" class="ml-1 text-[11.5px] text-text-faint">
        {{ t('audit.pageOf', { page, pages }) }}
      </span>

      <LoaderCircle v-if="loading" class="icon ml-auto animate-spin text-text-faint" />
    </div>

    <div
      v-if="errorMessage"
      data-testid="audit-error"
      class="border-t border-border-base px-4 py-2.5 text-[12.5px] text-[#f5a9b0]"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
