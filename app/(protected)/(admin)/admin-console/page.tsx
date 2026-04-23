// app/admin/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SecurityService } from '@/features/admin/services/admin';
import LiveTerminalLogs from '@/features/admin/components/LiveTerminalLogs';
import UserManagement from '@/features/admin/components/UserManagement';
import { SelectionsOptions } from '@/features/admin/services/options';

interface AdminPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const profile = await SecurityService.getPersonalProfile(user.id);
  const options = await SelectionsOptions.getAllSecurityOptions();
  const roles = await SelectionsOptions.getAllRoles();

  if (profile.role_id !== 0) {
    redirect('/user'); // Redirect non-admins to their dashboard
  }

  // Fetch data directly via our service
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  const { users, total } = await SecurityService.getAllIdentities({
    limit: pageSize,
    offset,
  });
  const logs = await SecurityService.getSystemLogs();

  return (
    <section className="flex flex-col gap-8">
      <UserManagement
        initialUsers={users}
        totalUsers={total}
        page={page}
        pageSize={pageSize}
        currentUserId={user.id}
        securityQuestions={options}
        roles={roles}
        adminName={profile.username}
      />
      <LiveTerminalLogs initialLogs={logs} />
    </section>
  );
}
