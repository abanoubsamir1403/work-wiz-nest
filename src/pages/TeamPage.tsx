import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, UserRole } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, User } from 'lucide-react';

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: ShieldCheck, color: 'text-destructive' },
  employee: { label: 'Employee', icon: Shield, color: 'text-primary' },
  intern: { label: 'Intern', icon: User, color: 'text-muted-foreground' },
};

const TeamPage = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<(Profile & { role?: UserRole; roleId?: string })[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTeam = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('name');
    const { data: roles } = await supabase.from('user_roles').select('*');

    const merged = (profiles || []).map((p) => {
      const userRole = roles?.find((r) => r.user_id === p.id);
      return {
        ...p,
        role: (userRole?.role as UserRole) || 'employee',
        roleId: userRole?.id,
      };
    });
    setMembers(merged);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (memberId === user?.id) {
      toast({ title: 'لا يمكنك تغيير صلاحياتك', variant: 'destructive' });
      return;
    }

    setUpdating(memberId);
    try {
      const member = members.find((m) => m.id === memberId);
      if (member?.roleId) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('id', member.roleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: memberId, role: newRole });
        if (error) throw error;
      }

      toast({ title: 'تم تحديث الصلاحيات بنجاح ✅' });
      await fetchTeam();
    } catch (err: any) {
      toast({ title: 'فشل تحديث الصلاحيات', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground mt-1">{members.length} members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => {
          const config = roleConfig[m.role || 'employee'];
          const RoleIcon = config.icon;
          const isCurrentUser = m.id === user?.id;

          return (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {m.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {m.name} {isCurrentUser && <span className="text-xs text-muted-foreground">(أنت)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RoleIcon className={`w-4 h-4 ${config.color}`} />
                <Select
                  value={m.role || 'employee'}
                  onValueChange={(val) => handleRoleChange(m.id, val as UserRole)}
                  disabled={isCurrentUser || updating === m.id}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">🛡️ Admin</SelectItem>
                    <SelectItem value="employee">👤 Employee</SelectItem>
                    <SelectItem value="intern">🎓 Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamPage;
