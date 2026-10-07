import { describe, expect, it } from 'vitest'
import {
  describeDrawFailure,
  drawDeniedReasonKey,
  formatDrawnMembers,
  parseDrawReceipt,
} from './draw-receipt'








describe('parseDrawReceipt', () => {
  it('成功回执：把抽到谁、名单、实际人数一起读出来', () => {
    const receipt = parseDrawReceipt({
      target: 'roll_call',
      list_name: '大名单',
      count: 2,
      drawn: [
        { id: '07', name: '张三' },
        { id: '08', name: '李四' },
      ],
    })

    expect(receipt.recognized).toBe(true)
    expect(receipt.target).toBe('roll_call')
    expect(receipt.listName).toBe('大名单')
    expect(receipt.count).toBe(2)
    expect(receipt.drawn).toEqual([
      { id: '07', name: '张三' },
      { id: '08', name: '李四' },
    ])
  })

  it('缺字段的记录被跳过，而不是渲染一条空白的"抽到了"', () => {
    const receipt = parseDrawReceipt({ drawn: [{ id: '07' }, {}, { name: '李四' }, null, 'x'] })

    expect(receipt.drawn).toEqual([{ id: '07', name: null }, { id: null, name: '李四' }])
  })

  it('不是抽取的上下文：recognized 为 false，调用方不该凭空画一个结果框', () => {
    expect(parseDrawReceipt({ voice_enable: false }).recognized).toBe(false)
    expect(parseDrawReceipt({ writable_paths: ['voice.volume'] }).recognized).toBe(false)
    expect(parseDrawReceipt(null).recognized).toBe(false)
  })

  it('拒绝回执：细因与 invalid_value 的两个字段都读出来', () => {
    const denied = parseDrawReceipt({ reason: 'no_candidate' })
    expect(denied.recognized).toBe(true)
    expect(denied.deniedReason).toBe('no_candidate')
  })

  it('count 为负数 / 非数字时不认（序列化层面的坏数据不该变成一个"人数"）', () => {
    expect(parseDrawReceipt({ target: 'quick', count: -1 }).count).toBeNull()
    expect(parseDrawReceipt({ target: 'quick', count: '2' }).count).toBeNull()
  })
})

describe('describeDrawFailure', () => {
  it('draw_denied + no_candidate：说"名单里没有可抽取的人"，不是"名单不存在"', () => {
    const reason = describeDrawFailure('draw_denied', 'draw_denied', { reason: 'no_candidate' })

    expect(reason?.key).toBe('nodeDetail.feedback.drawDeniedNoCandidate')
    expect(reason?.tone).toBe('fail')
  })

  it('draw_denied + blocked_by_class_time：说清是上课时间', () => {
    expect(describeDrawFailure('draw_denied', 'draw_denied', { reason: 'blocked_by_class_time' })?.key).toBe(
      'nodeDetail.feedback.drawDeniedClassTime',
    )
  })

  it('draw_denied + local_verification_required：说清远程不会弹验证框', () => {
    expect(
      describeDrawFailure('draw_denied', 'draw_denied', { reason: 'local_verification_required' })?.key,
    ).toBe('nodeDetail.feedback.drawDeniedNeedsLocal')
  })

  it('draw_denied + 没见过的细因：照原样说出来（绝不吞掉唯一线索）', () => {
    const reason = describeDrawFailure('draw_denied', 'draw_denied', { reason: 'quantum_flux' })

    expect(reason?.key).toBe('nodeDetail.feedback.drawDenied')
    
    expect(reason?.rawParams).toEqual({ reason: 'quantum_flux' })
    expect(reason?.params).toEqual({})
  })

  it('draw_locked / busy：各自说清是控制台锁了、还是设备正忙', () => {
    expect(describeDrawFailure('draw_locked', 'draw_locked', { draw_locked: true })?.key).toBe(
      'nodeDetail.feedback.drawLocked',
    )
    expect(describeDrawFailure('busy', 'busy', {})?.key).toBe('nodeDetail.feedback.drawBusy')
    
    expect(describeDrawFailure('busy', 'busy', { drawing: true })?.key).toBe(
      'nodeDetail.feedback.drawDrawing',
    )
  })

  it('invalid_value:list_name:not_found：说"找不到这份名单"（名字由界面补）', () => {
    const reason = describeDrawFailure('invalid_value', 'invalid_value:list_name:not_found', {
      field: 'list_name',
      why: 'not_found',
    })

    expect(reason?.key).toBe('nodeDetail.feedback.drawListNotFoundNoName')
  })

  it('invalid_value:list_name:no_candidate：与"名单不存在"分开说', () => {
    expect(
      describeDrawFailure('invalid_value', 'invalid_value:list_name:no_candidate', {
        field: 'list_name',
        why: 'no_candidate',
      })?.key,
    ).toBe('nodeDetail.feedback.drawDeniedNoCandidate')
  })

  it('invalid_value:gender:not_in_list：设备不回取值，所以 {value} 留空由界面补', () => {
    const reason = describeDrawFailure('invalid_value', 'invalid_value:gender:not_in_list', {
      field: 'gender',
      why: 'not_in_list',
    })

    expect(reason?.key).toBe('nodeDetail.feedback.localCheckGender')
    expect(reason?.params).toEqual({ value: '' })
  })

  it('invalid_value:group:no_matching_member：条件本身合法，但筛完没人', () => {
    const reason = describeDrawFailure('invalid_value', 'invalid_value:group:no_matching_member', {
      field: 'group',
      why: 'no_matching_member',
    })

    expect(reason?.key).toBe('nodeDetail.feedback.drawNoMatching')
    expect(reason?.params).toEqual({ field: 'group', value: '' })
  })

  it('invalid_value:count:out_of_range:1..3：范围在原因码里，两个数都要说出来', () => {
    const reason = describeDrawFailure('invalid_value', 'invalid_value:count:out_of_range:1..3', {})

    expect(reason?.key).toBe('nodeDetail.feedback.drawCountOutOfRange')
    expect(reason?.params).toEqual({ min: 1, max: 3 })
  })

  it('范围也可能只出现在上下文的 why 里（设备按第一个冒号拆，`why` = `out_of_range:1..3`）', () => {
    
    
    const reason = describeDrawFailure('invalid_value', 'invalid_value', {
      field: 'count',
      why: 'out_of_range:1..3',
    })

    expect(reason?.key).toBe('nodeDetail.feedback.drawCountOutOfRange')
    expect(reason?.params).toEqual({ min: 1, max: 3 })
  })

  it('out_of_range 但没带范围：不编一个上限出来', () => {
    const reason = describeDrawFailure('invalid_value', 'invalid_value:count:out_of_range', {})

    expect(reason?.key).toBe('nodeDetail.feedback.localCheckCount')
    
    expect(reason?.params).toEqual({ available: '' })
  })

  it('设置那条路的 invalid_value 交回给原有逻辑（不许说成抽取的问题）', () => {
    expect(
      describeDrawFailure('invalid_value', 'invalid_value', { path: 'voice.volume', value: 300 }),
    ).toBeNull()
    expect(describeDrawFailure('invalid_value', 'invalid_value:foo:not_in_list', {})).toBeNull()
  })

  it('与抽取无关的原因码一律返回 null', () => {
    expect(describeDrawFailure('media_disabled', 'media_disabled', { voice_enable: false })).toBeNull()
    expect(describeDrawFailure('not_writable', 'not_writable', { path: 'x' })).toBeNull()
    expect(describeDrawFailure('', '', {})).toBeNull()
  })
})

describe('drawDeniedReasonKey', () => {
  it('能翻的翻成 key，翻不了的返回 null（调用方原样显示码）', () => {
    expect(drawDeniedReasonKey('draw_locked')).toBe('nodeDetail.feedback.drawLocked')
    expect(drawDeniedReasonKey('busy')).toBe('nodeDetail.feedback.drawBusy')
    expect(drawDeniedReasonKey('no_candidate')).toBe('nodeDetail.feedback.drawDeniedNoCandidate')
    expect(drawDeniedReasonKey('some_future_cause')).toBeNull()
  })
})

describe('formatDrawnMembers', () => {
  it('学号与姓名都在时两个都显示', () => {
    expect(formatDrawnMembers([{ id: '07', name: '张三' }])).toBe('07 张三')
  })

  it('只有一个时只显示那一个（名单允许只有姓名或只有学号）', () => {
    expect(formatDrawnMembers([{ id: '07', name: null }])).toBe('07')
    expect(formatDrawnMembers([{ id: null, name: '李四' }])).toBe('李四')
  })

  it('多个人用 ` · ` 连接，不用逗号（姓名自己可能带顿号）', () => {
    expect(
      formatDrawnMembers([
        { id: '07', name: '张三、李四' },
        { id: '08', name: '王五' },
      ]),
    ).toBe('07 张三、李四 · 08 王五')
  })

  it('全是空白的一条被丢掉，不渲染成一个空项', () => {
    expect(formatDrawnMembers([{ id: '  ', name: '' }, { id: '07', name: '张三' }])).toBe('07 张三')
    expect(formatDrawnMembers([])).toBe('')
  })
})
