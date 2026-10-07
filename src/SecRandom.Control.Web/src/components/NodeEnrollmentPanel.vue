<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LoaderCircle } from '@lucide/vue'
import { api } from '@/api/client'
import type { EnrollmentCodeDto, NodeTokenDto, NodeView } from '@/api/protocol'
import { apiErrorMessage, toErrorLike } from '@/utils/api-error-message'
import { normalizeInviteCode } from '@/utils/invite-code'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import { NODE_REFRESH_INTERVAL_MS, useAutoRefresh } from '@/composables/useAutoRefresh'

const props = defineProps<{ groupId: string; canManage: boolean }>()

const { t } = useI18n()

const STATUS_OVERRIDES: Record<number, string> = {
  401: 'errors.unauthorized',
  403: 'errors.insufficient_role',
  429: 'errors.too_many_attempts',
  503: 'errors.enrollment_disabled',
}

type AccessState = 'enrolled' | 'none' | 'expired' | 'revoked'

const ACCESS_KEYS: Record<AccessState, string> = {
  enrolled: 'group.enrollment.accessEnrolled',
  none: 'group.enrollment.accessNone',
  expired: 'group.enrollment.accessExpired',
  revoked: 'group.enrollment.accessRevoked',
}

const enabled = ref(false)
const codes = ref<EnrollmentCodeDto[]>([])
const nodes = ref<NodeView[]>([])
const loading = ref(false)
const creating = ref(false)
const revokingCode = ref<string | null>(null)
const busyNodeId = ref<string | null>(null)
const errorCode = ref<string | null>(null)
const errorStatus = ref<number | null>(null)
const issuedCode = ref<EnrollmentCodeDto | null>(null)
const issuedToken = ref<NodeTokenDto | null>(null)
const issuedTokenNodeId = ref<string | null>(null)
const copiedKey = ref<string | null>(null)
const confirmRevokeCode = ref<EnrollmentCodeDto | null>(null)
const confirmRevokeToken = ref<NodeView | null>(null)
const now = ref(Date.now())

let ticker: number | null = null

const visible = computed(() => props.canManage && enabled.value)

const errorMessage = computed(() =>
  apiErrorMessage(t, 'errors', errorCode.value, {
    status: errorStatus.value,
    overrides: STATUS_OVERRIDES,
  }),
)

const pendingCodes = computed(() => codes.value.filter((code) => code.status === 'pending'))

const codeSecondsLeft = computed(() => {
  const issued = issuedCode.value
  if (issued === null) return 0
  const expiresAt = Date.parse(issued.expires_at)
  if (Number.isNaN(expiresAt)) return 0
  return Math.max(0, Math.floor((expiresAt - now.value) / 1000))
})

const issuedCodeExpired = computed(() => issuedCode.value !== null && codeSecondsLeft.value <= 0)

const countdown = computed(() => {
  const total = codeSecondsLeft.value
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function fail(caught: unknown): void {
  const error = toErrorLike(caught)
  errorCode.value = error.code
  errorStatus.value = error.status
}

function resetError(): void {
  errorCode.value = null
  errorStatus.value = null
}

function codeStatusLabel(status: EnrollmentCodeDto['status']): string {
  const key = `group.enrollment.code${status.charAt(0).toUpperCase()}${status.slice(1)}`
  const translated = t(key)
  return translated === key ? status : translated
}

function nodeName(node: NodeView): string {
  const name = node.display_name?.trim()
  return name !== undefined && name.length > 0 ? name : node.node_id
}

function accessState(node: NodeView): AccessState {
  if (node.enrolled === true) return 'enrolled'
  if (node.token_state === 'revoked') return 'revoked'
  if (node.token_state === 'expired') return 'expired'
  return 'none'
}

function accessLabel(node: NodeView): string {
  return t(ACCESS_KEYS[accessState(node)])
}

function accessTone(node: NodeView): string {
  const state = accessState(node)
  if (state === 'enrolled') return 'border-brand/35 bg-brand/15 text-brand-bright'
  if (state === 'none') return 'border-border-strong bg-surface-2 text-text-muted'
  if (state === 'revoked') return 'border-danger/35 bg-danger/12 text-[#f5a9b0]'
  return 'border-warn/35 bg-warn/12 text-warn'
}

function onlineLabel(node: NodeView): string {
  return node.online ? t('group.enrollment.stateOnline') : t('group.enrollment.stateOffline')
}

function onlineTone(node: NodeView): string {
  return node.online
    ? 'border-brand/35 bg-brand/12 text-brand-bright'
    : 'border-border-strong bg-surface-2 text-text-muted'
}

function permissionLabel(node: NodeView): string {
  return node.local_remote_allowed
    ? t('group.enrollment.permissionAllowed')
    : t('group.enrollment.permissionDenied')
}

function permissionTone(node: NodeView): string {
  return node.local_remote_allowed
    ? 'border-border-strong bg-surface-2 text-text-muted'
    : 'border-warn/35 bg-warn/12 text-warn'
}

const enrolledCount = computed(() => nodes.value.filter((node) => node.enrolled === true).length)

const unenrolledCount = computed(() => nodes.value.length - enrolledCount.value)

async function loadMeta(): Promise<void> {
  try {
    const meta = await api.serverMeta()
    enabled.value = meta?.node_enrollment === true
  } catch {
    enabled.value = false
  }
}

async function loadData(): Promise<void> {
  const [codeList, nodeList] = await Promise.all([
    api.listEnrollmentCodes(props.groupId),
    api.listNodes(props.groupId),
  ])
  codes.value = codeList
  nodes.value = nodeList
}

async function refresh(): Promise<void> {
  loading.value = true
  resetError()
  try {
    await loadData()
  } catch (caught) {
    fail(caught)
  } finally {
    loading.value = false
  }
}

async function refreshQuietly(): Promise<void> {
  try {
    await loadData()
  } catch {
    return
  }
}

useAutoRefresh(() => refreshQuietly(), {
  intervalMs: NODE_REFRESH_INTERVAL_MS,
  canRefresh: () => visible.value && !loading.value && !creating.value && revokingCode.value === null,
})

async function create(): Promise<void> {
  creating.value = true
  resetError()
  try {
    const code = await api.createEnrollmentCode(props.groupId)
    issuedCode.value = code
    codes.value = [code, ...codes.value]
  } catch (caught) {
    fail(caught)
  } finally {
    creating.value = false
  }
}

async function revokeCode(code: EnrollmentCodeDto): Promise<void> {
  revokingCode.value = code.display_code
  resetError()
  try {
    await api.revokeEnrollmentCode(props.groupId, normalizeInviteCode(code.display_code))
    confirmRevokeCode.value = null
    if (issuedCode.value?.display_code === code.display_code) issuedCode.value = null
    await refresh()
  } catch (caught) {
    fail(caught)
  } finally {
    revokingCode.value = null
  }
}

async function issueToken(node: NodeView): Promise<void> {
  busyNodeId.value = node.node_id
  resetError()
  try {
    const token = await api.issueNodeToken(props.groupId, node.node_id)
    issuedToken.value = token
    issuedTokenNodeId.value = node.node_id
    await refresh()
  } catch (caught) {
    fail(caught)
  } finally {
    busyNodeId.value = null
  }
}

async function revokeToken(node: NodeView): Promise<void> {
  busyNodeId.value = node.node_id
  resetError()
  try {
    await api.revokeNodeToken(props.groupId, node.node_id)
    confirmRevokeToken.value = null
    if (issuedTokenNodeId.value === node.node_id) {
      issuedToken.value = null
      issuedTokenNodeId.value = null
    }
    await refresh()
  } catch (caught) {
    fail(caught)
  } finally {
    busyNodeId.value = null
  }
}

async function copy(text: string, key: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    window.setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null
    }, 2000)
  } catch {
    errorCode.value = 'network_error'
    errorStatus.value = null
  }
}

onMounted(async () => {
  ticker = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  if (!props.canManage) return
  await loadMeta()
  if (enabled.value) await refresh()
})

onUnmounted(() => {
  if (ticker !== null) window.clearInterval(ticker)
  ticker = null
})
</script>

<template>
  <div v-if="visible" class="flex flex-col gap-4">
    <div class="console-panel rounded-card border border-border-base bg-surface">
      <div class="flex flex-wrap items-center gap-3 border-b border-border-base px-4 py-3">
        <h2 class="text-[14px] font-semibold">{{ t('group.enrollment.title') }}</h2>
        <span class="console-badge rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted">
          {{ pendingCodes.length }}
        </span>

        <div class="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="enrollment-refresh"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[11.5px] transition hover:bg-surface-3 disabled:opacity-45"
            :disabled="loading"
            @click="refresh"
          >
            <LoaderCircle v-if="loading" class="icon animate-spin" />
            <ConsoleIcon v-else name="RefreshCw" class="icon" />
            {{ t('group.enrollment.refresh') }}
          </button>

          <button
            type="button"
            data-testid="enrollment-create"
            class="console-btn console-btn--accent btn-primary press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
            :disabled="creating"
            @click="create"
          >
            <LoaderCircle v-if="creating" class="icon animate-spin" />
            <ConsoleIcon v-else name="Plus" class="icon" />
            {{ t('group.enrollment.create') }}
          </button>
        </div>
      </div>

      <p class="border-b border-border-base px-4 py-2 text-[11.5px] leading-relaxed text-text-faint">
        {{ t('group.enrollment.hint') }}
      </p>

      <div
        v-if="issuedCode"
        data-testid="enrollment-code"
        class="border-b border-border-base bg-surface-2/40 px-4 py-4"
      >
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-[13px] font-semibold">{{ t('group.enrollment.newCodeTitle') }}</h3>
          <span
            data-testid="enrollment-code-countdown"
            class="console-badge rounded-full border px-1.5 text-[10.5px]"
            :class="
              issuedCodeExpired
                ? 'border-border-strong bg-surface-2 text-text-muted'
                : 'border-brand/35 bg-brand/15 text-brand-bright'
            "
          >
            {{
              issuedCodeExpired
                ? t('group.enrollment.expired')
                : `${t('group.enrollment.remaining')} ${countdown}`
            }}
          </span>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-3">
          <span
            data-testid="enrollment-code-value"
            class="font-mono text-[26px] font-semibold tracking-[0.22em] text-brand-bright"
          >
            {{ issuedCode.display_code }}
          </span>

          <button
            type="button"
            data-testid="enrollment-code-copy"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[11.5px] transition hover:bg-surface-3"
            @click="copy(issuedCode.display_code, 'code')"
          >
            <ConsoleIcon
              v-if="copiedKey === 'code'"
              name="Check"
              class="icon text-brand-bright"
            />
            <ConsoleIcon v-else name="Copy" class="icon" />
            {{ copiedKey === 'code' ? t('group.enrollment.copied') : t('group.enrollment.copyCode') }}
          </button>

          <button
            type="button"
            data-testid="enrollment-code-revoke"
            class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/30 bg-danger/12 px-2.5 py-1 text-[11.5px] text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
            :disabled="revokingCode === issuedCode.display_code"
            @click="confirmRevokeCode = issuedCode"
          >
            <LoaderCircle v-if="revokingCode === issuedCode.display_code" class="icon animate-spin" />
            <ConsoleIcon v-else name="X" class="icon" />
            {{ t('group.enrollment.revoke') }}
          </button>
        </div>

        <p class="mt-2 text-[11.5px] leading-relaxed text-text-faint">
          {{ t('group.enrollment.newCodeHint') }}
        </p>
      </div>

      <div
        v-if="issuedToken"
        data-testid="enrollment-token"
        class="border-b border-border-base bg-surface-2/40 px-4 py-4"
      >
        <h3 class="text-[13px] font-semibold">{{ t('group.enrollment.tokenTitle') }}</h3>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <span
            data-testid="enrollment-token-value"
            class="max-w-full truncate font-mono text-[13px] text-brand-bright"
          >
            {{ issuedToken.node_token }}
          </span>
          <button
            type="button"
            data-testid="enrollment-token-copy"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[11.5px] transition hover:bg-surface-3"
            @click="copy(issuedToken.node_token, 'token')"
          >
            <ConsoleIcon
              v-if="copiedKey === 'token'"
              name="Check"
              class="icon text-brand-bright"
            />
            <ConsoleIcon v-else name="Copy" class="icon" />
            {{ copiedKey === 'token' ? t('group.enrollment.copied') : t('group.enrollment.copyToken') }}
          </button>
          <button
            type="button"
            data-testid="enrollment-token-close"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[11.5px] transition hover:bg-surface-3"
            @click="issuedToken = null"
          >
            {{ t('group.enrollment.close') }}
          </button>
        </div>
        <p class="mt-2 text-[11.5px] leading-relaxed text-text-faint">
          {{ t('group.enrollment.tokenHint') }}
        </p>
      </div>

      <div class="border-b border-border-base px-4 py-2 text-[11.5px] font-medium text-text-muted">
        {{ t('group.enrollment.codesTitle') }}
      </div>

      <div v-if="loading && codes.length === 0" class="px-4 py-6 text-center text-[13px] text-text-muted">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="codes.length === 0" class="console-empty m-3">
        <p class="text-[13px]">{{ t('group.enrollment.codesEmpty') }}</p>
      </div>

      <ul v-else class="console-divide divide-y divide-border-base">
        <li
          v-for="code in codes"
          :key="code.display_code"
          class="console-list__row flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <ConsoleIcon name="Ticket" class="icon text-text-faint" />

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[13.5px] tracking-wider">{{ code.display_code }}</span>
              <span
                data-testid="enrollment-code-status"
                class="console-badge rounded-full border px-1.5 text-[10.5px]"
                :class="{
                  'border-brand/35 bg-brand/15 text-brand-bright': code.status === 'pending',
                  'border-border-strong bg-surface-2 text-text-muted': code.status !== 'pending',
                }"
              >
                {{ codeStatusLabel(code.status) }}
              </span>
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-text-faint">
              <span>{{ t('group.enrollment.codeExpiresAt') }} {{ new Date(code.expires_at).toLocaleString() }}</span>
              <template v-if="code.used_by_node_id">
                <span>·</span>
                <span class="font-mono">{{ code.used_by_node_id }}</span>
              </template>
            </div>
          </div>

          <div class="ml-auto flex items-center gap-2">
            <button
              v-if="code.status === 'pending'"
              type="button"
              class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/30 bg-danger/12 px-2.5 py-1 text-[11.5px] text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
              :disabled="revokingCode === code.display_code"
              @click="confirmRevokeCode = code"
            >
              <LoaderCircle v-if="revokingCode === code.display_code" class="icon animate-spin" />
              <ConsoleIcon v-else name="X" class="icon" />
              {{ t('group.enrollment.revoke') }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div class="console-panel rounded-card border border-border-base bg-surface">
      <div class="flex flex-wrap items-center gap-3 border-b border-border-base px-4 py-3">
        <h2 class="text-[14px] font-semibold">{{ t('group.enrollment.devicesTitle') }}</h2>
        <span class="console-badge rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted">
          {{ nodes.length }}
        </span>

        <div
          data-testid="enrollment-access-summary"
          class="ml-auto flex flex-wrap items-center justify-end gap-1.5"
        >
          <span
            v-if="enrolledCount > 0"
            data-testid="enrollment-access-enrolled"
            class="console-badge rounded-full border border-brand/35 bg-brand/15 px-2 py-0.5 text-[11px] text-brand-bright"
          >
            {{ t('group.enrollment.accessEnrolledCount', { count: enrolledCount }) }}
          </span>
          <span
            v-if="unenrolledCount > 0"
            data-testid="enrollment-access-none"
            class="console-badge rounded-full border border-border-strong bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted"
          >
            {{ t('group.enrollment.accessNoneCount', { count: unenrolledCount }) }}
          </span>
        </div>
      </div>

      <div v-if="loading && nodes.length === 0" class="px-4 py-6 text-center text-[13px] text-text-muted">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="nodes.length === 0" class="console-empty m-3">
        <p class="text-[13px]">{{ t('group.enrollment.devicesEmpty') }}</p>
      </div>

      <ul v-else class="console-divide divide-y divide-border-base">
        <li
          v-for="node in nodes"
          :key="node.node_id"
          :data-testid="`enrollment-node-${node.node_id}`"
          class="console-list__row flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <ConsoleIcon name="Monitor" class="icon text-text-faint" />

          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="truncate text-[13px] font-medium">{{ nodeName(node) }}</span>
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-text-faint">
              <span>{{ node.platform }} · {{ node.version }}</span>
              <span>·</span>
              <span class="font-mono">{{ node.node_id }}</span>
              <template v-if="node.token_expires_at">
                <span>·</span>
                <span>
                  {{ t('group.enrollment.tokenExpiresAt') }}
                  {{ new Date(node.token_expires_at).toLocaleString() }}
                </span>
              </template>
            </div>
          </div>

          <div
            data-testid="enrollment-node-status"
            class="ml-auto flex flex-wrap items-center gap-1.5 rounded-control border border-border-base bg-surface-2/60 px-2 py-1"
          >
            <span
              data-testid="enrollment-node-state"
              class="console-badge rounded-full border px-1.5 text-[10.5px]"
              :class="accessTone(node)"
            >
              {{ accessLabel(node) }}
            </span>
            <span
              :data-testid="`enrollment-node-online-${node.node_id}`"
              class="console-badge rounded-full border px-1.5 text-[10.5px]"
              :class="onlineTone(node)"
            >
              {{ onlineLabel(node) }}
            </span>
            <span
              :data-testid="`enrollment-node-permission-${node.node_id}`"
              class="console-badge rounded-full border px-1.5 text-[10.5px]"
              :class="permissionTone(node)"
            >
              {{ permissionLabel(node) }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              :data-testid="`enrollment-token-issue-${node.node_id}`"
              class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[11.5px] transition hover:bg-surface-3 disabled:opacity-45"
              :disabled="busyNodeId === node.node_id"
              @click="issueToken(node)"
            >
              <LoaderCircle v-if="busyNodeId === node.node_id" class="icon animate-spin" />
              <ConsoleIcon v-else name="ShieldCheck" class="icon" />
              {{
                node.enrolled === true
                  ? t('group.enrollment.reissueToken')
                  : t('group.enrollment.issueToken')
              }}
            </button>

            <button
              v-if="node.enrolled === true"
              type="button"
              :data-testid="`enrollment-token-revoke-${node.node_id}`"
              class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/30 bg-danger/12 px-2.5 py-1 text-[11.5px] text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
              :disabled="busyNodeId === node.node_id"
              @click="confirmRevokeToken = node"
            >
              <ConsoleIcon name="X" class="icon" />
              {{ t('group.enrollment.revokeToken') }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div
      v-if="errorMessage"
      data-testid="enrollment-error"
      class="console-note console-note--fail rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-[#f5a9b0]"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="confirmRevokeCode"
      data-testid="enrollment-code-revoke-confirm"
      class="console-scrim fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      @click.self="confirmRevokeCode = null"
    >
      <div class="console-dialog w-full max-w-md rounded-card border border-border-base bg-surface p-5">
        <h3 class="console-dialog__title text-[15px] font-semibold">
          {{ t('group.enrollment.revokeCodeConfirmTitle') }}
        </h3>
        <p class="mt-2 text-[12.5px] leading-relaxed text-text-muted">
          {{ t('group.enrollment.revokeCodeConfirmBody') }}
        </p>
        <p class="mt-2 font-mono text-[11.5px] text-text-faint">{{ confirmRevokeCode.display_code }}</p>
        <div class="console-dialog__foot mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px]"
            @click="confirmRevokeCode = null"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            data-testid="enrollment-code-revoke-confirm-yes"
            class="console-btn console-btn--danger press rounded-control border border-danger bg-danger px-3.5 py-2 text-[12.5px] font-medium text-white"
            @click="revokeCode(confirmRevokeCode)"
          >
            {{ t('group.enrollment.revoke') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="confirmRevokeToken"
      data-testid="enrollment-token-revoke-confirm"
      class="console-scrim fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      @click.self="confirmRevokeToken = null"
    >
      <div class="console-dialog w-full max-w-md rounded-card border border-border-base bg-surface p-5">
        <h3 class="console-dialog__title text-[15px] font-semibold">
          {{ t('group.enrollment.revokeTokenConfirmTitle') }}
        </h3>
        <p class="mt-2 text-[12.5px] leading-relaxed text-text-muted">
          {{ t('group.enrollment.revokeTokenConfirmBody') }}
        </p>
        <p class="mt-2 font-mono text-[11.5px] text-text-faint">{{ nodeName(confirmRevokeToken) }}</p>
        <div class="console-dialog__foot mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px]"
            @click="confirmRevokeToken = null"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            data-testid="enrollment-token-revoke-confirm-yes"
            class="console-btn console-btn--danger press rounded-control border border-danger bg-danger px-3.5 py-2 text-[12.5px] font-medium text-white"
            @click="revokeToken(confirmRevokeToken)"
          >
            {{ t('group.enrollment.revokeToken') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
