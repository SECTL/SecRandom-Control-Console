<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FluentIcon from './FluentIcon.vue'












const props = defineProps<{
  
  readonly?: boolean
  
  unread?: boolean
  
  dirty?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <span v-if="props.readonly === true" class="cn-chip" data-mark="readonly">
    <FluentIcon name="textFont" :size="14" />
    <span>{{ t('nodeDetail.settingsRead.notWritable') }}</span>
  </span>

  <span v-if="props.unread === true" class="cn-badge" data-mark="unread">
    {{ t('nodeDetail.settingsRead.valueUnknown') }}
  </span>

  <span
    v-if="props.dirty === true"
    class="cn-dirty"
    role="img"
    data-mark="dirty"
    :aria-label="t('nodeDetail.settingsRead.changes', { count: 1 })"
  />
</template>
