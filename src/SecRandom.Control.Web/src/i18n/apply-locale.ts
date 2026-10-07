import type { WritableComputedRef } from 'vue'











export function applyLocale<T extends { locale: unknown }>(composer: T, locale: string): void {
  ;(composer.locale as WritableComputedRef<string>).value = locale
}
