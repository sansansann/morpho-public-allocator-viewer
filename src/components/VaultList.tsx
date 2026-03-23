'use client';

import { useVaultsList } from '@/hooks/useVaultsList';

interface VaultListProps {
  chainId: number;
  onSelectVault: (address: string, chainId: number) => void;
}

function formatUsd(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function VaultList({ chainId, onSelectVault }: VaultListProps) {
  const { data, isLoading, error } = useVaultsList(chainId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner-ring" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-center text-sm">
        Failed to load vaults. Please try again.
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="mt-4 p-6 rounded-xl border border-white/5 bg-white/2 text-slate-500 text-center text-sm">
        No vaults with Public Allocator found on this chain.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">
          Vaults with Public Allocator
        </h2>
        <span className="text-xs text-slate-600 tabular-nums">
          {data.pageInfo.countTotal} total
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {data.items.map((vault) => {
          const flowCapCount = vault.publicAllocatorConfig?.flowCaps.length ?? 0;
          return (
            <button
              key={`${vault.chain.id}-${vault.address}`}
              onClick={() => onSelectVault(vault.address, vault.chain.id)}
              className="glass-card rounded-xl p-4 text-left w-full hover:border-indigo-500/40 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 focus:ring-offset-transparent"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-gray-100 leading-snug line-clamp-1 flex-1">
                  {vault.name || vault.symbol}
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  {vault.asset.symbol}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-xs text-slate-500">
                  {flowCapCount} flow cap {flowCapCount === 1 ? 'market' : 'markets'}
                </span>
                <span className="text-sm font-mono font-medium text-slate-200 tabular-nums">
                  {formatUsd(vault.state.totalAssetsUsd)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
