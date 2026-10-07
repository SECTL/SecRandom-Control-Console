import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/client'
import type { SetupState } from '@/api/protocol'
import { toErrorLike } from '@/utils/api-error-message'









export function parseSetupState(payload: SetupState | null): SetupState | null {
  if (payload === null || payload === undefined) return null

  return {
    initialized: payload.initialized === true,
    mode: typeof payload.mode === 'string' && payload.mode.length > 0 ? payload.mode : null,
    display_name:
      typeof payload.display_name === 'string' && payload.display_name.length > 0
        ? payload.display_name
        : null,
    membership_enabled: payload.membership_enabled !== false,
    modes: Array.isArray(payload.modes)
      ? payload.modes.map((mode) => ({
          id: mode.id,
          display_name: mode.display_name,
          available: mode.available === true,
          requires_credentials: mode.requires_credentials === true,
        }))
      : [],
  }
}












export const useSetupStore = defineStore('setup', () => {
  const status = ref<SetupState | null>(null)
  
  const loaded = ref(false)
  const loading = ref(false)
  
  const errorCode = ref<string | null>(null)
  const errorStatus = ref<number | null>(null)

  
  const initialized = computed(() => status.value?.initialized === true)

  
  const statusUnknown = computed(() => !loaded.value)

  
  const mode = computed(() => status.value?.mode ?? null)

  






  const membershipEnabled = computed(() => status.value?.membership_enabled !== false)

  
  const availableModes = computed(() => status.value?.modes ?? [])

  
  const needsSetup = computed(() => loaded.value && !initialized.value)

  async function load(): Promise<void> {
    loading.value = true
    errorCode.value = null
    errorStatus.value = null

    try {
      status.value = parseSetupState(await api.setupStatus())
      loaded.value = true
    } catch (caught) {
      
      
      status.value = null
      loaded.value = false
      const { code, status: httpStatus } = toErrorLike(caught)
      errorCode.value = code
      errorStatus.value = httpStatus
    } finally {
      loading.value = false
    }
  }

  
  function markInitialized(modeId: string): void {
    const current = status.value
    status.value = {
      initialized: true,
      mode: modeId,
      display_name: current?.display_name ?? null,
      membership_enabled: current?.membership_enabled !== false,
      modes: current?.modes ?? [],
    }
    loaded.value = true
    errorCode.value = null
    errorStatus.value = null
  }

  function clear(): void {
    status.value = null
    loaded.value = false
    errorCode.value = null
    errorStatus.value = null
  }

  return {
    status,
    loaded,
    loading,
    errorCode,
    errorStatus,
    initialized,
    statusUnknown,
    mode,
    membershipEnabled,
    availableModes,
    needsSetup,
    load,
    markInitialized,
    clear,
  }
})
