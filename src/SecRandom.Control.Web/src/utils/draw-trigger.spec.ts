import { describe, expect, it } from 'vitest'
import {
  genderOptions,
  groupOptions,
  isDrawCandidate,
  precheckDraw,
  precheckNotice,
} from './draw-trigger'
import type { NodeRosterListDto, NodeRosterMemberDto } from '@/api/protocol'









function member(overrides: Partial<NodeRosterMemberDto> = {}): NodeRosterMemberDto {
  return {
    id: '01',
    name: '张三',
    gender: '男',
    group: '第一组',
    count: null,
    weight: null,
    enabled: true,
    ...overrides,
  }
}

function list(members: NodeRosterMemberDto[], overrides: Partial<NodeRosterListDto> = {}): NodeRosterListDto {
  return {
    name: '大名单',
    is_default: true,
    count: members.length,
    total: members.length,
    truncated: false,
    members,
    ...overrides,
  }
}

describe('isDrawCandidate', () => {
  it('启用且学号或姓名非空才算候选（与设备侧 Student.IsCandidate 同一条规则）', () => {
    expect(isDrawCandidate(member())).toBe(true)
    expect(isDrawCandidate(member({ id: null }))).toBe(true)
    expect(isDrawCandidate(member({ name: null }))).toBe(true)
    
    expect(isDrawCandidate(member({ enabled: false }))).toBe(false)
    
    expect(isDrawCandidate(member({ id: '  ', name: '' }))).toBe(false)
  })
})

describe('genderOptions / groupOptions', () => {
  it('取值从成员派生：去重、稳定排序、空值不出现', () => {
    const members = [
      member({ gender: '女', group: '第二组' }),
      member({ gender: '男', group: '第一组' }),
      member({ gender: '', group: null }),
    ]

    
    
    expect(genderOptions(members)).toEqual(['男', '女'].sort((a, b) => a.localeCompare(b)))
    expect(groupOptions(members)).toEqual(['第一组', '第二组'].sort((a, b) => a.localeCompare(b)))
  })

  it('名单里一个取值都没有时给空清单（界面据此只有"不限"）', () => {
    expect(genderOptions([])).toEqual([])
    expect(groupOptions([member({ group: null })])).toEqual([])
  })
})

describe('precheckDraw', () => {
  it('没读到名单时不预检：candidates 为 null，而不是 0', () => {
    const result = precheckDraw({ list: null, gender: '', group: '', count: 1 })

    expect(result.ok).toBe(true)
    if (result.ok) {
      
      expect(result.candidates).toBeNull()
    }
  })

  it('不限条件时给出全部候选人数', () => {
    const result = precheckDraw({
      list: list([member(), member({ id: '02' }), member({ id: '03', enabled: false })]),
      gender: '',
      group: '',
      count: 2,
    })

    expect(result).toEqual({ ok: true, candidates: 2, incomplete: false })
  })

  it('条件取值不在名单里：说清是哪个取值', () => {
    const result = precheckDraw({ list: list([member()]), gender: '未知', group: '', count: 1 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.key).toBe('nodeDetail.draw.localCheckGender')
      expect(result.params).toEqual({ value: '未知' })
    }
  })

  it('分组同样按名单里的真实取值判', () => {
    const result = precheckDraw({ list: list([member()]), gender: '', group: '第九组', count: 1 })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.key).toBe('nodeDetail.draw.localCheckGroup')
  })

  it('条件合法但筛完没人（都停用了）→ 说"没有可抽取的人"', () => {
    const result = precheckDraw({
      list: list([member({ enabled: false }), member({ id: '02', group: '第一组', enabled: false })]),
      gender: '男',
      group: '',
      count: 1,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.key).toBe('nodeDetail.draw.localCheckNoCandidate')
  })

  it('人数超过符合条件的人数 → 说出允许的区间', () => {
    const result = precheckDraw({ list: list([member(), member({ id: '02' })]), gender: '', group: '', count: 5 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.key).toBe('nodeDetail.draw.localCheckCount')
      
      expect(result.params).toEqual({ min: 1, max: 2 })
    }
  })

  it('快抽（count 传 null）不判人数：快抽固定 1 个', () => {
    expect(precheckDraw({ list: list([member()]), gender: '', group: '', count: null })).toEqual({
      ok: true,
      candidates: 1,
      incomplete: false,
    })
  })

  it('名单被截断时结论带上 incomplete（预检只看到了回传的那一部分）', () => {
    const result = precheckDraw({
      list: list([member()], { truncated: true, count: 1, total: 500 }),
      gender: '',
      group: '',
      count: 1,
    })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.incomplete).toBe(true)
  })
})

describe('precheckNotice', () => {
  it('没截断就不提示', () => {
    const roster = list([member()])
    expect(precheckNotice(precheckDraw({ list: roster, gender: '', group: '', count: 1 }), roster)).toBeNull()
  })

  it('截断且预检通过：把"读到几条 / 共几条"说清楚', () => {
    const roster = list([member()], { truncated: true, count: 1, total: 500 })
    const notice = precheckNotice(precheckDraw({ list: roster, gender: '', group: '', count: 1 }), roster)

    expect(notice).toEqual({
      key: 'nodeDetail.draw.localCheckIncomplete',
      params: { count: 1, total: 500 },
    })
  })

  it('截断但预检已经失败：不再叠一句截断说明（更重要的话只有一句）', () => {
    const roster = list([member()], { truncated: true, count: 1, total: 500 })
    const result = precheckDraw({ list: roster, gender: '未知', group: '', count: 1 })

    expect(precheckNotice(result, roster)).toBeNull()
  })

  it('没读到名单时不提截断', () => {
    expect(precheckNotice(precheckDraw({ list: null, gender: '', group: '', count: 1 }), null)).toBeNull()
  })
})
