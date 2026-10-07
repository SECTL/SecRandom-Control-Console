<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NodeRosterListDto, NodeRosterMemberDto, RosterKind } from '@/api/protocol'
import { splitTags } from '@/utils/command-feedback'
import '@/assets/client-theme.css'
import FluentIcon from './FluentIcon.vue'
import ClientCommandBar from './ClientCommandBar.vue'
import type { ClientCommand, ClientRosterPanelState } from './client-model'












const props = defineProps<{
  kind: RosterKind
  lists: readonly NodeRosterListDto[]
  selectedListName: string | null
  members: readonly NodeRosterMemberDto[]
  state: ClientRosterPanelState
  





  readHint?: string | null
}>()

const emit = defineEmits<{
  read: []
  selectList: [name: string]
  switchKind: [kind: RosterKind]
  updateMember: [index: number, patch: Record<string, unknown>]
  






  addRow: [member: NodeRosterMemberDto]
  removeRow: [index: number]
  import: []
  export: []
  submit: []
}>()

const { t } = useI18n()

type RosterColumnId =
  | 'enabled'
  | 'id'
  | 'name'
  | 'gender'
  | 'group'
  | 'count'
  | 'weight'
  | 'tags'
  | 'actions'


const COLUMNS: Record<RosterKind, readonly RosterColumnId[]> = {
  students: ['enabled', 'id', 'name', 'gender', 'group', 'tags', 'actions'],
  prizes: ['enabled', 'id', 'name', 'count', 'weight', 'tags', 'actions'],
}







type RosterFieldId = Exclude<RosterColumnId, 'actions' | 'enabled'>






const COLUMN_WEIGHT: Record<RosterColumnId, number> = {
  enabled: 7,
  id: 13,
  name: 18,
  gender: 9,
  group: 13,
  count: 12,
  weight: 12,
  tags: 24,
  actions: 14,
}

const layout = computed(() => {
  const ids = COLUMNS[props.kind]
  const total = ids.reduce((sum, id) => sum + COLUMN_WEIGHT[id], 0)
  return ids.map((id) => ({ id, width: `${Math.round((COLUMN_WEIGHT[id] / total) * 1000) / 10}%` }))
})

const kindLabel = computed(() =>
  props.kind === 'prizes'
    ? t('nodeDetail.rosterKind.prizes')
    : t('nodeDetail.rosterKind.students'),
)

const memberCount = computed(() =>
  props.kind === 'prizes'
    ? t('nodeDetail.rosterRead.membersPrizes', { count: props.members.length })
    : t('nodeDetail.rosterRead.members', { count: props.members.length }),
)


const activeList = computed<NodeRosterListDto | null>(
  () => props.lists.find((list) => list.name === props.selectedListName) ?? null,
)

const truncatedList = computed<NodeRosterListDto | null>(() =>
  activeList.value?.truncated === true ? activeList.value : null,
)








function optionalTitle(text: string | null): { title?: string } {
  return text === null ? {} : { title: text }
}

const commands = computed<readonly ClientCommand[]>(() => {
  const noList = props.selectedListName === null
  const empty = props.members.length === 0

  return [
    {
      id: 'read',
      label: t('nodeDetail.rosterRead.read'),
      icon: 'arrowClockwise',
      disabled: !props.state.canRead || props.state.busy,
      testId: 'roster-refresh',
    },
    {
      id: 'add',
      label: t('nodeDetail.rosterRead.addRow'),
      icon: 'personAdd',
      disabled: props.state.busy || noList,
      separatorBefore: true,
      testId: 'roster-add',
      ...optionalTitle(noList ? t('nodeDetail.rosterRead.pickList') : null),
    },
    {
      id: 'import',
      label: t('nodeDetail.client.roster.importAction'),
      icon: 'peopleAdd',
      disabled: props.state.busy || noList,
      testId: 'roster-import',
      ...optionalTitle(noList ? t('nodeDetail.rosterRead.importNeedsList') : null),
    },
    {
      id: 'export',
      label: t('nodeDetail.client.roster.exportAction'),
      icon: 'arrowDownload',
      disabled: props.state.busy || empty,
      testId: 'roster-export',
      ...optionalTitle(empty ? t('nodeDetail.client.roster.exportEmpty') : null),
    },
    {
      id: 'submit',
      label: t('nodeDetail.rosterRead.submit'),
      icon: 'checkmark',
      disabled: !props.state.canPush || props.state.busy || empty,
      separatorBefore: true,
      testId: 'roster-submit',
    },
  ]
})

function onRun(id: string): void {
  switch (id) {
    case 'read':
      emit('read')
      return
    case 'add':
      openAddDialog()
      return
    case 'import':
      emit('import')
      return
    case 'export':
      emit('export')
      return
    case 'submit':
      emit('submit')
      return
    default:
      
      
      return
  }
}











const addOpen = ref(false)


const EMPTY_ADD_DRAFT: Record<RosterFieldId, string> = {
  id: '',
  name: '',
  gender: '',
  group: '',
  count: '',
  weight: '',
  tags: '',
}

const addDraft = ref<Record<RosterFieldId, string>>({ ...EMPTY_ADD_DRAFT })

const adding = computed(() => props.kind === 'prizes')






function splitTagInput(raw: string): string[] | null {
  return splitTags(raw)
}






function addNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : Number.NaN
  if (typeof raw !== 'string') return null
  const text = raw.trim()
  if (text.length === 0) return null
  return Number(text)
}

const addNumberInvalid = computed(() => {
  if (!adding.value) return false
  const count = addNumber(addDraft.value.count)
  const weight = addNumber(addDraft.value.weight)
  return (count !== null && !Number.isFinite(count)) || (weight !== null && !Number.isFinite(weight))
})


const addInvalid = computed(() => {
  const id = addDraft.value.id.trim()
  const name = addDraft.value.name.trim()
  if (id.length === 0 && name.length === 0) return true
  return addNumberInvalid.value
})

function resetAddDraft(): void {
  addDraft.value = { ...EMPTY_ADD_DRAFT }
}

function openAddDialog(): void {
  resetAddDraft()
  addOpen.value = true
}

function closeAddDialog(): void {
  addOpen.value = false
  resetAddDraft()
}

function confirmAdd(): void {
  if (addInvalid.value) return
  const draft = addDraft.value
  const id = draft.id.trim()
  const name = draft.name.trim()
  const gender = draft.gender.trim()
  const group = draft.group.trim()

  const member: NodeRosterMemberDto = {
    id: id.length > 0 ? id : null,
    name: name.length > 0 ? name : null,
    gender: adding.value ? null : gender.length > 0 ? gender : null,
    group: adding.value ? null : group.length > 0 ? group : null,
    count: addNumber(draft.count),
    weight: addNumber(draft.weight),
    
    
    enabled: true,
  }
  const tags = splitTagInput(draft.tags)
  if (tags !== null) member.tags = tags

  closeAddDialog()
  emit('addRow', member)
}








function onAddKeydown(event: KeyboardEvent): void {
  if (!addOpen.value || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  closeAddDialog()
}

onMounted(() => window.addEventListener('keydown', onAddKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onAddKeydown, true))


const listMenuOpen = ref(false)

function chooseList(name: string): void {
  listMenuOpen.value = false
  emit('selectList', name)
}


const selectedRow = ref<number | null>(null)

function columnLabel(column: RosterColumnId): string {
  switch (column) {
    case 'enabled':
      return t('nodeDetail.rosterRead.colEnabled')
    case 'id':
      return t('nodeDetail.rosterRead.colId')
    case 'name':
      return props.kind === 'prizes'
        ? t('nodeDetail.rosterRead.colPrizeName')
        : t('nodeDetail.rosterRead.colStudentName')
    case 'gender':
      return t('nodeDetail.rosterRead.colGender')
    case 'group':
      return t('nodeDetail.rosterRead.colGroup')
    case 'count':
      return t('nodeDetail.rosterRead.colCount')
    case 'weight':
      return t('nodeDetail.rosterRead.colWeight')
    case 'tags':
      return t('nodeDetail.client.roster.colTags')
    case 'actions':
      return t('nodeDetail.client.roster.colActions')
  }
}

function centered(column: RosterColumnId): boolean {
  return column === 'enabled' || column === 'actions'
}

function textValue(member: NodeRosterMemberDto, column: RosterColumnId): string {
  switch (column) {
    case 'id':
      return member.id ?? ''
    case 'name':
      return member.name ?? ''
    case 'gender':
      return member.gender ?? ''
    case 'group':
      return member.group ?? ''
    default:
      return ''
  }
}

function numberValue(member: NodeRosterMemberDto, column: RosterColumnId): string {
  if (column === 'count') return member.count === null ? '' : String(member.count)
  if (column === 'weight') return member.weight === null ? '' : String(member.weight)
  return ''
}


function tagsText(member: NodeRosterMemberDto): string {
  return member.tags == null ? '' : member.tags.join(', ')
}


function onTextChange(index: number, column: RosterColumnId, event: Event): void {
  if (column !== 'id' && column !== 'name' && column !== 'gender' && column !== 'group') return
  const raw = (event.target as HTMLInputElement).value.trim()
  emit('updateMember', index, { [column]: raw.length > 0 ? raw : null })
}

function onNumberChange(index: number, column: RosterColumnId, event: Event): void {
  if (column !== 'count' && column !== 'weight') return
  const raw = (event.target as HTMLInputElement).value.trim()
  if (raw.length === 0) {
    emit('updateMember', index, { [column]: null })
    return
  }
  const value = Number(raw)
  if (!Number.isFinite(value)) return
  emit('updateMember', index, { [column]: value })
}

function onEnabledChange(index: number, event: Event): void {
  emit('updateMember', index, { enabled: (event.target as HTMLInputElement).checked })
}








function onTagsChange(index: number, member: NodeRosterMemberDto, event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  const next = raw
    .split(/[,，;；|/\s]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  const current = member.tags ?? []
  if (next.length === current.length && next.every((tag, position) => tag === current[position])) {
    return
  }

  emit('updateMember', index, { tags: next })
}


const cannotReadHint = computed(() =>
  props.readHint !== undefined && props.readHint !== null && props.readHint.length > 0
    ? props.readHint
    : t('nodeDetail.rosterRead.adminRequired'),
)


const statusHint = computed<string | null>(() => {
  switch (props.state.status) {
    case 'idle':
      
      return props.state.canRead ? null : cannotReadHint.value
    case 'reading':
      return t('nodeDetail.rosterRead.reading')
    case 'ready':
      if (props.lists.length === 0) return t('nodeDetail.rosterRead.empty')
      if (props.selectedListName === null) return t('nodeDetail.rosterRead.pickList')
      return null
    case 'unavailable':
      






      return props.state.canRead ? null : cannotReadHint.value
    case 'failed':
      return null
  }
})

const statusTone = computed(() => (props.state.status === 'unavailable' ? 'warn' : 'info'))


const ADD_FIELDS = computed<RosterFieldId[]>(() =>
  adding.value
    ? ['id', 'name', 'count', 'weight', 'tags']
    : ['id', 'name', 'gender', 'group', 'tags'],
)








function addFieldInputMode(column: RosterFieldId): 'decimal' | undefined {
  return column === 'count' || column === 'weight' ? 'decimal' : undefined
}
</script>

<template>
  <div class="client-ui">
    <div class="cn-roster" data-testid="client-roster-panel">
      
      <div class="cn-page">
        <ClientCommandBar
          :commands="commands"
          leading
          :label="kindLabel"
          @run="onRun"
        >
          <template #leading>
            
            <div class="cn-listmenu-anchor">
              <button
                type="button"
                class="cn-cmd"
                data-testid="roster-current-list"
                :aria-expanded="listMenuOpen"
                :aria-haspopup="'menu'"
                :title="t('nodeDetail.client.roster.changeList')"
                @click="listMenuOpen = !listMenuOpen"
              >
                <FluentIcon name="peopleList" />
                <span>{{ props.selectedListName ?? t('nodeDetail.rosterRead.pickList') }}</span>
                <FluentIcon class="cn-cmd__caret" name="chevronDown" :size="10" />
              </button>

              <div v-if="listMenuOpen" class="cn-listmenu" role="menu" data-testid="roster-list-menu">
                <button
                  v-for="(list, index) in props.lists"
                  :key="list.name"
                  type="button"
                  class="cn-listmenu__item"
                  role="menuitemradio"
                  :aria-checked="list.name === props.selectedListName"
                  :data-testid="`roster-list-option-${index}`"
                  @click="chooseList(list.name)"
                >
                  <FluentIcon name="peopleList" :size="14" />
                  <span class="cn-nav__label">{{ list.name }}</span>
                  <span class="cn-badge" :data-testid="`roster-list-count-${index}`">
                    {{
                      props.kind === 'prizes'
                        ? t('nodeDetail.rosterRead.membersPrizes', { count: list.count })
                        : t('nodeDetail.rosterRead.members', { count: list.count })
                    }}
                  </span>
                  <span
                    v-if="list.is_default"
                    class="cn-badge cn-badge--brand"
                    :data-testid="`roster-list-default-${index}`"
                  >
                    {{ t('nodeDetail.rosterRead.current') }}
                  </span>
                  
                  <span
                    v-if="list.truncated"
                    class="cn-badge cn-badge--warn"
                    :data-testid="`roster-list-truncated-${index}`"
                  >
                    {{ t('nodeDetail.rosterRead.truncated') }}
                  </span>
                </button>
              </div>
            </div>

            
            <div class="cn-segment" role="tablist" :aria-label="t('nodeDetail.tabs.roster')">
              <button
                type="button"
                class="cn-segment__item"
                role="tab"
                :aria-selected="props.kind === 'students'"
                data-testid="roster-kind-students"
                @click="emit('switchKind', 'students')"
              >
                {{ t('nodeDetail.rosterKind.students') }}
              </button>
              <button
                type="button"
                class="cn-segment__item"
                role="tab"
                :aria-selected="props.kind === 'prizes'"
                data-testid="roster-kind-prizes"
                @click="emit('switchKind', 'prizes')"
              >
                {{ t('nodeDetail.rosterKind.prizes') }}
              </button>
            </div>
          </template>

          <span data-testid="roster-member-count">{{ memberCount }}</span>
        </ClientCommandBar>

        <div class="cn-roster__body">
          <p
            v-if="statusHint !== null"
            class="cn-note"
            :class="`cn-note--${statusTone}`"
            data-testid="roster-status"
          >
            {{ statusHint }}
          </p>

          <ul v-if="props.state.notices.length > 0" class="cn-notices" data-testid="roster-notices">
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

          
          <p v-if="truncatedList !== null" class="cn-note cn-note--warn" data-testid="roster-truncated">
            {{
              t('nodeDetail.rosterRead.truncatedHint', {
                count: truncatedList.count,
                total: truncatedList.total,
              })
            }}
          </p>

          <div class="cn-grid-card">
            <table class="cn-grid" :aria-label="kindLabel" data-testid="roster-table">
              <colgroup>
                <col v-for="column in layout" :key="column.id" :style="{ width: column.width }" />
              </colgroup>

              <thead>
                <tr>
                  <th
                    v-for="column in layout"
                    :key="column.id"
                    :class="{ 'cn-grid__center': centered(column.id) }"
                    :data-testid="`roster-col-${column.id}`"
                  >
                    <span class="cn-grid__th">
                      {{ columnLabel(column.id) }}
                      
                      <FluentIcon class="cn-grid__sort" name="chevronDown" :size="10" />
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(member, index) in props.members"
                  :key="index"
                  :class="{ 'is-selected': selectedRow === index }"
                  :data-testid="`roster-row-${index}`"
                  @click="selectedRow = index"
                >
                  <td
                    v-for="column in layout"
                    :key="column.id"
                    :class="{
                      'cn-grid__center': centered(column.id),
                      'cn-grid__actions': column.id === 'actions',
                    }"
                  >
                    <label v-if="column.id === 'enabled'" class="cn-check">
                      <input
                        type="checkbox"
                        :checked="member.enabled"
                        :aria-label="t('nodeDetail.rosterRead.colEnabled')"
                        :data-testid="`roster-enabled-${index}`"
                        @change="onEnabledChange(index, $event)"
                      />
                      <span class="cn-check__box"><FluentIcon name="checkmark" :size="12" /></span>
                    </label>

                    <input
                      v-else-if="column.id === 'tags'"
                      class="cn-cell-input"
                      type="text"
                      :value="tagsText(member)"
                      :placeholder="t('nodeDetail.client.roster.tagsPlaceholder')"
                      :data-testid="`roster-tags-${index}`"
                      @change="onTagsChange(index, member, $event)"
                    />

                    <div v-else-if="column.id === 'actions'" class="cn-grid__cellactions">
                      <button
                        type="button"
                        class="cn-icon-btn cn-icon-btn--danger"
                        :title="t('nodeDetail.rosterRead.removeRow')"
                        :aria-label="t('nodeDetail.rosterRead.removeRow')"
                        :data-testid="`roster-remove-${index}`"
                        @click.stop="emit('removeRow', index)"
                      >
                        <FluentIcon name="delete" />
                      </button>
                    </div>

                    <input
                      v-else-if="column.id === 'count' || column.id === 'weight'"
                      class="cn-cell-input cn-cell-input--number"
                      type="number"
                      min="0"
                      :value="numberValue(member, column.id)"
                      :aria-label="columnLabel(column.id)"
                      :data-testid="`roster-${column.id}-${index}`"
                      @change="onNumberChange(index, column.id, $event)"
                    />

                    <input
                      v-else
                      class="cn-cell-input"
                      type="text"
                      :value="textValue(member, column.id)"
                      :aria-label="columnLabel(column.id)"
                      :data-testid="`roster-${column.id}-${index}`"
                      @change="onTextChange(index, column.id, $event)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <p v-if="props.members.length === 0" class="cn-grid__empty" data-testid="roster-no-rows">
              {{ t('nodeDetail.rosterRead.noRows') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    
    <div
      v-if="addOpen"
      class="cn-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('nodeDetail.rosterRead.addRow')"
      data-testid="roster-add-dialog"
    >
      <div class="cn-dialog__scrim" data-testid="roster-add-scrim" @click="closeAddDialog" />

      <div class="cn-dialog__card">
        <h3 class="cn-dialog__title">{{ t('nodeDetail.rosterRead.addRow') }}</h3>

        <div class="cn-dialog__body">
          <div class="cn-form-grid">
            <div v-for="column in ADD_FIELDS" :key="column" class="cn-field">
              <span class="cn-field__label">{{ columnLabel(column) }}</span>
              <input
                v-model="addDraft[column]"
                class="cn-cell-input"
                type="text"
                :inputmode="addFieldInputMode(column)"
                :aria-label="columnLabel(column)"
                :aria-invalid="column === 'count' || column === 'weight' ? addNumberInvalid : undefined"
                :placeholder="column === 'tags' ? t('nodeDetail.client.roster.tagsPlaceholder') : undefined"
                :data-testid="`roster-add-${column}`"
              />
            </div>
          </div>
        </div>

        <footer class="cn-dialog__foot">
          <button
            type="button"
            class="cn-btn"
            data-testid="roster-add-cancel"
            @click="closeAddDialog"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="cn-btn cn-btn--accent"
            data-testid="roster-add-confirm"
            :disabled="addInvalid"
            @click="confirmAdd"
          >
            {{ t('common.confirm') }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>
