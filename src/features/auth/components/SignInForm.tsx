'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  useForm,
  Controller,
  SubmitHandler,
  FieldErrors,
  useWatch,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  RectangleEllipsis,
  Eye,
  EyeClosed,
  Loader2,
  ArrowRight,
  User,
} from 'lucide-react';

import { SignInData, SignInSchema } from '../schemas/auth';
import { signInAction } from '../actions/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import PasswordRulesCard from './PasswordRulesCard';

export default function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<SignInData>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { username: '', password: '' },
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

      <form onSubmit={handleSubmit(handleSignIn, onInvalid)} id="signin-form">
        <CardContent className="flex flex-col gap-5">
          {/* Username Field */}
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={field.name}
                  className="uppercase text-[10px] tracking-[0.2em] text-muted-foreground ml-1"
                >
                  User Identity
                </FieldLabel>
                <InputGroup className="transition-all focus-within:ring-1 focus-within:ring-ring/50">
                  <InputGroupInput
                    {...field}
                    autoComplete="username"
                    placeholder="Enter Username"
                    disabled={isPending}
                    className="placeholder:text-muted-foreground/40 text-sm tracking-wide"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon className="text-muted-foreground/60">
                    <User size={18} strokeWidth={1.5} />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            )}
          />

          {/* Password Field */}
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="uppercase text-[10px] tracking-[0.2em] text-muted-foreground ml-1"
                  htmlFor={field.name}
                >
                  Security Key
                </FieldLabel>
                <InputGroup className="transition-all ">
                  <InputGroupInput
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter Password"
                    disabled={isPending}
                    className="placeholder:text-muted-foreground/40 text-sm tracking-wide"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon className="text-muted-foreground/60">
                    <RectangleEllipsis size={18} strokeWidth={1.5} />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      className="hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeClosed
                          size={18}
                          strokeWidth={1.5}
                          className="text-muted-foreground/60 hover:text-foreground transition-colors"
                        />
                      ) : (
                        <Eye
                          size={18}
                          strokeWidth={1.5}
                          className="text-muted-foreground/60 hover:text-foreground transition-colors"
                        />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            )}
          />

          <div className="pt-2">
            <PasswordRulesCard rules={rules} />
          </div>
        </CardContent>
      </form>

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
