<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { KeyRound, LogIn, RefreshCw, ShieldCheck, TriangleAlert } from '@lucide/vue'
import { api, buildLoginUrl } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import { apiErrorMessage, toErrorLike } from '@/utils/api-error-message'
import SiteHeader from '@/components/SiteHeader.vue'
import SpotlightCard from '@/components/SpotlightCard.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const setup = useSetupStore()


const errorCode = computed(() => {
  const value = route.query.error
  if (typeof value === 'string' && value.length > 0) return value
  return null
})








const errorMessage = computed(() => {
  if (session.serviceUnavailable) return t('auth.errors.service_unavailable')
  if (!errorCode.value) return null

  if (/^http_5\d\d$/.test(errorCode.value)) return t('auth.errors.service_unavailable')

  const key = `auth.errors.${errorCode.value}`
  const translated = t(key)
  
  return translated === key ? t('auth.errors.unknown') : translated
})


const returnTo = computed(() => {
  const value = route.query.return_to
  if (typeof value === 'string' && value.startsWith('/')) return value
  return '/console'
})

const loginHref = computed(() => buildLoginUrl(returnTo.value))


function retry(): void {
  void session.load()
}










const usePasswordLogin = computed(() => setup.initialized && setup.mode === 'local')

const signInTitleKey = computed(() =>
  usePasswordLogin.value ? 'auth.signInTitleLocal' : 'auth.signInTitle',
)

const username = ref('')
const password = ref('')
const submitting = ref(false)
const localErrorCode = ref<string | null>(null)
const localErrorStatus = ref<number | null>(null)











const localErrorMessage = computed(() =>
  apiErrorMessage(t, 'auth.password.errors', localErrorCode.value, {
    status: localErrorStatus.value,
    overrides: {
      401: 'auth.password.errors.unauthorized',
      429: 'auth.password.errors.too_many_attempts',
      503: 'auth.password.errors.auth_not_configured',
    },
    fallbackKey: 'auth.errors.unknown',
  }),
)

const canSubmitPassword = computed(
  () => username.value.trim().length > 0 && password.value.length > 0,
)

async function submitPassword(): Promise<void> {
  if (submitting.value || !canSubmitPassword.value) return

  submitting.value = true
  localErrorCode.value = null
  localErrorStatus.value = null

  try {
    await api.passwordLogin(username.value.trim(), password.value)
    
    password.value = ''
    
    
    window.location.assign(returnTo.value)
  } catch (caught) {
    const { code, status } = toErrorLike(caught)
    localErrorCode.value = code
    localErrorStatus.value = status
  } finally {
    submitting.value = false
  }
}


const needsSetup = computed(() => setup.needsSetup)


async function goToSetup(): Promise<void> {
  if (!setup.loaded) await setup.load()
  if (setup.needsSetup) void router.replace({ name: 'setup' })
}

onMounted(async () => {
  
  
  if (!setup.loaded && !setup.loading) await setup.load()
})
</script>

<template>
  
  <div class="flex min-h-screen flex-col">
    
    <SiteHeader />

    
    <main class="brand-glow dot-grid-fade flex flex-1 items-center justify-center px-5 pb-16">
      <span class="hero-orb hero-orb--a" aria-hidden="true" />

      <div class="relative w-full max-w-[380px]">
        
        <SpotlightCard
          tag="div"
          class="reveal overflow-hidden rounded-card border border-border-base bg-surface/95 backdrop-blur-sm"
        >
          <div class="px-6 pt-7 pb-6 text-center" data-reveal>
            <img
              src="/apple-touch-icon.png"
              alt=""
              class="logo-float mx-auto h-14 w-14 rounded-[16px]"
            />
            <h1 class="mt-4 text-[16px] font-semibold tracking-wide">{{ t('common.appName') }}</h1>
            <h2 class="mt-1.5 text-[12.5px] text-text-muted">{{ t(signInTitleKey) }}</h2>

            <div
              v-if="errorMessage"
              class="mt-4 flex gap-2 rounded-control border border-danger/30 bg-danger/12 p-2.5 text-left text-[12.5px] leading-relaxed text-danger"
            >
              <TriangleAlert class="icon mt-0.5" />
              <span>{{ errorMessage }}</span>
            </div>

            
            <div v-if="session.isSignedIn" class="mt-5">
              <p class="mb-3 text-[12.5px] text-text-muted">{{ t('auth.alreadySignedIn') }}</p>
              <RouterLink
                to="/console"
                class="btn-primary press inline-flex w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover"
              >
                {{ t('auth.continueToConsole') }}
              </RouterLink>
            </div>

            
            <div v-else-if="session.serviceUnavailable" class="mt-5 flex flex-col gap-3">
              <button
                type="button"
                class="btn-ghost press inline-flex w-full items-center justify-center gap-2 rounded-control border border-border-strong bg-surface-2 px-4 py-2.5 text-[13px] font-medium hover:bg-surface-3"
                @click="retry"
              >
                <RefreshCw class="icon" :class="{ 'animate-spin': session.loading }" />
                {{ t('common.retry') }}
              </button>
              <p class="text-[11.5px] leading-relaxed text-text-faint">
                {{ t('auth.errors.network_error') }}
              </p>
            </div>

            
            <div v-else-if="needsSetup" class="mt-5 flex flex-col gap-3">
              <p class="text-[11.5px] leading-relaxed text-text-faint">
                {{ t('auth.notConfiguredDesc') }}
              </p>
              <button
                type="button"
                data-testid="login-go-setup"
                class="btn-primary press inline-flex w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover"
                @click="goToSetup"
              >
                {{ t('setup.title') }}
              </button>
            </div>

            
            <form
              v-else-if="usePasswordLogin"
              data-testid="login-password-form"
              class="mt-5 flex flex-col gap-3 text-left"
              @submit.prevent="submitPassword"
            >
              <p class="text-[12px] text-text-muted">{{ t('auth.password.title') }}</p>

              <div
                v-if="localErrorMessage"
                data-testid="login-password-error"
                class="flex gap-2 rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-danger"
              >
                <TriangleAlert class="icon mt-0.5" />
                <span>{{ localErrorMessage }}</span>
              </div>

              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] text-text-muted">{{ t('auth.password.usernameLabel') }}</span>
                <input
                  v-model="username"
                  data-testid="login-username"
                  type="text"
                  name="username"
                  autocomplete="username"
                  spellcheck="false"
                  :placeholder="t('auth.password.usernamePlaceholder')"
                  class="field-shell rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[13px] outline-none placeholder:text-text-faint"
                />
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] text-text-muted">{{ t('auth.password.passwordLabel') }}</span>
                <input
                  v-model="password"
                  data-testid="login-password"
                  type="password"
                  name="password"
                  autocomplete="current-password"
                  :placeholder="t('auth.password.passwordPlaceholder')"
                  class="field-shell rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[13px] outline-none placeholder:text-text-faint"
                />
              </label>

              <button
                type="submit"
                data-testid="login-password-submit"
                :disabled="submitting || !canSubmitPassword"
                class="btn-primary press inline-flex w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                <KeyRound class="icon" />
                {{ submitting ? t('auth.password.submitting') : t('auth.password.submit') }}
              </button>
            </form>

            <a
              v-else
              :href="loginHref"
              class="btn-primary press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover"
            >
              <LogIn class="icon" />
              {{ t('auth.signInWithSectl') }}
            </a>
          </div>

          
          <p
            class="flex items-start gap-2 border-t border-border-base bg-surface-2/40 px-6 py-3 text-left text-[11px] leading-relaxed text-text-faint"
            data-reveal
          >
            <ShieldCheck class="icon mt-0.5 flex-none text-brand-bright" />
            <span>{{ usePasswordLogin ? t('auth.password.securityNote') : t('auth.securityNote') }}</span>
          </p>
        </SpotlightCard>
      </div>
    </main>
  </div>
</template>
