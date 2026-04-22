'use client';
import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OTPData, OTPSchema } from '../schemas/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import OTPField from '@/components/shared/OTPField';
import { toast } from 'sonner';
import { signInWithOTPAction } from '../actions/otp';

export default function OTPForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const { control, handleSubmit } = useForm<OTPData>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { code: '' },
  });

  const handleSignIn: SubmitHandler<OTPData> = (data) => {
    startTransition(async () => {
      if (!email) {
        toast.error('Missing email for OTP verification.');
        return;
      }
      try {
        const result = await signInWithOTPAction(email, data.code);
        if (result?.success === false) {
          toast.error(result.message || 'OTP verification failed');
          return;
        }
        toast.success('OTP verified! You are now signed in.');
        router.replace('/'); // or wherever you want to redirect
      } catch (error) {
        toast.error('An unexpected error occurred.');
        console.error('Error verifying OTP:', error);
      }
    });
  };

  const handleResend = () => {
    startTransition(() => {
      // Simulate resend OTP API call
      console.log('Resending OTP...');
    });
  };
  return (
    <Card className="w-full max-w-xs mx-auto border-border/40 transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="uppercase text-xl sm:text-2xl text-center leading-none">
          Sign In
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-xs tracking-normal text-muted-foreground/80  mx-auto ">
          Please enter your credentials to access the secure area. Your identity
          will be verified before granting access.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleSignIn)} id="signin-form">
        <CardContent>
          <OTPField
            name="code"
            label="Verification code"
            control={control}
            isPending={isPending}
            onResend={handleResend}
          />
        </CardContent>
      </form>

      <CardFooter className="flex flex-col gap-4 ">
        <Button
          className="w-full"
          disabled={isPending}
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
              Verify <ArrowRight size={16} strokeWidth={1.5} />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
