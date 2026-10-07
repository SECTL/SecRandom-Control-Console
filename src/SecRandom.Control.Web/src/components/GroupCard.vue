<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import type { GroupSummary } from '@/api/protocol'
import { displayName } from '@/utils/display-name'
import ConsoleIcon from '@/components/ConsoleIcon.vue'







const props = defineProps<{ group: GroupSummary }>()

const { t } = useI18n()


const ownerName = computed(() =>
  displayName(props.group.owner_display_name, props.group.owner_user_id),
)
</script>

<template>
  
  <div class="console-card reveal rounded-card border border-border-base bg-surface">
    <RouterLink
      :to="`/console/groups/${group.group_id}`"
      class="group flex flex-col px-4 py-3.5"
      data-reveal
    >
      <div class="flex items-center gap-2">
        <ConsoleIcon name="LayoutDashboard" class="icon text-brand-bright" />
        <div class="text-[14px] font-semibold">{{ group.name }}</div>
        <ConsoleIcon
          name="ArrowRight"
          class="icon ml-auto -translate-x-1 text-brand-bright opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        />
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-text-muted">
        
        <span
          class="console-badge rounded-full border border-brand/35 bg-brand/15 px-2 py-0.5 text-brand-bright"
        >
          {{ t('group.youAre') }} {{ t(`roles.${group.role}`) }}
        </span>
        
        <span data-testid="group-card-owner">
          {{ t('group.ownerLabel') }}
          <span class="font-medium">{{ ownerName }}</span>
        </span>
        <span>·</span>
        <span>{{ t('group.groupIdLabel') }}</span>
        <span class="font-mono text-text-faint">{{ group.group_id }}</span>
      </div>
    </RouterLink>
  </div>
</template>
