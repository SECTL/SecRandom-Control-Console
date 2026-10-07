import { describe, expect, it } from 'vitest'
import { formatVersion } from './version'





describe('formatVersion', () => {
  it('干净的版本号原样保留', () => {
    expect(formatVersion('0.1.0')).toBe('0.1.0')
    expect(formatVersion('1.2.3')).toBe('1.2.3')
  })

  it('去掉 CI 附带的提交信息（`+<sha>`）', () => {
    expect(formatVersion('1.0.0+3f9a1c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b')).toBe('1.0.0')
    expect(formatVersion('0.1.0+build.20250101')).toBe('0.1.0')
  })

  it('去掉预发布标记（`-rc.1` / `-beta`）', () => {
    expect(formatVersion('1.0.1-rc.1')).toBe('1.0.1')
    expect(formatVersion('1.0.1-rc.1+abcdef')).toBe('1.0.1')
  })

  it('段数不足补零，段数过多只取前三段', () => {
    expect(formatVersion('1')).toBe('1.0.0')
    expect(formatVersion('1.2')).toBe('1.2.0')
    expect(formatVersion('1.2.3.4')).toBe('1.2.3')
  })

  it('容忍前缀 v', () => {
    expect(formatVersion('v1.2.3')).toBe('1.2.3')
    expect(formatVersion(' v1.2.3 ')).toBe('1.2.3')
  })

  it('不是版本号就什么都不显示，而不是把垃圾串丢到页面上', () => {
    expect(formatVersion('not-a-version')).toBe('')
    expect(formatVersion('')).toBe('')
    expect(formatVersion('   ')).toBe('')
    expect(formatVersion(undefined)).toBe('')
    expect(formatVersion(null)).toBe('')
  })
})
