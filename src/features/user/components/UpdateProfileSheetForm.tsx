'use client';

import { useEffect, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Edit,
  Loader2,
  Mail,
  RectangleEllipsis,
  Shield,
  User,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import InputField from '@/components/shared/InputField';
import SelectionField from '@/components/shared/SelectionField';
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
import { UpdateUser, UpdateUserSchema } from '@/features/admin/schemas/user';
import PasswordRulesCard from '@/features/auth/components/PasswordRulesCard';
import { UpdateUserAction } from '@/features/admin/actions/user';

interface UpdateProfileSheetFormProps {
  profile: any;
  securityQuestions: any[];
  roles: Role[];
}

interface Role {
  id: number;
  role_name: string;
}

export default function UpdateProfileSheetForm({
  profile,
  securityQuestions,
  roles,
}: UpdateProfileSheetFormProps) {
  const [isPending, startTransition] = useTransition();

  const roleOptions = roles.map((r) => ({
    value: r.id.toString(),
    label: r.role_name,
  }));

  const securityOptions = securityQuestions.map((q) => ({
    value: q.id,
    label: q.question_text,
  }));

  const { control, handleSubmit, reset } = useForm<UpdateUser>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      email: profile?.email || '',
      username: profile?.username || '',
      password: '',
      role_id: profile?.role_id ?? 1,
      security_question_id: String(profile?.security_question_id || ''),
      security_answer: '',
    },
  });
  console.log('UserRRole', profile.role_id);

  const passwordValue = useWatch({ control, name: 'password' }) || '';

  const rules = {
    minLen: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
  };

  const handleUpdateUser = async (data: UpdateUser) => {
    startTransition(async () => {
      try {
        // Call the server action with the target user's ID and the form data
        const result = await UpdateUserAction(profile.id, data);

        if (result.success) {
          toast.success(
            result.message || 'Personnel profile updated successfully!',
          );
          reset();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('An unexpected error occurred.');
        console.error('Update Error:', error);
      }
    });
  };

  return (
    <Sheet>
      <Tooltip>
        {/* Ensure ONLY the dialog is inside */}
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent>
          <p>Reactivate User</p>
        </TooltipContent>
      </Tooltip>

      <SheetContent
        className="border-l-2 border-border overflow-y-auto"
        side="right"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="uppercase tracking-tighter">
            Edit User Profile
          </SheetTitle>
          <SheetDescription className="text-xs uppercase">
            Modify identity parameters for UID: {profile.username}
          </SheetDescription>
        </SheetHeader>

        <form
          id="update-user-form"
          onSubmit={handleSubmit(handleUpdateUser)}
          className="flex flex-col gap-4 px-4 py-4"
        >
          <InputField
            name="email"
            label="Email"
            control={control}
            isPending={isPending}
            type="email"
            placeholder="Enter Email"
            leadingIcon={<Mail size={18} />}
          />

          <div className="flex gap-2">
            <InputField
              name="username"
              label="Username"
              control={control}
              isPending={isPending}
              type="text"
              placeholder="Enter Username"
              leadingIcon={<User size={18} />}
              description="NOTE: Case-sensitive!"
            />
            <SelectionField
              name="role_id"
              label="Role"
              control={control}
              isPending={isPending}
              options={roleOptions}
              transform={(val) => Number(val) as 0 | 1}
            />
          </div>

          <InputField
            name="password"
            label="New Password"
            control={control}
            isPending={isPending}
            type="password"
            placeholder="Leave blank to keep current password"
            leadingIcon={<RectangleEllipsis size={18} />}
          />

          <PasswordRulesCard rules={rules} />

          <SelectionField
            name="security_question_id"
            label="Security Question"
            control={control}
            isPending={isPending}
            options={securityOptions}
          />
          <InputField
            name="security_answer"
            label="Security Answer"
            control={control}
            isPending={isPending}
            type="text"
            placeholder={
              profile?.security_answer_hash
                ? '(Encrypted) Leave blank to keep current password'
                : 'Enter New Answer'
            }
            leadingIcon={<Shield size={18} />}
            description="Leave blank to keep the current security answer."
          />
        </form>

        <SheetFooter className="mt-auto">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full flex gap-2"
            form="update-user-form"
            size="lg"
          >
            {isPending ? 'Syncing...' : 'Commit Changes'}
            {isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
