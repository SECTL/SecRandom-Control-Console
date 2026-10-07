<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NodeSettingFieldDto } from '@/api/protocol'
import FluentIcon from './FluentIcon.vue'
import ClientHotkeyBox from './ClientHotkeyBox.vue'
import ClientNumberBox from './ClientNumberBox.vue'
import ClientSelect from './ClientSelect.vue'
import ClientTextBox from './ClientTextBox.vue'
import ClientToggle from './ClientToggle.vue'
import type { ClientSelectOption, ClientSettingControl, ClientSettingControlSpec } from './client-model'




















const props = defineProps<{
  row: ClientSettingControlSpec
  
  field: NodeSettingFieldDto | undefined
  
  draft: string | number | boolean | undefined
  






  locked?: boolean
}>()

const emit = defineEmits<{ update: [value: string | number | boolean] }>()

const { t } = useI18n()


const KNOWN_TYPES = new Set(['bool', 'int', 'double', 'string', 'enum'])

const unread = computed(() => props.field === undefined)
const disabled = computed(
  () => props.locked === true || props.row.readonly === true || props.field?.writable === false,
)
const testId = computed(() => `setting-${props.row.path}`)


function normalize(raw: unknown): string | number | boolean | undefined {
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') return raw
  if (raw === null || raw === undefined) return undefined
  return String(raw)
}


const current = computed(() => props.draft ?? normalize(props.field?.value))
















const options = computed<readonly ClientSelectOption[]>(() => {
  const declared = props.row.options ?? []
  const fromDevice = props.field?.options ?? []

  const base: readonly ClientSelectOption[] =
    fromDevice.length === 0
      ? declared
      : fromDevice.map((name) => {
          const label = declared.find((option) => option.value === name)?.label
          return { value: name, label: label ?? name }
        })

  const value = current.value
  if (value === undefined) return base

  const text = String(value)
  if (text.length === 0) return base
  if (base.some((option) => option.value === text)) return base
  return [...base, { value: text, label: text }]
})

const control = computed<ClientSettingControl>(() => {
  const field = props.field
  if (field !== undefined && !KNOWN_TYPES.has(field.type)) return 'text'
  if (props.row.control === 'select' && options.value.length === 0) return 'text'
  return props.row.control
})

const placeholder = computed<string | null>(() =>
  unread.value ? t('nodeDetail.settingsRead.valueUnknown') : null,
)






const minValue = computed(() => props.field?.min ?? props.row.min ?? null)
const maxValue = computed(() => props.field?.max ?? props.row.max ?? null)

const boolValue = computed(() => {
  const value = current.value
  if (typeof value === 'boolean') return value
  return value === 'true' || value === '1' || value === 1
})

const numberValue = computed<number | null>(() => {
  const value = current.value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean' || value === undefined) return null
  const parsed = Number(value)
  return value.trim().length > 0 && Number.isFinite(parsed) ? parsed : null
})

const stringValue = computed(() => (current.value === undefined ? '' : String(current.value)))


const readonlyText = computed(() =>
  unread.value || current.value === undefined
    ? t('nodeDetail.settingsRead.valueUnknown')
    : String(current.value),
)

function onNumber(next: number | null): void {
  if (next === null) return
  emit('update', next)
}
</script>

<template>
  <ClientToggle
    v-if="control === 'toggle'"
    :model-value="boolValue"
    :disabled="disabled"
    :label="props.row.title"
    :data-testid="testId"
    @update:model-value="emit('update', $event)"
  />

  <ClientSelect
    v-else-if="control === 'select'"
    :model-value="stringValue"
    :options="options"
    :disabled="disabled"
    :label="props.row.title"
    :data-testid="testId"
    @update:model-value="emit('update', $event)"
  />

  <ClientNumberBox
    v-else-if="control === 'number'"
    :model-value="numberValue"
    :min="minValue"
    :max="maxValue"
    :step="props.row.step ?? 1"
    :disabled="disabled"
    :placeholder="placeholder"
    :label="props.row.title"
    :data-testid="testId"
    @update:model-value="onNumber"
  />

  <ClientHotkeyBox
    v-else-if="control === 'hotkey'"
    :model-value="stringValue"
    :disabled="disabled"
    :placeholder="placeholder"
    :label="props.row.title"
    :data-testid="testId"
    @update:model-value="emit('update', $event)"
  />

  <ClientTextBox
    v-else-if="control === 'text'"
    :model-value="stringValue"
    :disabled="disabled"
    :placeholder="placeholder"
    :label="props.row.title"
    :data-testid="testId"
    @update:model-value="emit('update', $event)"
  />

  <span v-else class="cn-chip" :data-testid="testId">
    <FluentIcon name="textFont" :size="14" />
    <span>{{ readonlyText }}</span>
  </span>
</template>
