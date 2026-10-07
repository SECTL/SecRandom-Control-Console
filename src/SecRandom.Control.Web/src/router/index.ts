import { createRouter, createWebHistory } from 'vue-router'
import ConsoleLayout from '@/layouts/ConsoleLayout.vue'
import { guardConsoleEntry, redirectToSectlLogin } from './console-guard'
import { guardSetupEntry, SETUP_ROUTE } from './setup-guard'














export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    





    {
      path: SETUP_ROUTE,
      name: 'setup',
      component: () => import('@/views/SetupView.vue'),
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/JoinView.vue'),
      props: (route) => ({ code: typeof route.query.code === 'string' ? route.query.code : '' }),
    },
    {
      path: '/console',
      component: ConsoleLayout,
      children: [
        {
          path: '',
          name: 'console-groups',
          component: () => import('@/views/ConsoleGroupsView.vue'),
        },
        {
          path: 'groups/:groupId',
          name: 'console-group-detail',
          component: () => import('@/views/GroupDetailView.vue'),
          props: true,
        },
        






        {
          path: 'groups/:groupId/nodes/:nodeId',
          name: 'console-node-detail',
          component: () => import('@/views/NodeDetailView.vue'),
          props: true,
        },
        







        {
          path: 'groups/:groupId/batch-config',
          name: 'console-group-batch-config',
          component: () => import('@/views/GroupBatchConfigView.vue'),
          props: (route) => ({
            groupId: typeof route.params.groupId === 'string' ? route.params.groupId : '',
            nodes: typeof route.query.nodes === 'string' ? route.query.nodes : '',
          }),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

















router.beforeEach(async (to, from) => {
  const [{ useSessionStore }, { useSetupStore }] = await Promise.all([
    import('@/stores/session'),
    import('@/stores/setup'),
  ])
  const session = useSessionStore()
  const setup = useSetupStore()

  const setupGate = await guardSetupEntry(to, {
    loaded: () => setup.loaded,
    initialized: () => setup.initialized,
    load: () => setup.load(),
  })
  if (setupGate !== true) return setupGate

  return guardConsoleEntry(to, from, {
    isSignedIn: () => session.isSignedIn,
    loaded: () => session.loaded,
    serviceUnavailable: () => session.serviceUnavailable,
    load: () => session.load(),
    redirectToSectlLogin,
  })
})
