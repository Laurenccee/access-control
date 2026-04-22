export const ROUTES = {
  SIGN_IN: '/sign-in',
  RESET_PASSWORD: '/reset',
  PROFILE_SETUP: '/profile-setup',
  VERIFICATION: '/verification',
  ADMIN_CONSOLE: '/admin-console',
  USER_DASHBOARD: '/user',
  ROOT: '/',
} as const;

export type RouteKey = keyof typeof ROUTES;
