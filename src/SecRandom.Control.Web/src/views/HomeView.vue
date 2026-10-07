<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  LayoutDashboard,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  Users,
  Radio,
  ServerCog,
  Zap,
} from '@lucide/vue'
import { api } from '@/api/client'
import type { ServerMeta } from '@/api/protocol'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import { formatVersion } from '@/utils/version'
import SiteHeader from '@/components/SiteHeader.vue'
import SpotlightCard from '@/components/SpotlightCard.vue'

const { t } = useI18n()
const session = useSessionStore()
const setup = useSetupStore()








const showJoinEntry = computed(() => setup.membershipEnabled)


const meta = ref<ServerMeta | null>(null)

onMounted(async () => {
  try {
    meta.value = await api.serverMeta()
  } catch {
    
  }
})


const serverVersion = computed(() => formatVersion(meta.value?.server_version))

const features = [
  { icon: Radio, title: 'home.featureRealtimeTitle', desc: 'home.featureRealtimeDesc' },
  { icon: Lock, title: 'home.featureControlTitle', desc: 'home.featureControlDesc' },
  { icon: Users, title: 'home.featureGroupTitle', desc: 'home.featureGroupDesc' },
  { icon: ShieldCheck, title: 'home.featureDeviceTitle', desc: 'home.featureDeviceDesc' },
] as const





const COPYRIGHT_START_YEAR = 2025







const SECTL_SITE_URL = 'https://sectl.cn'








const serverYear = computed(() => {
  const raw = meta.value?.server_time
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getUTCFullYear()
})

const copyrightYears = computed(() => {
  const year = serverYear.value
  if (year === null) return ''
  return year > COPYRIGHT_START_YEAR ? `${COPYRIGHT_START_YEAR}-${year}` : `${year}`
})

const copyrightText = computed(() => t('home.copyright', { years: copyrightYears.value }))
</script>

<template>
  <div class="min-h-screen">
    
    <SiteHeader />

    
    <section class="brand-glow border-b border-border-base">
      <span class="hero-orb hero-orb--a" aria-hidden="true" />
      <span class="hero-orb hero-orb--b" aria-hidden="true" />

      <div class="relative mx-auto max-w-5xl px-5 py-16 text-center">
        <div class="reveal" data-reveal>
          <img
            src="/apple-touch-icon.png"
            alt=""
            class="logo-float mx-auto h-20 w-20 rounded-[22px] shadow-lg shadow-black/40"
          />
        </div>

        <h1
          class="reveal mt-6 text-[32px] leading-tight font-bold tracking-tight sm:text-[40px]"
          data-reveal
        >
          <span class="text-brand-gradient">{{ t('common.appName') }}</span>
        </h1>
        <p class="reveal mt-3 text-[15px] font-medium text-brand-bright" data-reveal>
          {{ t('home.tagline') }}
        </p>
        <p
          class="reveal mx-auto mt-5 max-w-2xl text-[13.5px] leading-relaxed text-text-muted"
          data-reveal
        >
          {{ t('home.description') }}
        </p>

        <div
          class="reveal mt-8 flex flex-wrap items-center justify-center gap-3"
          data-reveal
        >
          <RouterLink
            v-if="session.isSignedIn"
            to="/console"
            class="btn-primary inline-flex items-center gap-2 rounded-control border border-brand bg-brand px-5 py-2.5 text-[14px] font-medium text-white hover:bg-brand-hover"
          >
            <LayoutDashboard class="icon" />
            {{ t('home.enterConsole') }}
          </RouterLink>
          <RouterLink
            v-else
            :to="{ name: 'login' }"
            class="btn-primary inline-flex items-center gap-2 rounded-control border border-brand bg-brand px-5 py-2.5 text-[14px] font-medium text-white hover:bg-brand-hover"
          >
            {{ t('home.signIn') }}
            <ArrowRight class="icon" />
          </RouterLink>

          <RouterLink
            v-if="showJoinEntry"
            to="/join"
            data-testid="home-join-entry"
            class="btn-ghost inline-flex items-center gap-2 rounded-control border border-border-strong bg-surface px-4 py-2.5 text-[13px] text-text-muted hover:bg-surface-2 hover:text-text-base"
          >
            <Zap class="icon" />
            {{ t('home.haveInvite') }}
          </RouterLink>
        </div>
      </div>
    </section>

    
    <section class="mx-auto max-w-5xl px-5 py-14">
      <div class="mb-6 flex items-center gap-3">
        <span class="text-[11px] tracking-widest text-text-faint uppercase">
          {{ t('home.featuresLabel') }}
        </span>
        <span class="beam-line flex-1" aria-hidden="true" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <SpotlightCard
          v-for="feature in features"
          :key="feature.title"
          tag="article"
          class="reveal rounded-card border border-border-base bg-surface p-5"
          data-reveal
        >
          <span class="icon-tile">
            <component :is="feature.icon" class="h-[18px] w-[18px]" />
          </span>
          <h2 class="mt-3.5 text-[14.5px] font-semibold">
            {{ t(feature.title) }}
          </h2>
          <p class="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">{{ t(feature.desc) }}</p>
        </SpotlightCard>
      </div>
    </section>

    <footer class="footer-beam">
      <div
        class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-6 text-[11.5px] text-text-faint"
      >
        <MonitorSmartphone class="icon" />
        <span>{{ t('common.appName') }}</span>

        <!-- 版本号放在页脚：它是"排障时才会看"的信息，不该占据首屏。
             服务端的版本号就是**部署日期**（如 `2026.10.07`，见根目录 Directory.Build.props），
             页面上只显示三段数字 —— 原始值里可能追加了 `+<commit>`，那串东西对使用者没有意义
             （裁剪规则见 utils/version.ts）。
             取不到 `/v1/meta` 时整块不显示，而不是显示一个占位的假版本。 -->
        <span
          v-if="serverVersion"
          class="font-mono"
          data-testid="server-version"
          :title="t('home.serverVersion')"
        >
          {{ serverVersion }}
        </span>
        
        <a
          :href="SECTL_SITE_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-auto flex items-center gap-1.5 underline-offset-2 transition-colors hover:text-text-muted hover:underline"
          data-testid="copyright"
          :title="t('home.copyrightSource')"
        >
          <ServerCog class="icon" />
          {{ copyrightText }}
        </a>
      </div>
    </footer>
  </div>
</template>
