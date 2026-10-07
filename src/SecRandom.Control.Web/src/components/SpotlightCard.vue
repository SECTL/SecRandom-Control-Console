<script setup lang="ts">
import { computed, ref } from 'vue'

















const props = withDefaults(
  defineProps<{
    tag?: 'div' | 'article' | 'section'
    
    class?: string
  }>(),
  { tag: 'div', class: '' },
)

const element = ref<HTMLElement | null>(null)





function onPointerMove(event: PointerEvent): void {
  const node = element.value
  if (!node) return
  const box = node.getBoundingClientRect()
  if (box.width === 0 || box.height === 0) return
  const x = ((event.clientX - box.left) / box.width) * 100
  const y = ((event.clientY - box.top) / box.height) * 100
  node.style.setProperty('--mx', `${x.toFixed(2)}%`)
  node.style.setProperty('--my', `${y.toFixed(2)}%`)
}

const classes = computed(() => ['spotlight-card', props.class])
</script>

<template>
  <component :is="props.tag" ref="element" :class="classes" @pointermove="onPointerMove">
    <span class="spotlight-card__glow" aria-hidden="true" />
    <span class="spotlight-card__ring" aria-hidden="true" />
    <slot />
  </component>
</template>
