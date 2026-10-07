import type { DOMWrapper } from '@vue/test-utils'


















export type FoundElement = Omit<DOMWrapper<Element>, 'exists'>

export function selectPopup(): HTMLElement | null {
  return document.body.querySelector('[data-cn-select-popup]')
}

export function selectItems(): HTMLElement[] {
  return [...document.body.querySelectorAll('.cn-combo-popup__item')].map(
    (node) => node as HTMLElement,
  )
}


export function selectLabels(): string[] {
  return selectItems().map(
    (item) => item.querySelector('.cn-combo-popup__label')?.textContent?.trim() ?? '',
  )
}








export function selectValue(trigger: FoundElement): string {
  return trigger.find('.cn-combo__value').text()
}


export async function openSelect(trigger: FoundElement): Promise<void> {
  await trigger.trigger('click')
}







export async function pickOption(trigger: FoundElement, label: string): Promise<void> {
  if (selectPopup() === null) await openSelect(trigger)
  const item = selectItems().find(
    (node) => node.querySelector('.cn-combo-popup__label')?.textContent?.trim() === label,
  )
  if (item === undefined) {
    throw new Error(`弹层里没有「${label}」这一项，只有：${selectLabels().join(' / ')}`)
  }
  item.click()
  await new Promise((resolve) => setTimeout(resolve, 0))
}
