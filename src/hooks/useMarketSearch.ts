import { useQuery } from '@tanstack/react-query';
import { graphqlFetch } from '@/lib/graphql/client';
import { MARKETS_SEARCH_QUERY, MARKET_BY_UNIQUEKEY_QUERY, VAULTS_BY_MARKET_QUERY } from '@/lib/graphql/queries';

interface MarketSearchItem {
  uniqueKey: string;
  loanAsset: { symbol: string; address: string; decimals: number };
  collateralAsset: { symbol: string; address: string; decimals: number } | null;
  lltv: string;
  state: {
    supplyAssetsUsd: number | null;
    borrowAssetsUsd: number | null;
    liquidityAssetsUsd: number | null;
  } | null;
}

interface FlowCapResult {
  market: {
    uniqueKey: string;
    loanAsset: { symbol: string };
    collateralAsset: { symbol: string } | null;
  };
  maxIn: string;
  maxOut: string;
}

export interface VaultWithFlowCaps {
  address: string;
  name: string;
  symbol: string;
  asset: { symbol: string; decimals: number };
  state: { totalAssetsUsd: number | null };
  publicAllocatorConfig: {
    fee: string;
    flowCaps: FlowCapResult[];
  } | null;
}

export interface MarketWithVaults {
  market: MarketSearchItem;
  vaults: {
    vault: VaultWithFlowCaps;
    maxIn: string;
    maxOut: string;
  }[];
}

function isMarketId(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function useMarketSearch(search: string, chainId: number) {
  const isIdSearch = isMarketId(search);

  const marketsQuery = useQuery({
    queryKey: ['marketsSearch', search, chainId],
    queryFn: async () => {
      if (isIdSearch) {
        const data = await graphqlFetch<{
          markets: { items: MarketSearchItem[] };
        }>(MARKET_BY_UNIQUEKEY_QUERY, { uniqueKey: [search], chainId: [chainId] });
        return data.markets.items;
      }
      const data = await graphqlFetch<{
        markets: { items: MarketSearchItem[] };
      }>(MARKETS_SEARCH_QUERY, { search, chainId: [chainId] });
      return data.markets.items;
    },
    enabled: isIdSearch ? search.length === 66 : search.length >= 2,
    staleTime: 60_000,
  });

  const vaultsQuery = useQuery({
    queryKey: ['vaultsByMarket', marketsQuery.data?.map(m => m.uniqueKey), chainId],
    queryFn: async () => {
      const marketKeys = marketsQuery.data!.map(m => m.uniqueKey);
      const data = await graphqlFetch<{
        vaults: { items: VaultWithFlowCaps[] };
      }>(VAULTS_BY_MARKET_QUERY, {
        marketUniqueKey: marketKeys,
        chainId: [chainId],
      });

      const results: MarketWithVaults[] = marketsQuery.data!.map(market => {
        const matchingVaults = data.vaults.items
          .filter(v => v.publicAllocatorConfig?.flowCaps.some(
            fc => fc.market.uniqueKey === market.uniqueKey
          ))
          .map(vault => {
            const flowCap = vault.publicAllocatorConfig!.flowCaps.find(
              fc => fc.market.uniqueKey === market.uniqueKey
            )!;
            return { vault, maxIn: flowCap.maxIn, maxOut: flowCap.maxOut };
          });
        return { market, vaults: matchingVaults };
      }).filter(r => r.vaults.length > 0);

      return results;
    },
    enabled: !!marketsQuery.data && marketsQuery.data.length > 0,
    staleTime: 60_000,
  });

  return {
    data: vaultsQuery.data,
    isLoading: marketsQuery.isLoading || (marketsQuery.isSuccess && vaultsQuery.isLoading),
    error: marketsQuery.error || vaultsQuery.error,
  };
}
