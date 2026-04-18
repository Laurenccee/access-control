import { createColumnHelper } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const columnHelper = createColumnHelper<any>();

export const useUserColumns = (
  currentUserId: string | undefined,
  onlineUsers: Record<string, any>, // ← non-optional, matches useUserPresence return type
  callbacks: { onView: (user: any) => void },
) => {
  const { onView } = callbacks; // ← destructure here

  return [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    }),
    columnHelper.accessor('username', { header: 'Username' }),
    columnHelper.accessor('role_id', {
      header: 'Role',
      cell: (info) => (info.getValue() === 0 ? 'Admin' : 'User'),
    }),
    columnHelper.accessor('last_seen', {
      header: 'Presence', // ← renamed, no longer duplicate
      cell: (info) => {
        const rowUserId = info.row.original.id;
        const isSelf = rowUserId === currentUserId;

        if (isSelf) return <Badge variant="active">Current</Badge>;

        const isOnline = rowUserId in onlineUsers; // safe — onlineUsers always defined

        return isOnline ? (
          <Badge variant="active">Online</Badge>
        ) : (
          <Badge variant="secondary">Offline</Badge>
        );
      },
    }),
    columnHelper.accessor('is_active', {
      header: 'Status',
      cell: (info) =>
        info.getValue() ? (
          <Badge>Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        ),
    }),
    columnHelper.accessor('lockout_until', {
      header: 'Lock Duration',
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()).toLocaleString()
          : 'Not Locked',
    }),
    columnHelper.accessor('created_at', {
      header: 'Created At',
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()).toLocaleDateString()
          : 'Unknown',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const lockout_until = row.original.lockout_until;
        const isLocked = lockout_until && new Date(lockout_until) > new Date();

        return (
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onView(row.original)} // ← no optional chain needed
                >
                  <Eye size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Profile</p>
              </TooltipContent>
            </Tooltip>
            {isLocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onView(row.original)}
                  >
                    <RefreshCcw size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset Attempts</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    }),
  ];
};
