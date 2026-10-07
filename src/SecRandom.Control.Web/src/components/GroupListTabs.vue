<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'


export type GroupListTab = 'owned' | 'joined'







const props = defineProps<{
  modelValue: GroupListTab
  
  testIdPrefix: string
  
  stretch?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [GroupListTab] }>()

const { t } = useI18n()
const session = useSessionStore()

const tabs = computed(() => [
  { id: 'owned' as const, label: t('console.myGroups'), count: session.ownedGroupCount },
  { id: 'joined' as const, label: t('console.joinedGroups'), count: session.joinedGroups.length },
])
</script>

<template>
  
  <div
    class="console-segment flex gap-0.5 rounded-control bg-surface-2 p-0.5"
    role="tablist"
    :aria-label="t('console.myGroups')"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :data-testid="`${props.testIdPrefix}-tab-${tab.id}`"
      :aria-selected="modelValue === tab.id"
      class="console-segment__item press flex items-center justify-center gap-1 rounded-[5px] px-2 py-1 text-[11.5px] transition"
      :class="[
        modelValue === tab.id
          ? 'bg-surface font-medium text-text-base shadow-sm'
          : 'text-text-muted hover:text-text-base',
        props.stretch ? 'flex-1' : '',
      ]"
      @click="emit('update:modelValue', tab.id)"
    >
      <span class="truncate">{{ tab.label }}</span>
      <span
        class="console-segment__count rounded-full bg-surface-3 px-1 text-[10px] tabular-nums"
        :class="modelValue === tab.id ? 'text-text-muted' : 'text-text-faint'"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>
