<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Moon, Sun } from '@lucide/vue'
import { currentTheme, toggleTheme } from '@/theme'







const { t } = useI18n()

const isDark = computed(() => currentTheme.value === 'dark')
const label = computed(() => (isDark.value ? t('theme.toLight') : t('theme.toDark')))
</script>

<template>
  
  <button
    type="button"
    class="console-icon-btn grid h-8 w-8 flex-none place-items-center rounded-control text-text-muted transition hover:bg-surface-2 hover:text-text-base"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" class="icon" />
    <Moon v-else class="icon" />
  </button>
</template>
