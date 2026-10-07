<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LoaderCircle, ShieldCheck, UserRound } from '@lucide/vue'
import { api, ApiError } from '@/api/client'
import { GROUP_ROLE_RANK, type GroupRole, type MemberDto } from '@/api/protocol'
import { displayName } from '@/utils/display-name'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import ClientSelect from '@/components/client/fluent/ClientSelect.vue'

const props = defineProps<{
  groupId: string
  members: MemberDto[]
  loading: boolean
  errorCode: string | null
  isOwner: boolean
}>()

const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()

const busyUserId = ref<string | null>(null)
const errorCode = ref<string | null>(null)
const confirmRemove = ref<MemberDto | null>(null)







const avatarFailed = ref<Set<string>>(new Set())


function avatarUrl(member: MemberDto): string | undefined {
  if (avatarFailed.value.has(member.user_id)) return undefined

  const url = member.avatar_url?.trim()
  return url !== undefined && url.length > 0 ? url : undefined
}


function initial(member: MemberDto): string {
  return displayName(member.display_name, member.user_id).slice(0, 1) || '?'
}


function markAvatarFailed(member: MemberDto): void {
  avatarFailed.value.add(member.user_id)
}







const assignableRoles = computed<GroupRole[]>(() => {
  const self = props.members.find((member) => member.is_self)
  const selfRank = self ? GROUP_ROLE_RANK[self.role] : -1
  return (['viewer', 'operator', 'admin'] as GroupRole[]).filter(
    (role) => GROUP_ROLE_RANK[role] < selfRank,
  )
})


function canManage(member: MemberDto): boolean {
  if (member.is_self) return false
  if (member.role === 'owner') return false
  const self = props.members.find((item) => item.is_self)
  if (!self) return false
  return GROUP_ROLE_RANK[self.role] > GROUP_ROLE_RANK[member.role]
}









function roleOptions(member: MemberDto): { value: string; label: string }[] {
  const roles = assignableRoles.value.includes(member.role)
    ? assignableRoles.value
    : [member.role, ...assignableRoles.value]
  return roles.map((role) => ({ value: role, label: t(`roles.${role}`) }))
}

const errorMessage = computed(() => {
  if (!errorCode.value) return null
  const key = `errors.${errorCode.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})

async function changeRole(member: MemberDto, role: GroupRole): Promise<void> {
  if (role === member.role) return

  busyUserId.value = member.user_id
  errorCode.value = null
  try {
    await api.changeMemberRole(props.groupId, member.user_id, role)
    emit('changed')
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    busyUserId.value = null
  }
}

async function remove(member: MemberDto): Promise<void> {
  busyUserId.value = member.user_id
  errorCode.value = null
  try {
    await api.removeMember(props.groupId, member.user_id)
    confirmRemove.value = null
    emit('changed')
  } catch (caught) {
    errorCode.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    busyUserId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="console-panel rounded-card border border-border-base bg-surface">
      <div class="flex items-center gap-2 border-b border-border-base px-4 py-3">
        <h2 class="text-[14px] font-semibold">{{ t('members.title') }}</h2>
        <span class="console-badge rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-muted">
          {{ members.length }}
        </span>
      </div>

      <div v-if="loading" class="px-4 py-8 text-center text-[13px] text-text-muted">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="members.length === 0" class="console-empty m-3">
        <p class="text-[13px]">{{ t('members.empty') }}</p>
      </div>

      <ul v-else class="console-divide divide-y divide-border-base">
        <li
          v-for="member in members"
          :key="member.user_id"
          class="console-list__row flex flex-wrap items-center gap-3 px-4 py-3"
        >
          
          <img
            v-if="avatarUrl(member)"
            :src="avatarUrl(member)"
            alt=""
            referrerpolicy="no-referrer"
            class="h-8 w-8 flex-none rounded-full border border-border-base object-cover"
            @error="markAvatarFailed(member)"
          />
          <span
            v-else-if="member.display_name?.trim()"
            class="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-brand to-brand-bright text-[12px] font-bold text-white"
            aria-hidden="true"
          >
            {{ initial(member) }}
          </span>
          <div
            v-else
            class="grid h-8 w-8 flex-none place-items-center rounded-full border border-border-base bg-surface-2"
          >
            <UserRound class="icon text-text-muted" />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2 text-[13.5px] font-medium">
              <span class="truncate">{{ displayName(member.display_name, member.user_id) }}</span>
              <span
                v-if="member.is_self"
                class="rounded-full border border-brand/35 bg-brand/15 px-1.5 text-[10.5px] text-brand-bright"
              >
                {{ t('members.you') }}
              </span>
            </div>
            <div class="font-mono text-[11px] text-text-faint">{{ member.user_id }}</div>
          </div>

          
          <span
            v-if="member.role === 'owner'"
            class="ml-auto inline-flex items-center gap-1.5 rounded-full border border-privileged/35 bg-privileged/15 px-2 py-0.5 text-[11px] text-privileged"
            :title="t('members.ownerBadgeHint')"
          >
            <ShieldCheck class="icon" />
            {{ t('roles.owner') }}
          </span>

          <template v-else>
            
            <span v-if="canManage(member)" class="ml-auto inline-flex">
              <ClientSelect
                :model-value="member.role"
                :options="roleOptions(member)"
                :disabled="busyUserId === member.user_id"
                :label="t('members.changeRole')"
                :data-testid="`member-role-${member.user_id}`"
                @update:model-value="(role) => changeRole(member, role as GroupRole)"
              />
            </span>
            <span
              v-else
              class="ml-auto rounded-full border border-border-strong bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted"
            >
              {{ t(`roles.${member.role}`) }}
            </span>

            <button
              v-if="canManage(member)"
              type="button"
              class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger/30 bg-danger/12 px-2.5 py-1 text-[11.5px] text-[#f5a9b0] transition hover:bg-danger/20 disabled:opacity-45"
              :disabled="busyUserId === member.user_id"
              @click="confirmRemove = member"
            >
              <LoaderCircle v-if="busyUserId === member.user_id" class="icon animate-spin" />
              <ConsoleIcon v-else name="Trash2" class="icon" />
              {{ t('members.remove') }}
            </button>
          </template>
        </li>
      </ul>

      <p
        v-if="isOwner"
        class="border-t border-border-base px-4 py-2.5 text-[11.5px] leading-relaxed text-text-faint"
      >
        {{ t('members.ownerBadgeHint') }}
      </p>
    </div>

    <div
      v-if="errorMessage"
      data-testid="members-error"
      class="console-note console-note--fail rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-[#f5a9b0]"
    >
      {{ errorMessage }}
    </div>

    
    <div
      v-if="confirmRemove"
      data-testid="remove-confirm"
      class="console-scrim fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      @click.self="confirmRemove = null"
    >
      <div class="console-dialog w-full max-w-md rounded-card border border-border-base bg-surface p-5">
        <h3 class="console-dialog__title text-[15px] font-semibold">{{ t('members.removeConfirmTitle') }}</h3>
        <p class="mt-2 text-[12.5px] leading-relaxed text-text-muted">
          {{ t('members.removeConfirmBody') }}
        </p>
        <p class="mt-2 font-mono text-[11.5px] text-text-faint">
          {{ displayName(confirmRemove.display_name, confirmRemove.user_id) }}
        </p>
        <div class="console-dialog__foot mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px]"
            @click="confirmRemove = null"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            data-testid="remove-confirm-yes"
            class="console-btn console-btn--danger press inline-flex items-center gap-1.5 rounded-control border border-danger bg-danger px-3.5 py-2 text-[12.5px] font-medium text-white"
            :disabled="busyUserId === confirmRemove.user_id"
            @click="remove(confirmRemove)"
          >
            {{ t('members.remove') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
