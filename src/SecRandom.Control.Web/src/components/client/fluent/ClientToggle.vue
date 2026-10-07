<script setup lang="ts">









defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
  
  label?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <label class="client-ui cn-toggle" :class="{ 'cn-toggle--disabled': props.disabled === true }">
    <input
      v-bind="$attrs"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled === true"
      :aria-label="props.label ?? undefined"
      @change="onChange"
    />
    <span class="cn-toggle__track" />
    <span class="cn-toggle__knob" />
  </label>
</template>
