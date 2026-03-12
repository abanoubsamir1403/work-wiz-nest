import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  in_progress: { label: 'In Progress', className: 'bg-info/10 text-info' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
  delayed: { label: 'Delayed', className: 'bg-destructive/10 text-destructive' },
};

const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const config = statusConfig[status];
  return (
    <span className={cn('status-badge', config.className)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
