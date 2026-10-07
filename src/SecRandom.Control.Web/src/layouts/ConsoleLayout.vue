<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from '@lucide/vue'
import { ApiError } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import GroupListTabs, { type GroupListTab } from '@/components/GroupListTabs.vue'
import GroupNavSection from '@/components/GroupNavSection.vue'
import LanguagePicker from '@/components/LanguagePicker.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AccountMenu from '@/components/AccountMenu.vue'
import ScrollProgress from '@/components/ScrollProgress.vue'

const { t } = useI18n()
const session = useSessionStore()
const route = useRoute()





const isConsoleHome = computed(() => route.path === '/console')

const tab = ref<GroupListTab>('owned')

const tabPicked = ref(false)


watch(tab, () => {
  tabPicked.value = true
})






watch(
  () => session.loaded && session.groups.length > 0,
  (ready) => {
    if (ready && !tabPicked.value && session.ownedGroups.length === 0 && session.joinedGroups.length > 0)
      tab.value = 'joined'
  },
  { immediate: true },
)


const orderError = ref<string | null>(null)

async function commitOrder(orderedIds: string[]): Promise<void> {
  orderError.value = null

  
  const ownedIds =
    tab.value === 'owned' ? orderedIds : session.ownedGroups.map((group) => group.group_id)
  const joinedIds =
    tab.value === 'joined' ? orderedIds : session.joinedGroups.map((group) => group.group_id)

  try {
    await session.saveGroupOrder([...ownedIds, ...joinedIds])
  } catch (caught) {
    const code = caught instanceof ApiError ? caught.code : 'network_error'
    const key = `errors.${code}`
    const translated = t(key)
    orderError.value = translated === key ? t('errors.unknown') : translated
  }
}
</script>

<template>
  <div class="console-shell flex min-h-screen">
    <ScrollProgress />

    
    <aside
      class="console-shell__aside sticky top-0 flex h-screen w-60 flex-none flex-col gap-4 overflow-y-auto border-r border-border-base bg-surface px-3 py-3.5"
    >
      <RouterLink
        to="/"
        class="console-brand flex items-center gap-2.5 border-b border-border-base px-2 pb-3.5 transition duration-200 hover:opacity-85"
      >
        <img src="/favicon-32.png" alt="" class="h-7 w-7 rounded-[7px]" />
        <div>
          <div class="console-brand__name text-sm font-semibold tracking-wide">{{ t('common.appName') }}</div>
          <div class="console-brand__sub text-[11px] text-text-faint">{{ t('common.appSubtitle') }}</div>
        </div>
      </RouterLink>

      <nav class="console-shell__nav flex flex-col gap-0.5">
        
        <RouterLink
          v-if="!isConsoleHome"
          to="/console"
          data-testid="console-home"
          class="console-nav__item nav-item flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-[13px] text-text-muted hover:bg-surface-2 hover:text-text-base"
        >
          <ConsoleIcon name="ArrowLeft" class="icon transition duration-200" />
          <span class="truncate">{{ t('console.backToConsoleHome') }}</span>
        </RouterLink>

        
        <GroupListTabs v-model="tab" test-id-prefix="sidebar" stretch class="mt-1" />

        
        <p
          v-if="tab === 'owned' && session.groupLimit !== null"
          data-testid="sidebar-group-quota"
          class="px-2 text-[10.5px] tabular-nums"
          :class="session.groupLimitReached ? 'text-warn' : 'text-text-faint'"
          :title="t('console.groupQuotaHint')"
        >
          {{ session.ownedGroupCount }} / {{ session.groupLimit }}
        </p>

        <GroupNavSection
          :groups="tab === 'owned' ? session.ownedGroups : session.joinedGroups"
          :empty-hint="tab === 'owned' ? t('console.noOwnedGroups') : t('console.noJoinedGroups')"
          :test-id="tab === 'owned' ? 'owned' : 'joined'"
          @commit="commitOrder"
        />

        
        <p
          v-if="orderError"
          data-testid="group-order-error"
          class="rounded-control border border-danger/30 bg-danger/12 px-2 py-1.5 text-[11px] leading-relaxed text-[#f5a9b0]"
        >
          {{ orderError }}
        </p>

        <p
          v-if="!session.hasGroups && session.loaded"
          class="px-2.5 py-2 text-[12px] leading-relaxed text-text-faint"
        >
          {{ t('console.myGroupsEmpty') }}
        </p>
      </nav>

      <div class="console-shell__footer mt-auto flex flex-col gap-2 border-t border-border-base pt-3">
        
        <div class="flex items-center gap-1 px-1">
          <ThemeToggle />
          <LanguagePicker />
        </div>

        
        <AccountMenu v-if="session.isSignedIn" />

        <div
          v-else-if="session.serviceUnavailable"
          class="console-note console-note--fail flex items-start gap-2 rounded-control border border-danger/30 bg-danger/12 p-2 text-[11px] leading-relaxed text-danger"
        >
          
          <TriangleAlert class="icon mt-0.5" />
          <span>{{ t('auth.errors.service_unavailable') }}</span>
        </div>

        <p v-else-if="session.loaded" class="px-1 text-[11.5px] text-text-faint">
          {{ t('console.notSignedIn') }}
        </p>
        <p v-else class="px-1 text-[11.5px] text-text-faint">
          {{ t('console.checkingSession') }}
        </p>

        <p class="px-1 text-[10.5px] leading-relaxed text-text-faint">
          {{ t('console.fontCredits') }}
        </p>
      </div>
    </aside>

    <div class="console-shell__main flex min-w-0 flex-1 flex-col">
      <RouterView />
    </div>
  </div>
</template>
