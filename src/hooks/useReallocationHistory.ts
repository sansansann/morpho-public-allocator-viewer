import { useQuery } from '@tanstack/react-query';
import { graphqlFetch } from '@/lib/graphql/client';
import { VAULT_REALLOCATES_QUERY } from '@/lib/graphql/queries';
import { ReallocationItem } from '@/lib/types';

interface ReallocatesResponse {
  publicAllocatorReallocates: {
    items: ReallocationItem[];
  };
}

export function useReallocationHistory(vaultAddress: string) {
  return useQuery({
    queryKey: ['reallocationHistory', vaultAddress],
    queryFn: async () => {
      const data = await graphqlFetch<ReallocatesResponse>(
        VAULT_REALLOCATES_QUERY,
        { vaultAddress: [vaultAddress] }
      );
      return data.publicAllocatorReallocates.items;
    },
    enabled: !!vaultAddress,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
