export interface ResetPasswordPayload {
  password: string;
  tokenOrCode: string | null;
}
