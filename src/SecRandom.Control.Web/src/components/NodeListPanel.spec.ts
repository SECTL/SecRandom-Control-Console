import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import NodeListPanel from './NodeListPanel.vue'
import { api } from '@/api/client'
import { createAppI18n } from '@/i18n'
import { useSessionStore } from '@/stores/session'
import {
  NodeCapability,
  type CurrentUser,
  type GroupRole,
  type NodeView,
} from '@/api/protocol'










enableAutoUnmount(afterEach)

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/client')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      listNodes: vi.fn(),
      setDrawLock: vi.fn(),
      removeNode: vi.fn(),
      playMedia: vi.fn(),
    },
  }
})

const GROUP_ID = 'grp_01ab30b332e6'
const USER_ID = 'user_owner_1'
const NODE_A = 'node_01a'
const NODE_B = 'node_01b'

function userWith(role: GroupRole): CurrentUser {
  return {
    user_id: USER_ID,
    display_name: '张老师',
    groups: [
      {
        group_id: GROUP_ID,
        name: '高一（1）班 · 教学楼301',
        owner_user_id: USER_ID,
        created_at: '2026-03-12T00:00:00Z',
        role,
      },
    ],
  }
}

function node(id: string, capabilities: string[]): NodeView {
  return {
    node_id: id,
    group_id: GROUP_ID,
    platform: 'windows',
    version: '1.0.0',
    capabilities,
    local_remote_allowed: true,
    display_name: `讲台机 ${id}`,
    online: true,
    draw_locked: false,
    registered_at: '2026-03-12T00:00:00Z',
  }
}

interface Harness {
  wrapper: VueWrapper
  router: Router
}

async function mountPanel(role: GroupRole, list: NodeView[]): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  vi.mocked(api.listNodes).mockResolvedValue(list)

  const session = useSessionStore(pinia)
  session.user = userWith(role)
  session.loaded = true

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      {
        path: '/console/groups/:groupId',
        name: 'console-group-detail',
        component: { template: '<div />' },
      },
      {
        path: '/console/groups/:groupId/nodes/:nodeId',
        name: 'console-node-detail',
        component: { template: '<div />' },
      },
      {
        path: '/console/groups/:groupId/batch-config',
        name: 'console-group-batch-config',
        component: { template: '<div />' },
      },
    ],
  })
  await router.push(`/console/groups/${GROUP_ID}`)
  await router.isReady()

  const wrapper = mount(NodeListPanel, {
    
    props: { groupId: GROUP_ID, refreshIntervalMs: 3_600_000 },
    global: { plugins: [pinia, createAppI18n('zh-CN'), router] },
  })
  await flushPromises()

  return { wrapper, router }
}

async function select(wrapper: VueWrapper, nodeId: string): Promise<void> {
  await wrapper.get(`[data-testid="node-select-${nodeId}"]`).setValue(true)
}

beforeEach(() => {
  vi.mocked(api.setDrawLock).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NodeListPanel 的「统一配置」入口', () => {
  it('勾了声明了「远程改设置」的机器后出现，点它带着全部 id 跳到独立页面', async () => {
    const { wrapper, router } = await mountPanel('admin', [
      node(NODE_A, [NodeCapability.SettingsWrite]),
      node(NODE_B, [NodeCapability.SettingsWrite]),
    ])

    
    expect(wrapper.find('[data-testid="nodes-batch-config"]').exists()).toBe(false)

    await select(wrapper, NODE_A)
    await select(wrapper, NODE_B)

    const button = wrapper.get('[data-testid="nodes-batch-config"]')
    expect(button.attributes('disabled')).toBeUndefined()

    await button.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('console-group-batch-config')
    expect(router.currentRoute.value.params['groupId']).toBe(GROUP_ID)
    
    expect(router.currentRoute.value.query['nodes']).toBe(`${NODE_A},${NODE_B}`)
  })

  it('勾选的机器都没声明 capabilities 时按钮不可用，并在悬停说明里给出原因', async () => {
    const { wrapper } = await mountPanel('admin', [
      node(NODE_A, [NodeCapability.MediaPlay]),
      node(NODE_B, [NodeCapability.DrawLock]),
    ])

    await select(wrapper, NODE_A)

    const button = wrapper.get('[data-testid="nodes-batch-config"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toContain('没有声明「远程改设置」能力')
  })

  it('operator（非管理员）看不到这个入口：写设置在服务端要求 admin', async () => {
    const { wrapper } = await mountPanel('operator', [
      node(NODE_A, [NodeCapability.SettingsWrite]),
    ])

    await select(wrapper, NODE_A)

    
    expect(wrapper.find('[data-testid="nodes-batch-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nodes-batch-config"]').exists()).toBe(false)
  })
})
