'use client';

import { Suspense, useState, useTransition } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { useUserColumns } from '../hooks/useUserColumns';
import UserSearch from './UserSearch';
import UserDataTable from './UserDataTable';
import UserPagination from './UserPagenantion';
import CreateUserForm from './CreateUserForm';
import { useRouter } from 'next/navigation';
import { useUserPresence } from '@/hooks/useUserPresence';
import { SecurityService } from '../services/admin';
import { start } from 'repl';
import { resetUserLockout } from '../actions/user';
import { toast } from 'sonner';

// Local Sub-components

interface UserManagementProps {
  initialUsers: any[];
  securityQuestions: any[];
  roles: any[];
  currentUserId?: string;
  totalUsers?: number;
  page?: number;
  pageSize?: number;
  adminName?: string; // ← new prop for admin username
}

export default function UserManagement({
  initialUsers,
  securityQuestions,
  currentUserId,
  roles,
  totalUsers,
  page,
  pageSize,
  adminName,
}: UserManagementProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const onlineUsers = useUserPresence(currentUserId ?? '');
  const columns = useUserColumns(currentUserId, onlineUsers, {
    onView: (user) => {
      router.push(`/user/${user.id}`);
    },
    onResetLockout: handleResetLockout,
  });

  const handlePageChange = (newPage: number) => {
    router.push(`?page=${newPage}`);
  };

  // 2. Setup table with built-in filtering
  const table = useReactTable({
    data: initialUsers,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  async function handleResetLockout(userId: string) {
    startTransition(async () => {
      try {
        const result = await resetUserLockout(
          userId,
          adminName || 'Unknown Admin',
        );
        if (result.success) {
          toast.success('User lockout has been reset successfully.');
          router.refresh(); // Refresh to show updated status
        }
      } catch (error) {
        console.error('Error resetting user lockout:', error);
        toast.error('Failed to reset user lockout.');
      }
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Side: Summary/Header */}
      <CreateUserForm securityQuestions={securityQuestions} roles={roles} />

      {/* Right Side: Main Content */}
      <div className="flex-1/3">
        <Card className="border-border/60  h-full">
          <CardHeader className="grid md:grid-cols-2 items-start">
            <div className="flex flex-col pb-4">
              <CardTitle className="text-base flex items-center gap-2 uppercase tracking-wider">
                User Management
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                View, search, and manage all user accounts in the system.
              </CardDescription>
            </div>
            <UserSearch value={globalFilter} onChange={setGlobalFilter} />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <UserDataTable
              table={table}
              currentUserId={currentUserId}
              onlineUsers={onlineUsers}
            />
            <div className="mt-auto">
              <UserPagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={totalUsers}
                onPageChange={handlePageChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
