import { useQuery } from '@tanstack/react-query';
import { graphqlFetch } from '@/lib/graphql/client';
import { VAULT_PUBLIC_ALLOCATOR_QUERY } from '@/lib/graphql/queries';
import { VaultData } from '@/lib/types';
import { isValidAddress } from '@/lib/formatters';

interface VaultResponse {
  vaultByAddress: VaultData | null;
}

export function useVaultPublicAllocator(vaultAddress: string, chainId: number) {
  return useQuery({
    queryKey: ['vaultPublicAllocator', vaultAddress, chainId],
    queryFn: async () => {
      const data = await graphqlFetch<VaultResponse>(
        VAULT_PUBLIC_ALLOCATOR_QUERY,
        { address: vaultAddress, chainId }
      );
      if (!data.vaultByAddress) {
        throw new Error('Vault not found');
      }
      return data.vaultByAddress;
    },
    enabled: !!vaultAddress && isValidAddress(vaultAddress),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 3,
  });
}
