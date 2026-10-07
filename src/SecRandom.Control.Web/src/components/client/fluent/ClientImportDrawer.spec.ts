import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import ClientImportDrawer from './ClientImportDrawer.vue'
import {
  openSelect,
  pickOption,
  selectPopup,
  type FoundElement,
} from './client-select.test-utils'
import { createAppI18n } from '@/i18n'
import type { NodeRosterMemberDto, RosterKind } from '@/api/protocol'











enableAutoUnmount(afterEach)

interface ImportApi {
  loadFromBuffer: (data: ArrayBuffer, fileName: string) => Promise<void>
}

function csvBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer
}

function mountDrawer(kind: RosterKind = 'students') {
  const wrapper = mount(ClientImportDrawer, {
    props: { kind },
    global: { plugins: [createAppI18n('zh-CN')] },
  })
  const api = wrapper.vm as unknown as ImportApi
  return { wrapper, api }
}

async function load(api: ImportApi, text: string, name = 'students.csv'): Promise<void> {
  await api.loadFromBuffer(csvBuffer(text), name)
  await flushPromises()
}


function headers(wrapper: VueWrapper, scope: string): string[] {
  return wrapper
    .get(`${scope} thead`)
    .findAll('th')
    .map((th) => th.text())
}

function mappingSelect(wrapper: VueWrapper, column: string): FoundElement {
  return wrapper.get(`[data-testid="node-detail-roster-import-map-${column}"]`)
}


function mappingLabel(wrapper: VueWrapper, column: string): string {
  return mappingSelect(wrapper, column).text()
}

function confirmMembers(wrapper: VueWrapper): NodeRosterMemberDto[] | undefined {
  return wrapper.emitted('confirm')?.[0]?.[0] as NodeRosterMemberDto[] | undefined
}

const CSV_WITH_HEADER = 'id,name,gender,group,enabled,tags\n01,张三,男,A,1,班长\n02,李四,女,B,0,\n'


const CSV_SWAPPED = '编号,姓名,性别,分组,标签\n01,张三,男,A,班长\n02,李四,女,B,\n'

describe('ClientImportDrawer', () => {
  it('挂在对话框上：标题、说明、关闭按钮都在', () => {
    const { wrapper } = mountDrawer()

    const drawer = wrapper.get('[data-testid="node-detail-roster-import-drawer"]')
    expect(drawer.get('[role="dialog"]').attributes('aria-label')).toBe('从文件导入名单')
    expect(drawer.text()).toContain('导入只改控制台里的草稿')
  })

  



  it('确认之前先说清「整份覆盖」的后果', async () => {
    const { wrapper, api } = mountDrawer()

    expect(wrapper.get('[data-testid="node-detail-roster-import-overwrite"]').text()).toBe(
      '整份覆盖（缺的人会被删除）',
    )
    
    expect(
      wrapper.get('[data-testid="node-detail-roster-import-confirm"]').attributes('disabled'),
    ).toBeDefined()

    await load(api, CSV_WITH_HEADER)
    expect(wrapper.get('[data-testid="node-detail-roster-import-overwrite"]').text()).toBe(
      '整份覆盖（缺的人会被删除）',
    )
  })

  it('读一份带表头的 CSV：自动认出表头、按列对应生成预览', async () => {
    const { wrapper, api } = mountDrawer()
    await load(api, CSV_WITH_HEADER)

    expect(
      (wrapper.get('[data-testid="node-detail-roster-import-header-row"]').element as HTMLInputElement)
        .value,
    ).toBe('1')
    expect(
      (wrapper.get('[data-testid="node-detail-roster-import-first-row"]').element as HTMLInputElement)
        .value,
    ).toBe('2')
    
    expect(mappingLabel(wrapper, 'name')).not.toBe('未对应')

    const preview = wrapper.get('[data-testid="node-detail-roster-import-preview"]')
    expect(preview.text()).toContain('张三')
    expect(preview.text()).toContain('班长')
    
    expect(wrapper.find('[data-testid="node-detail-roster-import-problems"]').exists()).toBe(false)
  })

  it('列对应不再是原生 <select>：点开触发器列出候选列，选一项就改这一列的对应', async () => {
    const { wrapper, api } = mountDrawer()
    await load(api, CSV_SWAPPED)

    
    expect(mappingLabel(wrapper, 'id')).toContain('编号')
    expect(mappingLabel(wrapper, 'name')).toContain('姓名')

    const trigger = mappingSelect(wrapper, 'name')
    expect(trigger.element.tagName).toBe('BUTTON')

    await openSelect(trigger)
    
    expect(selectPopup()?.parentElement).toBe(document.body)
    expect(selectPopup()?.textContent).toContain('A · 编号')

    
    await pickOption(trigger, 'A · 编号')
    await flushPromises()

    const preview = wrapper.get('[data-testid="node-detail-roster-import-preview"]')
    expect(preview.text()).toContain('01')
  })

  it('预览表与列对应区都**没有「启用」列**：导入进来的人一律启用', async () => {
    const { wrapper, api } = mountDrawer()
    await load(api, CSV_WITH_HEADER)

    const preview = wrapper.get('[data-testid="node-detail-roster-import-preview"]')
    expect(headers(wrapper, '[data-testid="node-detail-roster-import-preview"]')).toEqual([
      '编号',
      '姓名',
      '性别',
      '分组',
      '标签',
    ])
    expect(wrapper.find('[data-testid="node-detail-roster-import-map-enabled"]').exists()).toBe(false)
    
    expect(wrapper.get('[data-testid="node-detail-roster-import-mapping"]').text()).not.toContain(
      '启用',
    )

    await wrapper.get('[data-testid="node-detail-roster-import-confirm"]').trigger('click')

    
    const members = confirmMembers(wrapper)
    expect(members?.map((member) => member.enabled)).toEqual([true, true])
    
    expect(preview.text()).not.toContain('启用')
  })

  it('奖品名单：列对应是编号 / 名称 / 数量 / 权重 / 标签', async () => {
    const { wrapper, api } = mountDrawer('prizes')
    await load(api, 'id,name,count,weight,tags\nP01,一等奖,1,1,稀有\n', 'prizes.csv')

    
    
    expect(headers(wrapper, '[data-testid="node-detail-roster-import-preview"]')).toEqual([
      '编号',
      '姓名',
      '数量',
      '权重',
      '标签',
    ])
    expect(wrapper.find('[data-testid="node-detail-roster-import-map-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="node-detail-roster-import-map-enabled"]').exists()).toBe(false)
  })

  it('确认时把草稿成员交出去（标签按文件里的来，tags 缺省不补 null）', async () => {
    const { wrapper, api } = mountDrawer()
    await load(api, CSV_WITH_HEADER)

    await wrapper.get('[data-testid="node-detail-roster-import-confirm"]').trigger('click')

    const members = confirmMembers(wrapper)
    expect(members).toHaveLength(2)
    expect(members?.[0]).toEqual({
      id: '01',
      name: '张三',
      gender: '男',
      group: 'A',
      count: null,
      weight: null,
      enabled: true,
      tags: ['班长'],
    })
    
    expect(members?.[1]?.enabled).toBe(true)
  })

  it('没有表头时按固定列序读（自动认出的列对应里不会混进「启用」）', async () => {
    const { wrapper, api } = mountDrawer()
    await load(api, '01,张三,男,A,1\n02,李四,女,B,0\n')

    await wrapper.get('[data-testid="node-detail-roster-import-no-header"]').setValue(true)
    await flushPromises()
    await wrapper.get('[data-testid="node-detail-roster-import-confirm"]').trigger('click')

    const members = confirmMembers(wrapper)
    
    
    expect(members?.[0]).toMatchObject({
      id: '01',
      name: '张三',
      gender: '男',
      group: 'A',
      enabled: true,
    })
    expect(members?.[1]?.enabled).toBe(true)
  })

  it('认不出任何列时说清"手动指定列对应"，并且不给确认', async () => {
    const { wrapper, api } = mountDrawer()
    await load(api, CSV_WITH_HEADER)

    for (const column of ['id', 'name', 'gender', 'group', 'tags']) {
      
      const trigger = mappingSelect(wrapper, column)
      await openSelect(trigger)
      const listId = trigger.attributes('aria-controls')
      const popup = listId === undefined ? null : document.getElementById(listId)
      const unmapped = [...(popup?.querySelectorAll('.cn-combo-popup__item') ?? [])].find(
        (node) => node.textContent?.trim() === '未对应',
      )
      ;(unmapped as HTMLElement | undefined)?.click()
      await flushPromises()
    }

    expect(wrapper.get('[data-testid="node-detail-roster-import-problems"]').text()).toContain(
      '没有认出任何一列',
    )
    expect(
      wrapper.get('[data-testid="node-detail-roster-import-confirm"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('读不了的文件说"读不了"，而不是编出一份空名单', async () => {
    const { wrapper, api } = mountDrawer()
    await load(api, '{"a":1}', 'roster.json')

    expect(wrapper.get('[data-testid="node-detail-roster-import-unreadable"]').text()).toContain(
      '读不出内容',
    )
    expect(wrapper.find('[data-testid="node-detail-roster-import-preview"]').exists()).toBe(false)
  })

  it('Esc 关闭（抽屉里的焦点可能在某个下拉上，所以监听挂在 document 上）', async () => {
    const { wrapper } = mountDrawer()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('点关闭按钮也关', async () => {
    const { wrapper } = mountDrawer()

    await wrapper.get('[data-testid="node-detail-roster-import-close"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
