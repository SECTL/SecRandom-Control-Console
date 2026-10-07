<script setup lang="ts">
import FluentIcon from './FluentIcon.vue'












defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: number | null
  min?: number | null
  max?: number | null
  
  step?: number
  disabled?: boolean
  placeholder?: string | null
  
  label?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()


function clamp(value: number): number {
  let next = value
  if (typeof props.min === 'number' && next < props.min) next = props.min
  if (typeof props.max === 'number' && next > props.max) next = props.max
  return Math.round(next * 100) / 100
}

function stepBy(direction: 1 | -1): void {
  
  const base = props.modelValue ?? props.min ?? 0
  emit('update:modelValue', clamp(base + direction * (props.step ?? 1)))
}

function onInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.trim()
  if (raw.length === 0) {
    emit('update:modelValue', null)
    return
  }
  const value = Number(raw)
  
  if (!Number.isFinite(value)) return
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="client-ui cn-number" :class="{ 'cn-number--disabled': props.disabled === true }">
    <input
      v-bind="$attrs"
      type="number"
      :value="props.modelValue ?? ''"
      :min="props.min ?? undefined"
      :max="props.max ?? undefined"
      :step="props.step ?? 1"
      :disabled="props.disabled === true"
      :placeholder="props.placeholder ?? undefined"
      :aria-label="props.label ?? undefined"
      @input="onInput"
    />
    <button
      type="button"
      class="cn-number__spin"
      tabindex="-1"
      aria-hidden="true"
      data-step="-1"
      :disabled="props.disabled === true"
      @click="stepBy(-1)"
    >
      <FluentIcon name="subtract" :size="12" />
    </button>
    <button
      type="button"
      class="cn-number__spin"
      tabindex="-1"
      aria-hidden="true"
      data-step="1"
      :disabled="props.disabled === true"
      @click="stepBy(1)"
    >
      <FluentIcon name="add" :size="12" />
    </button>
  </div>
</template>
