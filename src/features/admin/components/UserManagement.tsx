'use client';

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
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

// Local Sub-components

interface UserManagementProps {
  initialUsers: any[];
  securityQuestions: any[];
  roles: any[];
  currentUserId?: string;
}

export default function UserManagement({
  initialUsers,
  securityQuestions,
  currentUserId,
  roles,
}: UserManagementProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState('');

  const onlineUsers = useUserPresence(currentUserId ?? '');
  // 1. Memoize columns to prevent unnecessary re-renders
  const columns = useUserColumns(currentUserId, onlineUsers, {
    onView: (user) => {
      router.push(`/user/${user.id}`);
    },
  });

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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Side: Summary/Header */}
      <CreateUserForm securityQuestions={securityQuestions} roles={roles} />

      {/* Right Side: Main Content */}
      <div className="flex-1/3">
        <Card className="border-border/60  h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 uppercase tracking-wider">
              User Management
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              View, search, and manage all user accounts in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <UserSearch value={globalFilter} onChange={setGlobalFilter} />
            <UserDataTable
              table={table}
              currentUserId={currentUserId}
              onlineUsers={onlineUsers}
            />
            <div className="mt-auto">
              <UserPagination table={table} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
