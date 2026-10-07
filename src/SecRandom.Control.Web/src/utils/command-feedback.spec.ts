import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAX_TEXT_LENGTH,
  buildRosterPush,
  buildSettingsPatch,
  describeCommandFeedback,
  localizedDescription,
  localizedLabel,
  localizedText,
  parseRosterImport,
  parseRosterSnapshot,
  parseSettingsSnapshot,
  rosterDraftOf,
  settingsDraftsOf,
  settingDraftValue,
  splitTags,
  toPrizeInputs,
  toStudentInputs,
} from './command-feedback'
import type { NodeRosterMemberDto, NodeSettingFieldDto } from '@/api/protocol'








describe('describeCommandFeedback', () => {
  it('没有原因也没有上下文时什么都不说（不凭空造一句"设备返回"）', () => {
    expect(describeCommandFeedback(null)).toBeNull()
    expect(describeCommandFeedback(undefined)).toBeNull()
    expect(describeCommandFeedback({ status: 'completed' })).toBeNull()
    expect(describeCommandFeedback({ status: 'completed', result_detail: '' })).toBeNull()
    
    expect(describeCommandFeedback({ status: 'completed', result_context: {} })).toBeNull()
  })

  




  it('revoked 是控制平面的簿记，不是设备回执：不渲染"设备返回"', () => {
    expect(describeCommandFeedback({ status: 'revoked', result_detail: 'revoked' })).toBeNull()
  })

  it('media_disabled：说清"关了语音总开关"，并给出一键修复', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'media_disabled',
      result_context: { voice_enable: false },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.mediaDisabled')
    expect(view?.fix).toEqual({ kind: 'voice_enable' })
    expect(view?.tone).toBe('fail')
    expect(view?.unknown).toBe(false)
    
    expect(view?.rawContext).toBeNull()
  })

  it('已知原因码也保留多出来的上下文字段（认不出来就绝不藏）', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'media_disabled',
      result_context: { voice_enable: false, engine: 'edge-tts' },
    })

    expect(view?.rawContext).toContain('engine')
    expect(view?.rawContext).toContain('edge-tts')
    expect(view?.rawContext).not.toContain('voice_enable')
  })

  it('text_too_long：给出设备自己的长度上限', () => {
    const withLimit = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'text_too_long',
      result_context: { max_text_length: 60 },
    })
    expect(withLimit?.messageKey).toBe('nodeDetail.feedback.textTooLong')
    expect(withLimit?.params).toEqual({ max: 60 })

    
    const withoutLimit = describeCommandFeedback({ status: 'rejected', result_detail: 'text_too_long' })
    expect(withoutLimit?.messageKey).toBe('nodeDetail.feedback.textTooLongUnknown')
    expect(withoutLimit?.params).toEqual({})
    expect(DEFAULT_MAX_TEXT_LENGTH).toBe(200)
  })

  it('capability_unsupported：说清被拒的能力与设备支持的能力', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      capability: 'media.play',
      result_detail: 'capability_unsupported',
      result_context: { capability: 'settings.write', supported: ['node.status.read', 'draw.lock'] },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.capabilityUnsupported')
    expect(view?.params).toEqual({ capability: 'settings.write' })
    expect(view?.supportedCapabilities).toEqual(['node.status.read', 'draw.lock'])
  })

  it('capability_unsupported 缺少 capability 时回落到这条命令自己的能力', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      capability: 'media.play',
      result_detail: 'capability_unsupported',
      result_context: { supported: [] },
    })

    expect(view?.capability).toBe('media.play')
    expect(view?.params).toEqual({ capability: 'media.play' })
  })

  it('local_remote_disabled：说清是设备自己关的，控制台改不了', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'local_remote_disabled',
      result_context: { remote_control_enabled: false },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.localRemoteDisabled')
    expect(view?.tone).toBe('fail')
    expect(view?.rawContext).toBeNull()
  })

  it('rate_limited：给出窗口与上限，缺一半也照说', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'rate_limited',
      result_context: { max_commands: 5, window_seconds: 60 },
    })
    expect(view?.messageKey).toBe('nodeDetail.feedback.rateLimited')
    expect(view?.params).toEqual({ max: 5, window: 60 })
    
    expect(view?.tone).toBe('warn')

    const withoutContext = describeCommandFeedback({ status: 'rejected', result_detail: 'rate_limited' })
    expect(withoutContext?.messageKey).toBe('nodeDetail.feedback.rateLimitedUnknown')
  })

  it('not_writable：兼容老服务端的 `not_writable:<path>`', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'not_writable:security.password',
    })

    expect(view?.messageKey).toBe('nodeDetail.reasonNotWritable')
    expect(view?.params).toEqual({ path: 'security.password' })
    expect(view?.writablePaths).toEqual([])
  })

  it('not_writable：列出设备允许远程写的路径', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'not_writable',
      result_context: {
        path: 'security.password',
        writable_paths: ['voice.volume', 'voice.enable'],
      },
    })

    expect(view?.params).toEqual({ path: 'security.password' })
    expect(view?.writablePaths).toEqual(['voice.volume', 'voice.enable'])
    expect(view?.lines).toContainEqual({
      key: 'nodeDetail.feedback.writablePaths',
      params: { paths: 'voice.volume, voice.enable' },
    })
  })

  it('invalid_value：给出出问题的路径与设备给的细节', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'invalid_value',
      result_context: { path: 'voice.volume', value: 300 },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.invalidValue')
    expect(view?.params).toEqual({ path: 'voice.volume' })
    expect(view?.lines).toContainEqual({
      key: 'nodeDetail.feedback.invalidValueDetail',
      params: { detail: '300' },
    })
  })

  it('busy：设备正在抽取', () => {
    const view = describeCommandFeedback({ status: 'rejected', result_detail: 'busy' })
    expect(view?.messageKey).toBe('nodeDetail.feedback.drawBusy')
    expect(view?.tone).toBe('warn')
  })

  it('busy + drawing：说清是"正在抽，不能中途改设置"', () => {
    
    
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'busy',
      result_context: { drawing: true },
    })
    expect(view?.messageKey).toBe('nodeDetail.feedback.drawDrawing')
    expect(view?.tone).toBe('warn')
    
    expect(view?.rawContext).toBeNull()
  })

  it('draw_denied + no_candidate：把"名单里没人"说清楚，不再说"不认识这个原因码"', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'draw_denied',
      result_context: { reason: 'no_candidate' },
    })

    expect(view?.unknown).toBe(false)
    expect(view?.messageKey).toBe('nodeDetail.feedback.drawDeniedNoCandidate')
    expect(view?.tone).toBe('fail')
    
    expect(view?.rawContext).toBeNull()
  })

  it('draw_denied + 没见过的细因：码本身进 rawParams（不吞线索，也不显示成英文码）', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'draw_denied',
      result_context: { reason: 'future_cause' },
    })

    expect(view?.unknown).toBe(false)
    expect(view?.messageKey).toBe('nodeDetail.feedback.drawDenied')
    expect(view?.rawParams).toEqual({ reason: 'future_cause' })
    expect(view?.params).toEqual({})
  })

  it('draw_locked：控制台把抽取锁了，先说清楚怎么解除', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'draw_locked',
      result_context: { draw_locked: true },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.drawLocked')
    expect(view?.rawContext).toBeNull()
  })

  it('invalid_value:count:out_of_range:1..3：说出设备给的允许区间', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'invalid_value:count:out_of_range:1..3',
      result_context: { field: 'count', why: 'out_of_range' },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.drawCountOutOfRange')
    expect(view?.params).toEqual({ min: 1, max: 3 })
  })

  it('bare invalid_value + 上下文里的 field/why：不让空的原因码把上下文的线索顶掉', () => {
    
    
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'invalid_value',
      result_context: { field: 'count', why: 'out_of_range:1..3' },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.drawCountOutOfRange')
    expect(view?.params).toEqual({ min: 1, max: 3 })
  })

  it('设置那条路的 invalid_value 不受抽取那条路影响', () => {
    
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'invalid_value',
      result_context: { path: 'voice.volume', value: 300 },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.invalidValue')
  })

  it('unsupported_action：把被拒的动作名说出来', () => {
    const view = describeCommandFeedback({ status: 'rejected', result_detail: 'unsupported_action:show' })
    expect(view?.messageKey).toBe('nodeDetail.reasonUnsupportedAction')
    expect(view?.lines).toContainEqual({
      key: 'nodeDetail.feedback.unsupportedActionName',
      params: { action: 'show' },
    })
  })

  it('expired / invalid_command：协议里的另外两个原因', () => {
    expect(describeCommandFeedback({ status: 'rejected', result_detail: 'expired' })?.messageKey).toBe(
      'nodeDetail.feedback.expired',
    )
    expect(
      describeCommandFeedback({ status: 'rejected', result_detail: 'invalid_command' })?.messageKey,
    ).toBe('nodeDetail.feedback.invalidCommand')
  })

  it('invalid_command + unsupported_field：说清是"本机没实现这个选项"', () => {
    
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'invalid_command',
      result_context: { unsupported_field: 'system_volume_percent' },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.unsupportedField')
    expect(view?.params).toEqual({ field: 'system_volume_percent' })
    expect(view?.rawContext).toBeNull()
  })

  it('invalid_command + field：说清是哪个字段不合法', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'invalid_command',
      result_context: { field: 'count' },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.invalidCommandField')
    expect(view?.params).toEqual({ field: 'count' })
    expect(view?.rawContext).toBeNull()
  })

  it('不认识的原因码：保留码本身，并把整份上下文原样给出', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_detail: 'quantum_flux',
      result_context: { flux: 42, unit: 'q' },
    })

    expect(view?.unknown).toBe(true)
    expect(view?.messageKey).toBe('nodeDetail.feedback.unknown')
    expect(view?.params).toEqual({ code: 'quantum_flux' })
    expect(view?.rawContext).toContain('flux')
    expect(view?.rawContext).toContain('42')
  })

  it('只有上下文、没有原因码：如实说设备给了结构化结果', () => {
    const view = describeCommandFeedback({
      status: 'rejected',
      result_context: { reason_hint: 'nope' },
    })

    expect(view?.messageKey).toBe('nodeDetail.feedback.contextOnly')
    expect(view?.unknown).toBe(true)
    expect(view?.rawContext).toContain('reason_hint')
  })

  it('已经完成的命令带着上下文时不给红色（那不是失败）', () => {
    const view = describeCommandFeedback({
      status: 'completed',
      result_context: { applied: ['voice.volume'] },
    })

    expect(view?.tone).toBe('ok')
    expect(view?.rawContext).toContain('applied')
  })
})





const SETTINGS_PAYLOAD = {
  categories: [
    {
      id: 'voice',
      fields: [
        { path: 'voice.enable', category: 'voice', type: 'bool', value: true, writable: true },
        {
          path: 'voice.volume',
          category: 'voice',
          type: 'int',
          value: 80,
          writable: true,
          min: 0,
          max: 100,
        },
        {
          path: 'voice.engine',
          category: 'voice',
          type: 'enum',
          value: 'Edge',
          writable: true,
          options: ['System', 'Edge'],
        },
        {
          path: 'voice.speech_rate',
          category: 'voice',
          type: 'int',
          value: 150,
          writable: false,
          min: 50,
          max: 200,
        },
      ],
    },
  ],
}

describe('parseSettingsSnapshot', () => {
  
  it('没有结果载荷 / 形状不对时返回 null', () => {
    expect(parseSettingsSnapshot(undefined)).toBeNull()
    expect(parseSettingsSnapshot(null)).toBeNull()
    expect(parseSettingsSnapshot('categories')).toBeNull()
    expect(parseSettingsSnapshot([])).toBeNull()
    expect(parseSettingsSnapshot({})).toBeNull()
    expect(parseSettingsSnapshot({ categories: 'voice' })).toBeNull()
  })

  it('解析分类与字段（含范围与枚举成员名）', () => {
    const categories = parseSettingsSnapshot(SETTINGS_PAYLOAD)

    expect(categories).toHaveLength(1)
    expect(categories?.[0]?.id).toBe('voice')
    expect(categories?.[0]?.fields.map((field) => field.path)).toEqual([
      'voice.enable',
      'voice.volume',
      'voice.engine',
      'voice.speech_rate',
    ])
    expect(categories?.[0]?.fields[2]?.options).toEqual(['System', 'Edge'])
    expect(categories?.[0]?.fields[1]?.min).toBe(0)
    expect(categories?.[0]?.fields[1]?.max).toBe(100)
  })

  it('缺 writable 时按不可写处理，缺 path / type 的字段被跳过', () => {
    const categories = parseSettingsSnapshot({
      categories: [
        {
          id: 'voice',
          fields: [
            { path: 'voice.enable', type: 'bool', value: true },
            { path: '', type: 'bool', value: true },
            { path: 'voice.volume', value: 1 },
          ],
        },
        { id: 'empty', fields: [{ path: '', type: '' }] },
      ],
    })

    expect(categories).toHaveLength(1)
    expect(categories?.[0]?.fields).toHaveLength(1)
    expect(categories?.[0]?.fields[0]?.writable).toBe(false)
  })

  it('不认识的类型原样保留（新类型不该让整次读取作废）', () => {
    const categories = parseSettingsSnapshot({
      categories: [
        {
          id: 'voice',
          fields: [{ path: 'voice.color', type: 'color', value: '#fff', writable: true }],
        },
      ],
    })

    expect(categories?.[0]?.fields[0]?.type).toBe('color')
  })
})

const VOLUME_FIELD: NodeSettingFieldDto = {
  path: 'voice.volume',
  category: 'voice',
  type: 'int',
  value: 80,
  writable: true,
  min: 0,
  max: 100,
  options: null,
}

describe('settingsDraftsOf / settingDraftValue', () => {
  it('把设备值铺成表单草稿', () => {
    const categories = parseSettingsSnapshot(SETTINGS_PAYLOAD) ?? []
    const drafts = settingsDraftsOf(categories)

    expect(drafts).toEqual({
      'voice.enable': true,
      'voice.volume': 80,
      'voice.engine': 'Edge',
      'voice.speech_rate': 150,
    })
  })

  it('null 值给空串，数字原样', () => {
    expect(settingDraftValue({ ...VOLUME_FIELD, value: null })).toBe(0)
    expect(settingDraftValue({ ...VOLUME_FIELD, type: 'string', value: null })).toBe('')
    expect(settingDraftValue({ ...VOLUME_FIELD, value: 42 })).toBe(42)
    expect(settingDraftValue({ ...VOLUME_FIELD, type: 'bool', value: true })).toBe(true)
  })
})

describe('buildSettingsPatch', () => {
  it('只送改过且可写的字段', () => {
    const plan = buildSettingsPatch(
      [
        VOLUME_FIELD,
        { ...VOLUME_FIELD, path: 'voice.speech_rate', value: 150, writable: false },
        { ...VOLUME_FIELD, path: 'voice.enable', type: 'bool', value: true },
      ],
      { 'voice.volume': 60, 'voice.speech_rate': 120, 'voice.enable': true },
    )

    expect(plan.patch).toEqual({ 'voice.volume': 60 })
    expect(plan.problems).toEqual([])
    
    expect(plan.changed).toBe(1)
    expect(plan.skipped).toBe(1)
  })

  it('没改动就是空 patch（不假装下发成功）', () => {
    const plan = buildSettingsPatch([VOLUME_FIELD], { 'voice.volume': 80 })
    expect(plan.patch).toEqual({})
    expect(plan.changed).toBe(0)
  })

  it('越界 / 非数字 / 非枚举成员都在本地就被拦下', () => {
    const outOfRange = buildSettingsPatch([VOLUME_FIELD], { 'voice.volume': 999 })
    expect(outOfRange.patch).toEqual({})
    expect(outOfRange.problems).toEqual([
      { path: 'voice.volume', kind: 'range', min: 0, max: 100, options: [] },
    ])

    const notNumber = buildSettingsPatch([VOLUME_FIELD], { 'voice.volume': '' })
    expect(notNumber.problems[0]?.kind).toBe('notNumber')

    const notInteger = buildSettingsPatch([VOLUME_FIELD], { 'voice.volume': 1.5 })
    expect(notInteger.problems[0]?.kind).toBe('notNumber')

    const enumField: NodeSettingFieldDto = {
      path: 'voice.engine',
      category: 'voice',
      type: 'enum',
      value: 'Edge',
      writable: true,
      options: ['System', 'Edge'],
    }
    const notOption = buildSettingsPatch([enumField], { 'voice.engine': 'Google' })
    expect(notOption.problems[0]?.kind).toBe('notOption')
    expect(notOption.problems[0]?.options).toEqual(['System', 'Edge'])
  })

  it('double 允许小数，bool / string 原样送', () => {
    const plan = buildSettingsPatch(
      [
        { ...VOLUME_FIELD, path: 'voice.rate', type: 'double', value: 1, min: 0.5, max: 2 },
        { ...VOLUME_FIELD, path: 'voice.name', type: 'string', value: 'a' },
        { ...VOLUME_FIELD, path: 'voice.enable', type: 'bool', value: false },
      ],
      { 'voice.rate': 1.25, 'voice.name': 'b', 'voice.enable': true },
    )

    expect(plan.patch).toEqual({ 'voice.rate': 1.25, 'voice.name': 'b', 'voice.enable': true })
  })

  it('不认识的类型按字符串送（设备要么接受，要么退回原因）', () => {
    const plan = buildSettingsPatch(
      [{ ...VOLUME_FIELD, path: 'voice.color', type: 'color', value: '#000', min: null, max: null }],
      { 'voice.color': '#fff' },
    )
    expect(plan.patch).toEqual({ 'voice.color': '#fff' })
  })
})

const ROSTER_PAYLOAD = {
  roster_kind: 'students',
  lists: [
    {
      name: '高一（1）班',
      is_default: true,
      count: 2,
      total: 2,
      truncated: false,
      members: [
        { id: '01', name: '张三', gender: '男', group: 'A', count: null, weight: null, enabled: true },
        { id: null, name: '李四', gender: null, group: null, count: null, weight: null, enabled: false },
      ],
    },
    {
      name: '大名单',
      is_default: false,
      count: 2,
      total: 500,
      truncated: true,
      members: [],
    },
  ],
}

describe('parseRosterSnapshot', () => {
  it('没有结果载荷 / 形状不对时返回 null', () => {
    expect(parseRosterSnapshot(undefined)).toBeNull()
    expect(parseRosterSnapshot(null)).toBeNull()
    expect(parseRosterSnapshot({})).toBeNull()
    expect(parseRosterSnapshot({ lists: {} })).toBeNull()
  })

  it('解析名单、成员与截断标记', () => {
    const snapshot = parseRosterSnapshot(ROSTER_PAYLOAD)

    expect(snapshot?.roster_kind).toBe('students')
    expect(snapshot?.lists).toHaveLength(2)
    expect(snapshot?.lists[0]?.is_default).toBe(true)
    expect(snapshot?.lists[0]?.members).toHaveLength(2)
    
    expect(snapshot?.lists[0]?.members[1]?.id).toBeNull()
    expect(snapshot?.lists[0]?.members[1]?.enabled).toBe(false)
    expect(snapshot?.lists[1]?.truncated).toBe(true)
  })

  it('count < total 也算截断（设备漏标时不能骗自己）', () => {
    const snapshot = parseRosterSnapshot({
      roster_kind: 'prizes',
      lists: [{ name: '奖池', is_default: false, count: 3, total: 9, members: [] }],
    })

    expect(snapshot?.lists[0]?.truncated).toBe(true)
  })

  it('缺少 members 的名单不炸，缺 enabled 的成员按启用处理', () => {
    const snapshot = parseRosterSnapshot({
      roster_kind: 'students',
      lists: [{ name: '名单', is_default: false, count: 1, total: 1, members: [{ name: '张三' }] }],
    })

    expect(snapshot?.lists[0]?.members[0]).toEqual({
      id: null,
      name: '张三',
      gender: null,
      group: null,
      count: null,
      weight: null,
      enabled: true,
    })
  })
})

describe('名单载荷与导入', () => {
  const members = [
    { id: '01', name: '张三', gender: '男', group: 'A', count: null, weight: null, enabled: true },
    { id: null, name: '李四', gender: '', group: null, count: 3, weight: 1.5, enabled: false },
  ]

  it('学生载荷走 students，空字符串不送', () => {
    expect(toStudentInputs(members)).toEqual([
      { id: '01', name: '张三', gender: '男', group: 'A', enabled: true },
      { name: '李四', enabled: false },
    ])
  })

  it('奖品载荷走 count / weight', () => {
    expect(toPrizeInputs(members)).toEqual([
      { id: '01', name: '张三', enabled: true },
      { name: '李四', count: 3, weight: 1.5, enabled: false },
    ])
  })

  
  it('buildRosterPush 按 kind 给出 students 或 roster_kind + prizes', () => {
    expect(buildRosterPush('students', '高一（1）班', 'merge', false, members)).toEqual({
      list_name: '高一（1）班',
      mode: 'merge',
      activate: false,
      students: toStudentInputs(members),
    })

    expect(buildRosterPush('prizes', '奖池', 'replace', true, members)).toEqual({
      list_name: '奖池',
      mode: 'replace',
      activate: true,
      roster_kind: 'prizes',
      prizes: toPrizeInputs(members),
    })
  })

  it('草稿是深拷：编辑草稿不该改到快照本身', () => {
    const list = parseRosterSnapshot(ROSTER_PAYLOAD)?.lists[0]
    expect(list).toBeDefined()
    const draft = rosterDraftOf(list!)
    draft[0]!.name = '改过了'
    expect(list?.members[0]?.name).toBe('张三')
  })

  it('JSON 导入：数组、缺字段、非数组', () => {
    expect(parseRosterImport('[{"id":"01","name":"张三","enabled":false}]', 'students')).toEqual([
      { id: '01', name: '张三', gender: null, group: null, count: null, weight: null, enabled: false },
    ])
    
    expect(parseRosterImport('[{"id":"","name":""},{"name":"李四"}]', 'students')).toHaveLength(1)
    expect(parseRosterImport('{"name":"张三"}', 'students')).toBeNull()
    expect(parseRosterImport('[{"name":}]', 'students')).toBeNull()
    expect(parseRosterImport('', 'students')).toBeNull()
  })

  it('CSV 导入：带表头（乱序 + 引号包裹）与不带表头', () => {
    const withHeader = parseRosterImport(
      'name,id,group,enabled\n"张,三",01,A,1\n李四,02,B,否\n',
      'students',
    )
    expect(withHeader).toEqual([
      { id: '01', name: '张,三', gender: null, group: 'A', count: null, weight: null, enabled: true },
      { id: '02', name: '李四', gender: null, group: 'B', count: null, weight: null, enabled: false },
    ])

    
    const withoutHeader = parseRosterImport('01,张三,男,A,1', 'students')
    expect(withoutHeader?.[0]).toEqual({
      id: '01',
      name: '张三',
      gender: '男',
      group: 'A',
      count: null,
      weight: null,
      enabled: true,
    })
  })

  it('CSV 导入奖品：id,name,count,weight,enabled', () => {
    const prizes = parseRosterImport('p1,一等奖,2,1.5,1', 'prizes')
    expect(prizes?.[0]).toEqual({
      id: 'p1',
      name: '一等奖',
      gender: null,
      group: null,
      count: 2,
      weight: 1.5,
      enabled: true,
    })
  })
})

describe('三语文案的回退链', () => {
  it('labels 里有控制台语言就用它，而不是设备语言', () => {
    expect(
      localizedText(
        { label: '语音音量', labels: { 'zh-CN': '语音音量', 'en-US': 'Voice volume' } },
        'en-US',
      ),
    ).toBe('Voice volume')
  })

  it('控制台语言缺项时回落到设备本机语言，而不是随便挑一种', () => {
    
    expect(localizedText({ label: '语音音量', labels: { 'en-US': 'Voice volume' } }, 'ja-JP')).toBe(
      '语音音量',
    )
  })

  it('设备语言也没有时才退到任意一种可用语言', () => {
    expect(localizedText({ label: null, labels: { 'ja-JP': '音量' } }, 'en-US')).toBe('音量')
  })

  it('一个都没有就是 null；标题回落到路径的人类可读化，绝不出现空标题', () => {
    expect(localizedText({ label: '   ', labels: null }, 'zh-CN')).toBeNull()
    expect(localizedText({ label: null, labels: { 'en-US': '   ' } }, 'zh-CN')).toBeNull()
    expect(localizedLabel({ label: null, labels: null }, 'zh-CN', 'voice.volume')).toBe('Voice Volume')
  })

  it('说明允许缺失（大多数设置项没有说明），缺失就是 null', () => {
    expect(localizedDescription({ descriptions: { 'en-US': 'Set the volume' } }, 'en-US')).toBe(
      'Set the volume',
    )
    expect(localizedDescription({ description: '设置播报音量' }, 'en-US')).toBe('设置播报音量')
    expect(localizedDescription({ description: null, descriptions: {} }, 'en-US')).toBeNull()
  })
})

describe('settings.read 的三语文案解析', () => {
  it('labels / descriptions 会被解析；空串被丢掉（空串会挡住回退）', () => {
    const categories = parseSettingsSnapshot({
      categories: [
        {
          id: 'voice',
          label: '语音',
          labels: { 'zh-CN': '语音', 'en-US': '   ', 'ja-JP': '音声' },
          descriptions: { 'zh-CN': '' },
          fields: [
            {
              path: 'voice.volume',
              type: 'int',
              value: 60,
              writable: true,
              label: '语音音量',
              labels: { 'zh-CN': '语音音量', 'en-US': 'Voice volume' },
            },
          ],
        },
      ],
    })

    expect(categories?.[0]?.labels).toEqual({ 'zh-CN': '语音', 'ja-JP': '音声' })
    expect(categories?.[0]?.descriptions).toBeUndefined()
    expect(categories?.[0]?.fields[0]?.labels).toEqual({
      'zh-CN': '语音音量',
      'en-US': 'Voice volume',
    })
    expect(categories?.[0]?.fields[0]?.descriptions).toBeUndefined()
  })

  it('旧客户端没有这两个字段时，不凭空造一个空映射，老字段照旧可用', () => {
    const categories = parseSettingsSnapshot({
      categories: [
        {
          id: 'voice',
          label: '语音',
          fields: [
            { path: 'voice.volume', type: 'int', value: 1, writable: true, label: '音量' },
          ],
        },
      ],
    })

    expect(categories?.[0]?.labels).toBeUndefined()
    expect(categories?.[0]?.fields[0]?.labels).toBeUndefined()
    expect(categories?.[0]?.fields[0]?.label).toBe('音量')
  })
})

describe('名单标签的三态', () => {
  const memberWith = (extra: Record<string, unknown>): NodeRosterMemberDto[] => {
    const payload = {
      roster_kind: 'students',
      lists: [{ name: '高一（1）班', members: [{ id: '01', name: '张三', enabled: true, ...extra }] }],
    }
    return parseRosterSnapshot(payload)?.lists[0]?.members ?? []
  }

  



  it('设备没报 tags（字段缺席）→ 解析结果里也没有这个键，回写时省略', () => {
    const members = memberWith({})
    expect(members[0]).not.toHaveProperty('tags')
    expect(toStudentInputs(members)[0]).not.toHaveProperty('tags')
  })

  it('设备明确说没有标签（null / 空数组）→ 解析成 null，同样不下发', () => {
    for (const raw of [null, []]) {
      const members = memberWith({ tags: raw })
      expect(members[0]?.tags).toBeNull()
      expect(toStudentInputs(members)[0]).not.toHaveProperty('tags')
    }
  })

  it('有标签时原样带上，并去掉空项与重复项', () => {
    const members = memberWith({ tags: ['组长', '  ', '组长', '三好学生'] })
    expect(members[0]?.tags).toEqual(['组长', '三好学生'])
    expect(toStudentInputs(members)[0]?.tags).toEqual(['组长', '三好学生'])
    expect(toPrizeInputs(members)[0]?.tags).toEqual(['组长', '三好学生'])
  })

  it('用户把标签清空是**显式**行为：草稿是 []，就必须送 []（与"不下发"区分开）', () => {
    const cleared: NodeRosterMemberDto[] = [
      {
        id: '01',
        name: '张三',
        gender: null,
        group: null,
        count: null,
        weight: null,
        enabled: true,
        tags: [],
      },
    ]

    expect(toStudentInputs(cleared)[0]?.tags).toEqual([])
    expect(buildRosterPush('prizes', '奖池', 'merge', false, cleared)).toMatchObject({
      prizes: [{ id: '01', name: '张三', enabled: true, tags: [] }],
    })
  })

  it('形状不对的 tags 当作"设备没说清"：解析成 null，绝不猜成有标签', () => {
    const members = memberWith({ tags: '组长;三好学生' })
    expect(members[0]?.tags).toBeNull()
  })
})

describe('标签拆分与文件导入', () => {
  it('中英文分隔符都能拆，去空去重', () => {
    expect(splitTags('组长, 三好学生；组长|第1组')).toEqual(['组长', '三好学生', '第1组'])
    expect(splitTags(['a', ' b ', 'a'])).toEqual(['a', 'b'])
    expect(splitTags('   ')).toBeNull()
    expect(splitTags(undefined)).toBeNull()
  })

  it('CSV 有 tags 列 → 拆成数组；没有这一列 → 不写这个键', () => {
    const withTags = parseRosterImport('id,name,tags\n01,张三,"组长,三好学生"', 'students')
    expect(withTags?.[0]?.tags).toEqual(['组长', '三好学生'])

    
    const withoutTags = parseRosterImport('id,name\n01,张三', 'students')
    expect(withoutTags?.[0]).not.toHaveProperty('tags')
  })

  it('JSON 里 tags 是数组或字符串都收；键不存在则不写', () => {
    expect(
      parseRosterImport('[{"id":"01","name":"张三","tags":["组长"]}]', 'students')?.[0]?.tags,
    ).toEqual(['组长'])
    expect(
      parseRosterImport('[{"id":"01","name":"张三","tags":"组长;三好学生"}]', 'students')?.[0]?.tags,
    ).toEqual(['组长', '三好学生'])
    expect(parseRosterImport('[{"id":"01","name":"张三"}]', 'students')?.[0]).not.toHaveProperty(
      'tags',
    )
  })
})
