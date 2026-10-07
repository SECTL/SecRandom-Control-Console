import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { i18n, resolveInitialLocale } from './i18n'
import { initTheme } from './theme'
import { installReveal } from './motion/reveal'
import './assets/main.css'



document.documentElement.lang = resolveInitialLocale()



initTheme()

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)



installReveal(app)

app.mount('#app')
