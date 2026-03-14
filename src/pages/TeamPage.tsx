import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole } from '@/types';

const TeamPage = () => {
  const [members, setMembers] = useState<(Profile & { role?: UserRole })[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').order('name');
      const { data: roles } = await supabase.from('user_roles').select('*');

      const merged = (profiles || []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role as UserRole | undefined,
      }));
      setMembers(merged);
    };
    fetchTeam();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground mt-1">{members.length} members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <div key={m.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {m.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.email}</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="status-badge bg-primary/10 text-primary capitalize">{m.role || 'employee'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
