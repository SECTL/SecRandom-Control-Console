












export type PageItem = number | 'gap'


const NEIGHBOURS = 1





export function pageWindow(current: number, pages: number): PageItem[] {
  
  if (pages <= 0) return []

  
  
  const safeCurrent = Math.min(Math.max(1, Math.trunc(current)), pages)

  const wanted = new Set<number>([1, pages])
  for (let offset = -NEIGHBOURS; offset <= NEIGHBOURS; offset += 1) {
    const page = safeCurrent + offset
    if (page >= 1 && page <= pages) wanted.add(page)
  }

  const sorted = [...wanted].sort((left, right) => left - right)
  const items: PageItem[] = []
  let previous = 0
  for (const page of sorted) {
    
    if (previous !== 0 && page - previous > 1) items.push('gap')
    items.push(page)
    previous = page
  }

  return items
}


export function pageCount(total: number, pageSize: number): number {
  if (!Number.isFinite(total) || total <= 0) return 1
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 1
  return Math.max(1, Math.ceil(total / pageSize))
}
