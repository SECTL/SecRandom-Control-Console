<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Info, Link2, Ticket } from '@lucide/vue'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import { api, ApiError, buildLoginUrl } from '@/api/client'
import { extractInviteCode, looksLikeJoinLinkWithoutCode } from '@/utils/invite-code'
import SiteHeader from '@/components/SiteHeader.vue'
import SpotlightCard from '@/components/SpotlightCard.vue'

const props = defineProps<{ code: string }>()

const { t, te } = useI18n()
const router = useRouter()
const session = useSessionStore()
const setup = useSetupStore()

const enteredCode = ref(props.code)
const submitting = ref(false)



const errorCode = ref<string | null>(null)









const ALREADY_MEMBER_CODES = ['invite_already_member', 'invite_used']
const alreadyMember = ref(false)


const alreadyMemberMessage = computed(() => t('join.errors.already_member'))
const alreadyMemberAction = computed(() => t('join.alreadyMemberAction'))

const errorMessage = computed(() => {
  if (!errorCode.value) return null
  const code = errorCode.value
  
  
  
  
  
  const candidates = [
    `join.errors.${code}`,
    code.startsWith('invite_') ? `join.errors.${code.slice('invite_'.length)}` : null,
    `errors.${code}`,
  ]

  for (const key of candidates) {
    if (key !== null && te(key)) return t(key)
  }

  return t('join.errors.unknown')
})

const loginHref = computed(
  () => buildLoginUrl(`/join?code=${encodeURIComponent(enteredCode.value)}`),
)

const useLocalSignIn = computed(() => setup.mode === 'local')

const signInHref = computed(() => (useLocalSignIn.value ? '/login' : loginHref.value))

const signInTitleKey = computed(() =>
  useLocalSignIn.value ? 'auth.signInTitleLocal' : 'auth.signInTitle',
)

const signInFirstKey = computed(() =>
  useLocalSignIn.value ? 'join.signInFirstLocal' : 'join.signInFirst',
)

async function redeem(): Promise<void> {
  
  
  const submitted = enteredCode.value.trim()
  const code = extractInviteCode(submitted)

  errorCode.value = null
  alreadyMember.value = false

  if (code.length === 0) {
    errorCode.value = 'not_found'
    return
  }

  
  
  if (looksLikeJoinLinkWithoutCode(submitted)) {
    errorCode.value = 'link_without_code'
    return
  }

  submitting.value = true
  try {
    
    const result = await api.redeemInvite(code)
    await session.load()
    await router.push(`/console/groups/${result.group_id}`)
  } catch (caught) {
    if (caught instanceof ApiError && ALREADY_MEMBER_CODES.includes(caught.code)) {
      
      
      alreadyMember.value = true
      return
    }

    errorCode.value = caught instanceof ApiError ? caught.code : 'unknown'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    
    <SiteHeader />

    
    <main class="brand-glow flex flex-1 items-center justify-center px-5 pt-6 pb-16">
      <div class="relative w-full max-w-[430px]">
        <h1 class="reveal mb-4 text-[19px] font-semibold tracking-wide" data-reveal>
          {{ t('join.title') }}
        </h1>

        
        <SpotlightCard
          v-if="session.loaded && !session.isSignedIn"
          tag="div"
          class="reveal rounded-card border border-border-base bg-surface p-5"
        >
          <div data-reveal>
            <h2 class="text-[15px] font-semibold">{{ t(signInTitleKey) }}</h2>
            <a
              :href="signInHref"
              class="btn-primary press mt-4 inline-flex w-full items-center justify-center rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover"
            >
              {{ t(signInFirstKey) }}
            </a>
            <div
              class="mt-3 flex gap-2 rounded-control border border-info/30 bg-info/12 p-2.5 text-[12px] leading-relaxed text-info"
            >
              <Info class="icon mt-0.5" />
              <span>{{ t('join.signInHint') }}</span>
            </div>
          </div>
        </SpotlightCard>

        
        <SpotlightCard
          v-else-if="session.isSignedIn"
          tag="div"
          class="reveal rounded-card border border-border-base bg-surface p-5"
        >
          <div data-reveal>
            <p class="text-[12.5px] text-text-muted">{{ t('join.subtitle') }}</p>

            <form class="mt-4 flex flex-col gap-3" @submit.prevent="redeem">
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] text-text-muted">{{ t('join.codeLabel') }}</span>
                <span
                  class="code-field flex items-center gap-2 rounded-control border border-border-strong bg-surface-2 px-3 py-2"
                >
                  <Ticket class="icon text-text-faint" />
                  <input
                    v-model="enteredCode"
                    class="w-full bg-transparent font-mono text-[15px] tracking-[0.18em] outline-none placeholder:text-text-faint"
                    :placeholder="t('join.codePlaceholder')"
                    autocomplete="off"
                    spellcheck="false"
                  />
                </span>
              </label>

              
              <p class="flex items-start gap-2 text-[11px] leading-relaxed text-text-faint">
                <Link2 class="icon mt-0.5" />
                <span>{{ t('join.pasteLinkPlaceholder') }}</span>
              </p>

              <div
                v-if="errorMessage"
                data-testid="join-error"
                class="rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-danger"
              >
                {{ errorMessage }}
              </div>

              <button
                type="submit"
                :disabled="submitting || enteredCode.trim().length === 0"
                class="btn-primary press inline-flex w-full items-center justify-center rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                {{ submitting ? t('join.submitting') : t('join.submit') }}
              </button>
            </form>

            
            <div
              v-if="alreadyMember"
              data-testid="join-already-member"
              class="mt-3 rounded-control border border-info/30 bg-info/12 p-2.5 text-[12px] leading-relaxed text-info"
            >
              <div class="flex gap-2">
                <Info class="icon mt-0.5" />
                <span>{{ alreadyMemberMessage }}</span>
              </div>
              <RouterLink
                to="/console"
                data-testid="join-already-member-console"
                class="press mt-2 inline-flex w-full items-center justify-center rounded-control border border-info/40 bg-info/15 px-3 py-2 text-[12px] font-medium text-info hover:bg-info/25"
              >
                {{ alreadyMemberAction }}
              </RouterLink>
            </div>

            <div
              class="mt-3 flex gap-2 rounded-control border border-warn/30 bg-warn/12 p-2.5 text-[12px] leading-relaxed text-warn"
            >
              <Info class="icon mt-0.5" />
              <span>{{ t('join.warning') }}</span>
            </div>
          </div>
        </SpotlightCard>

        
        <div v-else class="flex flex-col gap-3">
          <span class="sr-only">{{ t('common.loading') }}</span>
          <div class="shimmer h-[132px]" aria-hidden="true" />
          <div class="shimmer h-[58px]" aria-hidden="true" />
        </div>
      </div>
    </main>
  </div>
</template>
