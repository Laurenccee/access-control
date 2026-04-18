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
import { Button } from '@/components/ui/button';
import { Trash, AlertTriangle } from 'lucide-react';
import { softDeleteUser } from '../actions/user';

interface DeleteUserDialogProps {
  userId: string;
  username: string;
}

export default function DeleteUserDialog({
  userId,
  username,
}: DeleteUserDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await softDeleteUser(userId);
      } catch (error) {
        console.error('Deactivation failed:', error);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="text-muted-foreground hover:text-rose-500 transition-colors"
          disabled={isPending}
        >
          <Trash size={16} />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 uppercase tracking-tighter text-rose-500">
            <AlertTriangle size={18} />
            Confirm_Deactivation
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs uppercase leading-relaxed">
            You are about to deactivate account:{' '}
            <span className="text-primary font-bold">{username}</span>. This
            will revoke all access tokens and mark the record as inactive in the
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
            onClick={handleDelete}
            className=" bg-destructive hover:bg-rose-700 uppercase text-xs tracking-widest"
          >
            {isPending ? 'Processing...' : 'Confirm Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
