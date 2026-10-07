<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LogIn } from '@lucide/vue'
import { useSessionStore } from '@/stores/session'
import LanguagePicker from '@/components/LanguagePicker.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AccountMenu from '@/components/AccountMenu.vue'










const { t } = useI18n()
const session = useSessionStore()
const route = useRoute()
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-border-base bg-surface-bg/85 backdrop-blur-md">
    <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5">
      
      <RouterLink to="/" class="flex flex-none items-center gap-2.5 transition hover:opacity-85">
        <img src="/favicon-32.png" alt="" class="h-8 w-8 flex-none rounded-lg" />
        <div class="min-w-0">
          <div class="text-[15px] font-semibold tracking-wide whitespace-nowrap">
            {{ t('common.appName') }}
          </div>
          <div
            class="hidden text-[10.5px] tracking-widest text-text-faint uppercase sm:block"
          >
            {{ t('common.appSubtitle') }}
          </div>
        </div>
      </RouterLink>

      <nav class="ml-auto flex min-w-0 flex-none items-center gap-1">
        <ThemeToggle />
        <LanguagePicker />

        
        <AccountMenu v-if="session.isSignedIn" variant="topbar" />

        
        <RouterLink
          v-else-if="route.name !== 'login'"
          :to="{ name: 'login' }"
          :aria-label="t('home.signIn')"
          class="press btn-primary ml-0.5 inline-flex flex-none items-center gap-1.5 rounded-control border border-brand bg-brand px-2.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-hover sm:ml-1 sm:px-3.5"
        >
          <LogIn class="icon" />
          
          <span class="hidden sm:inline">{{ t('home.signIn') }}</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
