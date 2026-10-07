<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'
import { LogOut, LoaderCircle } from '@lucide/vue'
import { useSessionStore } from '@/stores/session'
import { useSignOut } from '@/composables/useSignOut'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
















const props = withDefaults(defineProps<{ variant?: 'sidebar' | 'topbar' }>(), {
  variant: 'sidebar',
})

const { t } = useI18n()
const session = useSessionStore()
const route = useRoute()
const { signingOut, failed, signOut, reset } = useSignOut()

const isTopBar = computed(() => props.variant === 'topbar')

const open = ref(false)

const avatarFailed = ref(false)

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const displayName = computed(() => session.user?.display_name || session.user?.user_id || '')
const initial = computed(() => displayName.value.slice(0, 1) || '?')

const triggerClass = computed(() =>
  isTopBar.value
    ? 'console-account__trigger press flex items-center gap-2 rounded-control px-1.5 py-1 transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none'
    : 'console-account__trigger press flex w-full items-center gap-2.5 rounded-control px-1 py-1 text-left transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none',
)

const panelClass = computed(() =>
  isTopBar.value
    ? 'console-popover popover-in popover-in--down absolute top-full right-0 z-30 mt-1 min-w-[11rem] overflow-hidden rounded-card border border-border-strong bg-surface-2 py-1 shadow-xl shadow-black/40'
    : 'console-popover popover-in absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-card border border-border-strong bg-surface-2 py-1 shadow-xl shadow-black/40',
)

const itemClass =
  'console-menu__item press flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] text-text-muted transition hover:bg-surface-3 hover:text-text-base focus-visible:bg-surface-3 focus-visible:text-text-base focus-visible:outline-none disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent'

function toggle(): void {
  open.value = !open.value
  if (open.value) reset()
}

function close(restoreFocus = false): void {
  if (!open.value) return
  open.value = false
  if (restoreFocus) trigger.value?.focus()
}


onClickOutside(root, () => close())


function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (next && root.value?.contains(next)) return
  close()
}


watch(() => route.fullPath, () => close())
</script>

<template>
  <div ref="root" class="relative" @keydown.esc.stop.prevent="close(true)" @focusout="onFocusOut">
    <button
      ref="trigger"
      type="button"
      :class="triggerClass"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-controls="account-menu"
      @click="toggle"
    >
      
      <img
        v-if="session.user?.avatar_url && !avatarFailed"
        :src="session.user.avatar_url"
        alt=""
        referrerpolicy="no-referrer"
        class="h-7 w-7 flex-none rounded-full object-cover"
        @error="avatarFailed = true"
      />
      <span
        v-else
        class="grid h-7 w-7 flex-none place-items-center rounded-full bg-gradient-to-br from-brand to-brand-bright text-[11px] font-bold text-white"
      >
        {{ initial }}
      </span>

      
      <span v-if="!isTopBar" class="min-w-0 flex-1">
        <span class="block truncate text-[12.5px] font-medium">{{ displayName }}</span>
        <span class="block text-[11px] text-text-faint">{{ t('console.signedInViaSectl') }}</span>
      </span>
      
      <span v-else class="hidden max-w-[9rem] truncate text-[12.5px] font-medium sm:block">{{ displayName }}</span>

      <ConsoleIcon
        :name="isTopBar ? 'ChevronDown' : 'ChevronUp'"
        class="icon text-text-faint transition"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    
    <div
      v-if="open"
      id="account-menu"
      role="menu"
      :aria-label="t('account.menu')"
      :class="panelClass"
    >
      
      <RouterLink v-if="isTopBar" to="/console" role="menuitem" :class="itemClass" @click="close()">
        <ConsoleIcon name="LayoutDashboard" class="icon" />
        {{ t('home.enterConsole') }}
      </RouterLink>

      
      <button type="button" role="menuitem" :class="itemClass" :disabled="signingOut" @click="signOut">
        <LoaderCircle v-if="signingOut" class="icon animate-spin" />
        <LogOut v-else class="icon" />
        {{ signingOut ? t('account.signingOut') : t('auth.signOut') }}
      </button>

      <p
        v-if="failed"
        class="px-2.5 pt-1 pb-0.5 text-[11px] leading-relaxed text-danger"
        role="alert"
      >
        {{ t('account.signOutFailed') }}
      </p>
    </div>
  </div>
</template>
