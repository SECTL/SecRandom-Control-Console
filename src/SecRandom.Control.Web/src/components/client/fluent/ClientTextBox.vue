<script setup lang="ts">







defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  placeholder?: string | null
  
  label?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    v-bind="$attrs"
    class="client-ui cn-textbox"
    type="text"
    :value="props.modelValue"
    :disabled="props.disabled === true"
    :placeholder="props.placeholder ?? undefined"
    :aria-label="props.label ?? undefined"
    @input="onInput"
  />
</template>
