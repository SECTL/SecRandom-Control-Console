<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NodeSettingFieldDto } from '@/api/protocol'
import { optionLabelOf } from '@/data/client-setting-option-labels'
import {
  isClientSettingContainer,
  type ClientSettingContainerRow,
  type ClientSettingOptionEntry,
  type ClientSettingRow,
  type ClientSettingValueRow,
} from '@/data/client-settings-pages'
import {
  batchDraftIncluded,
  emptyBatchConfigDraft,
  isBatchChoiceControl,
  isBatchReadonlyRow,
  needsBatchInclude,
  type BatchConfigDraft,
} from '@/utils/batch-config'
import { clientSettingLocale, localizedSettingText } from '@/utils/client-settings-presenter'
import ClientSettingCard from './ClientSettingCard.vue'
import ClientNestedRow from './ClientNestedRow.vue'
import ClientBatchSettingCell from './ClientBatchSettingCell.vue'
import type { ClientSelectOption, ClientSettingControlSpec } from './client-model'



















const props = withDefaults(
  defineProps<{
    row: ClientSettingRow
    
    drafts: Record<string, BatchConfigDraft>
    





    nested?: boolean
    
    locked?: boolean
  }>(),
  { nested: false, locked: false },
)

const emit = defineEmits<{
  'update-value': [path: string, value: string | number | boolean]
  'update-include': [path: string, include: boolean]
}>()

const { t, locale } = useI18n()


const container = computed<ClientSettingContainerRow | null>(() =>
  isClientSettingContainer(props.row) ? props.row : null,
)
const value = computed(() => (isClientSettingContainer(props.row) ? null : props.row))


const children = computed<readonly ClientSettingRow[]>(() => props.row.rows ?? [])


function childKey(row: ClientSettingRow): string {
  return isClientSettingContainer(row) ? `container:${row.id}` : row.path
}


const titleFallback = computed(() =>
  isClientSettingContainer(props.row) ? props.row.id : props.row.path,
)

const title = computed(() =>
  localizedSettingText(props.row.labels, locale.value, titleFallback.value),
)







const description = computed(() => {
  const text = localizedSettingText(props.row.descriptions, locale.value, '')
  return text.length > 0 ? text : null
})







const locked = computed(() => value.value !== null && isBatchReadonlyRow(value.value))


const expanded = ref(true)


const draft = computed<BatchConfigDraft>(() => {
  const path = value.value?.path
  if (path === undefined) return emptyBatchConfigDraft()
  return props.drafts[path] ?? emptyBatchConfigDraft()
})


const included = computed(
  () => value.value !== null && batchDraftIncluded(value.value, draft.value),
)


const needsInclude = computed(() => value.value !== null && needsBatchInclude(value.value.control))







const subtreeIncluded = computed(() => {
  if (included.value) return true

  const walk = (rows: readonly ClientSettingRow[]): boolean =>
    rows.some((row) =>
      isClientSettingContainer(row)
        ? walk(row.rows)
        : batchDraftIncluded(row, props.drafts[row.path]),
    )
  return walk(children.value)
})


const spec = computed<ClientSettingControlSpec | null>(() => {
  const row = value.value
  if (row === null || locked.value) return null

  const spec: ClientSettingControlSpec = {
    path: row.path,
    title: title.value,
    
    control: isBatchChoiceControl(row.control) ? 'select' : row.control,
  }

  const options = choiceOptions(row)
  if (options.length > 0) spec.options = options
  return spec
})








function choiceOptions(row: ClientSettingValueRow): readonly ClientSelectOption[] {
  if (!isBatchChoiceControl(row.control)) return []

  const options: ClientSelectOption[] = [{ value: '', label: t('batchConfig.keep') }]
  if (row.control === 'toggle') {
    options.push({ value: 'true', label: t('batchConfig.on') })
    options.push({ value: 'false', label: t('batchConfig.off') })
    return options
  }

  for (const entry of row.options ?? []) options.push(optionOf(row.path, entry))
  return options
}


function optionOf(path: string, entry: ClientSettingOptionEntry): ClientSelectOption {
  if (typeof entry === 'string') {
    return {
      value: entry,
      label: optionLabelOf(path, entry, clientSettingLocale(locale.value)) ?? entry,
    }
  }
  return { value: entry.value, label: localizedSettingText(entry.labels, locale.value, entry.value) }
}









const field = computed<NodeSettingFieldDto | null>(() => {
  const row = value.value
  if (row === null || locked.value) return null

  return {
    path: row.path,
    category: '',
    type: fieldTypeOf(row.control),
    value: null,
    writable: true,
    min: null,
    max: null,
    options: null,
    label: null,
    description: null,
  }
})

function fieldTypeOf(control: string): string {
  switch (control) {
    case 'toggle':
      return 'bool'
    case 'select':
    case 'readonly':
      return 'enum'
    case 'number':
      return 'int'
    default:
      return 'string'
  }
}










const controlDraft = computed<string | number | boolean | undefined>(() => {
  const row = value.value
  if (row === null) return undefined

  const current = draft.value
  if (isBatchChoiceControl(row.control)) return String(current.value)
  if (row.control === 'text' || row.control === 'hotkey') return String(current.value)
  return undefined
})


const numberValue = computed<number | null>(() => {
  const current = draft.value
  if (!current.include) return null
  return typeof current.value === 'number' ? current.value : null
})


function onValue(next: string | number | boolean): void {
  const row = value.value
  if (row === null) return

  if (row.control === 'toggle') {
    emit('update-value', row.path, next === '' ? '' : next === 'true')
    return
  }
  emit('update-value', row.path, next)
}








function onNumber(next: number | null): void {
  const row = value.value
  if (row === null) return
  emit('update-value', row.path, next === null ? '' : next)
}


function onInclude(checked: boolean): void {
  const row = value.value
  if (row === null) return
  emit('update-include', row.path, checked)
}
</script>

<template>
  
  <ClientSettingCard
    v-if="container !== null"
    :title="title"
    :description="description"
    :icon="container.icon"
    :dirty="subtreeIncluded"
    :expanded="expanded"
    :has-extra="children.length > 0"
    :test-id="`batch-container-${container.id}`"
    @toggle-expand="expanded = !expanded"
  >
    <template v-if="children.length > 0" #extra>
      <ClientBatchSettingRow
        v-for="child in children"
        :key="childKey(child)"
        :row="child"
        :drafts="props.drafts"
        :nested="true"
        :locked="props.locked"
        @update-value="(path, next) => emit('update-value', path, next)"
        @update-include="(path, checked) => emit('update-include', path, checked)"
      />
    </template>
  </ClientSettingCard>

  
  <ClientSettingCard
    v-else-if="value !== null && !props.nested"
    :title="title"
    :description="description"
    :icon="value.icon"
    :disabled="locked || props.locked"
    :readonly="locked"
    :dirty="subtreeIncluded"
    :expanded="expanded"
    :has-extra="children.length > 0"
    :test-id="`batch-row-${value.path}`"
    @toggle-expand="expanded = !expanded"
  >
    <template v-if="spec !== null && field !== null" #control>
      <ClientBatchSettingCell
        :spec="spec"
        :control="value.control"
        :field="field"
        :draft="controlDraft"
        :number-value="numberValue"
        :included="included"
        :needs-include="needsInclude"
        :locked="locked || props.locked"
        @update-value="onValue"
        @update-number="onNumber"
        @update-include="onInclude"
      />
    </template>

    
    <template v-if="children.length > 0" #extra>
      <ClientBatchSettingRow
        v-for="child in children"
        :key="childKey(child)"
        :row="child"
        :drafts="props.drafts"
        :nested="true"
        :locked="props.locked"
        @update-value="(path, next) => emit('update-value', path, next)"
        @update-include="(path, checked) => emit('update-include', path, checked)"
      />
    </template>
  </ClientSettingCard>

  
  <ClientNestedRow
    v-else-if="value !== null"
    :title="title"
    :description="description"
    :disabled="locked || props.locked"
    :readonly="locked"
    :dirty="subtreeIncluded"
    :test-id="`batch-row-${value.path}`"
  >
    <template v-if="spec !== null && field !== null" #control>
      <ClientBatchSettingCell
        :spec="spec"
        :control="value.control"
        :field="field"
        :draft="controlDraft"
        :number-value="numberValue"
        :included="included"
        :needs-include="needsInclude"
        :locked="locked || props.locked"
        @update-value="onValue"
        @update-number="onNumber"
        @update-include="onInclude"
      />
    </template>
  </ClientNestedRow>

  
  <template v-if="props.nested && container === null">
    <ClientBatchSettingRow
      v-for="child in children"
      :key="childKey(child)"
      :row="child"
      :drafts="props.drafts"
      :nested="true"
      :locked="props.locked"
      @update-value="(path, next) => emit('update-value', path, next)"
      @update-include="(path, checked) => emit('update-include', path, checked)"
    />
  </template>
</template>
