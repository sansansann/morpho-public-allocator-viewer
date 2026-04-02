import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import type { Chain } from 'wagmi/chains';

const monad: Chain = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' } },
};

const katana: Chain = {
  id: 747474,
  name: 'Katana',
  nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
  rpcUrls: { default: { http: ['https://api.roninchain.com/rpc'] } },
  blockExplorers: { default: { name: 'Ronin Explorer', url: 'https://app.roninchain.com' } },
};

const hyperEVM: Chain = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.hyperliquid.xyz/evm'] } },
  blockExplorers: { default: { name: 'HyperEVM Explorer', url: 'https://explorer.hyperliquid.xyz' } },
};

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, monad, katana, hyperEVM],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [monad.id]: http(),
    [katana.id]: http(),
    [hyperEVM.id]: http(),
  },
});
