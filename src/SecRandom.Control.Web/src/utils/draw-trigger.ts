




















import type { NodeRosterListDto, NodeRosterMemberDto } from '@/api/protocol'








export function isDrawCandidate(member: NodeRosterMemberDto): boolean {
  if (!member.enabled) return false
  const id = member.id?.trim() ?? ''
  const name = member.name?.trim() ?? ''
  return id.length > 0 || name.length > 0
}








function optionsOf(
  members: readonly NodeRosterMemberDto[],
  pick: (member: NodeRosterMemberDto) => string | null,
): string[] {
  const values = new Set<string>()
  for (const member of members) {
    const value = pick(member)?.trim() ?? ''
    if (value.length > 0) values.add(value)
  }
  return [...values].sort((left, right) => left.localeCompare(right))
}


export function genderOptions(members: readonly NodeRosterMemberDto[]): string[] {
  return optionsOf(members, (member) => member.gender)
}


export function groupOptions(members: readonly NodeRosterMemberDto[]): string[] {
  return optionsOf(members, (member) => member.group)
}


export interface DrawPrecheckInput {
  
  list: NodeRosterListDto | null
  
  gender: string
  
  group: string
  
  count: number | null
}







export type DrawPrecheck =
  | {
      ok: true
      
      candidates: number | null
      
      incomplete: boolean
    }
  | {
      ok: false
      key: string
      params: Record<string, string | number>
      incomplete: boolean
    }
















export function precheckDraw(input: DrawPrecheckInput): DrawPrecheck {
  const { list, gender, group, count } = input

  
  if (list === null) return { ok: true, candidates: null, incomplete: false }

  const members = list.members
  const incomplete = list.truncated

  const wantedGender = gender.trim()
  if (wantedGender.length > 0 && !genderOptions(members).includes(wantedGender)) {
    return {
      ok: false,
      key: 'nodeDetail.draw.localCheckGender',
      params: { value: wantedGender },
      incomplete,
    }
  }

  const wantedGroup = group.trim()
  if (wantedGroup.length > 0 && !groupOptions(members).includes(wantedGroup)) {
    return {
      ok: false,
      key: 'nodeDetail.draw.localCheckGroup',
      params: { value: wantedGroup },
      incomplete,
    }
  }

  const candidates = members
    .filter(isDrawCandidate)
    .filter((member) => wantedGender.length === 0 || (member.gender?.trim() ?? '') === wantedGender)
    .filter((member) => wantedGroup.length === 0 || (member.group?.trim() ?? '') === wantedGroup)

  if (candidates.length === 0) {
    return { ok: false, key: 'nodeDetail.draw.localCheckNoCandidate', params: {}, incomplete }
  }

  if (count !== null && count > candidates.length) {
    
    
    return {
      ok: false,
      key: 'nodeDetail.draw.localCheckCount',
      params: { min: 1, max: candidates.length },
      incomplete,
    }
  }

  return { ok: true, candidates: candidates.length, incomplete }
}










export function precheckNotice(
  precheck: DrawPrecheck,
  list: NodeRosterListDto | null,
): { key: string; params: Record<string, string | number> } | null {
  if (list === null || !list.truncated) return null

  
  if (!precheck.ok) return null

  
  if (precheck.candidates === null) return null

  return list.total > list.count
    ? { key: 'nodeDetail.draw.localCheckIncomplete', params: { count: list.count, total: list.total } }
    : { key: 'nodeDetail.draw.localCheckTruncated', params: {} }
}
