<script setup lang="ts">
import { computed } from 'vue'
import { consoleFluentCodePoint, hasConsoleFluentIcon } from './console-icons'























const props = defineProps<{
  
  name: string
  
  size?: number
}>()

const known = computed(() => hasConsoleFluentIcon(props.name))

const style = computed(() => {
  
  
  const codepoint = consoleFluentCodePoint(props.name)
  const declarations: Record<string, string> = {
    '--cn-glyph': codepoint === null ? 'none' : `'\\${codepoint.toString(16)}'`,
  }
  if (props.size !== undefined) {
    declarations['--cn-fi-size'] = `${props.size}px`
    
    declarations['width'] = `${props.size}px`
    declarations['height'] = `${props.size}px`
  }
  return declarations
})
</script>

<template>
  <span v-if="known" class="cn-fi" :style="style" :data-console-icon="name" aria-hidden="true" />
</template>

<style scoped>








.cn-fi::before {
  font-family: 'FluentSystemIcons', 'Segoe UI', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: var(--cn-fi-size, 16px);
  line-height: 1;
  display: inline-block;
  flex: none;
  speak: none;
  -webkit-font-smoothing: antialiased;
  content: var(--cn-glyph);
}
</style>
