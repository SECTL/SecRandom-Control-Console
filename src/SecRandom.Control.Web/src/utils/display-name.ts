









export function displayName(name: string | null | undefined, fallbackId: string): string {
  const trimmed = name?.trim()
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : fallbackId
}
