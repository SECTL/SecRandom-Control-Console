<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NodeSettingFieldDto } from '@/api/protocol'
import type { ClientSettingValueRow } from '@/data/client-settings-pages'
import ClientNumberBox from './ClientNumberBox.vue'
import ClientSettingControl from './ClientSettingControl.vue'
import type { ClientSettingControlSpec } from './client-model'















const props = defineProps<{
  
  spec: ClientSettingControlSpec
  
  control: ClientSettingValueRow['control']
  
  field: NodeSettingFieldDto
  
  draft: string | number | boolean | undefined
  
  numberValue: number | null
  
  included: boolean
  
  needsInclude: boolean
  
  locked: boolean
}>()

const emit = defineEmits<{
  'update-value': [value: string | number | boolean]
  'update-number': [value: number | null]
  'update-include': [checked: boolean]
}>()

const { t } = useI18n()


const disabled = computed(() => props.locked || (props.needsInclude && !props.included))
</script>

<template>
  <div class="cn-batch-cell">
    
    <label v-if="props.needsInclude" class="cn-batch-cell__include">
      <input
        type="checkbox"
        class="size-3.5 accent-brand"
        :checked="props.included"
        :disabled="props.locked"
        :data-testid="`batch-include-${props.spec.path}`"
        @change="emit('update-include', ($event.target as HTMLInputElement).checked)"
      />
      <span>{{ t('batchConfig.include') }}</span>
    </label>

    <ClientNumberBox
      v-if="props.control === 'number'"
      :model-value="props.numberValue"
      :disabled="disabled"
      :label="props.spec.title"
      :data-testid="`setting-${props.spec.path}`"
      @update:model-value="emit('update-number', $event)"
    />

    <ClientSettingControl
      v-else
      :row="props.spec"
      :field="props.field"
      :draft="props.draft"
      :locked="disabled"
      @update="emit('update-value', $event)"
    />
  </div>
</template>
