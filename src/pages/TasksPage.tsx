import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TasksPage = () => {
  const { role, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      let query = supabase.from('tasks').select('*, assigned_user:profiles!tasks_assigned_to_fkey(*)');
      if (role !== 'admin') {
        query = query.eq('assigned_to', user?.id);
      }
      const { data } = await query.order('created_at', { ascending: false });
      setTasks(data || []);
    };

    if (user) fetchTasks();
  }, [user, role]);

  const filtered = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} tasks</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => navigate('/tasks/create')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((task) => (
          <div
            key={task.id}
            className="task-row flex items-center justify-between"
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <div className="flex-1 min-w-0 mr-4">
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Assigned to {task.assigned_user?.name || 'Unknown'} · Due{' '}
                {new Date(task.due_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-sm text-muted-foreground">{task.progress}%</span>
              <ProgressBar value={task.progress} className="w-24" />
              <StatusBadge status={task.status} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No tasks found</div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
