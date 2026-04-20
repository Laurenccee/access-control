// app/admin/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SecurityService } from '@/features/admin/services/admin';
import LiveTerminalLogs from '@/features/admin/components/LiveTerminalLogs';
import UserManagement from '@/features/admin/components/UserManagement';
import { SelectionsOptions } from '@/features/admin/services/options';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const profile = await SecurityService.getPersonalProfile(user.id);
  const options = await SelectionsOptions.getAllSecurityOptions();
  const roles = await SelectionsOptions.getAllRoles();

  if (profile.role_id !== 0) {
    redirect('/dashboard');
  }

  // Fetch data directly via our service
  const users = await SecurityService.getAllIdentities();
  const logs = await SecurityService.getSystemLogs();

  return (
    <section className="flex flex-col gap-8">
      <UserManagement
        initialUsers={users}
        currentUserId={user.id}
        securityQuestions={options}
        roles={roles}
      />
      <LiveTerminalLogs initialLogs={logs} />
    </section>
  );
}
