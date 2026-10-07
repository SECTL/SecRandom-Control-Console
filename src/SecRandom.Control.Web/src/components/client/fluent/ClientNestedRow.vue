<script setup lang="ts">
import ClientRowMarks from './ClientRowMarks.vue'








const props = defineProps<{
  title: string
  description?: string | null
  disabled?: boolean
  readonly?: boolean
  unread?: boolean
  






  dirty?: boolean
  testId?: string | null
}>()
</script>

<template>
  <div
    class="client-ui cn-row"
    :class="{ 'cn-row--disabled': props.disabled === true }"
    :data-testid="props.testId ?? undefined"
  >
    <div class="cn-row__text">
      <span class="cn-row__title">{{ props.title }}</span>
      <span v-if="props.description" class="cn-row__desc">{{ props.description }}</span>
    </div>

    <div class="cn-row__footer">
      <slot name="control" />
      <ClientRowMarks
        :readonly="props.readonly === true"
        :unread="props.unread === true"
        :dirty="props.dirty === true"
      />
    </div>
  </div>
</template>
