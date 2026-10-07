<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NodeSettingFieldDto } from '@/api/protocol'
import { optionLabelOf } from '@/data/client-setting-option-labels'
import {
  isClientSettingContainer,
  type ClientSettingContainerRow,
  type ClientSettingValueRow,
  type ClientSettingsPage,
} from '@/data/client-settings-pages'
import {
  clientPageNavGroups,
  clientSettingLocale,
  localizedSettingText,
} from '@/utils/client-settings-presenter'
import '@/assets/client-theme.css'
import FluentIcon from './FluentIcon.vue'
import ClientNestedRow from './ClientNestedRow.vue'
import ClientPageNav from './ClientPageNav.vue'
import ClientSettingCard from './ClientSettingCard.vue'
import ClientSettingControl from './ClientSettingControl.vue'
import type {
  ClientSelectOption,
  ClientSettingControlSpec,
  ClientSettingsPanelState,
} from './client-model'
































type SnapshotValueRow = ClientSettingValueRow & {
  min?: number | null
  max?: number | null
  step?: number | null
}







type SnapshotRow = SnapshotValueRow | ClientSettingContainerRow









interface DisplayRow {
  
  key: string
  
  container: boolean
  
  path: string | null
  title: string
  description: string | null
  icon: string
  expanded: boolean
  hasExtra: boolean
  disabled: boolean
  readonly: boolean
  unread: boolean
  dirty: boolean
  testId: string
  
  spec: ClientSettingControlSpec | null
  field: NodeSettingFieldDto | undefined
  draft: string | number | boolean | undefined
  children: readonly DisplayRow[]
}

const props = defineProps<{
  pages: readonly ClientSettingsPage[]
  
  activePageId: string
  
  fields: Record<string, NodeSettingFieldDto>
  drafts: Record<string, string | number | boolean>
  state: ClientSettingsPanelState
  






  readHint?: string | null
}>()

const emit = defineEmits<{
  selectPage: [id: string]
  updateDraft: [path: string, value: string | number | boolean]
  read: []
  submit: []
}>()

const { t, locale } = useI18n()






const navGroups = computed(() => clientPageNavGroups(props.pages, (key) => t(key)))

const activePage = computed<ClientSettingsPage | undefined>(() =>
  props.pages.find((page) => page.id === props.activePageId),
)


type SnapshotSection = ClientSettingsPage['sections'][number] & { icon?: string | null }


interface DisplaySection {
  id: string
  title: string
  icon: string | null
  rows: readonly DisplayRow[]
}

const sections = computed<readonly DisplaySection[]>(() =>
  (activePage.value?.sections ?? []).map((section) => {
    const widened: SnapshotSection = section
    return {
      id: section.id,
      title: section.title,
      icon: widened.icon ?? null,
      rows: section.rows
        
        .filter((row) => isRowVisible(row))
        .map((row) => displayRow(row, section.id)),
    }
  }),
)







const activeRows = computed(() =>
  sections.value.reduce(
    (total, section) => total + section.rows.filter((row) => !row.container).length,
    0,
  ),
)

function fieldOf(path: string): NodeSettingFieldDto | undefined {
  return props.fields[path]
}

function draftOf(path: string): string | number | boolean | undefined {
  return props.drafts[path]
}


function isUnread(path: string): boolean {
  return fieldOf(path) === undefined
}


function isReadonly(path: string): boolean {
  return fieldOf(path)?.writable === false
}







function controlSpecOf(row: SnapshotValueRow): ClientSettingControlSpec {
  const options: readonly ClientSelectOption[] = (row.options ?? []).map((entry) => {
    
    
    
    
    
    
    
    if (typeof entry === 'string') {
      return { value: entry, label: optionLabelOf(row.path, entry, clientSettingLocale(locale.value)) ?? entry }
    }
    return { value: entry.value, label: localizedSettingText(entry.labels, locale.value, entry.value) }
  })

  const spec: ClientSettingControlSpec = {
    path: row.path,
    title: titleOf(row, row.path),
    control: row.control,
  }
  if (options.length > 0) spec.options = options
  if (row.min !== undefined) spec.min = row.min
  if (row.max !== undefined) spec.max = row.max
  if (row.step !== undefined) spec.step = row.step
  if (row.readonly !== undefined) spec.readonly = row.readonly
  return spec
}


function titleOf(row: SnapshotRow, fallback: string): string {
  return localizedSettingText(row.labels, locale.value, fallback)
}








function rowDescription(row: SnapshotRow): string | null {
  const fromSnapshot = localizedSettingText(row.descriptions, locale.value, '')
  if (fromSnapshot.length > 0) return fromSnapshot
  if (isClientSettingContainer(row)) return null
  return props.fields[row.path]?.description ?? null
}










function isDisabled(row: SnapshotValueRow): boolean {
  return !props.state.canWrite || row.readonly === true || isReadonly(row.path)
}





function effectiveValueOf(path: string): unknown {
  const draft = draftOf(path)
  if (draft !== undefined) return draft
  return fieldOf(path)?.value
}











function isRowVisible(row: SnapshotRow): boolean {
  const visibility = row.visibleWhen
  if (visibility === undefined) return true

  return visibility.all.every((condition) => {
    const value = effectiveValueOf(condition.path)
    
    if (value === undefined || value === null) return true

    if (condition.equals !== undefined) return matchesCondition(value, condition.equals)
    if (condition.notEquals !== undefined) return !matchesCondition(value, condition.notEquals)
    
    return true
  })
}


function matchesCondition(value: unknown, expected: unknown): boolean {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return sameValue(value, expected)
  }
  
  return typeof expected === 'string' && String(value) === expected
}








function isDirty(path: string): boolean {
  const draft = draftOf(path)
  if (draft === undefined) return false

  const field = fieldOf(path)
  if (field === undefined) return true
  return !sameValue(draft, field.value)
}

function sameValue(draft: string | number | boolean, device: unknown): boolean {
  if (typeof draft === 'boolean') return device === draft || device === String(draft)
  if (typeof draft === 'number') {
    return device === draft || (typeof device === 'string' && Number(device) === draft)
  }
  if (typeof device === 'string') return device === draft
  if (typeof device === 'number' || typeof device === 'boolean') return String(device) === draft
  return false
}








const expandedPaths = ref<Record<string, boolean>>({})


function expandKeyOf(row: SnapshotRow, sectionId: string): string {
  return isClientSettingContainer(row) ? `container:${sectionId}:${row.id}` : row.path
}

function isExpanded(row: DisplayRow): boolean {
  return expandedPaths.value[row.key] ?? row.expanded
}

function toggleExpand(row: DisplayRow): void {
  expandedPaths.value = { ...expandedPaths.value, [row.key]: !isExpanded(row) }
}







function displayRow(row: SnapshotRow, sectionId: string): DisplayRow {
  const container = isClientSettingContainer(row)
  const key = expandKeyOf(row, sectionId)
  const children = (row.rows ?? [])
    .filter((child) => isRowVisible(child))
    .map((child) => displayRow(child, sectionId))

  return {
    key,
    container,
    path: container ? null : row.path,
    title: titleOf(row, container ? row.id : row.path),
    description: rowDescription(row),
    icon: row.icon,
    expanded: expandedPaths.value[key] ?? row.expanded === true,
    hasExtra: children.length > 0,
    disabled: container ? false : isDisabled(row),
    






    readonly: container ? false : row.readonly === true || isReadonly(row.path),
    unread: container ? false : isUnread(row.path),
    dirty: container ? false : isDirty(row.path),
    testId: container ? `container-${row.id}` : `card-${row.path}`,
    spec: container ? null : controlSpecOf(row),
    field: container ? undefined : fieldOf(row.path),
    draft: container ? undefined : draftOf(row.path),
    children,
  }
}




const cannotReadHint = computed(() =>
  props.readHint !== undefined && props.readHint !== null && props.readHint.length > 0
    ? props.readHint
    : t('nodeDetail.settingsRead.operatorRequired'),
)


const statusHint = computed<string | null>(() => {
  switch (props.state.status) {
    case 'idle':
      




      return props.state.canRead ? t('nodeDetail.settingsRead.hint') : cannotReadHint.value
    case 'reading':
      return t('nodeDetail.settingsRead.reading')
    case 'ready':
      return t('nodeDetail.settingsRead.deviceLanguage')
    case 'unavailable':
      










      return props.state.canRead ? null : cannotReadHint.value
    case 'failed':
      return null
  }
})

const statusTone = computed(() => (props.state.status === 'unavailable' ? 'warn' : 'info'))
</script>

<template>
  
  <div class="client-ui">
    <div class="cn-panel" data-testid="client-settings-panel">
      <ClientPageNav
        :groups="navGroups"
        :selected="props.activePageId"
        :label="t('nodeDetail.client.navLabel')"
        @select="emit('selectPage', $event)"
      />

      <div class="cn-panel__content">
        <h1 class="cn-page-title" data-testid="settings-page-title">
          {{ activePage?.title ?? '' }}
        </h1>

        <div class="cn-page-scroll">
          <div class="cn-page">
            
            <div class="cn-actionbar">
              <button
                type="button"
                class="cn-btn"
                data-testid="settings-read"
                :disabled="!props.state.canRead || props.state.busy"
                @click="emit('read')"
              >
                <FluentIcon name="arrowSync" />
                <span>{{ t('nodeDetail.settingsRead.read') }}</span>
              </button>

              <button
                type="button"
                class="cn-btn cn-btn--accent"
                data-testid="settings-submit"
                :disabled="!props.state.canWrite || props.state.busy || props.state.dirtyCount === 0"
                @click="emit('submit')"
              >
                <FluentIcon name="checkmark" />
                <span>{{ t('nodeDetail.settingsRead.submit') }}</span>
              </button>

              <span class="cn-actionbar__count" data-testid="settings-dirty-count">
                {{
                  props.state.dirtyCount > 0
                    ? t('nodeDetail.settingsRead.changes', { count: props.state.dirtyCount })
                    : t('nodeDetail.settingsRead.noChanges')
                }}
              </span>
            </div>

            <p
              v-if="statusHint !== null"
              class="cn-note"
              :class="`cn-note--${statusTone}`"
              data-testid="settings-status"
            >
              {{ statusHint }}
            </p>

            <ul
              v-if="props.state.notices.length > 0"
              class="cn-notices"
              data-testid="settings-notices"
            >
              <li
                v-for="(notice, index) in props.state.notices"
                :key="index"
                class="cn-note"
                :class="`cn-note--${notice.tone}`"
                :data-testid="notice.testId ?? undefined"
              >
                {{ notice.text }}
              </li>
            </ul>

            <p
              v-if="activeRows === 0"
              class="cn-note cn-note--info"
              data-testid="settings-category-empty"
            >
              {{ t('nodeDetail.client.categoryEmpty') }}
            </p>

            <template v-for="(section, index) in sections" :key="section.id">
              <hr v-if="index > 0" class="cn-separator" />

              <section class="cn-section">
                <h2 class="cn-section__head" :data-testid="`settings-section-${section.id}`">
                  
                  <FluentIcon v-if="section.icon" :name="section.icon" :size="18" />
                  <span>{{ section.title }}</span>
                </h2>

                <div class="cn-section__rows">
                  
                  <ClientSettingCard
                    v-for="row in section.rows"
                    :key="row.key"
                    :title="row.title"
                    :description="row.description"
                    :icon="row.icon"
                    :disabled="row.disabled"
                    :readonly="row.readonly"
                    :unread="row.unread"
                    :dirty="row.dirty"
                    :expanded="row.expanded"
                    :has-extra="row.hasExtra"
                    :test-id="row.testId"
                    @toggle-expand="toggleExpand(row)"
                  >
                    <template v-if="row.spec !== null" #control>
                      <ClientSettingControl
                        :row="row.spec"
                        :field="row.field"
                        :draft="row.draft"
                        :locked="!props.state.canWrite"
                        @update="(value) => emit('updateDraft', row.path ?? '', value)"
                      />
                    </template>

                    
                    <template v-if="row.hasExtra" #extra>
                      <ClientNestedRow
                        v-for="child in row.children"
                        :key="child.key"
                        :title="child.title"
                        :description="child.description"
                        :disabled="child.disabled"
                        :readonly="child.readonly"
                        :unread="child.unread"
                        :test-id="child.path === null ? null : `nested-${child.path}`"
                      >
                        <template v-if="child.spec !== null" #control>
                          <ClientSettingControl
                            :row="child.spec"
                            :field="child.field"
                            :draft="child.draft"
                            :locked="!props.state.canWrite"
                            @update="(value) => emit('updateDraft', child.path ?? '', value)"
                          />
                        </template>
                      </ClientNestedRow>
                    </template>
                  </ClientSettingCard>
                </div>
              </section>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
