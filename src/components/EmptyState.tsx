import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradient?: {
    from: string;
    to: string;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  gradient = { from: '#FFB88C', to: '#FF6F91' }
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: `linear-gradient(to right, ${gradient.from}10, ${gradient.to}10)`
        }}
      >
        <Icon className="w-10 h-10" style={{ color: gradient.from }} />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-xs mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r via-[#FF6F91] text-white"
          style={{
            backgroundImage: `linear-gradient(to right, ${gradient.from}, #FF6F91, ${gradient.to})`
          }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
