export const ROUTES = {
  SIGN_IN: '/sign-in',
  RESET_PASSWORD: '/reset',
  PROFILE_SETUP: '/profile-setup',
  VERIFICATION: '/verification',
  ADMIN_CONSOLE: '/admin-console',
  USER_DASHBOARD: '/user',
  OTP_CERIFICATION: '/otp-verification',
  ROOT: '/',
} as const;

export type RouteKey = keyof typeof ROUTES;
