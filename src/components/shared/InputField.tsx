import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Field, FieldDescription, FieldLabel } from '../ui/field';
import { RectangleEllipsis, EyeClosed, Eye } from 'lucide-react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '../ui/input-group';

interface InputFieldProps {
  name: string;
  label: string;
  control: any;
  isPending?: boolean;
  type?: string;
  placeholder?: string;
  description?: string;

  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export default function InputField({
  name,
  label,
  control,
  isPending = false,
  type = 'text',
  leadingIcon,
  trailingIcon,
  description,

  ...rest
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            className="uppercase text-xs tracking-[0.2em] text-muted-foreground ml-1"
            htmlFor={field.name}
          >
            {label}
          </FieldLabel>
          <InputGroup className="transition-all ">
            <InputGroupInput
              {...field}
              type={isPassword && showPassword ? 'text' : type}
              autoComplete={isPassword ? 'current-password' : undefined}
              placeholder={rest.placeholder}
              disabled={isPending}
              className="placeholder:text-muted-foreground/40 text-[10px] tracking-wide"
              aria-invalid={fieldState.invalid}
            />
            {leadingIcon && (
              <InputGroupAddon className="text-muted-foreground/60">
                {leadingIcon}
              </InputGroupAddon>
            )}
            {isPassword ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  className="hover:bg-transparent"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeClosed className="text-muted-foreground/60 hover:text-foreground transition-colors" />
                  ) : (
                    <Eye className="text-muted-foreground/60 hover:text-foreground transition-colors" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            ) : (
              trailingIcon && (
                <InputGroupAddon
                  align="inline-end"
                  className="text-muted-foreground/60"
                >
                  {trailingIcon}
                </InputGroupAddon>
              )
            )}
          </InputGroup>

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
