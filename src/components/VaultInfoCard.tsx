import { VaultData } from '@/lib/types';
import { formatTokenAmount, formatUsd } from '@/lib/formatters';
import { AddressDisplay } from './AddressDisplay';

interface VaultInfoCardProps {
  vault: VaultData;
  chainId: number;
}

export function VaultInfoCard({ vault, chainId }: VaultInfoCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-50 tracking-tight">
              {vault.name}
            </h2>
            <span className="text-slate-500 text-sm font-mono">{vault.symbol}</span>
          </div>
          <div className="mt-1.5">
            <AddressDisplay address={vault.address} chainId={chainId} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {vault.publicAllocatorConfig ? (
            <span className="badge-active inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              PA Active
            </span>
          ) : (
            <span className="badge-inactive inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              PA Inactive
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Asset</p>
          <p className="font-semibold text-gray-100">{vault.asset.symbol}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Assets</p>
          <p className="font-semibold text-gray-100 font-mono text-sm">
            {formatTokenAmount(vault.state.totalAssets, vault.asset.decimals)}{' '}
            <span className="text-slate-400 font-sans font-normal text-xs">{vault.asset.symbol}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{formatUsd(vault.state.totalAssetsUsd)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Markets</p>
          <p className="font-semibold text-gray-100">{vault.state.allocation.length}</p>
        </div>
      </div>
    </div>
  );
}
