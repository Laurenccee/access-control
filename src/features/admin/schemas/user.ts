import z from 'zod';
import { is } from 'zod/v4/locales';

/** * BASE RULES
 * We keep the logic here so we don't repeat the regex 100 times.
 **/
const usernameRule = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'No special characters');
const emailRule = z.string().email();
const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must include uppercase')
  .regex(/[a-z]/, 'Must include lowercase')
  .regex(/[0-9]/, 'Must include a number');

// --- 1. ADMIN ACTION: CREATE USER ---
// Used when the Admin is provisioning a new account
export const CreateUserSchema = z.object({
  username: usernameRule,
  email: emailRule,
  role_id: z.union([z.literal(0), z.literal(1)]), // ← drop z.coerce here
});

// --- 2. USER ACTION: UPDATE PROFILE ---
// Used by the user on their dashboard. Note: NO role_id here!
export const UpdateProfileSchema = z.object({
  username: usernameRule.optional(),
  email: emailRule.optional(),
  // For updates, we allow optional/empty so the DB doesn't overwrite with null
  password: passwordRule.optional().or(z.literal('')),
  security_question_id: z.string().uuid().optional(),
  security_answer: z.string().optional().or(z.literal('')),
});

// --- 3. ADMIN ACTION: UPDATE USER ---
// If the Admin needs to change someone else's role or fix an account
export const AdminUpdateUserSchema = UpdateProfileSchema.extend({
  role_id: z.coerce
    .number()
    .pipe(z.union([z.literal(0), z.literal(1)]))
    .optional(),
});

export const ProfileSetupSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string(),

    security_question_id: z.string().uuid(),
    security_answer: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword);

export const ResetPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword);

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type AdminUpdateUser = z.infer<typeof AdminUpdateUserSchema>;
export type ProfileSetup = z.infer<typeof ProfileSetupSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
