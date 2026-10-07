import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import JoinView from './JoinView.vue'
import { api, ApiError } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { createAppI18n } from '@/i18n'
import type { CurrentUser, RedeemResultDto } from '@/api/protocol'

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: { ...actual.api, redeemInvite: vi.fn(), session: vi.fn() },
  }
})

const GROUP_ID = 'grp_01ab30b332e6'
const GROUP_NAME = '高一（1）班'

const signedInUser: CurrentUser = {
  user_id: 'u-1',
  display_name: '张老师',
  groups: [
    {
      group_id: GROUP_ID,
      name: GROUP_NAME,
      owner_user_id: 'u-1',
      created_at: '2026-03-12T00:00:00Z',
      role: 'operator',
    },
  ],
}

const redeemResult: RedeemResultDto = {
  group_id: GROUP_ID,
  role: 'operator',
  group_name: GROUP_NAME,
  already_member: false,
}

async function mountJoin(
  props: { code: string },
  user: CurrentUser | null = signedInUser,
): Promise<{ wrapper: VueWrapper; router: Router }> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/join', component: { template: '<div />' } },
      { path: '/console', component: { template: '<div />' } },
      { path: '/console/groups/:groupId', component: { template: '<div />' } },
    ],
  })
  await router.push('/join')
  await router.isReady()

  const session = useSessionStore(pinia)
  session.user = user
  session.loaded = true

  const wrapper = mount(JoinView, {
    props,
    global: { plugins: [pinia, createAppI18n('zh-CN'), router] },
  })

  return { wrapper, router }
}







describe('JoinView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('显示站点顶栏（品牌回首页 + 语言选择），且没有控制台侧栏', async () => {
    const { wrapper } = await mountJoin({ code: '' })

    const header = wrapper.get('header')
    
    expect(header.find('a[href="/"]').exists()).toBe(true)
    
    expect(header.find('[data-testid="language-select"]').exists()).toBe(true)
    expect(wrapper.find('aside').exists()).toBe(false)
  })

  it('内容在页面里上下、左右都居中', async () => {
    const { wrapper } = await mountJoin({ code: '' })

    const main = wrapper.get('main')
    expect(main.classes()).toContain('flex-1')
    expect(main.classes()).toContain('items-center')
    expect(main.classes()).toContain('justify-center')
  })

  it('邀请码会从 URL 带进表单', async () => {
    const { wrapper } = await mountJoin({ code: 'ABCD-2345' })

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('ABCD-2345')
  })

  it('未登录时先给「登录再兑换」入口，并把邀请码带回本页', async () => {
    const { wrapper } = await mountJoin({ code: 'ABCD-1234' }, null)

    
    const signIn = wrapper.get('a[href^="/api/auth/login"]')
    expect(decodeURIComponent(signIn.attributes('href') ?? '')).toContain(
      'return_to=/join?code=ABCD-1234',
    )
    expect(wrapper.find('input').exists()).toBe(false)
  })

  



  it('只有一个输入框：码与链接都贴进同一个框', async () => {
    const { wrapper } = await mountJoin({ code: '' })

    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.get('input').attributes('placeholder')).toContain('邀请码')
  })

  it('粘贴整条邀请链接也能加入：提交时自动取出链接里的邀请码', async () => {
    vi.mocked(api.redeemInvite).mockResolvedValue(redeemResult)
    const { wrapper } = await mountJoin({ code: '' })

    await wrapper.get('input').setValue(`https://ctl.example.com/join?code=ABCD2345&from=wechat`)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    
    expect(api.redeemInvite).toHaveBeenCalledWith('ABCD2345')
  })

  it('链接里没有邀请码时给出明确提示，不发请求', async () => {
    const { wrapper } = await mountJoin({ code: '' })

    await wrapper.get('input').setValue('https://ctl.example.com/join')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.redeemInvite).not.toHaveBeenCalled()
    const error = wrapper.get('[data-testid="join-error"]')
    expect(error.text()).toContain('这个链接里没有邀请码')
  })

  it('成功加入后跳到该组详情页', async () => {
    vi.mocked(api.redeemInvite).mockResolvedValue(redeemResult)
    const { wrapper, router } = await mountJoin({ code: '' })

    await wrapper.get('input').setValue('ABCD-2345')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe(`/console/groups/${GROUP_ID}`)
  })

  



  it('已在组里（码还是新的）：提示不能重复加入，并给出去看我的组的出口（不跳转）', async () => {
    vi.mocked(api.redeemInvite).mockRejectedValue(new ApiError('invite_already_member', 409))
    const { wrapper, router } = await mountJoin({ code: 'ABCD-2345' })

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const panel = wrapper.get('[data-testid="join-already-member"]')
    expect(panel.text()).toContain('你已经是这个组的成员，不能重复加入')
    
    expect(panel.find('a[href="/console"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="join-error"]').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/join')
  })

  




  it('重复兑换同一个码：同样按"不能重复加入"呈现', async () => {
    vi.mocked(api.redeemInvite).mockRejectedValue(new ApiError('invite_used', 410))
    const { wrapper, router } = await mountJoin({ code: 'ABCD-2345' })

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[data-testid="join-already-member"]').text()).toContain('不能重复加入')
    expect(wrapper.find('[data-testid="join-error"]').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/join')
  })

  it('其它失败仍然显示服务端给出的精确原因', async () => {
    vi.mocked(api.redeemInvite).mockRejectedValue(new ApiError('invite_expired', 410))
    const { wrapper } = await mountJoin({ code: 'ABCD-2345' })

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const error = wrapper.get('[data-testid="join-error"]')
    expect(error.text()).toContain('邀请码已过期')
    expect(wrapper.find('[data-testid="join-already-member"]').exists()).toBe(false)
  })
})
