import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ConsoleGroupsView from './ConsoleGroupsView.vue'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import zhCN from '@/i18n/locales/zh-CN'
import type { CurrentUser } from '@/api/protocol'

const emptyUser: CurrentUser = { user_id: 'u-1', display_name: '张老师', groups: [] }

const userWithGroups: CurrentUser = {
  user_id: 'u-1',
  display_name: '张老师',
  groups: [
    {
      group_id: 'grp_1',
      name: '高一（1）班',
      role: 'owner',
      owner_user_id: 'u-1',
      owner_display_name: '张老师',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      group_id: 'grp_2',
      name: '高二机房',
      role: 'admin',
      owner_user_id: 'u-2',
      created_at: '2026-01-02T00:00:00Z',
    },
  ],
}

interface Harness {
  wrapper: VueWrapper
  session: ReturnType<typeof useSessionStore>
}

async function mountView(
  user: CurrentUser | null,
  loaded = true,
  options: { membershipEnabled?: boolean } = {},
): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  
  if (options.membershipEnabled === false) {
    const setup = useSetupStore(pinia)
    setup.loaded = true
    setup.status = {
      initialized: true,
      mode: 'local',
      display_name: '测试实例',
      membership_enabled: false,
      modes: [],
    }
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/console', component: { template: '<div />' } },
      { path: '/join', component: { template: '<div />' } },
      { path: '/console/groups/:groupId', component: { template: '<div />' } },
    ],
  })
  await router.push('/console')
  await router.isReady()

  const i18n = createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': zhCN } })

  const session = useSessionStore(pinia)
  session.user = user
  session.loaded = loaded

  const wrapper = mount(ConsoleGroupsView, { global: { plugins: [pinia, i18n, router] } })

  return { wrapper, session }
}

describe('ConsoleGroupsView', () => {
  it('没有组时，两条入口居中显示，并给出邀请码与邀请链接两种加入形态', async () => {
    const { wrapper } = await mountView(emptyUser)

    const empty = wrapper.get('[data-testid="groups-empty"]')
    
    expect(empty.classes()).toContain('items-center')
    expect(empty.classes()).toContain('justify-center')
    expect(empty.classes()).toContain('flex-1')

    expect(wrapper.get('h2').text()).toContain('你还没有加入任何组')

    
    
    const joinEntry = wrapper.get('[data-testid="join-entry"]')
    expect(joinEntry.attributes('href')).toBe('/join')
    expect(joinEntry.text()).toContain('加入别人的组')
    expect(joinEntry.text()).toContain('输入邀请码加入')
    expect(joinEntry.text()).toContain('粘贴邀请链接')

    
    const createEntry = wrapper.get('[data-testid="create-entry"]')
    expect(createEntry.text()).toContain('创建组')
  })

  it('没有组时不再重复显示顶部的快捷按钮', async () => {
    const { wrapper } = await mountView(emptyUser)

    expect(wrapper.findAll('[data-testid="join-entry"]')).toHaveLength(1)
    
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.get('button').attributes('data-testid')).toBe('create-entry')
  })

  





  it('关掉成员功能时不显示「加入别人的组」入口', async () => {
    const { wrapper } = await mountView(emptyUser, true, { membershipEnabled: false })

    expect(wrapper.find('[data-testid="join-entry"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="create-entry"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="create-entry"]').text()).toContain('创建组')

    const grid = wrapper.get('[data-testid="groups-empty-entries"]')
    expect(grid.classes()).not.toContain('sm:grid-cols-2')
    expect(grid.classes()).toContain('sm:grid-cols-1')
  })

  it('关掉成员功能时，有组状态下右上角的「输入邀请码加入」也一起消失', async () => {
    const { wrapper } = await mountView(userWithGroups, true, { membershipEnabled: false })

    expect(wrapper.find('[data-testid="join-quick-entry"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('输入邀请码加入')
    
    expect(wrapper.text()).toContain('创建组')
    expect(wrapper.text()).toContain('高一（1）班')
  })

  it('有组时列出组卡片，顶部快捷入口保留，空态不出现', async () => {
    const { wrapper } = await mountView(userWithGroups)

    expect(wrapper.find('[data-testid="groups-empty"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('高一（1）班')
    expect(wrapper.get('a[href="/join"]').text()).toContain('输入邀请码加入')
    expect(wrapper.text()).toContain('创建组')
  })

  it('组卡片显示创建者昵称，并把组 ID 单独标注', async () => {
    const { wrapper } = await mountView(userWithGroups)

    
    const owned = wrapper.findAll('[data-testid="group-card-owner"]')
    expect(owned).toHaveLength(1)
    expect(owned[0]!.text()).toContain('张老师')
    expect(wrapper.text()).toContain('组 ID')
    expect(wrapper.text()).toContain('grp_1')

    
    await wrapper.get('[data-testid="home-tab-joined"]').trigger('click')

    const joined = wrapper.findAll('[data-testid="group-card-owner"]')
    expect(joined).toHaveLength(1)
    expect(joined[0]!.text()).toContain('u-2')
    expect(joined[0]!.text()).not.toContain('grp_2')
  })

  it('还没加载完成时显示加载中，不先闪一下空态', async () => {
    const { wrapper } = await mountView(null, false)

    expect(wrapper.text()).toContain('正在加载…')
    expect(wrapper.find('[data-testid="groups-empty"]').exists()).toBe(false)
  })

  



  it('首页不再显示「是否允许被集控」那段设备开关说明', async () => {
    for (const { wrapper } of [await mountView(userWithGroups), await mountView(emptyUser)]) {
      expect(wrapper.text()).not.toContain('是否允许被集控')
      expect(wrapper.text()).not.toContain('断网也生效')
    }
  })

  it('「我的组」旁显示配额进度：只算自己拥有的组', async () => {
    
    const { wrapper } = await mountView({ ...userWithGroups, max_owned_groups: 100 })

    expect(wrapper.get('[data-testid="groups-quota"]').text()).toBe('1 / 100')
  })

  



  it('「我的组 / 加入的组」按钮切换，一次只显示一份列表', async () => {
    const { wrapper } = await mountView(userWithGroups)

    expect(wrapper.get('[data-testid="home-tab-owned"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-testid="owned-groups"]').text()).toContain('高一（1）班')
    expect(wrapper.text()).not.toContain('高二机房')

    await wrapper.get('[data-testid="home-tab-joined"]').trigger('click')

    expect(wrapper.get('[data-testid="home-tab-joined"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-testid="joined-groups"]').text()).toContain('高二机房')
    expect(wrapper.text()).not.toContain('高一（1）班')
    
    expect(wrapper.get('[data-testid="home-tab-joined"]').text()).toContain('1')
  })

  it('一个组都没建、只加入了别人的组时，默认落在「加入的组」', async () => {
    const joinedOnly: CurrentUser = {
      user_id: 'u-1',
      display_name: '张老师',
      groups: [userWithGroups.groups[1]!],
    }

    const { wrapper } = await mountView(joinedOnly)

    expect(wrapper.get('[data-testid="home-tab-joined"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-testid="joined-groups"]').text()).toContain('高二机房')

    
    await wrapper.get('[data-testid="home-tab-owned"]').trigger('click')
    expect(wrapper.get('[data-testid="owned-groups-empty"]').text()).toContain('还没有自己创建的组')
  })

  it('还没有组时进度从 0 开始', async () => {
    const { wrapper } = await mountView({ ...emptyUser, max_owned_groups: 100 })

    expect(wrapper.get('[data-testid="groups-quota"]').text()).toBe('0 / 100')
  })

  it('服务端没下发上限时不显示进度，也不自己编一个数字', async () => {
    
    const { wrapper } = await mountView(userWithGroups)

    expect(wrapper.find('[data-testid="groups-quota"]').exists()).toBe(false)
  })
})
