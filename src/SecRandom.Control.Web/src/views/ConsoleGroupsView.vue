<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LoaderCircle } from '@lucide/vue'
import { api, ApiError } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import GroupCard from '@/components/GroupCard.vue'
import GroupListTabs, { type GroupListTab } from '@/components/GroupListTabs.vue'

const { t } = useI18n()
const session = useSessionStore()
const setup = useSetupStore()
const router = useRouter()






const showJoinEntry = computed(() => setup.membershipEnabled)


const activeList = ref<GroupListTab>('owned')
const listPicked = ref(false)

watch(activeList, () => {
  listPicked.value = true
})





watch(
  () => session.loaded && session.groups.length > 0,
  (ready) => {
    if (ready && !listPicked.value && session.ownedGroups.length === 0 && session.joinedGroups.length > 0)
      activeList.value = 'joined'
  },
  { immediate: true },
)



const dialogOpen = ref(false)
const groupName = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')





const MAX_NAME_LENGTH = 64

const trimmedName = computed(() => groupName.value.trim())
const canSubmit = computed(
  () => trimmedName.value.length > 0 && trimmedName.value.length <= MAX_NAME_LENGTH && !creating.value,
)

async function openDialog(): Promise<void> {
  createError.value = null
  groupName.value = ''
  dialogOpen.value = true
  
  await nextTick()
  nameInput.value?.focus()
}

function closeDialog(): void {
  if (creating.value) return
  dialogOpen.value = false
}




async function submit(): Promise<void> {
  if (!canSubmit.value) return

  creating.value = true
  createError.value = null
  try {
    const group = await api.createGroup(trimmedName.value)
    
    await session.load()
    dialogOpen.value = false
    await router.push(`/console/groups/${group.group_id}`)
  } catch (caught) {
    
    createError.value = caught instanceof ApiError ? caught.code : 'network_error'
  } finally {
    creating.value = false
  }
}


const createErrorMessage = computed(() => {
  if (!createError.value) return null
  const key = `errors.${createError.value}`
  const translated = t(key)
  return translated === key ? t('errors.unknown') : translated
})
</script>

<template>
  <div class="console-page mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 p-5">
    <div class="flex items-end gap-3">
      <h1 class="console-page__title text-[19px] font-semibold tracking-wide">{{ t('console.myGroups') }}</h1>

      
      <span
        v-if="session.groupLimit !== null"
        data-testid="groups-quota"
        class="console-badge mb-0.5 rounded-full border border-border-base bg-surface-2 px-2 py-0.5 text-[11.5px] tabular-nums"
        :class="session.groupLimitReached ? 'text-warn' : 'text-text-muted'"
        :title="t('console.groupQuotaHint')"
      >
        {{ session.ownedGroupCount }} / {{ session.groupLimit }}
      </span>

      
      <div v-if="session.hasGroups" class="ml-auto flex gap-2">
        <RouterLink
          v-if="showJoinEntry"
          to="/join"
          data-testid="join-quick-entry"
          class="console-btn btn-ghost press inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-3 py-1.5 text-[12.5px] font-medium hover:bg-surface-3"
        >
          <ConsoleIcon name="Ticket" class="icon" />
          {{ t('console.joinWithCode') }}
        </RouterLink>
        <button
          type="button"
          class="console-btn console-btn--accent btn-primary press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-hover"
          @click="openDialog"
        >
          <ConsoleIcon name="Plus" class="icon" />
          {{ t('console.createGroup') }}
        </button>
      </div>
    </div>

    
    <div v-if="!session.loaded || session.loading" class="flex flex-col gap-3">
      <span class="sr-only">{{ t('common.loading') }}</span>
      <div class="grid gap-3 sm:grid-cols-2" aria-hidden="true">
        <div class="shimmer h-[74px]" />
        <div class="shimmer h-[74px]" />
      </div>
    </div>

    
    <div
      v-else-if="!session.hasGroups"
      data-testid="groups-empty"
      class="flex flex-1 items-center justify-center pb-8"
    >
      <div class="w-full max-w-2xl text-center">
        <div
          class="console-empty__icon icon-halo reveal mx-auto grid h-11 w-11 place-items-center rounded-full border border-border-base bg-surface"
          data-reveal
        >
          <ConsoleIcon name="Monitor" class="icon text-text-faint" />
        </div>
        <h2 class="reveal mt-4 text-[17px] font-semibold tracking-wide" data-reveal>
          {{ t('console.emptyTitle') }}
        </h2>
        <p
          class="reveal mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-text-muted"
          data-reveal
        >
          {{ t('console.myGroupsEmpty') }}
        </p>

        <div
          class="mt-6 grid gap-3 text-left"
          :class="showJoinEntry ? 'sm:grid-cols-2' : 'sm:grid-cols-1'"
          data-testid="groups-empty-entries"
        >
          
          <div
            v-if="showJoinEntry"
            class="console-card reveal rounded-card border border-border-base bg-surface"
          >
            <RouterLink
              to="/join"
              data-testid="join-entry"
              class="group flex flex-col px-4 py-4"
              data-reveal
            >
              <div class="flex items-center gap-2">
                <ConsoleIcon name="Ticket" class="icon text-brand-bright" />
                <div class="text-[14px] font-semibold">{{ t('console.joinCardTitle') }}</div>
                <ConsoleIcon
                  name="ArrowRight"
                  class="icon ml-auto -translate-x-1 text-brand-bright opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </div>
              <p class="mt-2 text-[12px] leading-relaxed text-text-muted">
                {{ t('join.subtitle') }}
              </p>
              <div class="mt-3 flex flex-col gap-1.5 text-[12px] text-text-faint">
                <span class="flex items-center gap-2">
                  <ConsoleIcon name="Ticket" class="icon" />
                  {{ t('console.joinWithCode') }}
                </span>
                <span class="flex items-center gap-2">
                  <ConsoleIcon name="Link2" class="icon" />
                  {{ t('join.pasteLinkLabel') }}
                </span>
              </div>
            </RouterLink>
          </div>

          
          <div class="console-card reveal rounded-card border border-border-base bg-surface">
            <button
              type="button"
              data-testid="create-entry"
              class="press group flex w-full flex-col px-4 py-4 text-left"
              data-reveal
              @click="openDialog"
            >
              <div class="flex items-center gap-2">
                <ConsoleIcon name="Plus" class="icon text-brand-bright" />
                <div class="text-[14px] font-semibold">{{ t('console.createGroup') }}</div>
                <ConsoleIcon
                  name="ArrowRight"
                  class="icon ml-auto -translate-x-1 text-brand-bright opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </div>
              <p class="mt-2 text-[12px] leading-relaxed text-text-muted">
                {{ t('console.createCardDesc') }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      
      <GroupListTabs v-model="activeList" test-id-prefix="home" />

      <div v-if="activeList === 'owned'">
        <div
          v-if="session.ownedGroups.length > 0"
          data-testid="owned-groups"
          class="grid gap-3 sm:grid-cols-2"
        >
          <GroupCard v-for="group in session.ownedGroups" :key="group.group_id" :group="group" />
        </div>

        <p
          v-else
          data-testid="owned-groups-empty"
          class="rounded-card border border-dashed border-border-base px-4 py-3 text-[12.5px] text-text-faint"
        >
          {{ t('console.noOwnedGroups') }}
        </p>
      </div>

      <div v-else>
        <div
          v-if="session.joinedGroups.length > 0"
          data-testid="joined-groups"
          class="grid gap-3 sm:grid-cols-2"
        >
          <GroupCard v-for="group in session.joinedGroups" :key="group.group_id" :group="group" />
        </div>

        <p
          v-else
          data-testid="joined-groups-empty"
          class="rounded-card border border-dashed border-border-base px-4 py-3 text-[12.5px] text-text-faint"
        >
          {{ t('console.noJoinedGroups') }}
        </p>
      </div>
    </template>

    
    <div
      v-if="dialogOpen"
      data-testid="create-dialog"
      class="console-scrim fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      @click.self="closeDialog"
      @keydown.esc="closeDialog"
    >
      <form
        class="console-dialog w-full max-w-md rounded-card border border-border-base bg-surface p-5 shadow-2xl"
        @submit.prevent="submit"
      >
        <h2 class="console-dialog__title text-[15.5px] font-semibold">{{ t('groupForm.createTitle') }}</h2>

        <label class="mt-4 flex flex-col gap-1.5">
          <span class="text-[12px] text-text-muted">{{ t('groupForm.nameLabel') }}</span>
          <input
            ref="nameInput"
            v-model="groupName"
            data-testid="group-name"
            :maxlength="MAX_NAME_LENGTH"
            :placeholder="t('groupForm.namePlaceholder')"
            class="console-input rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[14px] outline-none focus:border-brand"
            autocomplete="off"
          />
        </label>
        <p class="mt-1.5 text-[11.5px] leading-relaxed text-text-faint">
          {{ t('groupForm.nameHint') }}
        </p>

        <div
          v-if="createErrorMessage"
          data-testid="create-error"
          class="console-note console-note--fail mt-3 rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-[#f5a9b0]"
        >
          {{ createErrorMessage }}
        </div>

        <div class="console-dialog__foot mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="console-btn press rounded-control border border-border-strong bg-surface-2 px-3.5 py-2 text-[12.5px] font-medium transition hover:bg-surface-3"
            :disabled="creating"
            @click="closeDialog"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            data-testid="create-submit"
            class="console-btn console-btn--accent btn-primary press inline-flex items-center gap-1.5 rounded-control border border-brand bg-brand px-3.5 py-2 text-[12.5px] font-medium text-white transition hover:bg-brand-hover disabled:opacity-45"
            :disabled="!canSubmit"
          >
            <LoaderCircle v-if="creating" class="icon animate-spin" />
            {{ creating ? t('groupForm.creating') : t('groupForm.create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
