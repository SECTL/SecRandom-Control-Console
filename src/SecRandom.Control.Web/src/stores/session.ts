import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, ApiError } from '@/api/client'
import type { CurrentUser, GroupSummary, GroupRole } from '@/api/protocol'
import { roleAtLeast } from '@/api/protocol'









export const useSessionStore = defineStore('session', () => {
  const user = ref<CurrentUser | null>(null)
  const loading = ref(false)
  
  const loaded = ref(false)
  
  const errorCode = ref<string | null>(null)

  






  const serviceUnavailable = computed(() => {
    const code = errorCode.value
    if (code === null) return false
    if (code === 'network_error' || code === 'service_unavailable') return true
    
    return /^http_5\d\d$/.test(code)
  })

  const isSignedIn = computed(() => user.value !== null)
  const groups = computed<GroupSummary[]>(() => user.value?.groups ?? [])
  const hasGroups = computed(() => groups.value.length > 0)

  





  const ownedGroups = computed(() =>
    groups.value.filter((group) => group.owner_user_id === user.value?.user_id),
  )

  
  const joinedGroups = computed(() =>
    groups.value.filter((group) => group.owner_user_id !== user.value?.user_id),
  )

  const ownedGroupCount = computed(() => ownedGroups.value.length)

  



  const groupLimit = computed<number | null>(() => {
    const limit = user.value?.max_owned_groups
    return typeof limit === 'number' && limit > 0 ? limit : null
  })

  
  const groupLimitReached = computed(
    () => groupLimit.value !== null && ownedGroupCount.value >= groupLimit.value,
  )

  





  async function saveGroupOrder(orderedIds: string[]): Promise<void> {
    const current = user.value
    if (current === null) return

    const byId = new Map(current.groups.map((group) => [group.group_id, group]))
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((group): group is GroupSummary => group !== undefined)

    
    const rest = current.groups.filter((group) => !orderedIds.includes(group.group_id))
    user.value = { ...current, groups: [...ordered, ...rest] }

    try {
      await api.saveGroupOrder(orderedIds)
    } catch (caught) {
      
      await load()
      throw caught
    }
  }

  
  async function load(): Promise<void> {
    loading.value = true
    errorCode.value = null
    try {
      user.value = await api.session()
    } catch (caught) {
      
      user.value = null
      errorCode.value = resolveErrorCode(caught)
    } finally {
      loading.value = false
      loaded.value = true
    }
  }

  
  function resolveErrorCode(caught: unknown): string {
    if (caught instanceof ApiError) {
      return caught.status >= 500 ? `http_${caught.status}` : caught.code
    }
    return 'network_error'
  }

  function groupRole(groupId: string): GroupRole | null {
    return groups.value.find((group) => group.group_id === groupId)?.role ?? null
  }

  
  function canIn(groupId: string, minimum: GroupRole): boolean {
    const role = groupRole(groupId)
    return role !== null && roleAtLeast(role, minimum)
  }

  function clear(): void {
    user.value = null
    errorCode.value = null
  }

  return {
    user,
    loading,
    loaded,
    errorCode,
    serviceUnavailable,
    isSignedIn,
    groups,
    hasGroups,
    ownedGroups,
    joinedGroups,
    ownedGroupCount,
    groupLimit,
    groupLimitReached,
    saveGroupOrder,
    load,
    groupRole,
    canIn,
    clear,
  }
})
