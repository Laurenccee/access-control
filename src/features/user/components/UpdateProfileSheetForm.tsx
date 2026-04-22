'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Loader2, Mail, User, Save, Shield } from 'lucide-react';
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
import {
  AdminUpdateUserSchema,
  UpdateProfile,
} from '@/features/admin/schemas/user';
import {
  triggerPasswordResetAction,
  updateUserAction,
} from '@/features/admin/actions/user';
import { useAuth } from '@/hooks/useAuth';

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
  const { isAdmin, user } = useAuth();
  const isOwner = user?.id === profile?.id;
  const roleOptions = roles.map((r) => ({
    value: r.id.toString(),
    label: r.role_name,
  }));

  const securityOptions = securityQuestions.map((q) => ({
    value: q.id,
    label: q.question_text,
  }));

  // Change this line in your component:
  const { control, handleSubmit, reset } = useForm<any>({
    // Use 'any' or the specific Admin type
    resolver: zodResolver(AdminUpdateUserSchema),
    defaultValues: {
      email: profile?.email || '',
      username: profile?.username || '',
      role_id: profile?.role_id, // Ensure this is included
      security_question_id: String(profile?.security_question_id || ''),
      security_answer: '', // Keep this blank for updates
    },
  });

  const handleUpdateUser = async (data: UpdateProfile) => {
    startTransition(async () => {
      try {
        // Call the server action with the target user's ID and the form data
        const result = await updateUserAction(profile.id, data);

        if (result.success) {
          toast.success(
            result.message || 'Personnel profile updated successfully!',
          );
          reset({
            ...data,
            security_answer: '',
          });
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('An unexpected error occurred.');
        console.error('Update Error:', error);
      }
    });
  };

  const handleResetPassword = () => {
    startTransition(async () => {
      // 1. We use the email from the form data or the profile prop
      const email = profile.email;

      if (!email) {
        toast.error('User does not have a valid email address.');
        return;
      }

      const result = await triggerPasswordResetAction(email);
      if (result.success) {
        toast.success(`Security reset initiated for ${profile.username}.`);
      } else {
        toast.error(result.message);
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
          <p>Update User</p>
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
            {isAdmin && (
              <SelectionField
                name="role_id"
                label="Role"
                control={control}
                isPending={isPending}
                options={roleOptions}
                transform={(val) => Number(val) as 0 | 1}
              />
            )}
          </div>
          {isOwner && (
            <>
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
                description="LEAVE BLANK TO KEEP CURRENT ANSWER."
              />
            </>
          )}
        </form>

        <SheetFooter className="mt-auto">
          <Button
            type="button"
            size="lg"
            onClick={handleResetPassword}
            disabled={isPending}
            variant="outline"
          >
            Send Reset Password
          </Button>
        </SheetFooter>
        <SheetFooter className="mt-0 border-t-2 border-border">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full flex  gap-2"
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
