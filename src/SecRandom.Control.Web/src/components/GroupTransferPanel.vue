<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LoaderCircle } from '@lucide/vue'
import { api, ApiError } from '@/api/client'
import type { MemberDto, PendingTransfer, TransferDto } from '@/api/protocol'
import { useSessionStore } from '@/stores/session'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import ClientSelect from '@/components/client/fluent/ClientSelect.vue'

const props = defineProps<{
  groupId: string
  members: MemberDto[]
  




  isOwner: boolean
  
  loadError: string | null
  
  ended: boolean
}>()

const emit = defineEmits<{ changed: []; restart: [] }>()











const pending = defineModel<PendingTransfer | null>('pending', { default: null })

const { t } = useI18n()
const session = useSessionStore()

const selectedUserId = ref('')
const busy = ref(false)
const errorCode = ref<string | null>(null)

const justConfirmed = ref(false)

const justRejected = ref(false)

const selfUserId = computed(() => session.user?.user_id ?? '')










const current = computed<PendingTransfer | null>(() => pending.value ?? null)





const candidates = computed(() =>
  props.members.filter(
    (member) =>
      !member.is_self && member.role !== 'owner' && member.user_id !== selfUserId.value,
  ),
)









const targetOptions = computed<{ value: string; label: string }[]>(() => [
  { value: '', label: t('transfer.selectMember') },
  ...candidates.value.map((member) => ({
    value: member.user_id,
    label: `${displayName(member)} · ${t(`roles.${member.role}`)}`,
  })),
])


const isBriefOnly = computed(
  () => current.value !== null && 'restricted' in current.value,
)


const isRecipient = computed(
  () =>
    current.value !== null &&
    !isBriefOnly.value &&
    (current.value as TransferDto).to_user_id === selfUserId.value,
)


const isInitiator = computed(
  () =>
    current.value !== null &&
    !isBriefOnly.value &&
    (current.value as TransferDto).from_user_id === selfUserId.value,
)

function messageFor(code: string | null): string | null {
  if (!code) return null
  const key = `errors.${code}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
}


const errorMessage = computed(() => messageFor(errorCode.value ?? props.loadError))


const recipientName = computed(() => {
  if (current.value === null || isBriefOnly.value) return ''
  const target = props.members.find(
    (member) => member.user_id === (current.value as TransferDto).to_user_id,
  )
  return target ? displayName(target) : (current.value as TransferDto).to_user_id
})

function displayName(member: MemberDto): string {
  return member.display_name ?? member.user_id
}





const expiresAtText = computed(() =>
  current.value === null ? '' : new Date(current.value.expires_at).toLocaleString(),
)

async function request(): Promise<void> {
  if (!selectedUserId.value) return

  busy.value = true
  errorCode.value = null
  try {
    
    pending.value = await api.requestTransfer(props.groupId, selectedUserId.value)
    selectedUserId.value = ''
    justRejected.value = false
    justConfirmed.value = false
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    busy.value = false
  }
}

async function confirm(): Promise<void> {
  if (current.value === null || isBriefOnly.value) return

  busy.value = true
  errorCode.value = null
  try {
    await api.confirmTransfer(props.groupId, (current.value as TransferDto).transfer_id)
    pending.value = null
    justConfirmed.value = true
    
    await session.load()
    emit('changed')
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    busy.value = false
  }
}

async function reject(): Promise<void> {
  if (current.value === null || isBriefOnly.value) return

  busy.value = true
  errorCode.value = null
  try {
    await api.rejectTransfer(props.groupId, (current.value as TransferDto).transfer_id)
    pending.value = null
    justRejected.value = true
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="console-panel rounded-card border border-border-base bg-surface">
    <div class="flex items-center gap-2 border-b border-border-base px-4 py-3">
      <ConsoleIcon name="ArrowRightLeft" class="icon text-text-faint" />
      <h2 class="text-[14px] font-semibold">{{ t('transfer.title') }}</h2>
    </div>

    <div class="flex flex-col gap-3 p-4">
      
      <div
        v-if="justConfirmed"
        data-testid="transfer-confirmed"
        class="flex gap-2 rounded-control border border-brand/35 bg-brand/12 p-3 text-[12.5px] leading-relaxed"
      >
        <ConsoleIcon name="ShieldCheck" class="icon mt-0.5 text-brand-bright" />
        <div>
          <div class="font-medium text-text-base">{{ t('transfer.confirmedTitle') }}</div>
          <p class="mt-1 text-text-muted">{{ t('transfer.confirmedBody') }}</p>
        </div>
      </div>

      
      <template v-if="isRecipient && current">
        <div
          class="flex gap-2 rounded-control border border-warn/35 bg-warn/12 p-3 text-[12.5px] leading-relaxed text-[#f0cd8a]"
        >
          <ConsoleIcon name="ShieldCheck" class="icon mt-0.5" />
          <div>
            <div class="font-medium text-white">{{ t('transfer.incomingTitle') }}</div>
            <p class="mt-1">{{ t('transfer.incomingBody') }}</p>
            <p class="mt-1.5 text-text-faint">{{ t('transfer.expiresAt', { time: expiresAtText }) }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="transfer-accept"
            class="console-btn console-btn--accent btn-primary press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3.5 py-2 text-[12.5px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
            :disabled="busy"
            @click="confirm"
          >
            <LoaderCircle v-if="busy" class="icon animate-spin" />
            <ConsoleIcon v-else name="Check" class="icon" />
            {{ busy ? t('transfer.accepting') : t('transfer.accept') }}
          </button>
          <button
            type="button"
            data-testid="transfer-reject"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px] transition hover:bg-surface-3 disabled:opacity-45"
            :disabled="busy"
            @click="reject"
          >
            <ConsoleIcon name="X" class="icon" />
            {{ t('transfer.reject') }}
          </button>
        </div>
      </template>

      
      <template v-else-if="isInitiator && current">
        <div
          class="flex gap-2 rounded-control border border-border-strong bg-surface-2 p-3 text-[12.5px] leading-relaxed text-text-muted"
        >
          <ConsoleIcon name="Clock" class="icon mt-0.5 text-warn" />
          <div>
            <div class="font-medium text-text-base">{{ t('transfer.pendingTitle') }}</div>
            <p class="mt-1">{{ t('transfer.pendingBody') }}</p>
            <p class="mt-1.5 text-text-faint">
              {{ t('transfer.waitingForRecipient', { name: recipientName }) }}
            </p>
            <p class="mt-1 text-text-faint">{{ t('transfer.expiresAt', { time: expiresAtText }) }}</p>
          </div>
        </div>
      </template>

      
      <p v-else-if="isBriefOnly" class="text-[12.5px] text-text-muted">
        {{ t('transfer.pendingTitle') }}
      </p>

      
      <template v-else-if="ended && isOwner">
        <div
          data-testid="transfer-ended"
          class="flex gap-2 rounded-control border border-border-strong bg-surface-2 p-3 text-[12.5px] leading-relaxed text-text-muted"
        >
          <ConsoleIcon name="Clock" class="icon mt-0.5 text-text-faint" />
          <div>
            <div class="font-medium text-text-base">{{ t('transfer.endedTitle') }}</div>
            <p class="mt-1">{{ t('transfer.endedBody') }}</p>
          </div>
        </div>
        <div>
          <button
            type="button"
            data-testid="transfer-restart"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px] font-medium transition hover:bg-surface-3"
            @click="emit('restart')"
          >
            {{ t('transfer.restart') }}
          </button>
        </div>
      </template>

      
      <template v-else-if="isOwner">
        <p class="text-[12.5px] leading-relaxed text-text-muted">
          {{ t('transfer.description') }}
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <ClientSelect
            v-model="selectedUserId"
            size="wide"
            :options="targetOptions"
            :label="t('transfer.selectMember')"
            data-testid="transfer-target"
          />
          <button
            type="button"
            data-testid="transfer-request"
            class="console-btn press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px] font-medium transition hover:bg-surface-3 disabled:opacity-45"
            :disabled="busy || selectedUserId === ''"
            @click="request"
          >
            <LoaderCircle v-if="busy" class="icon animate-spin" />
            {{ busy ? t('transfer.requesting') : t('transfer.request') }}
          </button>
        </div>
      </template>

      
      <p v-else-if="justRejected" class="text-[12.5px] text-text-muted">
        {{ t('transfer.rejectedNotice') }}
      </p>
      <p v-else class="text-[12.5px] text-text-muted">{{ t('members.onlyOwnerCanTransfer') }}</p>

      <p class="text-[11.5px] leading-relaxed text-text-faint">{{ t('transfer.twoPartyHint') }}</p>
    </div>

    <div
      v-if="errorMessage"
      data-testid="transfer-error"
      class="border-t border-border-base px-4 py-2.5 text-[12.5px] text-[#f5a9b0]"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
