import { ChainConfig } from './types';

export const CHAINS: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: 'Ethereum',
    explorerUrl: 'https://etherscan.io',
    publicAllocatorAddress: '0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D',
  },
  42161: {
    id: 42161,
    name: 'Arbitrum',
    explorerUrl: 'https://arbiscan.io',
    publicAllocatorAddress: '0x769583Af5e9D03589F159EbEC31Cc2c23E8C355E',
  },
  143: {
    id: 143,
    name: 'Monad',
    explorerUrl: 'https://explorer.monad.xyz',
    publicAllocatorAddress: '0xfd70575B732F9482F4197FE1075492e114E97302',
  },
  747474: {
    id: 747474,
    name: 'Katana',
    explorerUrl: 'https://app.roninchain.com',
    publicAllocatorAddress: '0x39EB6Da5e88194C82B13491Df2e8B3E213eD2412',
  },
  999: {
    id: 999,
    name: 'HyperEVM',
    explorerUrl: 'https://explorer.hyperliquid.xyz',
    publicAllocatorAddress: '0x517505be22D9068687334e69ae7a02fC77edf4Fc',
  },
};

export const MORPHO_API_URL = 'https://api.morpho.org/graphql';

export const UINT128_MAX = '340282366920938463463374607431768211455';

export const PUBLIC_ALLOCATOR_ABI = [
  {
    inputs: [{ name: 'vault', type: 'address' }],
    name: 'fee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'vault', type: 'address' }],
    name: 'admin',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'vault', type: 'address' },
      {
        name: 'withdrawals',
        type: 'tuple[]',
        components: [
          {
            name: 'marketParams',
            type: 'tuple',
            components: [
              { name: 'loanToken', type: 'address' },
              { name: 'collateralToken', type: 'address' },
              { name: 'oracle', type: 'address' },
              { name: 'irm', type: 'address' },
              { name: 'lltv', type: 'uint256' },
            ],
          },
          { name: 'amount', type: 'uint128' },
        ],
      },
      {
        name: 'supplyMarketParams',
        type: 'tuple',
        components: [
          { name: 'loanToken', type: 'address' },
          { name: 'collateralToken', type: 'address' },
          { name: 'oracle', type: 'address' },
          { name: 'irm', type: 'address' },
          { name: 'lltv', type: 'uint256' },
        ],
      },
    ],
    name: 'reallocateTo',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export const MORPHO_APP_URL = 'https://app.morpho.org';

