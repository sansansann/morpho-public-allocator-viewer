'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  encodeFunctionData,
  keccak256,
  encodeAbiParameters,
  formatUnits,
  parseUnits,
  type Hex,
} from 'viem';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { FlowCap, Allocation } from '@/lib/types';
import { PUBLIC_ALLOCATOR_ABI, CHAINS } from '@/lib/constants';
import {
  formatTokenAmount,
  formatFeeToEth,
  formatAddress,
  getMarketLabel,
} from '@/lib/formatters';

interface MarketParams {
  loanToken: Hex;
  collateralToken: Hex;
  oracle: Hex;
  irm: Hex;
  lltv: bigint;
}

interface WithdrawalInput {
  marketKey: string;
  amount: string;
}

interface ReallocateBuilderProps {
  vaultAddress: string;
  flowCaps: FlowCap[];
  allocations: Allocation[];
  assetDecimals: number;
  assetSymbol: string;
  fee: string;
  chainId: number;
}

function getMarketId(params: MarketParams): bigint {
  return BigInt(
    keccak256(
      encodeAbiParameters(
        [
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'uint256' },
        ],
        [
          params.loanToken,
          params.collateralToken,
          params.oracle,
          params.irm,
          params.lltv,
        ]
      )
    )
  );
}

export function ReallocateBuilder({
  vaultAddress,
  flowCaps,
  allocations,
  assetDecimals,
  assetSymbol,
  fee,
  chainId,
}: ReallocateBuilderProps) {
  const [targetMarketKey, setTargetMarketKey] = useState('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalInput[]>([]);
  const [copied, setCopied] = useState<'calldata' | 'to' | 'value' | null>(
    null
  );

  // Wallet state
  const { address, isConnected, chain: connectedChain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
    reset: resetTx,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const needsChainSwitch = isConnected && connectedChain?.id !== chainId;

  const allocationMap = useMemo(() => {
    const map = new Map<string, Allocation>();
    for (const a of allocations) {
      map.set(a.market.uniqueKey, a);
    }
    return map;
  }, [allocations]);

  const activeMarkets = useMemo(
    () =>
      flowCaps.filter((fc) => {
        const hasFlowCap =
          String(fc.maxIn) !== '0' || String(fc.maxOut) !== '0';
        const allocation = allocationMap.get(fc.market.uniqueKey);
        if (!allocation) return false;
        if (String(allocation.supplyCap) === '0') return false;
        return hasFlowCap;
      }),
    [flowCaps, allocationMap]
  );

  const targetMarket = activeMarkets.find(
    (m) => m.market.uniqueKey === targetMarketKey
  );

  const sourceMarkets = useMemo(
    () =>
      activeMarkets.filter(
        (fc) =>
          fc.market.uniqueKey !== targetMarketKey &&
          String(fc.maxOut) !== '0'
      ),
    [activeMarkets, targetMarketKey]
  );

  const handleAddWithdrawal = useCallback(
    (marketKey: string) => {
      if (withdrawals.some((w) => w.marketKey === marketKey)) return;
      setWithdrawals((prev) => [...prev, { marketKey, amount: '' }]);
    },
    [withdrawals]
  );

  const handleRemoveWithdrawal = useCallback((marketKey: string) => {
    setWithdrawals((prev) => prev.filter((w) => w.marketKey !== marketKey));
  }, []);

  const handleAmountChange = useCallback(
    (marketKey: string, amount: string) => {
      setWithdrawals((prev) =>
        prev.map((w) => (w.marketKey === marketKey ? { ...w, amount } : w))
      );
    },
    []
  );

  const getSafeAmount = useCallback(
    (fc: FlowCap): string => {
      const maxOut = BigInt(String(fc.maxOut));
      const allocation = allocationMap.get(fc.market.uniqueKey);
      const supply = allocation ? BigInt(String(allocation.supplyAssets)) : BigInt(0);
      const liquidity = allocation?.market?.state
        ? BigInt(String(allocation.market.state.liquidityAssets))
        : BigInt(0);
      // Use 90% of liquidity to account for block-to-block fluctuation
      const safeLiquidity = (liquidity * BigInt(90)) / BigInt(100);
      let actual = maxOut < supply ? maxOut : supply;
      if (safeLiquidity < actual) actual = safeLiquidity;
      // Floor to integer token units (remove decimals)
      let unit = BigInt(1);
      for (let i = 0; i < assetDecimals; i++) unit = unit * BigInt(10);
      actual = (actual / unit) * unit;
      return formatUnits(actual, assetDecimals);
    },
    [assetDecimals, allocationMap]
  );

  const getMaxAmount = useCallback(
    (fc: FlowCap): string => {
      const maxOut = BigInt(String(fc.maxOut));
      const allocation = allocationMap.get(fc.market.uniqueKey);
      const supply = allocation ? BigInt(String(allocation.supplyAssets)) : BigInt(0);
      const liquidity = allocation?.market?.state
        ? BigInt(String(allocation.market.state.liquidityAssets))
        : BigInt(0);
      let actual = maxOut < supply ? maxOut : supply;
      if (liquidity < actual) actual = liquidity;
      return formatUnits(actual, assetDecimals);
    },
    [assetDecimals, allocationMap]
  );

  const handleSetMax = useCallback(
    (marketKey: string) => {
      const fc = activeMarkets.find(
        (m) => m.market.uniqueKey === marketKey
      );
      if (!fc) return;
      handleAmountChange(marketKey, getMaxAmount(fc));
    },
    [activeMarkets, getMaxAmount, handleAmountChange]
  );

  const buildMarketParams = useCallback(
    (fc: FlowCap): MarketParams | null => {
      const m = fc.market;
      if (!m.oracleAddress || !m.irmAddress) return null;
      return {
        loanToken: m.loanAsset.address as Hex,
        collateralToken: (m.collateralAsset?.address ??
          '0x0000000000000000000000000000000000000000') as Hex,
        oracle: m.oracleAddress as Hex,
        irm: m.irmAddress as Hex,
        lltv: BigInt(m.lltv),
      };
    },
    []
  );

  const txData = useMemo(() => {
    if (!targetMarket || withdrawals.length === 0) return null;

    const targetParams = buildMarketParams(targetMarket);
    if (!targetParams) return null;

    const withdrawalEntries: {
      marketParams: MarketParams;
      amount: bigint;
      id: bigint;
    }[] = [];

    for (const w of withdrawals) {
      const fc = activeMarkets.find(
        (m) => m.market.uniqueKey === w.marketKey
      );
      if (!fc || !w.amount || Number(w.amount) <= 0) continue;

      const params = buildMarketParams(fc);
      if (!params) continue;

      const rawAmount = parseUnits(w.amount, assetDecimals);
      withdrawalEntries.push({
        marketParams: params,
        amount: rawAmount,
        id: getMarketId(params),
      });
    }

    if (withdrawalEntries.length === 0) return null;

    // Sort by market ID ascending (required by contract)
    withdrawalEntries.sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );

    try {
      const calldata = encodeFunctionData({
        abi: PUBLIC_ALLOCATOR_ABI,
        functionName: 'reallocateTo',
        args: [
          vaultAddress as Hex,
          withdrawalEntries.map((e) => ({
            marketParams: e.marketParams,
            amount: e.amount,
          })),
          targetParams,
        ],
      });
      return { calldata, targetParams, withdrawalEntries };
    } catch {
      return null;
    }
  }, [
    targetMarket,
    withdrawals,
    activeMarkets,
    buildMarketParams,
    vaultAddress,
    assetDecimals,
  ]);

  const chain = CHAINS[chainId];
  const paAddress = chain?.publicAllocatorAddress ?? '';

  const handleCopy = useCallback(
    async (text: string, type: 'calldata' | 'to' | 'value') => {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    },
    []
  );

  const handleSendTx = useCallback(() => {
    if (!txData) return;
    resetTx();
    sendTransaction({
      to: paAddress as Hex,
      data: txData.calldata as Hex,
      value: BigInt(fee),
    });
  }, [txData, paAddress, fee, sendTransaction, resetTx]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              Reallocate Builder
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Generate and send{' '}
              <code className="text-indigo-400">reallocateTo</code>{' '}
              transactions
            </p>
          </div>

          {/* Wallet connection */}
          <div>
            {isConnected ? (
              <div className="flex items-center gap-2">
                {needsChainSwitch && (
                  <button
                    onClick={() => switchChain({ chainId })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                  >
                    Switch to {chain?.name}
                  </button>
                )}
                <span className="px-3 py-1.5 text-xs font-mono rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                  {formatAddress(address!)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                className="px-4 py-2 text-sm rounded-xl font-medium text-white accent-gradient hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* Target market selection */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
            Target Market (supply to)
          </label>
          <select
            value={targetMarketKey}
            onChange={(e) => {
              const newTarget = e.target.value;
              setTargetMarketKey(newTarget);
              resetTx();
              // Auto-populate sources, capped by target's maxIn
              if (newTarget) {
                const target = activeMarkets.find(
                  (m) => m.market.uniqueKey === newTarget
                );
                const maxIn = target
                  ? BigInt(String(target.maxIn))
                  : BigInt(0);
                // Also cap by target's remaining supply cap room
                const targetAlloc = allocationMap.get(newTarget);
                const capRoom = targetAlloc
                  ? BigInt(String(targetAlloc.supplyCap)) - BigInt(String(targetAlloc.supplyAssets))
                  : maxIn;
                const cap = maxIn < capRoom ? maxIn : capRoom;
                const sources = activeMarkets.filter(
                  (fc) =>
                    fc.market.uniqueKey !== newTarget &&
                    String(fc.maxOut) !== '0'
                );
                let remaining = cap;
                const entries: WithdrawalInput[] = [];
                for (const fc of sources) {
                  if (remaining <= BigInt(0)) break;
                  const maxRaw = parseUnits(getSafeAmount(fc), assetDecimals);
                  let use = maxRaw < remaining ? maxRaw : remaining;
                  // Floor to integer token units
                  let u = BigInt(1);
                  for (let i = 0; i < assetDecimals; i++) u = u * BigInt(10);
                  use = (use / u) * u;
                  if (use <= BigInt(0)) continue;
                  entries.push({
                    marketKey: fc.market.uniqueKey,
                    amount: formatUnits(use, assetDecimals),
                  });
                  remaining = remaining - use;
                }
                setWithdrawals(entries);
              } else {
                setWithdrawals([]);
              }
            }}
            className="input-field w-full px-4 py-2.5 rounded-xl text-gray-100 text-sm"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <option value="" style={{ background: '#0f0f17' }}>
              Select target market...
            </option>
            {activeMarkets
              .filter((fc) => String(fc.maxIn) !== '0')
              .map((fc) => (
                <option
                  key={fc.market.uniqueKey}
                  value={fc.market.uniqueKey}
                  style={{ background: '#0f0f17' }}
                >
                  {getMarketLabel(
                    fc.market.collateralAsset,
                    fc.market.loanAsset
                  )}{' '}
                  — Max In:{' '}
                  {formatTokenAmount(String(fc.maxIn), assetDecimals)}{' '}
                  {assetSymbol}
                </option>
              ))}
          </select>
        </div>

        {/* Source markets */}
        {targetMarketKey && (
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
              Source Markets (withdraw from)
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {sourceMarkets
                .filter(
                  (fc) =>
                    !withdrawals.some(
                      (w) => w.marketKey === fc.market.uniqueKey
                    )
                )
                .map((fc) => (
                  <button
                    key={fc.market.uniqueKey}
                    onClick={() =>
                      handleAddWithdrawal(fc.market.uniqueKey)
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
                  >
                    +{' '}
                    {getMarketLabel(
                      fc.market.collateralAsset,
                      fc.market.loanAsset
                    )}
                  </button>
                ))}
            </div>

            <div className="space-y-2">
              {withdrawals.map((w) => {
                const fc = activeMarkets.find(
                  (m) => m.market.uniqueKey === w.marketKey
                );
                if (!fc) return null;
                return (
                  <div
                    key={w.marketKey}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]"
                  >
                    <span className="text-sm text-gray-200 flex-shrink-0 min-w-[140px]">
                      {getMarketLabel(
                        fc.market.collateralAsset,
                        fc.market.loanAsset
                      )}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        value={w.amount}
                        onChange={(e) =>
                          handleAmountChange(w.marketKey, e.target.value)
                        }
                        placeholder="0.00"
                        className="input-field flex-1 px-3 py-1.5 rounded-lg text-gray-100 text-sm font-mono"
                        min="0"
                        step="any"
                      />
                      <span className="text-xs text-slate-500">
                        {assetSymbol}
                      </span>
                      <button
                        onClick={() => handleSetMax(w.marketKey)}
                        className="px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-md hover:border-indigo-500/40 transition-all"
                      >
                        MAX
                      </button>
                    </div>
                    <span className="text-xs text-slate-600 flex-shrink-0">
                      max:{' '}
                      {formatTokenAmount(
                        String(fc.maxOut),
                        assetDecimals
                      )}
                    </span>
                    <button
                      onClick={() => handleRemoveWithdrawal(w.marketKey)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action area */}
        {txData && (
          <div className="space-y-3 pt-2">
            <div className="h-px bg-white/5" />

            {/* Send transaction button */}
            <div className="flex flex-col gap-3">
              {!isConnected ? (
                <button
                  onClick={() => connect({ connector: injected() })}
                  className="w-full py-3 rounded-xl font-medium text-sm text-white accent-gradient hover:opacity-90 transition-opacity"
                >
                  Connect Wallet to Send
                </button>
              ) : needsChainSwitch ? (
                <button
                  onClick={() => switchChain({ chainId })}
                  className="w-full py-3 rounded-xl font-medium text-sm text-amber-100 bg-amber-600 hover:bg-amber-500 transition-colors"
                >
                  Switch to {chain?.name}
                </button>
              ) : (
                <button
                  onClick={handleSendTx}
                  disabled={isSending || isConfirming}
                  className="w-full py-3 rounded-xl font-medium text-sm text-white accent-gradient hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {isSending
                    ? 'Confirm in wallet...'
                    : isConfirming
                    ? 'Confirming...'
                    : `Send reallocateTo (fee: ${formatFeeToEth(String(fee))})`}
                </button>
              )}

              {/* Tx success */}
              {isConfirmed && txHash && (
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm flex items-center justify-between">
                  <span>Transaction confirmed!</span>
                  <a
                    href={`${chain?.explorerUrl}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline hover:text-emerald-300 transition-colors"
                  >
                    View on explorer
                  </a>
                </div>
              )}

              {/* Tx error */}
              {sendError && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm break-all">
                  {(sendError as Error).message?.includes('User rejected')
                    ? 'Transaction rejected by user'
                    : (sendError as Error).message?.slice(0, 200) ??
                      'Transaction failed'}
                </div>
              )}
            </div>

            {/* Calldata details (collapsible) */}
            <details className="group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
                View raw calldata
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 uppercase tracking-widest">
                      To (Public Allocator)
                    </span>
                    <button
                      onClick={() => handleCopy(paAddress, 'to')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {copied === 'to' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="block p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-emerald-400 font-mono break-all">
                    {paAddress}
                  </code>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 uppercase tracking-widest">
                      Value (Fee)
                    </span>
                    <button
                      onClick={() => handleCopy(String(fee), 'value')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {copied === 'value' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="block p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-amber-400 font-mono">
                    {fee} wei ({formatFeeToEth(String(fee))})
                  </code>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 uppercase tracking-widest">
                      Calldata
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(txData.calldata, 'calldata')
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {copied === 'calldata' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="block p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-indigo-300 font-mono break-all max-h-40 overflow-y-auto">
                    {txData.calldata}
                  </code>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
