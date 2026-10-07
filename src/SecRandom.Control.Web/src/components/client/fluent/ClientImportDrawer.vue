<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NodeRosterMemberDto, RosterKind } from '@/api/protocol'
import '@/assets/client-theme.css'
import {
  ROSTER_MAX_ROWS,
  buildRosterImportDraft,
  parseCsvWorkbook,
  parseWorkbook,
  suggestHeaderRow,
  suggestMapping,
  type RosterColumn,
  type RosterImportDraft,
  type RosterMemberLike,
  type RosterProblem,
  type RosterSheet,
  type RosterWorkbook,
} from '@/utils/roster-sheet'
import FluentIcon from './FluentIcon.vue'
import ClientNumberBox from './ClientNumberBox.vue'
import ClientSelect from './ClientSelect.vue'
import ClientToggle from './ClientToggle.vue'
import type { ClientSelectOption } from './client-model'


















const props = defineProps<{ kind: RosterKind }>()

const emit = defineEmits<{
  confirm: [members: NodeRosterMemberDto[]]
  close: []
}>()

const { t } = useI18n()










const STUDENT_COLUMNS: readonly RosterColumn[] = ['id', 'name', 'gender', 'group', 'tags']
const PRIZE_COLUMNS: readonly RosterColumn[] = ['id', 'name', 'count', 'weight', 'tags']


const PREVIEW_ROWS = 8

const columns = computed<readonly RosterColumn[]>(() =>
  props.kind === 'prizes' ? PRIZE_COLUMNS : STUDENT_COLUMNS,
)

const fileName = ref('')
const reading = ref(false)
const unreadable = ref(false)
const sheets = ref<RosterSheet[]>([])
const sheetIndex = ref(0)
const headerRow = ref<number | null>(null)
const firstRow = ref(0)
const lastRow = ref<number | null>(null)
const mapping = ref<Partial<Record<RosterColumn, number>>>({})

const sheet = computed<RosterSheet | null>(() => sheets.value[sheetIndex.value] ?? null)
const rowCount = computed(() => sheet.value?.rows.length ?? 0)


const suggestedHeader = computed(() =>
  sheet.value === null ? null : suggestHeaderRow(sheet.value, props.kind),
)


const optionCells = computed<readonly string[]>(() => {
  const target = sheet.value
  if (target === null) return []
  const row = headerRow.value !== null ? target.rows[headerRow.value] : target.rows[0]
  return row ?? []
})

const draft = computed<RosterImportDraft | null>(() => {
  const target = sheet.value
  if (target === null) return null
  return buildRosterImportDraft(
    target,
    {
      sheetIndex: sheetIndex.value,
      headerRow: headerRow.value,
      firstDataRow: firstRow.value,
      lastDataRow: lastRow.value,
      columns: mapping.value,
    },
    props.kind,
  )
})

const members = computed<readonly RosterMemberLike[]>(() => draft.value?.members ?? [])
const previewMembers = computed(() => members.value.slice(0, PREVIEW_ROWS))
const tooManyRows = computed(() => members.value.length > ROSTER_MAX_ROWS)
const canConfirm = computed(() => !reading.value && members.value.length > 0 && !tooManyRows.value)

const title = computed(() => t('nodeDetail.client.import.title'))
const hint = computed(() => t('nodeDetail.client.import.hint'))




function readWorkbook(data: ArrayBuffer, name: string): RosterWorkbook | null {
  const lower = name.trim().toLowerCase()

  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    const text = new TextDecoder().decode(data).replace(/^\uFEFF/, '')
    return parseCsvWorkbook(text, name.replace(/\.[^.]*$/, ''))
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.xlsm')) {
    return parseWorkbook(data)
  }

  
  
  
  return null
}









function suggestedMapping(cells: readonly string[]): Partial<Record<RosterColumn, number>> {
  const suggested = suggestMapping(cells, props.kind)
  const allowed: Partial<Record<RosterColumn, number>> = {}
  for (const column of columns.value) {
    const index = suggested[column]
    if (index !== undefined) allowed[column] = index
  }
  return allowed
}


function chooseSheet(index: number): void {
  const target = sheets.value[index]
  if (target === undefined) return

  sheetIndex.value = index
  const suggested = suggestHeaderRow(target, props.kind)
  headerRow.value = suggested
  firstRow.value = suggested === null ? 0 : suggested + 1
  lastRow.value = null
  mapping.value = suggested === null ? {} : suggestedMapping(target.rows[suggested] ?? [])
}







function applyHeaderRow(value: number | null): void {
  headerRow.value = value
  firstRow.value = value === null ? 0 : value + 1
  mapping.value = value === null ? {} : suggestedMapping(sheet.value?.rows[value] ?? [])
}


function toggleNoHeader(noHeader: boolean): void {
  applyHeaderRow(noHeader ? null : (suggestedHeader.value ?? 0))
}


function onHeaderRowValue(value: number | null): void {
  applyHeaderRow(value === null ? null : Math.max(0, Math.trunc(value) - 1))
}

function onFirstRowValue(value: number | null): void {
  firstRow.value = value === null ? 0 : Math.max(0, Math.trunc(value) - 1)
}

function onLastRowValue(value: number | null): void {
  lastRow.value = value === null ? null : Math.max(0, Math.trunc(value) - 1)
}

function setMapping(column: RosterColumn, value: string): void {
  const next: Partial<Record<RosterColumn, number>> = { ...mapping.value }
  if (value.length === 0) delete next[column]
  else next[column] = Number(value)
  mapping.value = next
}







async function loadFromBuffer(data: ArrayBuffer, name: string): Promise<void> {
  fileName.value = name
  reading.value = true
  unreadable.value = false
  sheets.value = []
  sheetIndex.value = 0
  headerRow.value = null
  firstRow.value = 0
  lastRow.value = null
  mapping.value = {}

  try {
    
    
    if (data.byteLength > 0) await nextTick()

    const workbook = readWorkbook(data, name)
    if (workbook === null || workbook.sheets.length === 0) {
      unreadable.value = true
      return
    }
    sheets.value = workbook.sheets
    chooseSheet(0)
  } finally {
    reading.value = false
  }
}

async function onPickFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  try {
    if (file === undefined) return
    await loadFromBuffer(await file.arrayBuffer(), file.name)
  } catch {
    
    unreadable.value = true
  } finally {
    
    input.value = ''
  }
}

defineExpose({ loadFromBuffer })



const panel = ref<HTMLElement | null>(null)





function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  
  panel.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})




function columnLetter(index: number): string {
  let value = index
  let letters = ''
  do {
    letters = String.fromCharCode(65 + (value % 26)) + letters
    value = Math.floor(value / 26) - 1
  } while (value >= 0)
  return letters
}

function optionLabel(cell: string, index: number): string {
  const text = cell.trim()
  return text.length > 0 ? `${columnLetter(index)} · ${text}` : columnLetter(index)
}

const mappingOptions = computed<readonly ClientSelectOption[]>(() => [
  { value: '', label: t('nodeDetail.client.import.unmapped') },
  ...optionCells.value.map((cell, index) => ({
    value: String(index),
    label: optionLabel(cell, index),
  })),
])

function mappingValue(column: RosterColumn): string {
  const index = mapping.value[column]
  return index === undefined ? '' : String(index)
}

function columnLabel(column: string): string {
  
  
  switch (column) {
    case 'id':
      return t('nodeDetail.client.import.columns.id')
    case 'name':
      return t('nodeDetail.client.import.columns.name')
    case 'gender':
      return t('nodeDetail.client.import.columns.gender')
    case 'group':
      return t('nodeDetail.client.import.columns.group')
    case 'enabled':
      return t('nodeDetail.client.import.columns.enabled')
    case 'count':
      return t('nodeDetail.client.import.columns.count')
    case 'weight':
      return t('nodeDetail.client.import.columns.weight')
    case 'tags':
      return t('nodeDetail.client.import.columns.tags')
    default:
      return column
  }
}


function problemText(problem: RosterProblem): string {
  const row = (problem.row ?? 0) + 1

  switch (problem.code) {
    case 'no_columns':
      return t('nodeDetail.client.import.problemNoColumns')
    case 'empty_region':
      return t('nodeDetail.client.import.problemEmptyRegion')
    case 'duplicate_id':
      return t('nodeDetail.client.import.problemDuplicateId', {
        row,
        
        id: cellAt(problem.row, 'id') || '—',
      })
    case 'bad_number':
      return t('nodeDetail.client.import.problemBadNumber', {
        row,
        column: columnLabel(problem.column ?? ''),
      })
    default:
      
      
      return t('nodeDetail.client.import.unreadable')
  }
}

function cellAt(row: number | undefined, column: RosterColumn): string {
  const target = sheet.value
  if (target === null || row === undefined) return ''
  const index = mapping.value[column]
  if (index === undefined) return ''
  return (target.rows[row]?.[index] ?? '').trim()
}

function memberCell(member: RosterMemberLike, column: RosterColumn): string {
  switch (column) {
    case 'id':
      return member.id ?? ''
    case 'name':
      return member.name ?? ''
    case 'gender':
      return member.gender ?? ''
    case 'group':
      return member.group ?? ''
    case 'enabled':
      
      
      return member.enabled ? '1' : '0'
    case 'tags':
      return member.tags == null ? '' : member.tags.join(', ')
    case 'count':
      return member.count === null ? '' : String(member.count)
    case 'weight':
      return member.weight === null ? '' : String(member.weight)
  }
}









function toMember(member: RosterMemberLike): NodeRosterMemberDto {
  const next: NodeRosterMemberDto = {
    id: member.id,
    name: member.name,
    gender: member.gender,
    group: member.group,
    count: member.count,
    weight: member.weight,
    enabled: true,
  }
  if (member.tags !== undefined) next.tags = member.tags
  return next
}

function confirm(): void {
  if (!canConfirm.value) return
  emit('confirm', members.value.map(toMember))
}
</script>

<template>
  <div class="client-ui">
    <div class="cn-drawer" data-testid="node-detail-roster-import-drawer">
      <div class="cn-drawer__scrim" @click="emit('close')" />

      <aside
        ref="panel"
        class="cn-drawer__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
      >
        <header class="cn-drawer__head">
          <h3 class="cn-drawer__title">{{ title }}</h3>
          
          <button
            type="button"
            class="cn-icon-btn"
            :aria-label="title"
            data-testid="node-detail-roster-import-close"
            @click="emit('close')"
          >
            <FluentIcon name="arrowLeft" />
          </button>
        </header>

        <p class="cn-drawer__hint">{{ hint }}</p>

        <div class="cn-drawer__body">
          
          <label class="cn-list-item">
            <FluentIcon name="peopleAdd" />
            <span class="cn-nav__label">
              {{ fileName.length > 0 ? fileName : t('nodeDetail.client.import.pickFile') }}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt"
              data-testid="node-detail-roster-import-file"
              class="cn-sr-only"
              @change="onPickFile"
            />
          </label>

          <p v-if="reading" class="cn-note" data-testid="node-detail-roster-import-reading">
            {{ t('nodeDetail.client.import.reading') }}
          </p>

          <p v-else-if="unreadable" class="cn-note cn-note--fail" data-testid="node-detail-roster-import-unreadable">
            {{ t('nodeDetail.client.import.unreadable') }}
          </p>

          <template v-else-if="sheet">
            <div class="cn-field">
              <span class="cn-field__label">{{ t('nodeDetail.client.import.sheet') }}</span>
              <div class="cn-segment" data-testid="node-detail-roster-import-sheets">
                <button
                  v-for="(item, index) in sheets"
                  :key="item.name"
                  type="button"
                  class="cn-segment__item"
                  :aria-selected="index === sheetIndex"
                  :data-testid="`node-detail-roster-import-sheet-${index}`"
                  @click="chooseSheet(index)"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>

            
            <div class="cn-form-grid">
              <div class="cn-field">
                <span class="cn-field__label">{{ t('nodeDetail.client.import.headerRow') }}</span>
                <ClientNumberBox
                  :model-value="headerRow === null ? null : headerRow + 1"
                  :min="1"
                  :max="rowCount"
                  :disabled="headerRow === null"
                  :label="t('nodeDetail.client.import.headerRow')"
                  data-testid="node-detail-roster-import-header-row"
                  @update:model-value="onHeaderRowValue"
                />
              </div>

              <div class="cn-field">
                <span class="cn-field__label">{{ t('nodeDetail.client.import.firstRow') }}</span>
                <ClientNumberBox
                  :model-value="firstRow + 1"
                  :min="1"
                  :max="rowCount"
                  :label="t('nodeDetail.client.import.firstRow')"
                  data-testid="node-detail-roster-import-first-row"
                  @update:model-value="onFirstRowValue"
                />
              </div>

              <div class="cn-field">
                <span class="cn-field__label">{{ t('nodeDetail.client.import.lastRow') }}</span>
                <ClientNumberBox
                  :model-value="lastRow === null ? null : lastRow + 1"
                  :min="1"
                  :max="rowCount"
                  :placeholder="String(rowCount)"
                  :label="t('nodeDetail.client.import.lastRow')"
                  data-testid="node-detail-roster-import-last-row"
                  @update:model-value="onLastRowValue"
                />
              </div>

              <div class="cn-field">
                <span class="cn-field__label">{{ t('nodeDetail.client.import.headerNone') }}</span>
                <ClientToggle
                  :model-value="headerRow === null"
                  :label="t('nodeDetail.client.import.headerNone')"
                  data-testid="node-detail-roster-import-no-header"
                  @update:model-value="toggleNoHeader"
                />
              </div>
            </div>

            <p v-if="suggestedHeader !== null" class="cn-note">
              {{ t('nodeDetail.client.import.headerAuto', { row: suggestedHeader + 1 }) }}
            </p>

            
            <div class="cn-field">
              <span class="cn-field__label">{{ t('nodeDetail.client.import.mapping') }}</span>
              <div class="cn-form-grid" data-testid="node-detail-roster-import-mapping">
                <div v-for="column in columns" :key="column" class="cn-field">
                  <span class="cn-field__label">{{ columnLabel(column) }}</span>
                  <ClientSelect
                    :model-value="mappingValue(column)"
                    :options="mappingOptions"
                    :label="columnLabel(column)"
                    :data-testid="`node-detail-roster-import-map-${column}`"
                    @update:model-value="(value) => setMapping(column, value)"
                  />
                </div>
              </div>
            </div>

            <p
              v-if="(draft?.skippedRows ?? 0) > 0"
              class="cn-note"
              data-testid="node-detail-roster-import-skipped"
            >
              {{ t('nodeDetail.client.import.skipped', { count: draft?.skippedRows ?? 0 }) }}
            </p>

            
            <div
              v-if="(draft?.problems.length ?? 0) > 0"
              class="cn-note cn-note--warn"
              data-testid="node-detail-roster-import-problems"
            >
              <p v-for="(problem, index) in draft?.problems ?? []" :key="index">
                {{ problemText(problem) }}
              </p>
            </div>

            <p
              v-if="tooManyRows"
              class="cn-note cn-note--fail"
              data-testid="node-detail-roster-import-too-many"
            >
              {{
                t('nodeDetail.client.import.problemTooManyRows', {
                  count: members.length,
                  max: ROSTER_MAX_ROWS,
                })
              }}
            </p>

            
            <div v-if="previewMembers.length > 0" class="cn-field">
              <span class="cn-field__label">
                {{ t('nodeDetail.client.import.preview', { count: previewMembers.length }) }}
              </span>
              <div class="cn-table-wrap">
                <table class="cn-table" data-testid="node-detail-roster-import-preview">
                  <thead>
                    <tr>
                      <th v-for="column in columns" :key="column">{{ columnLabel(column) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(member, index) in previewMembers" :key="index">
                      <td v-for="column in columns" :key="column">{{ memberCell(member, column) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>

        <footer class="cn-drawer__foot">
          
          <p
            class="cn-note cn-note--warn"
            data-testid="node-detail-roster-import-overwrite"
          >
            {{ t('nodeDetail.rosterModeReplace') }}
          </p>
          <button
            type="button"
            class="cn-btn cn-btn--accent"
            data-testid="node-detail-roster-import-confirm"
            :disabled="!canConfirm"
            @click="confirm"
          >
            {{ t('nodeDetail.client.import.confirm') }}
          </button>
          <span class="cn-field__label">{{ hint }}</span>
        </footer>
      </aside>
    </div>
  </div>
</template>
