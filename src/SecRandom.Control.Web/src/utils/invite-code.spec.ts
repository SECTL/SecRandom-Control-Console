import { describe, expect, it } from 'vitest'
import {
  INVITE_CODE_LENGTH,
  INVITE_LIFETIME_HOURS,
  extractInviteCode,
  isInviteCode,
  looksLikeJoinLinkWithoutCode,
  normalizeInviteCode,
} from './invite-code'





describe('extractInviteCode', () => {
  it('纯邀请码原样取出（大写规范化）', () => {
    expect(extractInviteCode('abcd2345')).toBe('ABCD2345')
  })

  it('界面展示用的连字符形式也能取出', () => {
    expect(extractInviteCode('ABCD-2345')).toBe('ABCD2345')
  })

  it('前后空白与中文输入法带进来的空格不影响结果', () => {
    expect(extractInviteCode('  ABCD 2345  ')).toBe('ABCD2345')
  })

  it('完整邀请链接从 code 查询参数取码', () => {
    expect(extractInviteCode('https://ctl.example.com/join?code=ABCD2345')).toBe('ABCD2345')
  })

  it('链接带其它查询参数、锚点或没有 scheme 时仍能取码', () => {
    expect(extractInviteCode('https://ctl.example.com/join?from=wechat&code=abcd2345#x')).toBe(
      'ABCD2345',
    )
    expect(extractInviteCode('ctl.example.com/join?code=ABCD2345')).toBe('ABCD2345')
  })

  it('码放在路径里的链接也能取码', () => {
    expect(extractInviteCode('https://ctl.example.com/join/ABCD2345')).toBe('ABCD2345')
  })

  it('链接被换行或转义拆开时，从原始串里兜底捞 code 参数', () => {
    expect(extractInviteCode('https://ctl.example.com/join?code=ABCD2345&amp;x=1')).toBe('ABCD2345')
  })

  it('取不出码时返回规范化后的原输入，由服务端给权威结论', () => {
    
    expect(extractInviteCode('hello')).toBe('HELLO')
    expect(extractInviteCode('https://ctl.example.com/join')).toBe('HTTPSCTLEXAMPLECOMJOIN')
  })

  it('空输入返回空串', () => {
    expect(extractInviteCode('   ')).toBe('')
  })
})

describe('isInviteCode', () => {
  it('长度与字母表都符合才算码', () => {
    expect(isInviteCode('ABCD2345')).toBe(true)
    expect(isInviteCode('ABCD-2345')).toBe(true)
    
    expect(isInviteCode('ABCD2340')).toBe(false)
    expect(isInviteCode('ABCD234')).toBe(false)
    expect(isInviteCode('ABCD23456')).toBe(false)
  })

  it('码长与协议常量一致', () => {
    expect(INVITE_CODE_LENGTH).toBe(8)
    expect(isInviteCode('A'.repeat(INVITE_CODE_LENGTH))).toBe(true) 
    
    expect(isInviteCode('I'.repeat(INVITE_CODE_LENGTH))).toBe(false)
    expect(isInviteCode('O'.repeat(INVITE_CODE_LENGTH))).toBe(false)
  })
})

describe('normalizeInviteCode', () => {
  it('只保留字母数字并大写', () => {
    expect(normalizeInviteCode(' ab-cd 23_45 ')).toBe('ABCD2345')
  })
})

describe('looksLikeJoinLinkWithoutCode', () => {
  it('带码的链接不算"没带码"', () => {
    expect(looksLikeJoinLinkWithoutCode('https://ctl.example.com/join?code=ABCD2345')).toBe(false)
    expect(looksLikeJoinLinkWithoutCode('ABCD2345')).toBe(false)
  })

  it('贴了链接但链接里没有码：能识别出来，好给一句明确提示', () => {
    expect(looksLikeJoinLinkWithoutCode('https://ctl.example.com/join')).toBe(true)
    expect(looksLikeJoinLinkWithoutCode('https://ctl.example.com/')).toBe(true)
    expect(looksLikeJoinLinkWithoutCode('ctl.example.com/join')).toBe(true)
  })

  it('普通输入不当作链接', () => {
    expect(looksLikeJoinLinkWithoutCode('hello')).toBe(false)
    expect(looksLikeJoinLinkWithoutCode('')).toBe(false)
  })
})

describe('INVITE_LIFETIME_HOURS', () => {
  it('固定 72 小时：协议文档与三语文案都写这个数字', () => {
    expect(INVITE_LIFETIME_HOURS).toBe(72)
  })
})
