'use client';
import React from 'react';
import { Controller } from 'react-hook-form';
import { Field, FieldDescription, FieldLabel } from '../ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '../ui/input-otp';
import { Button } from '../ui/button';
import { RefreshCwIcon } from 'lucide-react';

interface OTPFieldProps {
  name: string;
  label: string;
  control: any;
  isPending?: boolean;
  description?: string;
  maxLength?: number;
  onResend?: () => void;
}

export default function OTPField({
  name,
  label,
  control,
  isPending = false,
  description,
  maxLength = 8,
  onResend,
}: OTPFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex items-center justify-between">
            <FieldLabel
              className="uppercase text-xs tracking-wide text-muted-foreground ml-1"
              htmlFor={field.name}
            >
              {label}
            </FieldLabel>
            <Button
              variant="outline"
              size="xs"
              disabled={isPending}
              onClick={onResend}
            >
              <RefreshCwIcon />
              Resend Code
            </Button>
          </div>

          <InputOTP
            maxLength={maxLength}
            id={field.name}
            {...field}
            aria-invalid={fieldState.invalid}
            disabled={isPending}
          >
            <InputOTPGroup className="flex-1 flex">
              <InputOTPSlot index={0} className="w-full h-10 text-xl" />
              <InputOTPSlot index={1} className="w-full h-10 text-xl" />
              <InputOTPSlot index={2} className="w-full h-10 text-xl" />
              <InputOTPSlot index={3} className="w-full h-10 text-xl" />
            </InputOTPGroup>
            <InputOTPSeparator className="mx-2" />
            <InputOTPGroup className="flex-1 flex">
              <InputOTPSlot index={4} className="w-full h-10 text-xl" />
              <InputOTPSlot index={5} className="w-full h-10 text-xl" />
              <InputOTPSlot index={6} className="w-full h-10 text-xl" />
              <InputOTPSlot index={7} className="w-full h-10 text-xl" />
            </InputOTPGroup>
          </InputOTP>
          {fieldState.error && (
            <span className="text-red-500 text-xs mt-1 block">
              {fieldState.error.message}
            </span>
          )}
          {description && (
            <FieldDescription className="text-xs tracking-[0.2em] text-muted-foreground ml-1">
              {description}
            </FieldDescription>
          )}
        </Field>
      )}
    />
  );
}
