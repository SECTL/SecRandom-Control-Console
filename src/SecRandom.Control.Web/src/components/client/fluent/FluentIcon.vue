<script setup lang="ts">
import { computed } from 'vue'
import { FLUENT_ICON_FALLBACK, fluentGlyph, hasFluentIcon, resolveFluentIconName } from './fluent-icons'













const props = defineProps<{
  
  name: string
  
  size?: number
}>()

const glyph = computed(() => fluentGlyph(props.name))
const unknown = computed(() => (hasFluentIcon(props.name) ? null : props.name))
const style = computed(() => (props.size === undefined ? undefined : { fontSize: `${props.size}px` }))


const resolved = computed(() => resolveFluentIconName(props.name) ?? FLUENT_ICON_FALLBACK)
</script>

<template>
  <span
    class="cn-fi"
    :style="style"
    :data-icon-name="resolved"
    :data-icon-unknown="unknown ?? undefined"
    aria-hidden="true"
    >{{ glyph }}</span
  >
</template>
