import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Comment, Attachment, TaskStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('tasks')
      .select('*, assigned_user:profiles!tasks_assigned_to_fkey(*)')
      .eq('id', id)
      .single();
    setTask(data);

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, user:profiles!comments_user_id_fkey(*)')
      .eq('task_id', id)
      .order('created_at', { ascending: true });
    setComments(commentsData || []);

    const { data: attachmentsData } = await supabase
      .from('attachments')
      .select('*')
      .eq('task_id', id);
    setAttachments(attachmentsData || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const updateStatus = async (status: TaskStatus) => {
    if (!task) return;
    await supabase.from('tasks').update({ status }).eq('id', task.id);
    setTask({ ...task, status });
    toast.success('Status updated');
  };

  const updateProgress = async (value: number[]) => {
    if (!task) return;
    const progress = value[0];
    await supabase.from('tasks').update({ progress }).eq('id', task.id);
    setTask({ ...task, progress });
  };

  const addComment = async () => {
    if (!newComment.trim() || !task || !user) return;
    const { error } = await supabase.from('comments').insert({
      task_id: task.id,
      user_id: user.id,
      comment: newComment.trim(),
    });
    if (error) {
      toast.error('Failed to add comment');
      return;
    }
    setNewComment('');
    fetchTask();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !user) return;

    const filePath = `${task.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
    if (uploadError) {
      toast.error('Upload failed');
      return;
    }

    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);

    await supabase.from('attachments').insert({
      task_id: task.id,
      file_url: urlData.publicUrl,
      file_name: file.name,
      uploaded_by: user.id,
    });

    toast.success('File uploaded');
    fetchTask();
  };

  const deleteTask = async () => {
    if (!task) return;
    await supabase.from('tasks').delete().eq('id', task.id);
    toast.success('Task deleted');
    navigate('/tasks');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  if (!task) {
    return <div className="text-center py-16 text-muted-foreground">Task not found</div>;
  }

  const canEdit = role === 'admin' || task.assigned_to === user?.id;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground mt-1">
              Assigned to {task.assigned_user?.name || 'Unknown'} · Due{' '}
              {new Date(task.due_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            {role === 'admin' && (
              <Button variant="destructive" size="icon" onClick={deleteTask}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-foreground/80 mb-6">{task.description}</p>

        {canEdit && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={task.status} onValueChange={(v) => updateStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Progress: {task.progress}%</label>
              <Slider
                value={[task.progress]}
                onValueCommit={updateProgress}
                max={100}
                step={5}
                className="mt-3"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ProgressBar value={task.progress} className="flex-1" />
          <span className="text-sm font-medium">{task.progress}%</span>
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Attachments</h2>
        <div className="space-y-2 mb-4">
          {attachments.map((att) => (
            <a
              key={att.id}
              href={att.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Paperclip className="w-4 h-4" />
              {att.file_name}
            </a>
          ))}
          {attachments.length === 0 && <p className="text-sm text-muted-foreground">No attachments</p>}
        </div>
        {canEdit && (
          <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
            <Paperclip className="w-4 h-4" />
            Upload file
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        )}
      </div>

      {/* Comments */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        <div className="space-y-4 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {c.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium">{c.user?.name || 'Unknown'}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </p>
                <p className="text-sm mt-1">{c.comment}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet</p>}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button size="icon" onClick={addComment} disabled={!newComment.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
