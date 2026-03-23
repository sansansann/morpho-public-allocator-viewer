import { ReallocationItem } from '@/lib/types';
import { formatTokenAmount, formatRelativeTime, getMarketLabel } from '@/lib/formatters';

interface ReallocationHistoryProps {
  items: ReallocationItem[];
  assetDecimals: number;
  assetSymbol: string;
}

export function ReallocationHistory({ items, assetDecimals, assetSymbol }: ReallocationHistoryProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Recent Reallocations</h3>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Time</th>
              <th className="text-left px-6 py-3 font-medium">Market</th>
              <th className="text-right px-6 py-3 font-medium">Amount</th>
              <th className="text-center px-6 py-3 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {items.map((item, i) => (
              <tr key={`${item.timestamp}-${item.market.uniqueKey}-${item.type}`} className={`table-row-hover ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}>
                <td className="px-6 py-3.5 text-slate-500 text-xs font-mono">
                  {formatRelativeTime(item.timestamp)}
                </td>
                <td className="px-6 py-3.5 text-gray-200 text-sm">
                  {getMarketLabel(item.market.collateralAsset, item.market.loanAsset)}
                </td>
                <td className="px-6 py-3.5 text-right font-mono text-xs text-gray-200">
                  {formatTokenAmount(item.assets, assetDecimals)}{' '}
                  <span className="text-slate-600">{assetSymbol}</span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.type === 'ReallocateWithdraw' ? 'badge-outflow' : 'badge-inflow'
                    }`}
                  >
                    {item.type === 'ReallocateWithdraw' ? (
                      <>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                        Outflow
                      </>
                    ) : (
                      <>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        Inflow
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="sm:hidden p-4 space-y-3">
        {items.map((item, i) => (
          <div key={`${item.timestamp}-${item.market.uniqueKey}-${item.type}`} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200">
                {getMarketLabel(item.market.collateralAsset, item.market.loanAsset)}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.type === 'ReallocateWithdraw' ? 'badge-outflow' : 'badge-inflow'
                }`}
              >
                {item.type === 'ReallocateWithdraw' ? 'Outflow' : 'Inflow'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                {formatRelativeTime(item.timestamp)}
              </span>
              <span className="font-mono text-gray-200">
                {formatTokenAmount(item.assets, assetDecimals)}{' '}
                <span className="text-slate-600">{assetSymbol}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
