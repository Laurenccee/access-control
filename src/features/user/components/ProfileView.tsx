import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Calendar,
  Mail,
  Fingerprint,
  Power,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import UpdateProfileSheetForm from './UpdateProfileSheetForm';
import DeleteUserDialog from './DeleteUserDialog';
import ReactivateUserDialog from './ReactivateUserDialog';
import { is } from 'zod/v4/locales';

interface ProfileViewProps {
  profile: any;
  isOwner: boolean;

  securityQuestions: any[];
  roles: Role[];
}
export interface Role {
  id: number;
  role_name: string;
}

export default function ProfileView({
  profile,
  isOwner,
  securityQuestions,
  roles,
}: ProfileViewProps) {
  const isAdmin = profile.role_id === 0;
  const isDeleted = profile.deleted_at !== null;
  const isActive = profile.is_active === true;
  const questionText = (profile.security_questions as any)?.question_text;

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      {/* 1. Deactivation Warning Banner */}
      {isDeleted && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 flex items-center gap-3 rounded-md">
          <AlertTriangle size={18} />
          <div className="text-[10px] uppercase tracking-widest font-bold">
            Notice: Account Deleted on{' '}
            {new Date(profile.deleted_at).toLocaleDateString()}
          </div>
        </div>
      )}
      {!isActive && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 flex items-center gap-3 rounded-md">
          <AlertTriangle size={18} />
          <div className="text-[10px] uppercase tracking-widest font-bold">
            Notice: Account Inactive
          </div>
        </div>
      )}

      <Card className="border-border/60 flex-1">
        <CardHeader className=" flex items-center pb-4 justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-2xl tracking-none">
              {profile.username}
            </CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge
                variant={isAdmin ? 'default' : 'secondary'}
                className="rounded-sm px-2 text-xs tracking-widest uppercase"
              >
                {isAdmin ? 'Admin_Access' : 'Standard_User'}
              </Badge>
              {isOwner && (
                <Badge
                  variant="outline"
                  className=" rounded-sm text-xs tracking-widest border-primary/20 text-primary"
                >
                  OWNER
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDeleted && isActive && (
              <>
                <UpdateProfileSheetForm
                  profile={profile}
                  securityQuestions={securityQuestions}
                  roles={roles}
                />
                <DeleteUserDialog
                  userId={profile.id}
                  username={profile.username}
                />
              </>
            )}

            {(isDeleted || !isActive) && (
              <ReactivateUserDialog
                userId={profile.id}
                username={profile.username}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="py-2 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Column 1: Identity & Access */}
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <Label className=" uppercase tracking-normal text-muted-foreground flex items-center gap-1">
                <Fingerprint size={12} /> User_Identifier
              </Label>
              <p className="font-mono text-xs break-all text-muted-foreground uppercase">
                {isOwner ? profile.id : 'PROTECTED_BY_OWNER'}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className=" uppercase tracking-normal text-muted-foreground flex items-center gap-1">
                <Mail size={12} /> Email_Address
              </Label>
              <p className=" font-mono text-xs uppercase text-muted-foreground">
                {profile.email || 'no_email_sync'}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className=" uppercase tracking-normal text-muted-foreground flex items-center gap-1">
                <Power size={12} /> System_Status
              </Label>
              <p className="font-mono text-xs uppercase tracking-tighter">
                {profile.is_active ? (
                  <span className="text-emerald-500 font-mono uppercase">
                    Account_Active
                  </span>
                ) : (
                  <span className="text-rose-500 font-mono uppercase">
                    Account_Inactive
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Column 2: Activity & Security (Task 7 Logs) */}
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <Label className=" uppercase tracking-normal text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> Last_Pulse
              </Label>
              <div className="flex flex-col">
                <p className="text-xs font-mono uppercase text-muted-foreground tracking-tighter">
                  {profile.last_seen ? (
                    new Date().getTime() -
                      new Date(profile.last_seen).getTime() <
                    120000 ? (
                      <span className="text-emerald-500 animate-pulse">
                        ONLINE_NOW
                      </span>
                    ) : (
                      formatDistanceToNow(new Date(profile.last_seen), {
                        addSuffix: true,
                      })
                    )
                  ) : (
                    'OFFLINE'
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className=" uppercase tracking-normal text-muted-foreground flex items-center gap-1">
                <Calendar size={12} /> Joined_Network
              </Label>
              <p className="text-xs font-mono uppercase tracking-tighter text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className=" uppercase tracking-normal text-muted-foreground flex items-center gap-1">
                <ShieldCheck size={12} /> Lockout_Status
              </Label>
              <p className="font-mono text-xs uppercase tracking-tighter">
                {profile.lockout_until &&
                new Date(profile.lockout_until) > new Date() ? (
                  <span className="text-rose-500 uppercase ">
                    Security_Lockout_Active
                  </span>
                ) : (
                  <span className="text-emerald-500 uppercase ">Clear</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Question (Only for Owner or Admin to verify it exists) */}
      <div className="p-4 border-2 border-dashed border-border/60 rounded-md bg-card/50 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-tighter flex items-center gap-1 text-muted-foreground">
            <Shield size={12} />
            Security_Challenge
          </p>
          <p className="text-sm italic">{questionText}</p>
        </div>
        <Badge variant="outline" className="text-xs uppercase tracking-tighter">
          Encrypted_Hash_Stored
        </Badge>
      </div>
    </section>
  );
}
