import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
}

const ProgressBar = ({ value, className }: ProgressBarProps) => {
  return (
    <div className={cn('w-full bg-muted rounded-full h-2', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

export default ProgressBar;
