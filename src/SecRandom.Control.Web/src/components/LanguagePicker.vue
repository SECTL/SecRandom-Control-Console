<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Languages } from '@lucide/vue'
import { SUPPORTED_LOCALES, currentLocale, isAppLocale, setLocale, type AppLocale } from '@/i18n'
import ClientSelect from '@/components/client/fluent/ClientSelect.vue'















const { t } = useI18n()

const labels: Record<AppLocale, string> = {
  'zh-CN': 'language.zhCN',
  'en-US': 'language.enUS',
  'ja-JP': 'language.jaJP',
}


const options = computed(() =>
  SUPPORTED_LOCALES.map((item) => ({ value: item as string, label: t(labels[item]) })),
)

function onChange(next: string): void {
  
  if (isAppLocale(next)) setLocale(next)
}
</script>

<template>
  
  <label class="group relative inline-flex items-center gap-1.5">
    
    <Languages
      class="icon text-text-muted transition-colors duration-200 group-hover:text-brand-bright"
    />
    <span class="sr-only">{{ t('language.label') }}</span>
    
    <span class="hidden sm:inline-flex">
      <ClientSelect
        :model-value="currentLocale"
        :options="options"
        :label="t('language.label')"
        data-testid="language-select"
        @update:model-value="onChange"
      />
    </span>
  </label>
</template>
