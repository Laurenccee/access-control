'use client';
import InputField from '@/components/shared/InputField';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { UpdateUser } from '@/features/admin/schemas/user';
import PasswordRulesCard from '@/features/auth/components/PasswordRulesCard';
import { Edit, Mail, RectangleEllipsis, User } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';

interface UpdateProfileSheetFormProps {
  profile: any;
}

export default function UpdateProfileSheetForm({
  profile,
}: UpdateProfileSheetFormProps) {
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit } = useForm<UpdateUser>({
    defaultValues: {
      email: profile.email,
      username: profile.username,
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

  const handleUpdateUser = async (data: UpdateUser) => {
    startTransition(async () => {
      try {
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="text-muted-foreground"
          size="icon"
          disabled={isPending}
        >
          <Edit size={16} />
        </Button>
      </SheetTrigger>
      <form
        action=""
        id="update-user-form"
        onSubmit={handleSubmit(handleUpdateUser)}
      >
        <SheetContent className="border-l-2 border-border">
          <SheetHeader>
            <SheetTitle className="uppercase tracking-tighter">
              Edit User Profile
            </SheetTitle>
            <SheetDescription className="text-xs uppercase">
              Modify identity parameters for UID: {profile.username}
            </SheetDescription>
          </SheetHeader>

          <div className="grid flex-1 auto-rows-min gap-4 px-4">
            <InputField
              name="email"
              label="Email"
              control={control}
              isPending={isPending}
              type="email"
              placeholder="Enter Email"
              leadingIcon={<Mail size={18} />}
            />
            <InputField
              name="username"
              label="Username "
              control={control}
              isPending={isPending}
              type="text"
              placeholder="Enter Username"
              leadingIcon={<User size={18} />}
            />
          </div>

          <SheetFooter>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
              form="update-user-form"
            >
              {isPending ? 'Syncing...' : 'Commit Changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </form>
    </Sheet>
  );
}
