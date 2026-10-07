<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import FluentIcon from './FluentIcon.vue'
import type { ClientPageNavGroup } from './client-model'














const props = defineProps<{
  groups: readonly ClientPageNavGroup[]
  
  selected: string
  
  label?: string
}>()

const emit = defineEmits<{ select: [id: string] }>()

const root = ref<HTMLElement | null>(null)


const flatIds = computed(() => props.groups.flatMap((group) => group.items.map((item) => item.id)))

function items(): HTMLElement[] {
  const nodes = root.value?.querySelectorAll<HTMLElement>('.cn-nav__item')
  return nodes === undefined ? [] : Array.from(nodes)
}

function focusAt(index: number): void {
  
  
  void nextTick(() => items()[index]?.focus())
}

function onKeydown(event: KeyboardEvent, id: string): void {
  const ids = flatIds.value
  const index = ids.indexOf(id)
  if (index < 0 || ids.length === 0) return

  let next: number
  switch (event.key) {
    case 'ArrowDown':
      next = (index + 1) % ids.length
      break
    case 'ArrowUp':
      next = (index - 1 + ids.length) % ids.length
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = ids.length - 1
      break
    default:
      return
  }

  event.preventDefault()
  const nextId = ids[next]
  if (nextId === undefined) return
  emit('select', nextId)
  focusAt(next)
}
</script>

<template>
  <nav
    ref="root"
    class="client-ui cn-nav"
    role="tablist"
    aria-orientation="vertical"
    :aria-label="props.label ?? undefined"
  >
    <div class="cn-nav__scroll">
      <template v-for="(group, groupIndex) in props.groups" :key="group.id">
        <hr v-if="groupIndex > 0" class="cn-nav__sep" />
        <div class="cn-nav__group">{{ group.label }}</div>

        <button
          v-for="item in group.items"
          :key="item.id"
          type="button"
          class="cn-nav__item"
          role="tab"
          :aria-selected="item.id === props.selected"
          :tabindex="item.id === props.selected ? 0 : -1"
          :data-testid="`client-nav-${item.id}`"
          @click="emit('select', item.id)"
          @keydown="onKeydown($event, item.id)"
        >
          <span class="cn-nav__indicator" />
          <FluentIcon :name="item.icon" />
          <span class="cn-nav__label">{{ item.label }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>
