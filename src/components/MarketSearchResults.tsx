'use client';

import { MarketWithVaults } from '@/hooks/useMarketSearch';
import { formatFlowCap, formatUsd, formatLltv, getMarketLabel } from '@/lib/formatters';
import { MORPHO_APP_URL, CHAINS } from '@/lib/constants';

interface MarketSearchResultsProps {
  results: MarketWithVaults[];
  chainId: number;
  onSelectVault: (address: string, chainId: number) => void;
}

function formatTvl(value: number | null): string {
  if (value == null) return '—';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function MarketSearchResults({ results, chainId, onSelectVault }: MarketSearchResultsProps) {
  const chain = CHAINS[chainId];

  if (results.length === 0) {
    return (
      <div className="mt-6 p-6 rounded-xl border border-white/5 bg-white/[0.02] text-slate-500 text-center text-sm">
        No vaults with Public Allocator flow caps found for matching markets.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {results.map(({ market, vaults }) => {
        const marketLabel = getMarketLabel(market.collateralAsset, market.loanAsset);
        const decimals = market.loanAsset.decimals;

        return (
          <div key={market.uniqueKey} className="glass-card rounded-2xl overflow-hidden">
            {/* Market header */}
            <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center gap-3">
              <a
                href={`${MORPHO_APP_URL}/${chain?.name.toLowerCase()}/market/${market.uniqueKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold accent-text hover:opacity-80 transition-opacity"
              >
                {marketLabel}
              </a>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                {formatLltv(market.lltv)}
              </span>
              {market.state?.liquidityAssetsUsd != null && (
                <span className="text-xs text-slate-500">
                  Liquidity: <span className="text-slate-300">{formatUsd(market.state.liquidityAssetsUsd)}</span>
                </span>
              )}
              <span className="ml-auto text-xs text-slate-600">
                {vaults.length} vault{vaults.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                    <th className="text-left px-6 py-3 font-medium">Vault</th>
                    <th className="text-right px-6 py-3 font-medium">TVL</th>
                    <th className="text-right px-6 py-3 font-medium">Max In</th>
                    <th className="text-right px-6 py-3 font-medium">Max Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {vaults.map(({ vault, maxIn, maxOut }, i) => {
                    const fmtIn = formatFlowCap(maxIn, decimals);
                    const fmtOut = formatFlowCap(maxOut, decimals);
                    return (
                      <tr
                        key={vault.address}
                        className={`table-row-hover cursor-pointer ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}
                        onClick={() => onSelectVault(vault.address, chainId)}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-100 font-medium text-sm">
                              {vault.name || vault.symbol}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                              {vault.asset.symbol}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-300">
                          {formatTvl(vault.state.totalAssetsUsd)}
                        </td>
                        <td className={`px-6 py-3.5 text-right font-mono text-xs ${fmtIn.isDisabled ? 'text-red-400' : fmtIn.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                          {fmtIn.display}
                          {!fmtIn.isUnlimited && !fmtIn.isDisabled && (
                            <span className="text-slate-600 ml-1">{vault.asset.symbol}</span>
                          )}
                        </td>
                        <td className={`px-6 py-3.5 text-right font-mono text-xs ${fmtOut.isDisabled ? 'text-red-400' : fmtOut.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                          {fmtOut.display}
                          {!fmtOut.isUnlimited && !fmtOut.isDisabled && (
                            <span className="text-slate-600 ml-1">{vault.asset.symbol}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden p-4 space-y-3">
              {vaults.map(({ vault, maxIn, maxOut }) => {
                const fmtIn = formatFlowCap(maxIn, decimals);
                const fmtOut = formatFlowCap(maxOut, decimals);
                return (
                  <button
                    key={vault.address}
                    onClick={() => onSelectVault(vault.address, chainId)}
                    className="w-full text-left rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-100 font-medium text-sm line-clamp-1">
                        {vault.name || vault.symbol}
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {vault.asset.symbol}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500 uppercase tracking-wider mb-0.5">TVL</p>
                        <p className="font-mono text-slate-300">{formatTvl(vault.state.totalAssetsUsd)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-wider mb-0.5">Max In</p>
                        <p className={`font-mono ${fmtIn.isDisabled ? 'text-red-400' : fmtIn.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                          {fmtIn.display}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-wider mb-0.5">Max Out</p>
                        <p className={`font-mono ${fmtOut.isDisabled ? 'text-red-400' : fmtOut.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                          {fmtOut.display}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
