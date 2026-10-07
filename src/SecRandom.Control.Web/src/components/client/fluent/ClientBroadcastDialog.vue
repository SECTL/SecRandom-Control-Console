<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  MEDIA_VOLUME_MAX_PERCENT,
  MEDIA_VOLUME_MIN_PERCENT,
  type MediaPlayOptions,
} from '@/api/protocol'
import '@/assets/client-theme.css'
import ClientNestedRow from './ClientNestedRow.vue'
import ClientNumberBox from './ClientNumberBox.vue'
import ClientToggle from './ClientToggle.vue'




















const emit = defineEmits<{
  



  confirm: [options: MediaPlayOptions]
  close: []
}>()

const { t } = useI18n()








type VolumeMode = 'keep' | 'set'

const showQuickDrawWindow = ref(false)
const systemMode = ref<VolumeMode>('keep')
const systemVolume = ref<number | null>(null)
const voiceMode = ref<VolumeMode>('keep')
const voiceVolume = ref<number | null>(null)


function volumeUnusable(mode: VolumeMode, value: number | null): boolean {
  if (mode === 'keep') return false
  if (value === null) return true
  return (
    !Number.isInteger(value) ||
    value < MEDIA_VOLUME_MIN_PERCENT ||
    value > MEDIA_VOLUME_MAX_PERCENT
  )
}

const volumeProblem = computed(
  () =>
    volumeUnusable(systemMode.value, systemVolume.value) ||
    volumeUnusable(voiceMode.value, voiceVolume.value),
)

const canConfirm = computed(() => !volumeProblem.value)


const volumeRange = computed(() => ({
  min: MEDIA_VOLUME_MIN_PERCENT,
  max: MEDIA_VOLUME_MAX_PERCENT,
}))

function confirm(): void {
  if (!canConfirm.value) return

  const options: MediaPlayOptions = { show_quick_draw_window: showQuickDrawWindow.value }
  
  
  if (systemMode.value === 'set' && systemVolume.value !== null) {
    options.system_volume_percent = systemVolume.value
  }
  if (voiceMode.value === 'set' && voiceVolume.value !== null) {
    options.voice_volume_percent = voiceVolume.value
  }

  emit('confirm', options)
}



const panel = ref<HTMLElement | null>(null)








function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown, true)
  
  panel.value?.focus()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <div class="client-ui">
    <div
      class="cn-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('nodeDetail.client.broadcast.title')"
      data-testid="broadcast-dialog"
    >
      <div class="cn-dialog__scrim" data-testid="broadcast-scrim" @click="emit('close')" />

      <div ref="panel" class="cn-dialog__card" tabindex="-1">
        <h3 class="cn-dialog__title">{{ t('nodeDetail.client.broadcast.title') }}</h3>

        <div class="cn-dialog__body">
          
          <p class="cn-note" data-testid="broadcast-hint">
            {{ t('nodeDetail.client.broadcast.hint') }}
          </p>

          
          <ClientNestedRow
            :title="t('nodeDetail.client.broadcast.quickDrawWindow')"
            test-id="broadcast-quick-draw-row"
          >
            <template #control>
              <ClientToggle
                :model-value="showQuickDrawWindow"
                :label="t('nodeDetail.client.broadcast.quickDrawWindow')"
                data-testid="broadcast-quick-draw"
                @update:model-value="(value) => (showQuickDrawWindow = value)"
              />
            </template>
          </ClientNestedRow>

          
          <ClientNestedRow
            :title="t('nodeDetail.client.broadcast.systemVolume')"
            :description="t('nodeDetail.client.broadcast.volumeRange')"
            test-id="broadcast-system-row"
          >
            <template #control>
              <div
                class="cn-segment"
                role="radiogroup"
                :aria-label="t('nodeDetail.client.broadcast.systemVolume')"
              >
                <button
                  type="button"
                  class="cn-segment__item"
                  role="radio"
                  :aria-selected="systemMode === 'keep'"
                  data-testid="broadcast-system-keep"
                  @click="systemMode = 'keep'"
                >
                  {{ t('nodeDetail.client.broadcast.volumeKeep') }}
                </button>
                <button
                  type="button"
                  class="cn-segment__item"
                  role="radio"
                  :aria-selected="systemMode === 'set'"
                  data-testid="broadcast-system-set"
                  @click="systemMode = 'set'"
                >
                  {{ t('nodeDetail.client.broadcast.volumeSet') }}
                </button>
              </div>

              <ClientNumberBox
                :model-value="systemVolume"
                :min="MEDIA_VOLUME_MIN_PERCENT"
                :max="MEDIA_VOLUME_MAX_PERCENT"
                :disabled="systemMode === 'keep'"
                :label="t('nodeDetail.client.broadcast.systemVolume')"
                data-testid="broadcast-system-volume"
                @update:model-value="(value) => (systemVolume = value)"
              />
            </template>
          </ClientNestedRow>

          
          <ClientNestedRow
            :title="t('nodeDetail.client.broadcast.voiceVolume')"
            :description="t('nodeDetail.client.broadcast.volumeRange')"
            test-id="broadcast-voice-row"
          >
            <template #control>
              <div
                class="cn-segment"
                role="radiogroup"
                :aria-label="t('nodeDetail.client.broadcast.voiceVolume')"
              >
                <button
                  type="button"
                  class="cn-segment__item"
                  role="radio"
                  :aria-selected="voiceMode === 'keep'"
                  data-testid="broadcast-voice-keep"
                  @click="voiceMode = 'keep'"
                >
                  {{ t('nodeDetail.client.broadcast.volumeKeep') }}
                </button>
                <button
                  type="button"
                  class="cn-segment__item"
                  role="radio"
                  :aria-selected="voiceMode === 'set'"
                  data-testid="broadcast-voice-set"
                  @click="voiceMode = 'set'"
                >
                  {{ t('nodeDetail.client.broadcast.volumeSet') }}
                </button>
              </div>

              <ClientNumberBox
                :model-value="voiceVolume"
                :min="MEDIA_VOLUME_MIN_PERCENT"
                :max="MEDIA_VOLUME_MAX_PERCENT"
                :disabled="voiceMode === 'keep'"
                :label="t('nodeDetail.client.broadcast.voiceVolume')"
                data-testid="broadcast-voice-volume"
                @update:model-value="(value) => (voiceVolume = value)"
              />
            </template>
          </ClientNestedRow>

          
          <p
            v-if="volumeProblem"
            class="cn-note cn-note--fail"
            data-testid="broadcast-problem"
          >
            {{ t('nodeDetail.client.broadcast.volumeInvalid', volumeRange) }}
          </p>
        </div>

        <footer class="cn-dialog__foot">
          <button
            type="button"
            class="cn-btn"
            data-testid="broadcast-cancel"
            @click="emit('close')"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="cn-btn cn-btn--accent"
            data-testid="broadcast-confirm"
            :disabled="!canConfirm"
            @click="confirm"
          >
            {{ t('common.confirm') }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>
