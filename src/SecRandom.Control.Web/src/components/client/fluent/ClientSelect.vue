<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import FluentIcon from './FluentIcon.vue'
import type { ClientSelectOption } from './client-model'



















const POPUP_Z_INDEX = 100000

let uid = 0

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: string
  options: readonly ClientSelectOption[]
  disabled?: boolean
  
  size?: 'default' | 'medium' | 'wide'
  
  label?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const listId = `cn-combo-list-${(uid += 1)}`

const open = ref(false)

const activeIndex = ref(-1)
const trigger = ref<HTMLButtonElement | null>(null)
const popup = ref<HTMLElement | null>(null)
const popupStyle = ref<Record<string, string>>({})

const selected = computed<ClientSelectOption | null>(
  () => props.options.find((option) => option.value === props.modelValue) ?? null,
)


const selectedLabel = computed(() => selected.value?.label ?? '')

const activeId = computed(() =>
  activeIndex.value >= 0 && activeIndex.value < props.options.length
    ? `${listId}-option-${activeIndex.value}`
    : undefined,
)




const POPUP_MAX_HEIGHT = 240












function placePopup(): void {
  const rect = trigger.value?.getBoundingClientRect()
  if (rect === undefined) return

  const gap = 8
  const rawHeight = window.innerHeight || 0
  const viewportHeight = rawHeight || Number.POSITIVE_INFINITY
  const viewportWidth = window.innerWidth || Number.POSITIVE_INFINITY

  const below = rect.bottom + 4
  const above = rect.top - gap

  
  const content = popup.value?.scrollHeight ?? 0
  const height = Math.min(content > 0 ? content : rect.height + gap, POPUP_MAX_HEIGHT)

  const spaceBelow = viewportHeight - below
  const spaceAbove = above
  
  const upward = height > spaceBelow && spaceAbove > spaceBelow

  
  
  const available = upward ? spaceAbove : spaceBelow
  const maxHeight = Math.min(POPUP_MAX_HEIGHT, Math.max(80, Math.floor(available) - 4))

  const width = Math.min(Math.max(rect.width, 128), Math.max(128, viewportWidth - gap * 2))
  
  const maxLeft = Math.max(gap, viewportWidth - width - gap)
  const left = Math.min(Math.max(gap, rect.left), maxLeft)

  popupStyle.value = upward
    ? {
        left: `${left}px`,
        width: `${width}px`,
        bottom: `${rawHeight - above}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: String(POPUP_Z_INDEX),
      }
    : {
        left: `${left}px`,
        width: `${width}px`,
        top: `${below}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: String(POPUP_Z_INDEX),
      }
}








function onWindowScroll(): void {
  if (open.value) placePopup()
}

function startPositionTracking(): void {
  window.addEventListener('resize', onWindowScroll)
  window.addEventListener('scroll', onWindowScroll, true)
}

function stopPositionTracking(): void {
  window.removeEventListener('resize', onWindowScroll)
  window.removeEventListener('scroll', onWindowScroll, true)
}



function highlightSelected(): void {
  const index = props.options.findIndex((option) => option.value === props.modelValue)
  activeIndex.value = index >= 0 ? index : props.options.length > 0 ? 0 : -1
}

function openList(): void {
  if (props.disabled === true || open.value) return
  open.value = true
  highlightSelected()
  startPositionTracking()
  void nextTick(placePopup)
}

function closeList(): void {
  if (!open.value) return
  open.value = false
  activeIndex.value = -1
  stopPositionTracking()
}

function toggleList(): void {
  if (open.value) closeList()
  else openList()
}

function commit(index: number): void {
  const option = props.options[index]
  if (option === undefined) return
  closeList()
  
  emit('update:modelValue', option.value)
  void nextTick(() => trigger.value?.focus())
}


function move(next: number): void {
  const total = props.options.length
  if (total === 0) return
  activeIndex.value = Math.min(Math.max(next, 0), total - 1)
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled === true) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (open.value) move(activeIndex.value + 1)
      else openList()
      return
    case 'ArrowUp':
      event.preventDefault()
      if (open.value) move(activeIndex.value - 1)
      return
    case 'Home':
      if (!open.value) return
      event.preventDefault()
      move(0)
      return
    case 'End':
      if (!open.value) return
      event.preventDefault()
      move(props.options.length - 1)
      return
    case 'Enter':
      
      
      event.preventDefault()
      if (open.value) commit(activeIndex.value)
      else openList()
      return
    case ' ':
      event.preventDefault()
      if (open.value) commit(activeIndex.value)
      else openList()
      return
    case 'Escape':
      if (!open.value) return
      event.preventDefault()
      closeList()
      trigger.value?.focus()
      return
    case 'Tab':
      closeList()
      return
    default:
      return
  }
}

function onDocumentPointerDown(event: Event): void {
  const target = event.target as Node | null
  if (target === null || open.value !== true) return
  if (trigger.value?.contains(target) === true) return
  if (popup.value?.contains(target) === true) return
  closeList()
}

watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onDocumentPointerDown, true)
  else document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  stopPositionTracking()
})
</script>

<template>
  
  <div class="client-ui">
    <div class="cn-combo" :class="`cn-combo--${props.size ?? 'default'}`">
      <button
        v-bind="$attrs"
        ref="trigger"
        type="button"
        class="cn-combo__trigger"
        data-cn-select
        :disabled="props.disabled === true"
        :aria-label="props.label ?? undefined"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="open ? listId : undefined"
        :aria-activedescendant="open ? activeId : undefined"
        @click="toggleList"
        @keydown="onTriggerKeydown"
      >
        <span
          class="cn-combo__value"
          :class="{ 'cn-combo__value--empty': selectedLabel.length === 0 }"
        >
          {{ selectedLabel }}
        </span>
        <FluentIcon class="cn-combo__chev" name="chevronDown" :size="12" />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        :id="listId"
        ref="popup"
        class="client-ui cn-combo-popup"
        role="listbox"
        :aria-label="props.label ?? undefined"
        :style="popupStyle"
        data-cn-select-popup
      >
        <button
          v-for="(option, index) in props.options"
          :id="`${listId}-option-${index}`"
          :key="option.value"
          type="button"
          class="cn-combo-popup__item"
          role="option"
          :aria-selected="option.value === props.modelValue"
          :data-active="index === activeIndex ? 'true' : 'false'"
          @pointermove="activeIndex = index"
          @click="commit(index)"
        >
          <span class="cn-combo-popup__label">{{ option.label }}</span>
          <FluentIcon v-if="option.value === props.modelValue" class="cn-combo-popup__check" name="checkmark" :size="12" />
        </button>
      </div>
    </Teleport>
  </div>
</template>
