import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Loader2,
  Mail,
  RectangleEllipsis,
  Shield,
  SquarePlus,
  User,
} from 'lucide-react';
import { useTransition } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { CreateUser, CreateUserSchema } from '../schemas/user';
import InputField from '@/components/shared/InputField';
import PasswordRulesCard from '@/features/auth/components/PasswordRulesCard';
import SelectionField from '@/components/shared/SelectionField';
import { zodResolver } from '@hookform/resolvers/zod';
import { addUserAction } from '../actions/user';
import { toast } from 'sonner';
import { Resolver } from 'react-hook-form';

interface Role {
  id: number;
  role_name: string;
}

interface CreateUserFormProps {
  securityQuestions: any[];
  roles: Role[];
}

export default function CreateUserForm({
  securityQuestions,
  roles,
}: CreateUserFormProps) {
  const [isPending, startTransistion] = useTransition();

  const roleOptions = roles.map((r) => ({
    value: String(r.id),
    label: r.role_name,
  }));

  const { control, handleSubmit, reset } = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema), // ← cast
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      role_id: 1,
      security_question_id: '',
      security_answer: '',
    },
  });

  const [passwordValue, confirmPasswordValue] = useWatch({
    control,
    name: ['password', 'confirmPassword'],
  }) as [string | undefined, string | undefined];

  const checkRules = (pw: string = '', confirmPw: string = '') => ({
    minLen: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    mustMatch: pw === confirmPw && pw.length > 0,
  });

  const rules = checkRules(passwordValue || '', confirmPasswordValue || '');

  const securityOptions = securityQuestions.map((q) => ({
    value: q.id,
    label: q.question_text,
  }));

  const handleCreateUser: SubmitHandler<CreateUser> = (data) => {
    startTransistion(async () => {
      try {
        const result = await addUserAction(data);

        if (result.success) {
          toast.success('Personnel created successfully!');
          reset();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('An unexpected error occurred. Please try again.');
        console.error('Form Submission Error:', error);
      }
    });
  };
  return (
    <Card className="border-border/60 flex-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2 uppercase tracking-wider">
          Create New User
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Fill out the form below to add a new user to the system.
        </CardDescription>
      </CardHeader>
      <form
        action=""
        onSubmit={handleSubmit(handleCreateUser)}
        id="user-create-form"
      >
        <CardContent className="flex flex-col gap-4">
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
          <div className="flex gap-2">
            <InputField
              name="password"
              label="Password"
              control={control}
              isPending={isPending}
              type="password"
              placeholder="Enter Password"
              leadingIcon={<RectangleEllipsis size={18} />}
            />
            <InputField
              name="confirmPassword"
              label="Confirm Password"
              control={control}
              isPending={isPending}
              type="password"
              placeholder="Confirm Password"
              leadingIcon={<RectangleEllipsis size={18} />}
            />
          </div>

          <PasswordRulesCard rules={rules} />
          <div className="flex gap-2">
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
              placeholder="Enter Security Answer"
              leadingIcon={<Shield size={18} />}
            />
          </div>
        </CardContent>
      </form>
      <CardFooter>
        <Button
          size="lg"
          type="submit"
          className="flex-1"
          form="user-create-form"
          disabled={isPending}
        >
          {isPending ? 'Creating...' : 'Create User'}
          {isPending ? <Loader2 className="animate-spin" /> : <SquarePlus />}
        </Button>
      </CardFooter>
    </Card>
  );
}
