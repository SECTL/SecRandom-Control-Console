<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LoaderCircle } from '@lucide/vue'
import { api, ApiError } from '@/api/client'
import type { MemberDto, PendingTransfer } from '@/api/protocol'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import { displayName } from '@/utils/display-name'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import GroupMembersPanel from '@/components/GroupMembersPanel.vue'
import GroupInvitesPanel from '@/components/GroupInvitesPanel.vue'
import GroupAuditPanel from '@/components/GroupAuditPanel.vue'
import GroupTransferPanel from '@/components/GroupTransferPanel.vue'
import NodeListPanel from '@/components/NodeListPanel.vue'

const props = defineProps<{ groupId: string }>()

const { t } = useI18n()
const session = useSessionStore()
const router = useRouter()
const setup = useSetupStore()








const membershipEnabled = computed(() => setup.membershipEnabled)

const group = computed(
  () => session.groups.find((item) => item.group_id === props.groupId) ?? null,
)

type Tab = 'nodes' | 'members' | 'invites' | 'audit'
const activeTab = ref<Tab>('nodes')

const members = ref<MemberDto[]>([])
const membersError = ref<string | null>(null)
const loadingMembers = ref(false)









const ownerName = computed(() => {
  const current = group.value
  if (current === null) return ''

  const fromMembers = members.value.find((item) => item.user_id === current.owner_user_id)
  return displayName(current.owner_display_name || fromMembers?.display_name, current.owner_user_id)
})











const nodeCounts = ref({ total: 0, online: 0, drawLocked: 0 })






const stats = computed(() => {
  const items = [
    { key: 'group.nodeCount', icon: 'Monitor', value: nodeCounts.value.total, tone: 'text-text-base' },
    {
      key: 'group.online',
      icon: 'CircleCheck',
      value: nodeCounts.value.online,
      tone: 'text-brand-bright',
    },
    
    
    { key: 'group.drawLocked', icon: 'Lock', value: nodeCounts.value.drawLocked, tone: 'text-warn' },
    { key: 'group.memberCount', icon: 'Users', value: members.value.length, tone: 'text-text-base' },
  ]
  
  return membershipEnabled.value ? items : items.filter((item) => item.key !== 'group.memberCount')
})










const selfUserId = computed(() => session.user?.user_id ?? '')
const isOwner = computed(
  () =>
    session.groupRole(props.groupId) === 'owner' ||
    (group.value !== null && group.value.owner_user_id === selfUserId.value),
)







const canManage = computed(() => session.canIn(props.groupId, 'admin'))





const canRename = computed(() => session.canIn(props.groupId, 'admin'))


const MAX_GROUP_NAME_LENGTH = 64

const renameOpen = ref(false)
const renameName = ref('')
const renaming = ref(false)
const renameError = ref<string | null>(null)
const renameInput = useTemplateRef<HTMLInputElement>('renameInput')

const trimmedRename = computed(() => renameName.value.trim())
const canSubmitRename = computed(
  () =>
    trimmedRename.value.length > 0 &&
    trimmedRename.value.length <= MAX_GROUP_NAME_LENGTH &&
    !renaming.value,
)


const renameErrorMessage = computed(() => {
  if (!renameError.value) return null
  const key = `errors.${renameError.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})

async function openRename(): Promise<void> {
  renameName.value = group.value?.name ?? ''
  renameError.value = null
  renameOpen.value = true
  
  await nextTick()
  renameInput.value?.focus()
}

function closeRename(): void {
  if (renaming.value) return
  renameOpen.value = false
}





async function submitRename(): Promise<void> {
  if (!canSubmitRename.value) return

  renaming.value = true
  renameError.value = null
  try {
    await api.renameGroup(props.groupId, trimmedRename.value)
    await session.load()
    renameOpen.value = false
  } catch (caught) {
    renameError.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    renaming.value = false
  }
}











const deleteOpen = ref(false)
const deleteConfirmName = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const deleteInput = useTemplateRef<HTMLInputElement>('deleteInput')





const canSubmitDelete = computed(() => {
  const current = group.value
  if (current === null || deleting.value) return false
  return deleteConfirmName.value.trim() === current.name
})


const deleteMismatch = computed(
  () => !deleting.value && deleteConfirmName.value.trim().length > 0 && !canSubmitDelete.value,
)


const deleteErrorMessage = computed(() => {
  if (!deleteError.value) return null
  const key = `errors.${deleteError.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})

async function openDelete(): Promise<void> {
  deleteConfirmName.value = ''
  deleteError.value = null
  deleteOpen.value = true
  
  await nextTick()
  deleteInput.value?.focus()
}

function closeDelete(): void {
  if (deleting.value) return
  deleteOpen.value = false
}








async function submitDelete(): Promise<void> {
  if (!canSubmitDelete.value) return

  deleting.value = true
  deleteError.value = null
  try {
    await api.deleteGroup(props.groupId)
    
    
    
    deleteOpen.value = false
    await session.load()
    await router.push('/console/groups')
  } catch (caught) {
    deleteError.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    deleting.value = false
  }
}

const tabs = computed(() => {
  const items: { id: Tab; label: string; show: boolean }[] = [
    { id: 'nodes', label: t('console.nodes'), show: true },
    { id: 'members', label: t('members.title'), show: membershipEnabled.value },
    {
      id: 'invites',
      label: t('invites.title'),
      show: membershipEnabled.value && canManage.value,
    },
    { id: 'audit', label: t('audit.title'), show: canManage.value },
  ]
  return items.filter((item) => item.show)
})


watch(tabs, (list) => {
  if (!list.some((item) => item.id === activeTab.value)) activeTab.value = 'nodes'
})

async function loadMembers(): Promise<void> {
  
  if (!membershipEnabled.value) {
    members.value = []
    membersError.value = null
    return
  }

  loadingMembers.value = true
  membersError.value = null
  try {
    members.value = await api.listMembers(props.groupId)
  } catch (caught) {
    membersError.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    loadingMembers.value = false
  }
}





const pendingTransfer = ref<PendingTransfer | null>(null)
const transferLoadError = ref<string | null>(null)







const transferEnded = ref(false)


watch(pendingTransfer, (next) => {
  if (next !== null) transferEnded.value = false
})







async function loadPendingTransfer(): Promise<void> {
  
  if (!membershipEnabled.value) {
    pendingTransfer.value = null
    transferLoadError.value = null
    return
  }

  transferLoadError.value = null
  try {
    const next = await api.pendingTransfer(props.groupId)
    if (pendingTransfer.value !== null && next === null) transferEnded.value = true
    pendingTransfer.value = next
  } catch (caught) {
    
    transferLoadError.value = caught instanceof ApiError ? caught.code : 'network_error'
  }
}







const isTransferRecipient = computed(() => {
  const current = pendingTransfer.value
  return current !== null && !('restricted' in current) && current.to_user_id === selfUserId.value
})
const showTransferPanel = computed(() => isOwner.value || isTransferRecipient.value)

onMounted(loadMembers)
watch(() => props.groupId, loadMembers)






watch(membershipEnabled, (enabled) => {
  if (enabled) void loadMembers()
  else {
    members.value = []
    membersError.value = null
  }
})



onMounted(loadPendingTransfer)
watch(() => props.groupId, loadPendingTransfer)
watch(activeTab, (tab) => {
  if (tab === 'members') void loadPendingTransfer()
})
</script>

<template>
  <div class="console-page mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-5">
    <div
      v-if="!group && session.loaded"
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
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="console-page__title text-[19px] font-semibold tracking-wide">{{ group.name }}</h1>

          <button
            v-if="canRename"
            type="button"
            data-testid="group-rename-open"
            class="console-btn press ml-auto inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-surface-3"
            :title="t('groupForm.renameTitle')"
            @click="openRename"
          >
            <ConsoleIcon name="Pencil" class="icon" />
            {{ t('groupForm.renameAction') }}
          </button>
        </div>

        
        <div class="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
          <span
            class="console-badge rounded-full border border-brand/35 bg-brand/15 px-2 py-0.5 text-[11px] text-brand-bright"
          >
            {{ t('group.youAre') }} {{ t(`roles.${group.role}`) }}
          </span>
          <span data-testid="group-owner">
            {{ t('group.ownerLabel') }}
            <span class="font-medium text-text-muted">{{ ownerName }}</span>
          </span>
          <span>·</span>
          <span>{{ t('group.groupIdLabel') }}</span>
          <span class="font-mono text-[11px] text-text-faint">{{ group.group_id }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="group-stats">
        <div
          v-for="item in stats"
          :key="item.key"
          class="console-card rounded-card border border-border-base bg-surface"
        >
          <div class="px-4 py-3">
            <div class="flex items-center gap-1.5 text-[11.5px] text-text-muted">
              <ConsoleIcon :name="item.icon" class="icon" />
              {{ t(item.key) }}
            </div>
            <div class="console-stat__value mt-1 text-[23px] font-bold tracking-tight" :class="item.tone">
              {{ item.value }}
            </div>
          </div>
        </div>
      </div>

      
      <div class="console-tabs flex flex-wrap gap-1.5 border-b border-border-base">
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          :data-testid="`tab-${item.id}`"
          :data-active="activeTab === item.id ? 'true' : 'false'"
          class="console-tabs__item press -mb-px border-b-2 px-3 py-2 text-[13px] transition"
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

      
      <NodeListPanel
        v-if="activeTab === 'nodes'"
        :key="groupId"
        :group-id="groupId"
        @counts="nodeCounts = $event"
      />

      
      <template v-else-if="activeTab === 'members' && membershipEnabled">
        <GroupMembersPanel
          :group-id="groupId"
          :members="members"
          :loading="loadingMembers"
          :error-code="membersError"
          :is-owner="isOwner"
          @changed="loadMembers"
        />

        <GroupTransferPanel
          v-if="showTransferPanel && membershipEnabled"
          v-model:pending="pendingTransfer"
          :group-id="groupId"
          :members="members"
          :is-owner="isOwner"
          :load-error="transferLoadError"
          :ended="transferEnded"
          @changed="loadMembers"
          @restart="transferEnded = false"
        />
      </template>

      
      <GroupInvitesPanel
        v-else-if="activeTab === 'invites' && membershipEnabled"
        :group-id="groupId"
        :members="members"
      />

      
      <GroupAuditPanel
        v-else-if="activeTab === 'audit'"
        :group-id="groupId"
        :group-name="group.name"
      />

      
      <div
        v-if="isOwner"
        data-testid="group-danger-zone"
        class="console-card mt-1 rounded-card border border-danger/30 bg-danger/12 px-4 py-3.5"
      >
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex items-center gap-2 text-[13.5px] font-semibold text-[#f5a9b0]">
              <ConsoleIcon name="TriangleAlert" class="icon" />
              {{ t('groupForm.deleteTitle') }}
            </div>
            <p class="text-[12px] leading-relaxed text-text-muted">
              {{ t('groupForm.deleteWarning') }}
            </p>
          </div>

          <button
            type="button"
            data-testid="group-delete-open"
            class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/40 bg-danger/12 px-2.5 py-1.5 text-[12px] font-medium text-[#f5a9b0] transition hover:bg-danger/20"
            :title="t('groupForm.deleteTitle')"
            @click="openDelete"
          >
            <ConsoleIcon name="Trash2" class="icon" />
            {{ t('groupForm.deleteAction') }}
          </button>
        </div>
      </div>
    </template>

    <div v-else class="text-[13px] text-text-muted">{{ t('common.loading') }}</div>

    
    <div
      v-if="renameOpen"
      data-testid="rename-dialog"
      class="console-scrim fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      @click.self="closeRename"
      @keydown.esc="closeRename"
    >
      <form
        class="console-dialog w-full max-w-md rounded-card border border-border-base bg-surface p-5 shadow-2xl"
        @submit.prevent="submitRename"
      >
        <h2 class="console-dialog__title text-[15.5px] font-semibold">{{ t('groupForm.renameTitle') }}</h2>

        <label class="mt-4 flex flex-col gap-1.5">
          <span class="text-[12px] text-text-muted">{{ t('groupForm.nameLabel') }}</span>
          <input
            ref="renameInput"
            v-model="renameName"
            data-testid="rename-name"
            :maxlength="MAX_GROUP_NAME_LENGTH"
            :placeholder="t('groupForm.namePlaceholder')"
            class="console-input rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[14px] outline-none focus:border-brand"
            autocomplete="off"
          />
        </label>
        <p class="mt-1.5 text-[11.5px] leading-relaxed text-text-faint">
          {{ t('groupForm.nameHint') }}
        </p>

        <div
          v-if="renameErrorMessage"
          data-testid="rename-error"
          class="console-note console-note--fail mt-3 rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-[#f5a9b0]"
        >
          {{ renameErrorMessage }}
        </div>

        <div class="console-dialog__foot mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px] font-medium transition hover:bg-surface-3"
            :disabled="renaming"
            @click="closeRename"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            data-testid="rename-submit"
            class="console-btn console-btn--accent btn-primary press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3.5 py-2 text-[12.5px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
            :disabled="!canSubmitRename"
          >
            <LoaderCircle v-if="renaming" class="icon animate-spin" />
            {{ renaming ? t('groupForm.renaming') : t('groupForm.rename') }}
          </button>
        </div>
      </form>
    </div>

    
    <div
      v-if="deleteOpen"
      data-testid="delete-dialog"
      class="console-scrim fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      @click.self="closeDelete"
      @keydown.esc="closeDelete"
    >
      <form
        class="console-dialog w-full max-w-md rounded-card border border-border-base bg-surface p-5 shadow-2xl"
        @submit.prevent="submitDelete"
      >
        <h2
          data-testid="delete-dialog-title"
          class="console-dialog__title flex items-center gap-2 text-[15.5px] font-semibold text-[#f5a9b0]"
        >
          <ConsoleIcon name="TriangleAlert" class="icon" />
          {{ t('groupForm.deleteTitle') }}
        </h2>

        <p class="mt-3 text-[12.5px] leading-relaxed text-text-muted">
          {{ t('groupForm.deleteWarning') }}
        </p>

        <label class="mt-4 flex flex-col gap-1.5">
          <span class="text-[12px] text-text-muted">
            {{ t('groupForm.deleteConfirmLabel', { name: group?.name ?? '' }) }}
          </span>
          <input
            ref="deleteInput"
            v-model="deleteConfirmName"
            data-testid="delete-confirm-name"
            :placeholder="t('groupForm.deletePlaceholder')"
            class="console-input rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[14px] outline-none focus:border-brand"
            autocomplete="off"
          />
        </label>
        <p
          v-if="deleteMismatch"
          data-testid="delete-mismatch"
          class="mt-1.5 text-[11.5px] leading-relaxed text-warn"
        >
          {{ t('groupForm.deleteMismatch') }}
        </p>

        <div
          v-if="deleteErrorMessage"
          data-testid="delete-error"
          class="console-note console-note--fail mt-3 rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-[#f5a9b0]"
        >
          {{ deleteErrorMessage }}
        </div>

        <div class="console-dialog__foot mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px] font-medium transition hover:bg-surface-3"
            :disabled="deleting"
            @click="closeDelete"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            data-testid="delete-submit"
            class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/50 bg-danger/15 px-3.5 py-2 text-[12.5px] font-medium text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
            :disabled="!canSubmitDelete"
          >
            <LoaderCircle v-if="deleting" class="icon animate-spin" />
            {{ deleting ? t('groupForm.deleting') : t('groupForm.deleteSubmit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
