import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import ConsoleLayout from './ConsoleLayout.vue'
import { api } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import zhCN from '@/i18n/locales/zh-CN'
import type { CurrentUser } from '@/api/protocol'


vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return { ...actual, api: { ...actual.api, saveGroupOrder: vi.fn() } }
})

const signedInUser: CurrentUser = { user_id: 'u-1', display_name: '张老师', groups: [] }
const signedOutUser: CurrentUser | null = null


const userWithGroup: CurrentUser = {
  user_id: 'u-1',
  display_name: '张老师',
  groups: [
    {
      group_id: 'grp_1',
      name: '高一（1）班',
      owner_user_id: 'u-1',
      owner_display_name: '张老师',
      created_at: '2025-09-01T00:00:00Z',
      role: 'owner',
    },
  ],
}


const mixedUser: CurrentUser = {
  user_id: 'u-1',
  display_name: '张老师',
  groups: [
    {
      group_id: 'grp_o1',
      name: '我的组一',
      owner_user_id: 'u-1',
      owner_display_name: '张老师',
      created_at: '2025-09-01T00:00:00Z',
      role: 'owner',
    },
    {
      group_id: 'grp_o2',
      name: '我的组二',
      owner_user_id: 'u-1',
      owner_display_name: '张老师',
      created_at: '2025-09-02T00:00:00Z',
      role: 'owner',
    },
    {
      group_id: 'grp_j1',
      name: '别人的组一',
      owner_user_id: 'u-2',
      owner_display_name: '李老师',
      created_at: '2025-09-03T00:00:00Z',
      role: 'operator',
    },
    {
      group_id: 'grp_j2',
      name: '别人的组二',
      owner_user_id: 'u-3',
      owner_display_name: '王老师',
      created_at: '2025-09-04T00:00:00Z',
      role: 'viewer',
    },
  ],
}


function pointer(type: string, x = 0, y = 0): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y })
}

interface Harness {
  wrapper: VueWrapper
  session: ReturnType<typeof useSessionStore>
  router: Router
}

async function mountLayout(
  user: CurrentUser | null,
  routePath = '/console',
): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/join', component: { template: '<div />' } },
      
      
      { path: '/console', component: { template: '<div />' }, children: [
        { path: '', component: { template: '<div />' } },
        { path: 'groups/:groupId', component: { template: '<div />' } },
      ] },
    ],
  })
  await router.push(routePath)
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const session = useSessionStore(pinia)
  session.user = user
  session.loaded = true

  const wrapper = mount(ConsoleLayout, {
    global: {
      plugins: [pinia, i18n, router],
      
      stubs: { AccountMenu: true },
    },
  })

  return { wrapper, session, router }
}


const footer = (wrapper: VueWrapper) => wrapper.get('.mt-auto')

describe('ConsoleLayout', () => {
  it('左下角保留语言选择，并且不再有「返回首页」', async () => {
    const { wrapper } = await mountLayout(signedInUser)

    
    expect(footer(wrapper).find('[data-testid="language-select"]').exists()).toBe(true)
    expect(footer(wrapper).find('a').exists()).toBe(false)
    expect(footer(wrapper).text()).not.toContain('返回首页')
    expect(wrapper.text()).not.toContain('返回首页')
  })

  it('侧栏品牌标识仍然可以回到站点首页', async () => {
    const { wrapper } = await mountLayout(signedInUser)

    
    expect(wrapper.find('aside a[href="/"]').exists()).toBe(true)
  })

  it('离开控制台首页后，侧栏顶部的第一条是回控制台首页的入口（箭头 + 文案）', async () => {
    const { wrapper } = await mountLayout(userWithGroup, '/console/groups/grp_1')

    const nav = wrapper.get('aside nav')
    const homeLink = nav.get('a[data-testid="console-home"]')

    expect(homeLink.attributes('href')).toBe('/console')
    
    
    expect(homeLink.text()).toContain('返回控制台首页')
    expect(nav.text()).toContain('返回控制台首页')
    
    expect(homeLink.attributes('aria-label')).toBeUndefined()

    
    expect(nav.element.firstElementChild).toBe(homeLink.element)
  })

  




  it('已经在控制台首页时，回首页入口整条隐藏', async () => {
    const { wrapper } = await mountLayout(signedInUser, '/console')

    expect(wrapper.find('aside [data-testid="console-home"]').exists()).toBe(false)
    expect(wrapper.get('aside').text()).not.toContain('返回控制台首页')
  })

  it('点「返回控制台首页」跳回首页后，这条入口自己就没了', async () => {
    const { wrapper, router } = await mountLayout(userWithGroup, '/console/groups/grp_1')

    expect(wrapper.find('aside [data-testid="console-home"]').exists()).toBe(true)

    await wrapper.get('aside a[data-testid="console-home"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/console')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('aside [data-testid="console-home"]').exists()).toBe(false)
  })

  it('组详情页的侧栏仍然列出本组，组链接照旧可点', async () => {
    const { wrapper } = await mountLayout(userWithGroup, '/console/groups/grp_1')

    
    expect(wrapper.get('aside a[href="/console/groups/grp_1"]').text()).toContain('高一（1）班')
  })

  




  it('组详情页的侧栏不再有「当前组」占位分组', async () => {
    const { wrapper } = await mountLayout(userWithGroup, '/console/groups/grp_1')

    expect(wrapper.findAll('aside nav')).toHaveLength(1)

    const asideText = wrapper.get('aside').text()
    expect(asideText).not.toContain('当前组')
    expect(asideText).not.toContain('审计日志')
  })

  




  it('侧栏不再有「创建组」与「输入邀请码加入」', async () => {
    const { wrapper } = await mountLayout(signedInUser)

    const navItems = wrapper
      .get('aside nav')
      .findAll('a, button')
      .map((item) => item.text())

    expect(navItems.some((text) => text.includes('创建组'))).toBe(false)
    expect(navItems.some((text) => text.includes('输入邀请码加入'))).toBe(false)

    
    expect(wrapper.get('aside').find('a[href="/join"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/console/join"]').exists()).toBe(false)
  })

  it('未登录时左下角仍显示语言选择与登录状态提示', async () => {
    const { wrapper, session } = await mountLayout(signedOutUser)

    expect(session.isSignedIn).toBe(false)
    expect(footer(wrapper).find('[data-testid="language-select"]').exists()).toBe(true)
    expect(footer(wrapper).text()).toContain('未登录')
  })

  





  it('「我的组」旁显示配额进度', async () => {
    const { wrapper } = await mountLayout({ ...userWithGroup, max_owned_groups: 100 })

    expect(wrapper.get('[data-testid="sidebar-group-quota"]').text()).toBe('1 / 100')
  })

  it('服务端没下发上限时不显示进度，也不自己编一个数字', async () => {
    const { wrapper } = await mountLayout(userWithGroup)

    expect(wrapper.find('[data-testid="sidebar-group-quota"]').exists()).toBe(false)
  })

  



  it('「我的组 / 加入的组」按钮切换，一次只显示一份列表', async () => {
    const { wrapper } = await mountLayout(mixedUser)

    expect(wrapper.get('[data-testid="sidebar-tab-owned"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('我的组一')
    expect(wrapper.text()).not.toContain('别人的组一')

    await wrapper.get('[data-testid="sidebar-tab-joined"]').trigger('click')

    expect(wrapper.get('[data-testid="sidebar-tab-joined"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('别人的组一')
    expect(wrapper.text()).not.toContain('我的组一')
  })

  it('配额进度只在「我的组」页签下显示', async () => {
    const { wrapper } = await mountLayout({ ...mixedUser, max_owned_groups: 100 })

    expect(wrapper.get('[data-testid="sidebar-group-quota"]').text()).toBe('2 / 100')

    await wrapper.get('[data-testid="sidebar-tab-joined"]').trigger('click')
    expect(wrapper.find('[data-testid="sidebar-group-quota"]').exists()).toBe(false)
  })

  it('一个组都没建、只加入了别人的组时，默认落在「加入的组」', async () => {
    const joinedOnly: CurrentUser = {
      user_id: 'u-1',
      display_name: '张老师',
      groups: mixedUser.groups.filter((group) => group.owner_user_id !== 'u-1'),
    }

    const { wrapper } = await mountLayout(joinedOnly)

    expect(wrapper.get('[data-testid="sidebar-tab-joined"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('别人的组一')
  })

  it('排序提交时把两个分区的顺序一起写回服务端', async () => {
    vi.useFakeTimers()

    try {
      const { wrapper } = await mountLayout({ ...mixedUser, max_owned_groups: 100 })

      await wrapper.get('[data-testid="sidebar-tab-joined"]').trigger('click')

      
      const links = wrapper.findAll('a[data-sort-id]')
      links[1]!.element.dispatchEvent(pointer('pointerdown', 5, 5))
      vi.advanceTimersByTime(600)
      await wrapper.vm.$nextTick()

      await wrapper.findAll('[data-testid="sort-up"]')[1]!.trigger('click')
      await wrapper.get('[data-testid="sort-done"]').trigger('click')
      await flushPromises()

      
      expect(api.saveGroupOrder).toHaveBeenCalledWith(['grp_o1', 'grp_o2', 'grp_j2', 'grp_j1'])
    } finally {
      vi.useRealTimers()
    }
  })
})

afterEach(() => {
  vi.mocked(api.saveGroupOrder).mockReset()
})
