import { describe, expect, it } from 'vitest'
import { pageCount, pageWindow } from './pager'







describe('pageWindow', () => {
  it('只有一两页时把页码全部列出来，不画省略号', () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(1, 2)).toEqual([1, 2])
    expect(pageWindow(2, 2)).toEqual([1, 2])
  })

  it('页数够多时固定显示第 1 页与最后一页，当前页两侧各留一个邻居', () => {
    expect(pageWindow(1, 12)).toEqual([1, 2, 'gap', 12])
    expect(pageWindow(2, 12)).toEqual([1, 2, 3, 'gap', 12])
    expect(pageWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12])
    expect(pageWindow(12, 12)).toEqual([1, 'gap', 11, 12])
  })

  it('断了才画省略号：相邻数字之间不画', () => {
    
    expect(pageWindow(2, 12).filter((item) => item === 'gap')).toHaveLength(1)
    
    for (const items of [pageWindow(6, 500), pageWindow(250, 500), pageWindow(499, 500)]) {
      const text = items.join(',')
      expect(text).not.toContain('gap,gap')
    }
  })

  it('当前页越界（记录变少之后还停在第 9 页）时画出里面那一页', () => {
    expect(pageWindow(9, 3)).toEqual([1, 2, 3])
    expect(pageWindow(0, 3)).toEqual([1, 2, 3])
  })

  it('没有页时返回空：不画一个孤零零的「1」', () => {
    expect(pageWindow(1, 0)).toEqual([])
    expect(pageWindow(1, -3)).toEqual([])
  })

  it('五百页时仍然只画出固定几个数字', () => {
    expect(pageWindow(250, 500)).toEqual([1, 'gap', 249, 250, 251, 'gap', 500])
    expect(pageWindow(250, 500).length).toBeLessThanOrEqual(7)
  })
})

describe('pageCount', () => {
  it('向上取整，且至少 1 页', () => {
    expect(pageCount(0, 50)).toBe(1)
    expect(pageCount(1, 50)).toBe(1)
    expect(pageCount(50, 50)).toBe(1)
    expect(pageCount(51, 50)).toBe(2)
    expect(pageCount(1234, 50)).toBe(25)
  })

  it('总数或页长为坏值时退化成 1 页，而不是 NaN / Infinity 个页码', () => {
    expect(pageCount(Number.NaN, 50)).toBe(1)
    expect(pageCount(100, 0)).toBe(1)
    expect(pageCount(100, Number.POSITIVE_INFINITY)).toBe(1)
  })
})
