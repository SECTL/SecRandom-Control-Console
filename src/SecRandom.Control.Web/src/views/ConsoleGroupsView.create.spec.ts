import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import ConsoleGroupsView from './ConsoleGroupsView.vue'
import { api } from '@/api/client'
import { useSessionStore } from '@/stores/session'
import { createAppI18n } from '@/i18n'
import type { CurrentUser } from '@/api/protocol'



vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: { ...actual.api, createGroup: vi.fn() },
  }
})

const signedInUser: CurrentUser = { user_id: 'u-1', display_name: '张老师', groups: [] }

async function mountView(user: CurrentUser): Promise<{ wrapper: VueWrapper; router: Router }> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/console', component: { template: '<div />' } },
      { path: '/join', component: { template: '<div />' } },
      { path: '/console/groups/:groupId', component: { template: '<div />' } },
    ],
  })
  await router.push('/console')
  await router.isReady()

  const session = useSessionStore(pinia)
  session.user = user
  session.loaded = true
  
  vi.spyOn(session, 'load').mockResolvedValue(undefined)

  const wrapper = mount(ConsoleGroupsView, {
    global: { plugins: [pinia, createAppI18n('zh-CN'), router] },
  })

  return { wrapper, router }
}

describe('ConsoleGroupsView 创建组', () => {
  beforeEach(() => {
    vi.mocked(api.createGroup).mockReset()
  })

  it('没有组时给出创建入口，点击后打开对话框', async () => {
    const { wrapper } = await mountView({ ...signedInUser, groups: [] })

    expect(wrapper.find('[data-testid="create-dialog"]').exists()).toBe(false)

    await wrapper.get('[data-testid="create-entry"]').trigger('click')

    expect(wrapper.find('[data-testid="create-dialog"]').exists()).toBe(true)
  })

  it('组名为空时提交按钮不可用', async () => {
    const { wrapper } = await mountView({ ...signedInUser, groups: [] })
    await wrapper.get('[data-testid="create-entry"]').trigger('click')

    const submit = wrapper.get('[data-testid="create-submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    
    await wrapper.get('[data-testid="group-name"]').setValue('   ')
    expect(wrapper.get('[data-testid="create-submit"]').attributes('disabled')).toBeDefined()
  })

  it('提交成功后跳转到新组', async () => {
    vi.mocked(api.createGroup).mockResolvedValue({
      group_id: 'grp_new',
      name: '高一（1）班',
      owner_user_id: 'u-1',
      created_at: new Date().toISOString(),
      role: 'owner',
    })

    const { wrapper, router } = await mountView({ ...signedInUser, groups: [] })
    const push = vi.spyOn(router, 'push')

    await wrapper.get('[data-testid="create-entry"]').trigger('click')
    await wrapper.get('[data-testid="group-name"]').setValue('  高一（1）班  ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    
    expect(api.createGroup).toHaveBeenCalledWith('高一（1）班')
    expect(push).toHaveBeenCalledWith('/console/groups/grp_new')
  })

  it('服务端报错时显示对应文案，且不跳转', async () => {
    const { ApiError } = await import('@/api/client')
    vi.mocked(api.createGroup).mockRejectedValue(new ApiError('invalid_group_name', 400))

    const { wrapper, router } = await mountView({ ...signedInUser, groups: [] })
    const push = vi.spyOn(router, 'push')

    await wrapper.get('[data-testid="create-entry"]').trigger('click')
    await wrapper.get('[data-testid="group-name"]').setValue('x')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const error = wrapper.get('[data-testid="create-error"]')
    
    expect(error.text()).not.toContain('invalid_group_name')
    expect(error.text().length).toBeGreaterThan(0)
    expect(push).not.toHaveBeenCalled()
    
    expect(wrapper.find('[data-testid="create-dialog"]').exists()).toBe(true)
  })

  it('未知错误码回落到通用文案，而不是把码显示给用户', async () => {
    const { ApiError } = await import('@/api/client')
    vi.mocked(api.createGroup).mockRejectedValue(new ApiError('some_future_error', 400))

    const { wrapper } = await mountView({ ...signedInUser, groups: [] })

    await wrapper.get('[data-testid="create-entry"]').trigger('click')
    await wrapper.get('[data-testid="group-name"]').setValue('x')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[data-testid="create-error"]').text()).not.toContain('some_future_error')
  })
})
