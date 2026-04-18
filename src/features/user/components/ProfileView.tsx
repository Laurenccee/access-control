import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Calendar,
  Mail,
  Fingerprint,
  Power,
  AlertTriangle,
  Clock,
  Trash,
  Edit,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import UpdateProfileSheetForm from './UpdateProfileSheetForm';
import DeleteUserDialog from './DeleteUserDialog';

interface ProfileViewProps {
  profile: any;
  isOwner: boolean;
}

export default function ProfileView({ profile, isOwner }: ProfileViewProps) {
  const isAdmin = profile.role_id === 0;
  const isDeleted = profile.is_active === false;
  const questionText = (profile.security_questions as any)?.question_text;

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      {/* 1. Deactivation Warning Banner */}
      {isDeleted && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 flex items-center gap-3 rounded-md">
          <AlertTriangle size={18} />
          <div className="text-[10px] uppercase tracking-widest font-bold">
            Notice: Account Deactivated on{' '}
            {new Date(profile.deleted_at).toLocaleDateString()}
          </div>
        </div>
      )}

      <Card className="border-border/60 shadow-none bg-background/50 backdrop-blur-sm relative overflow-hidden">
        {/* Subtle Background Pattern (Nothing Aesthetic) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px]" />

        <CardHeader className="border-b-2 border-border/40 pb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
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
            </div>
            <div className="flex items-center gap-1">
              <UpdateProfileSheetForm profile={profile} />
              <DeleteUserDialog
                userId={profile.id}
                username={profile.username}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Column 1: Identity & Access */}
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <Label className=" uppercase tracking-normal text-muted-foreground flex items-center gap-1">
                <Fingerprint size={12} /> User_Identifier
              </Label>
              <p className="font-mono text-xs break-all text-muted-foreground uppercase">
                {isOwner ? 'PROTECTED_BY_OWNER' : profile.id}
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
      <div className="p-4 border border-dashed border-border/60 rounded-none bg-muted/5 flex items-center justify-between">
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
