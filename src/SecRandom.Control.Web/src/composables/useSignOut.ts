import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'
import { useSessionStore } from '@/stores/session'







export function useSignOut() {
  const router = useRouter()
  const session = useSessionStore()

  
  const signingOut = ref(false)
  



  const failed = ref(false)

  function reset(): void {
    failed.value = false
  }

  async function signOut(): Promise<void> {
    if (signingOut.value) return
    signingOut.value = true
    failed.value = false

    try {
      await api.logout()
    } catch {
      failed.value = true
      return
    } finally {
      signingOut.value = false
    }

    
    session.clear()

    
    
    await router.replace('/')
  }

  return { signingOut, failed, signOut, reset }
}
