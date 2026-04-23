import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../ui/input-group';
import { BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Field, FieldDescription } from '../ui/field';

interface CaptchaAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CaptchaAlertDialog({
  open,
  onOpenChange,
  onSuccess,
}: CaptchaAlertDialogProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [localError, setLocalError] = useState('');

  // Ga Generate it simple math quiz para sa captcha
  const generateQuiz = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserInput('');
  };

  // Ga reset it quiz kada open it Alert dialog
  useEffect(() => {
    if (open) {
      generateQuiz();
      setLocalError('');
    }
  }, [open]);

  // Gina verify if correct ang answer, kung correct ga call it onSuccess callback, kung incorrect ga show it error message kag ga generate it bag-o nga quiz
  const handleVerify = () => {
    if (!userInput) {
      setLocalError('Please enter your answer.');
      return;
    }
    if (parseInt(userInput, 10) === num1 + num2) {
      setLocalError('');
      onSuccess();
      onOpenChange(false);
    } else {
      setLocalError('Incorrect. Try again.');
      setUserInput('');
      generateQuiz();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[320px]">
        <AlertDialogHeader className="gap-0">
          <AlertDialogTitle className="text-xl">
            Security Check
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs uppercase leading-relaxed">
            Solve this simple math problem:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Card className="bg-accent">
          <CardContent className="flex flex-col justify-center items-center text-2xl font-mono font-bold gap-2">
            {num1} + {num2} = ?
          </CardContent>
        </Card>
        <div className="flex flex-col items-center gap-4 py-4">
          <Field>
            <InputGroup className="transition-all ">
              <InputGroupInput
                type="text"
                placeholder="Enter your answer"
                className="placeholder:text-muted-foreground/40 text-[10px] tracking-wide"
                value={userInput}
                onChange={(e) =>
                  setUserInput(e.target.value.replace(/[^0-9]/g, ''))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerify();
                  }
                }}
                aria-invalid={!!localError}
                autoFocus
              />
              <InputGroupAddon className="text-muted-foreground/60">
                <BadgeCheck />
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription className="text-red-500 ">
              {localError}
            </FieldDescription>
          </Field>
        </div>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleVerify}>
            Verify Answer
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
