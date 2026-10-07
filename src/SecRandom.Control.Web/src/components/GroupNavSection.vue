<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { GripVertical, LayoutGrid } from '@lucide/vue'
import type { GroupSummary } from '@/api/protocol'
import ConsoleIcon from '@/components/ConsoleIcon.vue'
import { useAnyListSorting, useLongPressSort } from '@/composables/useLongPressSort'







const props = defineProps<{
  groups: GroupSummary[]
  
  emptyHint: string
  
  testId: string
}>()

const emit = defineEmits<{ commit: [orderedIds: string[]] }>()

const { t } = useI18n()
const route = useRoute()


const draftIds = ref<string[]>([])

const anySorting = useAnyListSorting()

const { sorting, draggingId, arm, moveBy, commit, cancel } = useLongPressSort({
  ids: () => draftIds.value,
  onStart: () => {
    draftIds.value = props.groups.map((group) => group.group_id)
  },
  onMove: (from, to) => {
    const next = [...draftIds.value]
    const [moved] = next.splice(from, 1)
    if (moved === undefined) return
    next.splice(to, 0, moved)
    draftIds.value = next
  },
  onCommit: () => emit('commit', [...draftIds.value]),
  onCancel: () => {
    draftIds.value = []
  },
})


const orderedGroups = computed(() => {
  if (!sorting.value) return props.groups

  const byId = new Map(props.groups.map((group) => [group.group_id, group]))
  return draftIds.value
    .map((id) => byId.get(id))
    .filter((group): group is GroupSummary => group !== undefined)
})


const frozen = computed(() => anySorting.value && !sorting.value)
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <template v-for="(group, index) in orderedGroups" :key="group.group_id">
      
      <div
        v-if="sorting"
        :data-sort-id="group.group_id"
        data-testid="sort-row"
        class="console-nav__item nav-item flex cursor-grabbing items-center gap-2 rounded-control px-2.5 py-1.5 text-[13px] text-text-base select-none"
        :class="
          draggingId === group.group_id
            ? 'bg-surface-3 ring-1 ring-brand'
            : 'bg-surface-2'
        "
        style="touch-action: none"
        @pointerdown="arm($event, group.group_id)"
      >
        
        <GripVertical class="icon flex-none text-text-faint" />
        <span class="truncate">{{ group.name }}</span>

        <span class="ml-auto flex flex-none items-center gap-0.5">
          <button
            type="button"
            data-testid="sort-up"
            class="console-icon-btn press grid h-6 w-6 place-items-center rounded-control border border-border-strong bg-surface text-text-muted hover:bg-surface-3 disabled:opacity-30"
            :disabled="index === 0"
            :aria-label="t('console.moveUp')"
            @click="moveBy(group.group_id, -1)"
          >
            <ConsoleIcon name="ChevronUp" class="icon" />
          </button>
          <button
            type="button"
            data-testid="sort-down"
            class="console-icon-btn press grid h-6 w-6 place-items-center rounded-control border border-border-strong bg-surface text-text-muted hover:bg-surface-3 disabled:opacity-30"
            :disabled="index === orderedGroups.length - 1"
            :aria-label="t('console.moveDown')"
            @click="moveBy(group.group_id, 1)"
          >
            <ConsoleIcon name="ChevronDown" class="icon" />
          </button>
        </span>
      </div>

      <RouterLink
        v-else
        :to="`/console/groups/${group.group_id}`"
        :data-sort-id="group.group_id"
        class="console-nav__item nav-item flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-[13px] text-text-muted hover:bg-surface-2 hover:text-text-base"
        :class="{ 'pointer-events-none opacity-40': frozen }"
        :data-active="route.params.groupId === group.group_id ? 'true' : 'false'"
        @pointerdown="arm($event, group.group_id)"
      >
        
        <LayoutGrid class="icon transition duration-200" />
        <span class="truncate">{{ group.name }}</span>
      </RouterLink>
    </template>

    <p
      v-if="orderedGroups.length === 0 && !sorting"
      :data-testid="`${testId}-empty`"
      class="px-2.5 py-1 text-[11.5px] leading-relaxed text-text-faint"
    >
      {{ emptyHint }}
    </p>

    
    <div
      v-if="sorting"
      data-testid="sort-hint"
      class="console-note mt-1 flex flex-wrap items-center gap-1.5 rounded-control border border-border-base bg-surface px-2 py-1.5"
    >
      <span class="text-[10.5px] leading-tight text-text-faint">{{ t('console.sortHint') }}</span>
      <button
        type="button"
        data-testid="sort-cancel"
        class="console-btn press ml-auto rounded-control border border-border-strong bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted hover:bg-surface-3"
        @click="cancel"
      >
        {{ t('console.sortCancel') }}
      </button>
      <button
        type="button"
        data-testid="sort-done"
        class="console-btn console-btn--accent btn-primary press rounded-control border border-brand bg-brand px-2 py-0.5 text-[11px] font-medium text-white hover:bg-brand-hover"
        @click="commit"
      >
        {{ t('console.sortDone') }}
      </button>
    </div>

    
    <p
      v-else-if="orderedGroups.length > 1"
      data-testid="sort-discovery"
      class="px-2.5 pt-0.5 text-[10.5px] text-text-faint"
    >
      {{ t('console.sortLongPress') }}
    </p>
  </div>
</template>
