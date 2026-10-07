import type { ClientPageNavGroup } from '@/components/client/fluent/client-model'
import {
  type ClientSettingLocale,
  type ClientSettingText,
  type ClientSettingsPage,
} from '@/data/client-settings-pages'
import { CLIENT_SETTING_OPTION_LANGUAGES } from '@/data/client-setting-option-labels'

























export function clientSettingLocale(locale: string): ClientSettingLocale {
  return (CLIENT_SETTING_OPTION_LANGUAGES as readonly string[]).includes(locale)
    ? (locale as ClientSettingLocale)
    : 'zh-CN'
}







export function localizedSettingText(
  text: ClientSettingText | undefined,
  locale: string,
  fallback: string,
): string {
  if (text === undefined) return fallback
  return text[clientSettingLocale(locale)] ?? text['zh-CN'] ?? fallback
}







export type ClientSettingGroupLabelKey =
  | 'nodeDetail.client.groups.general'
  | 'nodeDetail.client.groups.personalized'
  | 'nodeDetail.client.groups.listManagement'
  | 'nodeDetail.client.groups.picking'
  | 'nodeDetail.client.groups.notification'
  | 'nodeDetail.client.groups.history'
  | 'nodeDetail.client.groups.more'
  | 'nodeDetail.client.groups.other'







export function clientSettingGroupLabel(
  group: string,
  t: (key: ClientSettingGroupLabelKey) => string,
): string {
  switch (group) {
    case 'general':
      return t('nodeDetail.client.groups.general')
    case 'personalized':
      return t('nodeDetail.client.groups.personalized')
    case 'listManagement':
      return t('nodeDetail.client.groups.listManagement')
    case 'picking':
      return t('nodeDetail.client.groups.picking')
    case 'notification':
      return t('nodeDetail.client.groups.notification')
    case 'history':
      return t('nodeDetail.client.groups.history')
    case 'more':
      
      return t('nodeDetail.client.groups.more')
    default:
      return t('nodeDetail.client.groups.other')
  }
}







export function clientPageNavGroups(
  pages: readonly ClientSettingsPage[],
  t: (key: ClientSettingGroupLabelKey) => string,
): readonly ClientPageNavGroup[] {
  const order: string[] = []
  const grouped = new Map<string, { id: string; label: string; icon: string }[]>()

  for (const page of pages) {
    let bucket = grouped.get(page.groupId)
    if (bucket === undefined) {
      bucket = []
      grouped.set(page.groupId, bucket)
      order.push(page.groupId)
    }
    bucket.push({ id: page.id, label: page.title, icon: page.icon })
  }

  return order.map((group) => ({
    id: group,
    label: clientSettingGroupLabel(group, t),
    items: grouped.get(group) ?? [],
  }))
}
