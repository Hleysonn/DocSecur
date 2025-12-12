export const roles = ['USER', 'MANAGER', 'ADMIN'] as const
export type Role = (typeof roles)[number]

