'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight, Loader2, RectangleEllipsis, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ProfileSetup,
  ProfileSetupSchema,
  ResetPassword,
  ResetPasswordSchema,
} from '@/features/admin/schemas/user';
import InputField from '@/components/shared/InputField';
import PasswordRulesCard from './PasswordRulesCard';
import { resetPasswordAction, setupProfileAction } from '../actions/profile';

export default function ResetProfileForm({}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema), // ← cast
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const [passwordValue, confirmPasswordValue] = useWatch({
    control,
    name: ['password', 'confirmPassword'],
  }) as [string | undefined, string | undefined];

  const checkRules = (pw: string = '', confirmPw: string = '') => ({
    minLen: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    mustMatch: pw === confirmPw && pw.length > 0,
  });

  const rules = checkRules(passwordValue || '', confirmPasswordValue || '');

  const handlePasswordReset: SubmitHandler<ResetPassword> = (data) => {
    startTransition(async () => {
      try {
        const result = await resetPasswordAction(data);

        if (result.success) {
          toast.success('Password updated successfully!');
          reset();
          router.replace('/');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('An unexpected error occurred. Please try again.');
        console.error('Form Submission Error:', error);
      }
    });
  };

  return (
    <Card className="w-full max-w-[95%] sm:max-w-md mx-auto border-border/40 transition-all">
      <CardHeader className=" pt-4">
        <CardTitle className="uppercase text-2xl sm:text-3xl text-center tracking-[0.15em] leading-none">
          Reset Your Password
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm tracking-normal text-muted-foreground/80 max-w-70 mx-auto leading-relaxed">
          For your account's security, please set a new password and confirm it.
          Make sure to follow the password requirements listed below.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handlePasswordReset)} id="verification-form">
        <CardContent className="flex flex-col gap-6">
          <InputField
            name="password"
            label="Password"
            control={control}
            isPending={isPending}
            type="password"
            placeholder="Enter Password"
            leadingIcon={<RectangleEllipsis size={18} />}
          />
          <InputField
            name="confirmPassword"
            label="Confirm Password"
            control={control}
            isPending={isPending}
            type="password"
            placeholder="Confirm Password"
            leadingIcon={<RectangleEllipsis size={18} />}
          />
          <PasswordRulesCard rules={rules} />
        </CardContent>
      </form>

      <CardFooter className="">
        <Button
          type="submit"
          form="verification-form"
          disabled={isPending}
          size="lg"
          className="w-full uppercase text-xs tracking-[0.25em] transition-all active:scale-[0.98]"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              Updating <Loader2 size={16} className="animate-spin" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Reset Password <ArrowRight size={16} strokeWidth={1.5} />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
