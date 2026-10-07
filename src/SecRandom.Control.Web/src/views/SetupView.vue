<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  UserCog,
} from '@lucide/vue'
import { api } from '@/api/client'
import { useSetupStore } from '@/stores/setup'
import { apiErrorMessage, toErrorLike } from '@/utils/api-error-message'
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  ADMIN_USERNAME_MAX_LENGTH,
  isValidAdminPassword,
  isValidAdminUsername,
} from '@/utils/setup-validation'
import SiteHeader from '@/components/SiteHeader.vue'
import SpotlightCard from '@/components/SpotlightCard.vue'

const { t } = useI18n()
const setup = useSetupStore()

type Step = 'mode' | 'identity' | 'token' | 'done'


const finished = ref(false)
const step = ref<Step>('mode')

const displayName = ref('')
const adminUsername = ref('')
const adminPassword = ref('')
const confirmPassword = ref('')
const setupToken = ref('')

const submitting = ref(false)
const submitCode = ref<string | null>(null)
const submitStatus = ref<number | null>(null)







const modes = computed(() => setup.availableModes)
const mode = computed(() => modes.value.find((item) => item.id === selectedModeId.value) ?? null)
const selectedModeId = ref('')

const steps = computed<Step[]>(() => ['mode', 'identity', 'token'])
const stepIndex = computed(() => steps.value.indexOf(step.value))


const needsCredentials = computed(() => mode.value?.requires_credentials === true)

const usernameTouched = ref(false)
const passwordTouched = ref(false)

const usernameValid = computed(() => isValidAdminUsername(adminUsername.value.trim()))
const passwordValid = computed(() => isValidAdminPassword(adminPassword.value))
const passwordsMatch = computed(() => adminPassword.value === confirmPassword.value)







const identityError = computed<string | null>(() => {
  if (!needsCredentials.value) return null
  if (usernameTouched.value && adminUsername.value.length > 0 && !usernameValid.value) {
    return t('setup.errors.admin_username_invalid')
  }
  if (passwordTouched.value && adminPassword.value.length > 0 && !passwordValid.value) {
    return t('setup.errors.admin_password_too_short')
  }
  if (confirmPassword.value.length > 0 && !passwordsMatch.value) {
    return t('setup.passwordMismatch')
  }
  return null
})


const canAdvance = computed(() => {
  switch (step.value) {
    case 'mode':
      return mode.value?.available === true
    case 'identity':
      return (
        !needsCredentials.value || (usernameValid.value && passwordValid.value && passwordsMatch.value)
      )
    case 'token':
      return setupToken.value.trim().length > 0
    default:
      return false
  }
})








const submitErrorMessage = computed(() =>
  apiErrorMessage(t, 'setup.errors', submitCode.value, {
    status: submitStatus.value,
    overrides: {
      429: 'setup.errors.setup_rate_limited',
      503: 'setup.errors.not_configured',
    },
  }),
)







const loadErrorMessage = computed(() => t('setup.unavailableTitle'))

function selectMode(id: string): void {
  selectedModeId.value = id
  submitCode.value = null
  submitStatus.value = null
}


function preselectMode(): void {
  if (selectedModeId.value.length > 0) return
  const usable = modes.value.filter((item) => item.available)
  if (usable.length === 1 && usable[0]) selectedModeId.value = usable[0].id
}

function goNext(): void {
  submitCode.value = null
  submitStatus.value = null
  const index = stepIndex.value
  const next = steps.value[index + 1]
  if (next) step.value = next
}

function goPrevious(): void {
  submitCode.value = null
  submitStatus.value = null
  const previous = steps.value[stepIndex.value - 1]
  if (previous) step.value = previous
}

async function submit(): Promise<void> {
  if (submitting.value || !canAdvance.value || !mode.value) return

  submitting.value = true
  submitCode.value = null
  submitStatus.value = null

  try {
    const name = displayName.value.trim()
    await api.setup({
      setup_token: setupToken.value.trim(),
      mode: mode.value.id,
      
      
      ...(name.length > 0 ? { display_name: name } : {}),
      ...(needsCredentials.value
        ? {
            admin_username: adminUsername.value.trim(),
            admin_password: adminPassword.value,
          }
        : {}),
    })

    setup.markInitialized(mode.value.id)
    finished.value = true
    step.value = 'done'
  } catch (caught) {
    const { code, status } = toErrorLike(caught)
    submitCode.value = code
    submitStatus.value = status

    
    if (status === 409 || code === 'already_initialized') {
      setup.markInitialized(mode.value.id)
      finished.value = true
      step.value = 'done'
    }
  } finally {
    submitting.value = false
  }
}

async function retryLoad(): Promise<void> {
  await setup.load()
  preselectMode()
}

onMounted(async () => {
  
  if (!setup.loaded && !setup.loading) await setup.load()
  preselectMode()
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />

    <main class="brand-glow dot-grid-fade flex flex-1 items-start justify-center px-5 pt-10 pb-16">
      <span class="hero-orb hero-orb--a" aria-hidden="true" />

      <div class="relative w-full max-w-[440px]">
        <SpotlightCard
          tag="div"
          class="reveal overflow-hidden rounded-card border border-border-base bg-surface/95 backdrop-blur-sm"
        >
          <div class="px-6 pt-7 pb-6" data-reveal>
            <div class="text-center">
              <img
                src="/apple-touch-icon.png"
                alt=""
                class="logo-float mx-auto h-14 w-14 rounded-[16px]"
              />
              <h1 class="mt-4 text-[16px] font-semibold tracking-wide">{{ t('setup.title') }}</h1>
              <p class="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">
                {{ t('setup.subtitle') }}
              </p>
            </div>

            
            <div
              v-if="setup.loading && !setup.loaded"
              data-testid="setup-checking"
              class="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-text-muted"
            >
              <RefreshCw class="icon animate-spin" />
              {{ t('setup.checking') }}
            </div>

            
            <div
              v-else-if="!setup.loaded"
              data-testid="setup-unavailable"
              class="mt-6 flex flex-col gap-3 text-left"
            >
              <div
                class="flex gap-2 rounded-control border border-danger/30 bg-danger/12 p-2.5 text-[12.5px] leading-relaxed text-danger"
              >
                <TriangleAlert class="icon mt-0.5" />
                <span>{{ loadErrorMessage }}</span>
              </div>
              <button
                type="button"
                class="btn-ghost press inline-flex w-full items-center justify-center gap-2 rounded-control border border-border-strong bg-surface-2 px-4 py-2.5 text-[13px] font-medium hover:bg-surface-3"
                @click="retryLoad"
              >
                <RefreshCw class="icon" :class="{ 'animate-spin': setup.loading }" />
                {{ t('common.retry') }}
              </button>
            </div>

            
            <div v-else-if="setup.initialized && !finished" data-testid="setup-done-already" class="mt-6">
              <div
                class="flex gap-2 rounded-control border border-info/30 bg-info/12 p-2.5 text-left text-[12.5px] leading-relaxed text-info"
              >
                <CircleCheck class="icon mt-0.5" />
                <span>
                  <strong class="font-medium">{{ t('setup.alreadyInitializedTitle') }}</strong>
                  <br />
                  {{ t('setup.alreadyInitializedDesc') }}
                </span>
              </div>
              <RouterLink
                to="/login"
                class="btn-primary press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover"
              >
                {{ t('setup.goToLogin') }}
              </RouterLink>
            </div>

            
            <div v-else-if="finished" data-testid="setup-finished" class="mt-6">
              <div
                class="flex gap-2 rounded-control border border-success/30 bg-success/12 p-2.5 text-left text-[12.5px] leading-relaxed text-success"
              >
                <CircleCheck class="icon mt-0.5" />
                <span>
                  <strong class="font-medium">{{ t('setup.doneTitle') }}</strong>
                  <br />
                  {{ t('setup.doneDesc') }}
                </span>
              </div>
              <RouterLink
                to="/login"
                data-testid="setup-go-login"
                class="btn-primary press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover"
              >
                {{ t('setup.goToLogin') }}
              </RouterLink>
            </div>

            
            <div v-else class="mt-6">
              
              <ol class="flex items-center gap-1.5" data-testid="setup-steps">
                <li
                  v-for="(item, index) in steps"
                  :key="item"
                  class="flex flex-1 flex-col gap-1.5"
                  :data-state="index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'todo'"
                >
                  <span
                    class="h-1 rounded-full"
                    :class="index <= stepIndex ? 'bg-brand' : 'bg-border-base'"
                  />
                  <span
                    class="text-[11px]"
                    :class="index === stepIndex ? 'text-text-base' : 'text-text-faint'"
                  >
                    {{ t(`setup.step.${item}`) }}
                  </span>
                </li>
              </ol>

              <div
                v-if="submitErrorMessage"
                data-testid="setup-error"
                class="mt-4 flex gap-2 rounded-control border border-danger/30 bg-danger/12 p-2.5 text-left text-[12.5px] leading-relaxed text-danger"
              >
                <TriangleAlert class="icon mt-0.5" />
                <span>{{ submitErrorMessage }}</span>
              </div>

              
              <section v-if="step === 'mode'" data-testid="setup-step-mode" class="mt-5">
                <h2 class="text-[12.5px] text-text-muted">{{ t('setup.chooseMode') }}</h2>

                <p
                  v-if="modes.length === 0"
                  data-testid="setup-no-modes"
                  class="mt-3 rounded-control border border-warning/30 bg-warning/12 p-2.5 text-[12.5px] leading-relaxed text-warning"
                >
                  {{ t('setup.noModes') }}
                </p>

                <div v-else class="mt-3 flex flex-col gap-2">
                  <button
                    v-for="item in modes"
                    :key="item.id"
                    type="button"
                    :disabled="!item.available"
                    :data-testid="`setup-mode-${item.id}`"
                    :data-selected="selectedModeId === item.id"
                    class="press flex items-start gap-3 rounded-control border px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-45"
                    :class="
                      selectedModeId === item.id
                        ? 'border-brand bg-brand/10'
                        : 'border-border-strong bg-surface-2'
                    "
                    @click="selectMode(item.id)"
                  >
                    <UserCog class="icon mt-0.5 text-brand-bright" />
                    <span class="flex flex-col gap-0.5">
                      
                      <span class="text-[13px] font-medium">{{ item.display_name }}</span>
                      <span v-if="item.requires_credentials" class="text-[11.5px] text-text-faint">
                        {{ t('setup.credentialsLabel') }}
                      </span>
                    </span>
                  </button>
                </div>
              </section>

              
              <section v-else-if="step === 'identity'" data-testid="setup-step-identity" class="mt-5">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[12px] text-text-muted">{{ t('setup.displayNameLabel') }}</span>
                  <input
                    v-model="displayName"
                    data-testid="setup-display-name"
                    type="text"
                    maxlength="64"
                    autocomplete="organization"
                    :placeholder="t('setup.displayNamePlaceholder')"
                    class="field-shell rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[13px] outline-none placeholder:text-text-faint"
                  />
                  <span class="text-[11px] leading-relaxed text-text-faint">
                    {{ t('setup.displayNameHint') }}
                  </span>
                </label>

                <template v-if="needsCredentials">
                  <label class="mt-4 flex flex-col gap-1.5">
                    <span class="text-[12px] text-text-muted">
                      {{ t('setup.adminUsernameLabel') }}
                    </span>
                    <input
                      v-model="adminUsername"
                      data-testid="setup-admin-username"
                      type="text"
                      autocomplete="username"
                      spellcheck="false"
                      :maxlength="ADMIN_USERNAME_MAX_LENGTH"
                      :placeholder="t('setup.adminUsernamePlaceholder')"
                      class="field-shell rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[13px] outline-none placeholder:text-text-faint"
                      @blur="usernameTouched = true"
                    />
                    <span class="text-[11px] leading-relaxed text-text-faint">
                      {{ t('setup.adminUsernameRule') }}
                    </span>
                  </label>

                  <label class="mt-3 flex flex-col gap-1.5">
                    <span class="text-[12px] text-text-muted">
                      {{ t('setup.adminPasswordLabel') }}
                    </span>
                    <input
                      v-model="adminPassword"
                      data-testid="setup-admin-password"
                      type="password"
                      autocomplete="new-password"
                      :placeholder="`≥ ${ADMIN_PASSWORD_MIN_LENGTH}`"
                      class="field-shell rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[13px] outline-none placeholder:text-text-faint"
                      @blur="passwordTouched = true"
                    />
                    <span class="text-[11px] leading-relaxed text-text-faint">
                      {{ t('setup.adminPasswordRule') }}
                    </span>
                  </label>

                  <label class="mt-3 flex flex-col gap-1.5">
                    <span class="text-[12px] text-text-muted">
                      {{ t('setup.confirmPasswordLabel') }}
                    </span>
                    <input
                      v-model="confirmPassword"
                      data-testid="setup-confirm-password"
                      type="password"
                      autocomplete="new-password"
                      class="field-shell rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-[13px] outline-none placeholder:text-text-faint"
                    />
                  </label>

                  <p
                    v-if="identityError"
                    data-testid="setup-identity-error"
                    class="mt-2 flex gap-2 text-[11.5px] leading-relaxed text-danger"
                  >
                    <TriangleAlert class="icon mt-0.5" />
                    <span>{{ identityError }}</span>
                  </p>
                </template>
              </section>

              
              <section v-else data-testid="setup-step-token" class="mt-5">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[12px] text-text-muted">{{ t('setup.tokenLabel') }}</span>
                  <span
                    class="code-field flex items-center gap-2 rounded-control border border-border-strong bg-surface-2 px-3 py-2"
                  >
                    <KeyRound class="icon text-text-faint" />
                    <input
                      v-model="setupToken"
                      data-testid="setup-token"
                      type="text"
                      autocomplete="off"
                      spellcheck="false"
                      class="w-full bg-transparent font-mono text-[13px] outline-none placeholder:text-text-faint"
                      :placeholder="t('setup.tokenPlaceholder')"
                    />
                  </span>
                  <span class="text-[11px] leading-relaxed text-text-faint">
                    {{ t('setup.tokenHint') }}
                  </span>
                </label>
              </section>

              
              <div class="mt-6 flex items-center gap-2">
                <button
                  v-if="stepIndex > 0"
                  type="button"
                  data-testid="setup-previous"
                  class="btn-ghost press inline-flex items-center justify-center gap-1.5 rounded-control border border-border-strong bg-surface-2 px-3 py-2.5 text-[13px] font-medium hover:bg-surface-3"
                  @click="goPrevious"
                >
                  <ArrowLeft class="icon" />
                  {{ t('setup.previous') }}
                </button>

                <button
                  v-if="step !== 'token'"
                  type="button"
                  data-testid="setup-next"
                  :disabled="!canAdvance"
                  class="btn-primary press ml-auto inline-flex items-center justify-center gap-1.5 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
                  @click="goNext"
                >
                  {{ t('setup.next') }}
                  <ArrowRight class="icon" />
                </button>

                <button
                  v-else
                  type="button"
                  data-testid="setup-submit"
                  :disabled="submitting || !canAdvance"
                  class="btn-primary press ml-auto inline-flex items-center justify-center gap-1.5 rounded-control border border-brand bg-brand px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
                  @click="submit"
                >
                  <RefreshCw v-if="submitting" class="icon animate-spin" />
                  {{ submitting ? t('setup.submitting') : t('setup.submit') }}
                </button>
              </div>
            </div>
          </div>

          <p
            class="flex items-start gap-2 border-t border-border-base bg-surface-2/40 px-6 py-3 text-left text-[11px] leading-relaxed text-text-faint"
            data-reveal
          >
            <ShieldCheck class="icon mt-0.5 flex-none text-brand-bright" />
            <span>{{ t('setup.tokenHint') }}</span>
          </p>
        </SpotlightCard>
      </div>
    </main>
  </div>
</template>
