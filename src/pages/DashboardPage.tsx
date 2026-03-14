import { useEffect, useState } from 'react';
import { ListTodo, CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { Task } from '@/types';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { role, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from('tasks').select('*, assigned_user:profiles!tasks_assigned_to_fkey(*)');
      if (role !== 'admin') {
        query = query.eq('assigned_to', user?.id);
      }
      const { data } = await query.order('created_at', { ascending: false });
      setTasks(data || []);

      if (role === 'admin') {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        setTeamCount(count || 0);
      }
    };

    if (user) fetchData();
  }, [user, role]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    delayed: tasks.filter((t) => t.status === 'delayed').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of tasks and progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={stats.total} icon={ListTodo} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} trend={`${completionRate}% completion rate`} />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} />
        <StatCard title="Delayed" value={stats.delayed} icon={AlertTriangle} />
      </div>

      {role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Team Members" value={teamCount} icon={Users} />
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
            <p className="text-3xl font-bold mb-3">{completionRate}%</p>
            <ProgressBar value={completionRate} />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tasks yet</p>
            </div>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="task-row flex items-center justify-between"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {task.assigned_user?.name || 'Unassigned'} · Due {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressBar value={task.progress} className="w-24" />
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
