<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'















const bar = ref<HTMLElement | null>(null)

let frame = 0

function onScroll(): void {
  if (frame !== 0) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    const node = bar.value
    if (!node) return

    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    const progress = scrollable <= 0 ? 0 : Math.min(Math.max(window.scrollY / scrollable, 0), 1)
    node.style.transform = `scaleX(${progress.toFixed(4)})`
  })
}

onMounted(() => {
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (frame !== 0) window.cancelAnimationFrame(frame)
})
</script>

<template>
  
  <div class="pointer-events-none fixed inset-x-0 top-0 z-30 h-0.5" aria-hidden="true">
    <div ref="bar" class="scroll-progress h-full w-full origin-left" style="transform: scaleX(0)" />
  </div>
</template>
