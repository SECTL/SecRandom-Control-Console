
















import type { NodeRosterMemberDto, RosterKind } from '@/api/protocol'


export type RosterCsvColumn =
  | 'enabled'
  | 'id'
  | 'name'
  | 'gender'
  | 'group'
  | 'tags'
  | 'count'
  | 'weight'







export const ROSTER_CSV_COLUMNS: Record<RosterKind, readonly RosterCsvColumn[]> = {
  students: ['enabled', 'id', 'name', 'gender', 'group', 'tags'],
  prizes: ['enabled', 'id', 'name', 'count', 'weight', 'tags'],
}


function csvCell(value: string): string {
  return /["\r\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function cellOf(member: NodeRosterMemberDto, column: RosterCsvColumn): string {
  switch (column) {
    case 'enabled':
      
      return member.enabled ? '1' : '0'
    case 'id':
      return member.id ?? ''
    case 'name':
      return member.name ?? ''
    case 'gender':
      return member.gender ?? ''
    case 'group':
      return member.group ?? ''
    case 'tags':
      
      
      return member.tags === null || member.tags === undefined ? '' : member.tags.join(', ')
    case 'count':
      return member.count === null ? '' : String(member.count)
    case 'weight':
      return member.weight === null ? '' : String(member.weight)
  }
}









const UTF8_BOM = '\uFEFF'







export function toRosterCsv(members: readonly NodeRosterMemberDto[], kind: RosterKind): string {
  if (members.length === 0) return ''

  const columns = ROSTER_CSV_COLUMNS[kind]
  const lines = [columns.join(',')]
  for (const member of members) {
    lines.push(columns.map((column) => csvCell(cellOf(member, column))).join(','))
  }
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`
}


const UNSAFE_FILE_CHARS = /[\\/:*?"<>|]/g


function safeListName(listName: string | null): string {
  return (listName ?? '')
    .replace(UNSAFE_FILE_CHARS, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 64)
}







export function rosterCsvFileName(kind: RosterKind, listName: string | null): string {
  const base = safeListName(listName)
  return base.length > 0 ? `roster-${kind}-${base}.csv` : `roster-${kind}.csv`
}
