// /lib/validations.ts
import { email, z } from 'zod';

export const SignInSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'No special characters allowed'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[0-9]/, 'Must include a number'),
});

export const SecurityQuestionSchema = z.object({
  answer: z.string().min(1, 'Answer cannot be empty'),
});

export const OTPSchema = z.object({
  code: z.string().length(8, 'OTP must be 8 characters long'),
});
export const EmailSignInSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type SignInData = z.infer<typeof SignInSchema>;
export type SecurityQuestionData = z.infer<typeof SecurityQuestionSchema>;
export type OTPData = z.infer<typeof OTPSchema>;
export type EmailSignInData = z.infer<typeof EmailSignInSchema>;
export type Role = keyof typeof UserRole;
