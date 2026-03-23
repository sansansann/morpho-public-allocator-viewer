import { PublicAllocatorConfig } from '@/lib/types';
import { formatFeeToEth } from '@/lib/formatters';

interface PublicAllocatorSummaryProps {
  config: PublicAllocatorConfig;
}

export function PublicAllocatorSummary({ config }: PublicAllocatorSummaryProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4">
        Public Allocator Configuration
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reallocation Fee</p>
          <p className="font-semibold text-gray-100 font-mono text-sm">{formatFeeToEth(config.fee)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Flow Cap Markets</p>
          <p className="font-semibold text-gray-100">{config.flowCaps.length}</p>
        </div>
      </div>
    </div>
  );
}
