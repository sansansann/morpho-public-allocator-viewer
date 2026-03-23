'use client';

import { useState, useMemo } from 'react';
import { FlowCap, Allocation, SortField, SortDirection } from '@/lib/types';
import { formatFlowCap, formatTokenAmount, formatUsd, formatLltv, getMarketLabel } from '@/lib/formatters';
import { MORPHO_APP_URL, CHAINS } from '@/lib/constants';

interface FlowCapsTableProps {
  flowCaps: FlowCap[];
  allocations: Allocation[];
  assetDecimals: number;
  assetSymbol: string;
  chainId: number;
}

export function FlowCapsTable({
  flowCaps,
  allocations,
  assetDecimals,
  assetSymbol,
  chainId,
}: FlowCapsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const allocationMap = useMemo(() => {
    const map = new Map<string, Allocation>();
    for (const a of allocations) {
      map.set(a.market.uniqueKey, a);
    }
    return map;
  }, [allocations]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const activeFlowCaps = useMemo(
    () => flowCaps.filter((fc) => {
      const hasFlowCap = String(fc.maxIn) !== '0' || String(fc.maxOut) !== '0';
      const allocation = allocationMap.get(fc.market.uniqueKey);
      if (!allocation) return false;
      if (String(allocation.supplyCap) === '0') return false;
      return hasFlowCap;
    }),
    [flowCaps, allocationMap]
  );

  const sortedFlowCaps = useMemo(() => {
    if (!sortField) return activeFlowCaps;

    return [...activeFlowCaps].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      if (sortField === 'maxIn') {
        aVal = Number(a.maxIn);
        bVal = Number(b.maxIn);
      } else if (sortField === 'maxOut') {
        aVal = Number(a.maxOut);
        bVal = Number(b.maxOut);
      } else if (sortField === 'liquidity') {
        const aAlloc = allocationMap.get(a.market.uniqueKey);
        const bAlloc = allocationMap.get(b.market.uniqueKey);
        aVal = Number(aAlloc?.market?.state?.liquidityAssets ?? 0);
        bVal = Number(bAlloc?.market?.state?.liquidityAssets ?? 0);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [activeFlowCaps, sortField, sortDirection, allocationMap]);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 hover:text-indigo-300 transition-colors"
    >
      {label}
      <span className={`text-xs transition-colors ${sortField === field ? 'text-indigo-400' : 'text-slate-700'}`}>
        {sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );

  const chain = CHAINS[chainId];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Flow Caps</h3>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Market</th>
              <th className="text-right px-6 py-3 font-medium">LLTV</th>
              <th className="text-right px-6 py-3 font-medium">
                <SortButton field="maxIn" label="Max In" />
              </th>
              <th className="text-right px-6 py-3 font-medium">
                <SortButton field="maxOut" label="Max Out" />
              </th>
              <th className="text-right px-6 py-3 font-medium">
                <SortButton field="liquidity" label="Liquidity" />
              </th>
              <th className="text-right px-6 py-3 font-medium">Supply Cap</th>
              <th className="text-right px-6 py-3 font-medium">Current Supply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sortedFlowCaps.map((fc, i) => {
              const allocation = allocationMap.get(fc.market.uniqueKey);
              const maxIn = formatFlowCap(fc.maxIn, assetDecimals);
              const maxOut = formatFlowCap(fc.maxOut, assetDecimals);

              return (
                <tr
                  key={fc.market.uniqueKey}
                  className={`table-row-hover ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}
                >
                  <td className="px-6 py-3.5">
                    <a
                      href={`${MORPHO_APP_URL}/${chain?.name.toLowerCase()}/market/${fc.market.uniqueKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors"
                    >
                      {getMarketLabel(fc.market.collateralAsset, fc.market.loanAsset)}
                    </a>
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-400 font-mono text-xs">
                    {formatLltv(fc.market.lltv)}
                  </td>
                  <td className={`px-6 py-3.5 text-right font-mono text-xs ${maxIn.isDisabled ? 'text-red-400' : maxIn.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {maxIn.display}
                    {!maxIn.isUnlimited && !maxIn.isDisabled && (
                      <span className="text-slate-600 ml-1">{assetSymbol}</span>
                    )}
                  </td>
                  <td className={`px-6 py-3.5 text-right font-mono text-xs ${maxOut.isDisabled ? 'text-red-400' : maxOut.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {maxOut.display}
                    {!maxOut.isUnlimited && !maxOut.isDisabled && (
                      <span className="text-slate-600 ml-1">{assetSymbol}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {allocation?.market?.state ? (
                      <>
                        <span className="font-mono text-xs text-gray-200">
                          {formatTokenAmount(allocation.market.state.liquidityAssets, assetDecimals)}
                          <span className="text-slate-600 ml-1">{assetSymbol}</span>
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatUsd(allocation.market.state.liquidityAssetsUsd)}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-xs">
                    {allocation ? (
                      <span className="text-gray-200">
                        {formatTokenAmount(allocation.supplyCap, assetDecimals)}
                        <span className="text-slate-600 ml-1">{assetSymbol}</span>
                      </span>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-xs">
                    {allocation ? (
                      <>
                        <span className="text-gray-200">
                          {formatTokenAmount(allocation.supplyAssets, assetDecimals)}
                          <span className="text-slate-600 ml-1">{assetSymbol}</span>
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatUsd(allocation.supplyAssetsUsd)}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden p-4 space-y-3">
        {sortedFlowCaps.map((fc) => {
          const allocation = allocationMap.get(fc.market.uniqueKey);
          const maxIn = formatFlowCap(fc.maxIn, assetDecimals);
          const maxOut = formatFlowCap(fc.maxOut, assetDecimals);

          return (
            <div
              key={fc.market.uniqueKey}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <a
                  href={`${MORPHO_APP_URL}/${chain?.name.toLowerCase()}/market/${fc.market.uniqueKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                >
                  {getMarketLabel(fc.market.collateralAsset, fc.market.loanAsset)}
                </a>
                <span className="text-xs text-slate-500 font-mono">{formatLltv(fc.market.lltv)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Max In</p>
                  <p className={`font-mono text-xs ${maxIn.isDisabled ? 'text-red-400' : maxIn.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {maxIn.display}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Max Out</p>
                  <p className={`font-mono text-xs ${maxOut.isDisabled ? 'text-red-400' : maxOut.isUnlimited ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {maxOut.display}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Liquidity</p>
                  <p className="font-mono text-xs text-gray-200">
                    {allocation?.market?.state
                      ? formatTokenAmount(allocation.market.state.liquidityAssets, assetDecimals)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Current Supply</p>
                  <p className="font-mono text-xs text-gray-200">
                    {allocation ? formatTokenAmount(allocation.supplyAssets, assetDecimals) : '—'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
