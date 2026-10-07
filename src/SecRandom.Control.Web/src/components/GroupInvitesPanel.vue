<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LoaderCircle } from '@lucide/vue'
import { api, ApiError } from '@/api/client'
import { GROUP_ROLE_RANK, type GroupRole, type InviteDto, type MemberDto } from '@/api/protocol'
import { useSessionStore } from '@/stores/session'
import { displayName } from '@/utils/display-name'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import ClientSelect from '@/components/client/fluent/ClientSelect.vue'

const props = defineProps<{ groupId: string; members: MemberDto[] }>()

const { t } = useI18n()
const session = useSessionStore()

const invites = ref<InviteDto[]>([])
const loading = ref(false)
const creating = ref(false)
const revokingCode = ref<string | null>(null)
const errorCode = ref<string | null>(null)
const copiedCode = ref<string | null>(null)

const selectedRole = ref<GroupRole>('operator')
const confirmRevoke = ref<InviteDto | null>(null)


const assignableRoles = computed<GroupRole[]>(() => {
  const self = session.groupRole(props.groupId)
  const rank = self ? GROUP_ROLE_RANK[self] : -1
  return (['viewer', 'operator', 'admin'] as GroupRole[]).filter(
    (role) => GROUP_ROLE_RANK[role] < rank,
  )
})







const roleOptions = computed<{ value: string; label: string }[]>(() =>
  assignableRoles.value.map((role) => ({ value: role, label: t(`roles.${role}`) })),
)


function onRoleChange(value: string): void {
  selectedRole.value = value as GroupRole
}

const errorMessage = computed(() => {
  if (!errorCode.value) return null
  const key = `errors.${errorCode.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})


function inviteLink(invite: InviteDto): string {
  return `${window.location.origin}/join?code=${encodeURIComponent(invite.code)}`
}

function statusLabel(status: InviteDto['status']): string {
  return t(`invites.status${status.charAt(0).toUpperCase()}${status.slice(1)}`)
}







function creatorName(userId: string): string {
  const member = props.members.find((item) => item.user_id === userId)
  return displayName(member?.display_name, userId)
}

async function load(): Promise<void> {
  loading.value = true
  errorCode.value = null
  try {
    invites.value = await api.listInvites(props.groupId)
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    loading.value = false
  }
}

async function create(): Promise<void> {
  creating.value = true
  errorCode.value = null
  try {
    const invite = await api.createInvite(props.groupId, selectedRole.value)
    
    invites.value = [invite, ...invites.value]
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    creating.value = false
  }
}

async function revoke(invite: InviteDto): Promise<void> {
  revokingCode.value = invite.code
  errorCode.value = null
  try {
    await api.revokeInvite(props.groupId, invite.code)
    confirmRevoke.value = null
    await load()
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    revokingCode.value = null
  }
}

async function copy(invite: InviteDto): Promise<void> {
  try {
    await navigator.clipboard.writeText(inviteLink(invite))
    copiedCode.value = invite.code
    window.setTimeout(() => {
      if (copiedCode.value === invite.code) copiedCode.value = null
    }, 2000)
  } catch {
    
    errorCode.value = 'network_error'
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="console-panel rounded-card border border-border-base bg-surface">
      <div class="flex flex-wrap items-center gap-3 border-b border-border-base px-4 py-3">
        <h2 class="text-[14px] font-semibold">{{ t('invites.title') }}</h2>
        <span class="console-badge rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted">
          {{ invites.length }}
        </span>

        <div class="ml-auto flex flex-wrap items-center gap-2">
          <ClientSelect
            :model-value="selectedRole"
            :options="roleOptions"
            :label="t('invites.roleLabel')"
            data-testid="invite-role"
            @update:model-value="onRoleChange"
          />
          <button
            type="button"
            data-testid="invite-create"
            class="console-btn console-btn--accent btn-primary press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
            :disabled="creating || assignableRoles.length === 0"
            @click="create"
          >
            <LoaderCircle v-if="creating" class="icon animate-spin" />
            <ConsoleIcon v-else name="Plus" class="icon" />
            {{ t('invites.create') }}
          </button>
        </div>
      </div>

      <p class="border-b border-border-base px-4 py-2 text-[11.5px] leading-relaxed text-text-faint">
        {{ t('invites.roleHint') }}
      </p>

      <div v-if="loading" class="px-4 py-8 text-center text-[13px] text-text-muted">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="invites.length === 0" class="console-empty m-3">
        <p class="text-[13px]">{{ t('invites.empty') }}</p>
      </div>

      <ul v-else class="console-divide divide-y divide-border-base">
        <li
          v-for="invite in invites"
          :key="invite.code"
          class="console-list__row flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <ConsoleIcon name="Ticket" class="icon text-text-faint" />

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[13.5px] tracking-wider">{{ invite.display_code }}</span>
              <span
                class="console-badge rounded-full border px-1.5 text-[10.5px]"
                :class="{
                  'border-brand/35 bg-brand/15 text-brand-bright': invite.status === 'pending',
                  'border-border-strong bg-surface-2 text-text-muted': invite.status !== 'pending',
                }"
              >
                {{ statusLabel(invite.status) }}
              </span>
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-text-faint">
              <span>{{ t(`roles.${invite.role}`) }}</span>
              <span>·</span>
              
              <span data-testid="invite-creator">
                {{ t('invites.createdBy') }} {{ creatorName(invite.created_by_user_id) }}
              </span>
              <span>·</span>
              <span>{{ t('invites.expiresAt') }} {{ new Date(invite.expires_at).toLocaleString() }}</span>
            </div>
          </div>

          <div class="ml-auto flex items-center gap-2">
            <button
              v-if="invite.status === 'pending'"
              type="button"
              class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1 text-[11.5px] transition hover:bg-surface-3"
              @click="copy(invite)"
            >
              <ConsoleIcon
                v-if="copiedCode === invite.code"
                name="Check"
                class="icon text-brand-bright"
              />
              <ConsoleIcon v-else name="Copy" class="icon" />
              {{ copiedCode === invite.code ? t('invites.copied') : t('invites.copyLink') }}
            </button>

            <button
              v-if="invite.status === 'pending'"
              type="button"
              class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/30 bg-danger/12 px-2.5 py-1 text-[11.5px] text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
              :disabled="revokingCode === invite.code"
              @click="confirmRevoke = invite"
            >
              <LoaderCircle v-if="revokingCode === invite.code" class="icon animate-spin" />
              <ConsoleIcon v-else name="X" class="icon" />
              {{ t('invites.revoke') }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div
      v-if="errorMessage"
      data-testid="invites-error"
      class="console-note console-note--fail rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-[#f5a9b0]"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="confirmRevoke"
      data-testid="revoke-confirm"
      class="console-scrim fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      @click.self="confirmRevoke = null"
    >
      <div class="console-dialog w-full max-w-md rounded-card border border-border-base bg-surface p-5">
        <h3 class="console-dialog__title text-[15px] font-semibold">{{ t('invites.revokeConfirmTitle') }}</h3>
        <p class="mt-2 text-[12.5px] leading-relaxed text-text-muted">
          {{ t('invites.revokeConfirmBody') }}
        </p>
        <p class="mt-2 font-mono text-[11.5px] text-text-faint">{{ confirmRevoke.display_code }}</p>
        <div class="console-dialog__foot mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px]"
            @click="confirmRevoke = null"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            data-testid="revoke-confirm-yes"
            class="console-btn console-btn--danger press rounded-control border border-danger bg-danger px-3.5 py-2 text-[12.5px] font-medium text-white"
            @click="revoke(confirmRevoke)"
          >
            {{ t('invites.revoke') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
