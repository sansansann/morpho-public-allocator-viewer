import { useQuery } from '@tanstack/react-query';
import { graphqlFetch } from '@/lib/graphql/client';
import { VAULTS_LIST_QUERY } from '@/lib/graphql/queries';

export interface VaultListItem {
  address: string;
  name: string;
  symbol: string;
  asset: { symbol: string; decimals: number };
  state: { totalAssetsUsd: number | null };
  publicAllocatorConfig: {
    fee: string;
    flowCaps: { market: { uniqueKey: string } }[];
  } | null;
  chain: { id: number; network: string };
}

interface VaultsListResponse {
  vaults: {
    items: VaultListItem[];
    pageInfo: { countTotal: number };
  };
}

export function useVaultsList(chainId: number) {
  return useQuery({
    queryKey: ['vaultsList', chainId],
    queryFn: async () => {
      const data = await graphqlFetch<VaultsListResponse>(
        VAULTS_LIST_QUERY,
        { chainId: [chainId], first: 50, skip: 0 }
      );
      return data.vaults;
    },
    staleTime: 5 * 60_000,
  });
}
