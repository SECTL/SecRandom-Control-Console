import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import GroupNavSection from './GroupNavSection.vue'
import zhCN from '@/i18n/locales/zh-CN'
import type { GroupSummary } from '@/api/protocol'

function group(id: string, name: string): GroupSummary {
  return {
    group_id: id,
    name,
    owner_user_id: 'u-1',
    owner_display_name: '张老师',
    created_at: '2026-01-01T00:00:00Z',
    role: 'owner',
  }
}

const groups = [group('grp_a', '一班'), group('grp_b', '二班'), group('grp_c', '三班')]

interface Harness {
  wrapper: VueWrapper
  router: Router
}






let mounted: VueWrapper | undefined

async function mountSection(list: GroupSummary[] = groups): Promise<Harness> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/console', component: { template: '<div />' } },
      { path: '/console/groups/:groupId', component: { template: '<div />' } },
    ],
  })
  await router.push('/console')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const wrapper = mount(GroupNavSection, {
    props: { groups: list, emptyHint: '还没有自己创建的组。', testId: 'owned' },
    global: { plugins: [i18n, router] },
  })

  mounted = wrapper
  return { wrapper, router }
}





function pointer(type: string, x = 0, y = 0): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y })
}

const links = (wrapper: VueWrapper) => wrapper.findAll('a[data-sort-id]')
const rowNames = (wrapper: VueWrapper) =>
  wrapper.findAll('[data-testid="sort-row"]').map((row) => row.text())


async function longPress(wrapper: VueWrapper, index = 0): Promise<void> {
  links(wrapper)[index]!.element.dispatchEvent(pointer('pointerdown', 5, 5))
  vi.advanceTimersByTime(600)
  await wrapper.vm.$nextTick()
}


let restoreElementFromPoint: (() => void) | undefined
function stubElementFromPoint(element: Element): void {
  const original = Object.getOwnPropertyDescriptor(document, 'elementFromPoint')
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    writable: true,
    value: () => element,
  })

  restoreElementFromPoint = () => {
    if (original) Object.defineProperty(document, 'elementFromPoint', original)
    else delete (document as { elementFromPoint?: unknown }).elementFromPoint
  }
}

describe('GroupNavSection 长按排序', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    restoreElementFromPoint?.()
    restoreElementFromPoint = undefined
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('平时是链接，长按后进入排序态', async () => {
    const { wrapper } = await mountSection()

    expect(links(wrapper)).toHaveLength(3)
    expect(wrapper.find('[data-testid="sort-hint"]').exists()).toBe(false)
    
    expect(wrapper.get('[data-testid="sort-discovery"]').text()).toContain('长按可排序')

    await longPress(wrapper)

    expect(wrapper.findAll('[data-testid="sort-row"]')).toHaveLength(3)
    
    expect(links(wrapper)).toHaveLength(0)
    expect(wrapper.get('[data-testid="sort-hint"]').text()).toContain('拖动')
  })

  it('普通点击（没按够时长）不进入排序态', async () => {
    const { wrapper } = await mountSection()

    links(wrapper)[0]!.element.dispatchEvent(pointer('pointerdown', 5, 5))
    vi.advanceTimersByTime(100)
    window.dispatchEvent(pointer('pointerup'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="sort-row"]').exists()).toBe(false)
    expect(links(wrapper)).toHaveLength(3)
  })

  it('长按期间先滑动（滚动/拖选）就放弃排序', async () => {
    const { wrapper } = await mountSection()

    links(wrapper)[0]!.element.dispatchEvent(pointer('pointerdown', 5, 5))
    window.dispatchEvent(pointer('pointermove', 5, 40))
    vi.advanceTimersByTime(600)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="sort-row"]').exists()).toBe(false)
  })

  it('▲▼ 按钮移动条目，点「完成」提交新顺序', async () => {
    const { wrapper } = await mountSection()

    await longPress(wrapper)

    
    await wrapper.findAll('[data-testid="sort-down"]')[0]!.trigger('click')
    expect(rowNames(wrapper)).toEqual(['二班', '一班', '三班'])

    
    await wrapper.findAll('[data-testid="sort-up"]')[2]!.trigger('click')
    expect(rowNames(wrapper)).toEqual(['二班', '三班', '一班'])

    await wrapper.get('[data-testid="sort-done"]').trigger('click')

    expect(wrapper.emitted('commit')?.at(-1)).toEqual([['grp_b', 'grp_c', 'grp_a']])
    
    expect(links(wrapper)).toHaveLength(3)
  })

  it('首尾条目的 ▲/▼ 不可点（顺序不会转出边界）', async () => {
    const { wrapper } = await mountSection()

    await longPress(wrapper)

    const ups = wrapper.findAll('[data-testid="sort-up"]')
    const downs = wrapper.findAll('[data-testid="sort-down"]')

    expect(ups[0]!.attributes('disabled')).toBeDefined()
    expect(downs[2]!.attributes('disabled')).toBeDefined()
    expect(ups[1]!.attributes('disabled')).toBeUndefined()
  })

  it('「取消」与 Esc 都不提交，并退回原顺序', async () => {
    const { wrapper } = await mountSection()

    await longPress(wrapper)
    await wrapper.findAll('[data-testid="sort-down"]')[0]!.trigger('click')
    expect(rowNames(wrapper)).toEqual(['二班', '一班', '三班'])

    await wrapper.get('[data-testid="sort-cancel"]').trigger('click')

    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(links(wrapper).map((link) => link.text())).toEqual(['一班', '二班', '三班'])

    await longPress(wrapper)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(wrapper.find('[data-testid="sort-row"]').exists()).toBe(false)
  })

  it('拖动到另一条上时交换位置，松手提交', async () => {
    const { wrapper } = await mountSection()

    await longPress(wrapper, 0)

    
    stubElementFromPoint(wrapper.findAll('[data-testid="sort-row"]')[2]!.element)
    window.dispatchEvent(pointer('pointermove', 10, 90))
    await wrapper.vm.$nextTick()

    expect(rowNames(wrapper)).toEqual(['二班', '三班', '一班'])

    window.dispatchEvent(pointer('pointerup'))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('commit')?.at(-1)).toEqual([['grp_b', 'grp_c', 'grp_a']])
  })

  it('空分区显示提示', async () => {
    const { wrapper } = await mountSection([])

    expect(wrapper.get('[data-testid="owned-empty"]').text()).toContain('还没有自己创建的组')
    expect(wrapper.find('[data-testid="sort-discovery"]').exists()).toBe(false)
  })
})
