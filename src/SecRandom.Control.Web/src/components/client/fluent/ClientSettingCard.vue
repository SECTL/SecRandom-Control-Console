<script setup lang="ts">
import { computed, useSlots } from 'vue'
import FluentIcon from './FluentIcon.vue'
import ClientRowMarks from './ClientRowMarks.vue'















const props = defineProps<{
  title: string
  description?: string | null
  
  icon: string
  
  disabled?: boolean
  
  readonly?: boolean
  
  unread?: boolean
  
  dirty?: boolean
  
  expanded?: boolean
  
  hasExtra?: boolean
  testId?: string | null
}>()

const emit = defineEmits<{ 'toggle-expand': [] }>()

const slots = useSlots()

const canExpand = computed(() => props.hasExtra === true || slots.extra !== undefined)
const collapsed = computed(() => canExpand.value && props.expanded !== true)
</script>

<template>
  <div
    class="client-ui cn-expander"
    :class="{ 'cn-expander--collapsed': collapsed, 'cn-expander--disabled': props.disabled === true }"
    :data-testid="props.testId ?? undefined"
  >
    <div class="cn-expander__header">
      <FluentIcon class="cn-expander__icon" :name="props.icon" :size="20" />

      <div class="cn-expander__text">
        <span class="cn-expander__title">{{ props.title }}</span>
        <span v-if="props.description" class="cn-expander__desc">{{ props.description }}</span>
      </div>

      <div class="cn-expander__footer">
        <slot name="control" />
        <ClientRowMarks
          :readonly="props.readonly === true"
          :unread="props.unread === true"
          :dirty="props.dirty === true"
        />
        <button
          v-if="canExpand"
          type="button"
          class="cn-expander__chevron"
          :aria-expanded="props.expanded === true"
          :aria-label="props.title"
          :data-testid="props.testId === null || props.testId === undefined ? undefined : `${props.testId}-chevron`"
          @click="emit('toggle-expand')"
        >
          <FluentIcon name="chevronDown" :size="12" />
        </button>
      </div>
    </div>

    <div v-if="canExpand" class="cn-expander__items">
      <slot name="extra" />
    </div>
  </div>
</template>
