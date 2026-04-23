'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Loader2, Mail, RectangleEllipsis } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import CaptchaAlertDialog from '@/components/shared/CaptchaAlertDialog';
import { resendVerificationEmailAction } from '../actions/auth';
import { SubmitHandler, useForm } from 'react-hook-form';
import { ForgetPasswordData, ForgetPasswordSchema } from '../schemas/auth';
import { triggerPasswordResetAction } from '@/features/admin/actions/user';
import OTPField from '@/components/shared/OTPField';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from '@/components/shared/InputField';

export default function ForgetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null); // for update form data

  const onSubmit = (data: ForgetPasswordData) => {
    setPendingData(data);
    setCaptchaOpen(true);
  };

  const handleCaptchaSuccess = () => {
    setCaptchaOpen(false);
    if (pendingData) {
      handleForgetPassword(pendingData);
      setPendingData(null);
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgetPasswordData>({
    resolver: zodResolver(ForgetPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleForgetPassword: SubmitHandler<ForgetPasswordData> = async (
    data,
  ) => {
    startTransition(async () => {
      // 1. We use the email from the form data or the profile prop
      const email = data.email;

      if (!email) {
        toast.error('User does not have a valid email address.');
        return;
      }

      const result = await triggerPasswordResetAction(email);
      if (result.success) {
        toast.success(`Security reset initiated for ${email}.`);
        router.push('/sign-in');
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Card className="w-full max-w-sm mx-auto border-border/40 transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle>Forget Password</CardTitle>
        <CardDescription>
          Enter your email address to receive password reset instructions.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} id="forget-password-form">
        <CardContent className="flex flex-col gap-5">
          <InputField
            name="email"
            label="Email Address"
            control={control}
            isPending={isPending}
            type="email"
            placeholder="Enter Email Address"
            leadingIcon={<Mail size={18} />}
            error={errors.email?.message}
          />
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
          disabled={isPending}
          type="submit"
          form="forget-password-form"
          variant="default"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              Sending <Loader2 className="animate-spin" size={16} />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Request Password Reset <Mail size={16} strokeWidth={1.5} />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
