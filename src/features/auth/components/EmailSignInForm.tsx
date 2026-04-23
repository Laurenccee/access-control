'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import InputField from '@/components/shared/InputField';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmailSignInData, EmailSignInSchema } from '../schemas/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { sendOTPToEmailAction } from '../actions/otp';
import { toast } from 'sonner';
import CaptchaAlertDialog from '@/components/shared/CaptchaAlertDialog';

export default function EmailSignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [pendingData, setPendingData] = useState<EmailSignInData | null>(null);

  const onSubmit = (data: EmailSignInData) => {
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

  const { control, handleSubmit } = useForm<EmailSignInData>({
    resolver: zodResolver(EmailSignInSchema),
    defaultValues: { email: '' },
  });

  const handleSignIn: SubmitHandler<EmailSignInData> = async (data) => {
    startTransition(async () => {
      try {
        const result = await sendOTPToEmailAction(data.email);
        if (result?.success === false) {
          toast.error(result.message || 'Access Denied');
          return;
        }
        toast.success(`OTP sent to ${data.email}`);
        router.push(
          `/otp-verification?email=${encodeURIComponent(data.email)}`,
        );
      } catch (error) {
        toast.error('An unexpected error occurred.');
        console.error('Error sending OTP:', error);
      }
    });
  };

  return (
    <Card className="w-full mx-auto border-border/40 transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="uppercase text-2xl sm:text-3xl text-center leading-none">
          Sign In
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm tracking-normal text-muted-foreground/80  mx-auto ">
          Please enter your credentials to access the secure area. Your identity
          will be verified before granting access.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} id="signin-form">
        <CardContent className="flex flex-col gap-5">
          <InputField
            name="email"
            label="Email"
            control={control}
            isPending={isPending}
            type="email"
            placeholder="Enter Email"
            leadingIcon={<Mail size={18} />}
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
          form="signin-form"
          variant="default"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              Sending <Loader2 className="animate-spin" size={16} />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Send OTP to Email <ArrowRight size={16} strokeWidth={1.5} />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
