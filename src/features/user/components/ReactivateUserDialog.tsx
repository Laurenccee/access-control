'use client';

import { useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, Loader2 } from 'lucide-react';
import { reactivateUser, softDeleteUser } from '../actions/user';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ReactivateUserDialogProps {
  userId: string;
  username: string;
}

export default function ReactivateUserDialog({
  userId,
  username,
}: ReactivateUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivateUser(userId);
      if (result.success) {
        toast.success(`Account ${username} reactivated.`);
        router.replace('/');
      } else {
        toast.error(result.message || 'Reactivation failed.');
      }
    });
  };

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="text-muted-foreground hover:text-emerald-500 transition-colors"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Key size={16} />
              )}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reactivate User</p>
        </TooltipContent>
      </Tooltip>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 uppercase tracking-tighter text-rose-500">
            <AlertTriangle size={18} />
            Confirm_Reactivate
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs uppercase leading-relaxed">
            You are about to reactivate account:{' '}
            <span className="text-primary font-bold">{username}</span>. This
            will restore access tokens and mark the record as active in the
            database.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel
            variant="ghost"
            className=" uppercase text-xs tracking-widest"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReactivate}
            className=" bg-destructive hover:bg-rose-700 uppercase text-xs tracking-widest"
          >
            {isPending ? 'Processing...' : 'Confirm Reactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
