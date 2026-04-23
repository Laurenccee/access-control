'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, FieldErrors, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { RectangleEllipsis, Loader2, ArrowRight, User } from 'lucide-react';

import { SignInData, SignInSchema } from '../schemas/auth';
import { resendVerificationEmailAction, signInAction } from '../actions/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PasswordRulesCard from './PasswordRulesCard';
import InputField from '@/components/shared/InputField';
import CaptchaAlertDialog from '@/components/shared/CaptchaAlertDialog';

export default function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [pendingData, setPendingData] = useState<SignInData | null>(null);

  const onSubmit = (data: SignInData) => {
    setPendingData(data);
    setCaptchaOpen(true);
  };
  const handleCaptchaSuccess = () => {
    setCaptchaOpen(false);
    if (pendingData) {
      handleSignIn(pendingData);
      setPendingData(null);
    }
  };

  const { control, handleSubmit } = useForm<SignInData>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const checkRules = (password: string = '') => ({
    minLen: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  });

  const passwordValue = useWatch({ control, name: 'password' }) || '';
  const rules = checkRules(passwordValue);

  const handleSignIn: SubmitHandler<SignInData> = async (data) => {
    startTransition(async () => {
      try {
        const result = await signInAction(data);
        if (result?.success === false) {
          if (
            result.code === 'email_not_confirmed' ||
            result.message?.toLowerCase().includes('confirm your email')
          ) {
            const email = result.email || data.username;
            await resendVerificationEmailAction(email);
            router.replace('/');
            return;
          }
          toast.error(result.message || 'Access Denied');
          return;
        }
        toast.success(`Identity Verified: ${data.username}`);
        router.replace('/');
      } catch (err) {
        toast.error('System error: Could not reach authentication gateway');
      }
    });
  };

  // Handle form validation errors to show the first error message as a toast
  const onInvalid = (errors: FieldErrors<SignInData>) => {
    const errorValues = Object.values(errors);
    if (errorValues.length > 0) {
      const firstError = errorValues[0];
      if (firstError && 'message' in firstError) {
        toast.error(firstError.message as string);
      }
    }
  };
  return (
    <Card className="w-full mx-auto border-border/40 transition-all duration-300">
      <CardHeader className="gap-2 pb-4">
        <CardTitle className="uppercase text-2xl sm:text-3xl text-center leading-none">
          Sign In
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm tracking-normal text-muted-foreground/80  mx-auto ">
          Please enter your credentials to access the secure area. Your identity
          will be verified before granting access.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} id="signin-form">
        <CardContent className="flex flex-col gap-5">
          {/* Username Field */}
          <InputField
            name="username"
            label="Username"
            control={control}
            isPending={isPending}
            type="text"
            placeholder="Enter Username"
            leadingIcon={<User size={18} />}
          />

          {/* Password Field */}

          <div className="flex flex-col items-end">
            <InputField
              name="password"
              label="Password"
              control={control}
              isPending={isPending}
              type="password"
              placeholder="Enter Password"
              leadingIcon={<RectangleEllipsis size={18} />}
            />
            <Button
              variant="link"
              size="sm"
              type="button"
              onClick={() => router.push('/forget-password')}
              disabled={isPending}
            >
              Forgot Password?
            </Button>
          </div>
          <PasswordRulesCard rules={rules} />
        </CardContent>
      </form>

      <CaptchaAlertDialog
        open={captchaOpen}
        onOpenChange={setCaptchaOpen}
        onSuccess={handleCaptchaSuccess}
      />

      <CardFooter className="flex flex-col gap-4 ">
        <Button
          className="w-full uppercase text-xs tracking-[0.25em] h-10 transition-all active:scale-[0.98]"
          disabled={isPending || captchaOpen}
          type="submit"
          form="signin-form"
          variant="default"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              Verifying <Loader2 className="animate-spin" size={16} />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Authorize <ArrowRight size={16} strokeWidth={1.5} />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
