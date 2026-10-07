








import { createApp, h } from 'vue'
import { createAppI18n } from '@/i18n'
import ClientBroadcastDialog from '@/components/client/fluent/ClientBroadcastDialog.vue'

const params = new URLSearchParams(location.search)
const theme = params.get('theme') === 'dark' ? 'dark' : 'light'
document.documentElement.dataset.theme = theme

document.documentElement.style.background = 'var(--cn-content-bg)'

const view = {
  render: () =>
    h(ClientBroadcastDialog, {
      
      onConfirm: () => undefined,
      onClose: () => undefined,
    }),
}

const app = createApp(view)
app.use(createAppI18n('zh-CN'))
app.mount('#preview')


if (params.get('filled') === '1') {
  const click = (selector: string): void => {
    document.querySelector<HTMLElement>(selector)?.click()
  }
  const type = (selector: string, value: string): void => {
    const input = document.querySelector<HTMLInputElement>(selector)
    if (input === null) return
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  setTimeout(() => {
    click('[data-testid="broadcast-quick-draw"]')
    click('[data-testid="broadcast-system-set"]')
    type('[data-testid="broadcast-system-volume"]', '40')
    click('[data-testid="broadcast-voice-set"]')
    type('[data-testid="broadcast-voice-volume"]', '60')
  }, 200)
}
