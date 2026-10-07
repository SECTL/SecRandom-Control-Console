<script setup lang="ts">
import { useSlots } from 'vue'
import FluentIcon from './FluentIcon.vue'
import type { ClientCommand } from './client-model'











const props = defineProps<{
  commands: readonly ClientCommand[]
  
  leading?: boolean
  
  label?: string
}>()

const emit = defineEmits<{ run: [id: string] }>()

const slots = useSlots()


const showLeading = (): boolean => props.leading === true || slots.leading !== undefined
</script>

<template>
  <div class="client-ui cn-cmdbar-card">
    <div class="cn-cmdbar" role="toolbar" :aria-label="props.label ?? undefined">
      <div v-if="showLeading()" class="cn-cmdbar__leading">
        <slot name="leading" />
      </div>

      <template v-for="(command, index) in props.commands" :key="command.id">
        <span
          v-if="command.separatorBefore === true && (index > 0 || showLeading())"
          class="cn-cmdbar__sep"
          role="separator"
        />
        <button
          type="button"
          class="cn-cmd"
          :disabled="command.disabled === true"
          :title="command.title ?? undefined"
          :data-testid="command.testId ?? undefined"
          @click="emit('run', command.id)"
        >
          <FluentIcon :name="command.icon" />
          <span>{{ command.label }}</span>
        </button>
      </template>

      <div v-if="slots.default !== undefined" class="cn-cmdbar__tail">
        <slot />
      </div>
    </div>
  </div>
</template>
