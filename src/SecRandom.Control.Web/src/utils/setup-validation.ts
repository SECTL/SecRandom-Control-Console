









export const ADMIN_USERNAME_MIN_LENGTH = 3

export const ADMIN_USERNAME_MAX_LENGTH = 32

export const ADMIN_PASSWORD_MIN_LENGTH = 8








const ADMIN_USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/


export function isValidAdminUsername(value: string): boolean {
  if (value.length < ADMIN_USERNAME_MIN_LENGTH) return false
  if (value.length > ADMIN_USERNAME_MAX_LENGTH) return false
  return ADMIN_USERNAME_PATTERN.test(value)
}


export function isValidAdminPassword(value: string): boolean {
  return value.length >= ADMIN_PASSWORD_MIN_LENGTH
}
