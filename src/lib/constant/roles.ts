export const ROLES = {
  ADMIN: 0,
  USER: 1,
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
