<script setup lang="ts">
import { computed, nextTick, ref, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'

























defineOptions({ inheritAttrs: false })

const props = defineProps<{
  
  modelValue: string
  disabled?: boolean
  
  placeholder?: string | null
  
  label?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()

const attrs = useAttrs()






const testId = computed<string | undefined>(() =>
  typeof attrs['data-testid'] === 'string' ? attrs['data-testid'] : undefined,
)
const clearTestId = computed<string | undefined>(() =>
  testId.value === undefined ? undefined : `${testId.value}-clear`,
)


const recording = ref(false)
const box = ref<HTMLButtonElement | null>(null)








const MODIFIER_CODES = new Set([
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
  'MetaLeft',
  'MetaRight',
])
const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'OS', 'Hyper'])












function mainKeyOf(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code

  switch (code) {
    case 'Space':
      return 'Space'
    case 'Tab':
      return 'Tab'
    case 'Enter':
      return 'Enter'
    case 'Delete':
      return 'Delete'
    case 'Home':
      return 'Home'
    case 'End':
      return 'End'
    case 'PageUp':
      return 'PageUp'
    case 'PageDown':
      return 'PageDown'
    case 'ArrowLeft':
      return 'Left'
    case 'ArrowUp':
      return 'Up'
    case 'ArrowRight':
      return 'Right'
    case 'ArrowDown':
      return 'Down'
    default:
      return null
  }
}





function formatShortcut(event: KeyboardEvent, mainKey: string): string {
  const parts: string[] = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push('Win')
  parts.push(mainKey)
  return parts.join('+')
}

function isLoneModifier(event: KeyboardEvent): boolean {
  return MODIFIER_CODES.has(event.code) || MODIFIER_KEYS.has(event.key)
}

const hasValue = computed(() => props.modelValue.length > 0)









const displayText = computed(() => {
  if (recording.value) return t('nodeDetail.client.hotkey.recording')
  if (hasValue.value) return props.modelValue
  if (props.placeholder !== undefined && props.placeholder !== null && props.placeholder.length > 0) {
    return props.placeholder
  }
  return t('nodeDetail.client.hotkey.capture')
})






const ariaLabel = computed<string | undefined>(() => {
  if (recording.value) return t('nodeDetail.client.hotkey.recording')
  return props.label ?? undefined
})







const liveText = computed(() => {
  if (recording.value) return t('nodeDetail.client.hotkey.recording')
  return hasValue.value ? props.modelValue : ''
})

const clearLabel = computed(() => t('nodeDetail.client.hotkey.clear'))

function startRecording(): void {
  if (props.disabled === true || recording.value) return
  recording.value = true
  
  void nextTick(() => box.value?.focus())
}


function cancelRecording(): void {
  recording.value = false
}

function commit(value: string): void {
  recording.value = false
  emit('update:modelValue', value)
  
  void nextTick(() => box.value?.focus())
}

function clear(): void {
  if (props.disabled === true) return
  commit('')
}

function onBoxClick(): void {
  if (props.disabled === true) return
  
  if (recording.value) cancelRecording()
  else startRecording()
}

function onKeydown(event: KeyboardEvent): void {
  if (props.disabled === true) return

  if (!recording.value) {
    
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      startRecording()
    }
    return
  }

  




  if (event.key === 'Tab') {
    cancelRecording()
    return
  }

  
  
  event.preventDefault()
  event.stopPropagation()

  
  if (event.key === 'Escape' || event.code === 'Escape') {
    cancelRecording()
    return
  }

  
  if (event.code === 'Backspace' || event.key === 'Backspace') {
    commit('')
    return
  }

  
  if (isLoneModifier(event)) return

  const mainKey = mainKeyOf(event.code)
  
  if (mainKey === null) return

  commit(formatShortcut(event, mainKey))
}
</script>

<template>
  <div class="client-ui cn-hotkey" :class="{ 'cn-hotkey--disabled': props.disabled === true }">
    <button
      v-bind="$attrs"
      ref="box"
      type="button"
      class="cn-hotkey__box"
      :class="{ 'cn-hotkey__box--recording': recording }"
      :disabled="props.disabled === true"
      :aria-label="ariaLabel"
      data-cn-hotkey
      :data-recording="recording ? 'true' : 'false'"
      @click="onBoxClick"
      @keydown="onKeydown"
      @blur="cancelRecording"
    >
      <span class="cn-hotkey__value" :class="{ 'cn-hotkey__value--empty': !hasValue || recording }">
        {{ displayText }}
      </span>
    </button>

    
    <button
      type="button"
      class="cn-hotkey__clear"
      :disabled="props.disabled === true || recording || !hasValue"
      :aria-label="clearLabel"
      :title="clearLabel"
      :data-testid="clearTestId"
      data-cn-hotkey-clear
      @click="clear"
    >
      <span aria-hidden="true">×</span>
    </button>

    <span class="cn-sr-only" aria-live="polite" data-cn-hotkey-live>{{ liveText }}</span>
  </div>
</template>
