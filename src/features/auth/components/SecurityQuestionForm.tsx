'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  Controller,
  SubmitHandler,
  useForm,
  FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight, Loader2, ShieldQuestion } from 'lucide-react';

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
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  SecurityQuestionData,
  SecurityQuestionSchema,
} from '@/features/auth/schemas/auth';
import { verifySecurityAction } from '../actions/verify';

interface SecurityQuestionFormProps {
  question?: string;
}

export default function SecurityQuestionForm({
  question,
}: SecurityQuestionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit } = useForm<SecurityQuestionData>({
    resolver: zodResolver(SecurityQuestionSchema),
    defaultValues: { answer: '' },
  });

  const handleAnswerSubmit: SubmitHandler<SecurityQuestionData> = (data) => {
    startTransition(async () => {
      try {
        const result = await verifySecurityAction(data);

        if (result.success === false) {
          toast.error(result.message || 'Verification Failed');
          return;
        }

        toast.success('Security clearance granted.');
        if (result.redirectTo) {
          router.replace(result.redirectTo);
        }
      } catch (error) {
        toast.error('System error occurred during verification.');
      }
    });
  };

  const onInvalid = (errors: FieldErrors<SecurityQuestionData>) => {
    const errorValues = Object.values(errors);
    if (errorValues.length > 0) {
      const firstError = errorValues[0];
      if (firstError && 'message' in firstError) {
        toast.error(firstError.message as string);
      }
    }
  };

  return (
    <Card className="w-full max-w-[95%] sm:max-w-md mx-auto border-border/40 transition-all">
      <CardHeader className=" pt-4">
        <CardTitle className="uppercase text-2xl sm:text-3xl text-center tracking-[0.15em] leading-none">
          Security Challenge
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm tracking-normal text-muted-foreground/80 max-w-70 mx-auto leading-relaxed">
          Provide the pre-configured answer to finalize your session.
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={handleSubmit(handleAnswerSubmit, onInvalid)}
        id="verification-form"
      >
        <CardContent className="flex flex-col gap-6">
          {/* Question Display Section */}
          <div className="flex flex-col gap-3 rounded-lg bg-muted/30 p-5 border-2 border-border/60">
            <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">
              Identity Prompt:
            </span>
            <p className="text-sm sm:text-base leading-relaxed text-foreground italic">
              {question ? `"${question}"` : 'Retrieving security question...'}
            </p>
          </div>

          {/* Input Section */}
          <Controller
            name="answer"
            control={control}
            render={({ field, fieldState }) => (
              <Field className="space-y-1.5">
                <FieldLabel className="uppercase text-[10px] tracking-[0.2em] text-muted-foreground ml-1">
                  Your Answer
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    autoComplete="off"
                    placeholder="Input recorded response"
                    disabled={isPending}
                    className="placeholder:text-muted-foreground/40 text-sm tracking-wide"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon className="text-muted-foreground/60">
                    <ShieldQuestion size={20} strokeWidth={1.5} />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            )}
          />
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
              Validating <Loader2 size={16} className="animate-spin" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Submit Answer <ArrowRight size={16} strokeWidth={1.5} />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
