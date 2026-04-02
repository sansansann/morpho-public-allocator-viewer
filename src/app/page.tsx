'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VaultSearchBar } from '@/components/VaultSearchBar';
import { VaultInfoCard } from '@/components/VaultInfoCard';
import { PublicAllocatorSummary } from '@/components/PublicAllocatorSummary';
import { FlowCapsTable } from '@/components/FlowCapsTable';
import { ReallocateBuilder } from '@/components/ReallocateBuilder';
import { ReallocationHistory } from '@/components/ReallocationHistory';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { VaultList } from '@/components/VaultList';
import { MarketSearchResults } from '@/components/MarketSearchResults';
import { useVaultPublicAllocator } from '@/hooks/useVaultPublicAllocator';
import { useReallocationHistory } from '@/hooks/useReallocationHistory';
import { useMarketSearch } from '@/hooks/useMarketSearch';
import { CHAINS } from '@/lib/constants';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type SearchMode = 'vault' | 'market';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = (searchParams.get('mode') as SearchMode) || 'vault';
  const rawChain = Number(searchParams.get('chain')) || 1;
  const chainId = rawChain in CHAINS ? rawChain : 1;
  const searchAddress = searchParams.get('vault') || '';
  const marketKeyword = searchParams.get('q') || '';

  const [vaultInput, setVaultInput] = useState(searchAddress);
  const [marketInput, setMarketInput] = useState(marketKeyword);

  const debouncedKeyword = useDebounce(marketInput, 300);

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const url = new URLSearchParams();
      const merged = {
        mode,
        chain: String(chainId),
        vault: searchAddress,
        q: marketKeyword,
        ...params,
      };
      for (const [key, value] of Object.entries(merged)) {
        if (value && !(key === 'mode' && value === 'vault') && !(key === 'chain' && value === '1')) {
          url.set(key, value);
        }
      }
      // Remove empty params
      Array.from(url.keys()).forEach((key) => {
        if (!url.get(key)) url.delete(key);
      });
      router.push(`/?${url.toString()}`);
    },
    [mode, chainId, searchAddress, marketKeyword, router]
  );

  // Sync debounced market keyword to URL
  useEffect(() => {
    if (mode !== 'market') return;
    if (debouncedKeyword === marketKeyword) return;
    const url = new URLSearchParams();
    url.set('mode', 'market');
    if (chainId !== 1) url.set('chain', String(chainId));
    if (debouncedKeyword) url.set('q', debouncedKeyword);
    router.replace(`/?${url.toString()}`);
  }, [debouncedKeyword, mode, chainId, marketKeyword, router]);

  const {
    data: vault,
    isLoading,
    error,
    isFetching,
  } = useVaultPublicAllocator(searchAddress, chainId);

  const { data: reallocations } = useReallocationHistory(
    vault ? searchAddress : ''
  );

  const {
    data: marketResults,
    isLoading: marketLoading,
    error: marketError,
  } = useMarketSearch(marketKeyword, chainId);

  const handleSearch = useCallback(
    (address: string, chain: number) => {
      setVaultInput(address);
      updateUrl({ vault: address, chain: String(chain), mode: 'vault' });
    },
    [updateUrl]
  );

  const handleSelectVault = useCallback(
    (address: string, chain: number) => {
      setVaultInput(address);
      updateUrl({ vault: address, chain: String(chain), mode: 'vault', q: undefined });
    },
    [updateUrl]
  );

  const handleBackToList = useCallback(() => {
    setVaultInput('');
    updateUrl({ vault: undefined });
  }, [updateUrl]);

  const handleChainChange = useCallback(
    (id: number) => {
      updateUrl({ chain: String(id) });
    },
    [updateUrl]
  );

  const handleModeChange = useCallback(
    (newMode: SearchMode) => {
      const params: Record<string, string | undefined> = { mode: newMode };
      if (newMode === 'market') {
        params.vault = undefined;
      } else {
        params.q = undefined;
      }
      updateUrl(params);
    },
    [updateUrl]
  );

  const showingVault = !!searchAddress;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-50">
          Morpho <span className="accent-text">Public Allocator</span>
        </h1>
      </header>

      {/* Mode tabs */}
      <div className="glass-card rounded-2xl p-1.5 flex gap-1 mb-4 w-fit">
        <button
          onClick={() => handleModeChange('vault')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
            mode === 'vault'
              ? 'accent-gradient text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Vault Search
        </button>
        <button
          onClick={() => handleModeChange('market')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
            mode === 'market'
              ? 'accent-gradient text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Market Search
        </button>
      </div>

      {mode === 'vault' ? (
        <>
          <VaultSearchBar
            address={vaultInput}
            chainId={chainId}
            onAddressChange={setVaultInput}
            onChainChange={handleChainChange}
            onSearch={handleSearch}
            isLoading={isLoading || isFetching}
          />

          {showingVault ? (
            <>
              <div className="mt-4">
                <button
                  onClick={handleBackToList}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-300 transition-colors duration-150"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to vault list
                </button>
              </div>

              {isLoading && (
                <div className="flex justify-center py-20">
                  <LoadingSpinner />
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-center text-sm">
                  {error instanceof Error && error.message === 'Vault not found'
                    ? 'Vault not found. Please check the address and chain.'
                    : 'Failed to fetch vault data. Please try again.'}
                </div>
              )}

              {vault && !isLoading && (
                <div className="mt-6 space-y-4">
                  <VaultInfoCard vault={vault} chainId={chainId} />

                  {vault.publicAllocatorConfig ? (
                    <>
                      <PublicAllocatorSummary config={vault.publicAllocatorConfig} />
                      <FlowCapsTable
                        flowCaps={vault.publicAllocatorConfig.flowCaps}
                        allocations={vault.state.allocation}
                        assetDecimals={vault.asset.decimals}
                        assetSymbol={vault.asset.symbol}
                        chainId={chainId}
                      />
                      <ReallocateBuilder
                        vaultAddress={vault.address}
                        flowCaps={vault.publicAllocatorConfig.flowCaps}
                        allocations={vault.state.allocation}
                        assetDecimals={vault.asset.decimals}
                        assetSymbol={vault.asset.symbol}
                        fee={String(vault.publicAllocatorConfig.fee)}
                        chainId={chainId}
                      />
                      {reallocations && reallocations.length > 0 && (
                        <ReallocationHistory
                          items={reallocations}
                          assetDecimals={vault.asset.decimals}
                          assetSymbol={vault.asset.symbol}
                        />
                      )}
                    </>
                  ) : (
                    <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-center text-sm">
                      This vault does not have a Public Allocator configured.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <VaultList chainId={chainId} onSelectVault={handleSelectVault} />
          )}
        </>
      ) : (
        <>
          {/* Market search input */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={marketInput}
                onChange={(e) => setMarketInput(e.target.value)}
                placeholder="Search markets (e.g. wstETH, USDC, cbBTC)"
                className="input-field flex-1 px-4 py-2.5 rounded-xl text-gray-100 text-sm"
              />
              <select
                value={chainId}
                onChange={(e) => handleChainChange(Number(e.target.value))}
                className="input-field px-4 py-2.5 rounded-xl text-gray-100 text-sm"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                {Object.values(CHAINS).map((chain) => (
                  <option key={chain.id} value={chain.id} style={{ background: '#0f0f17' }}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>
            {marketInput.length > 0 && marketInput.length < 2 && (
              <p className="mt-2 text-xs text-slate-500">Type at least 2 characters to search</p>
            )}
          </div>

          {marketLoading && (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          )}

          {marketError && (
            <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-center text-sm">
              Failed to fetch market data. Please try again.
            </div>
          )}

          {marketResults && !marketLoading && (
            <MarketSearchResults
              results={marketResults}
              chainId={chainId}
              onSelectVault={handleSelectVault}
            />
          )}

          {marketKeyword.length < 2 && !marketLoading && (
            <div className="mt-6 p-6 rounded-xl border border-white/5 bg-white/[0.02] text-slate-500 text-center text-sm">
              Enter a market keyword to find vaults with flow caps configured for matching markets.
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
