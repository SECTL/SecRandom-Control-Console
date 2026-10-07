<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, FileQuestion } from '@lucide/vue'
import LanguagePicker from '@/components/LanguagePicker.vue'

const { t } = useI18n()
</script>

<template>
  <div class="brand-glow dot-grid-fade flex min-h-screen flex-col">
    <header class="relative z-10 flex h-14 flex-none items-center px-5">
      <RouterLink
        to="/"
        class="press inline-flex items-center gap-2 text-[12.5px] text-text-muted transition hover:text-text-base"
      >
        <ArrowLeft class="icon transition-transform duration-200 hover:-translate-x-0.5" />
        {{ t('common.backToHome') }}
      </RouterLink>
      <div class="ml-auto">
        <LanguagePicker />
      </div>
    </header>

    <main class="relative flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
      <span class="hero-orb hero-orb--b" aria-hidden="true" />

      <div
        class="icon-halo reveal grid h-16 w-16 place-items-center rounded-full border border-border-base bg-surface"
        data-reveal
      >
        <FileQuestion class="h-7 w-7 text-text-faint" />
      </div>
      <h1 class="reveal text-[17px] font-semibold" data-reveal>{{ t('notFound.title') }}</h1>
      <p class="reveal text-[12.5px] text-text-muted" data-reveal>{{ t('notFound.desc') }}</p>
      <RouterLink
        to="/"
        class="btn-primary press reveal mt-2 rounded-control border border-brand bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-hover"
        data-reveal
      >
        {{ t('common.backToHome') }}
      </RouterLink>
    </main>
  </div>
</template>
