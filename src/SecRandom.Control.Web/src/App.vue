<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useSessionWatchdog } from '@/composables/useSessionWatchdog'
import { setLocale, resolveInitialLocale } from '@/i18n'

const session = useSessionStore()



onMounted(() => {
  void session.load()
})



useSessionWatchdog()


setLocale(resolveInitialLocale())
</script>

<template>
  
  <RouterView />
</template>
