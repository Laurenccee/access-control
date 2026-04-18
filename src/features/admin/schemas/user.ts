import z from 'zod';

export const UserSchema = {
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'No special characters allowed'),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  security_question_id: z.string().uuid('Invalid security question selection'),
  security_answer: z.string().min(1, 'Security answer is required'),
  role_id: z.union([z.literal(0), z.literal(1)]), // ← drop z.coerce here
};

export const CreateUserSchema = z
  .object({
    ...UserSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  });

export const UpdateUserSchema = z.object({
  username: UserSchema.username.optional(),
  email: UserSchema.email.optional(),
  password: UserSchema.password.optional(),
  security_question_id: UserSchema.security_question_id.optional(),
  security_answer_hash: UserSchema.security_answer.optional(),
  role_id: UserSchema.role_id.optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
