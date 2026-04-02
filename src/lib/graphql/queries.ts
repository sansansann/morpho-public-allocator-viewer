export const VAULT_PUBLIC_ALLOCATOR_QUERY = `
  query VaultPublicAllocatorConfig($address: String!, $chainId: Int) {
    vaultByAddress(address: $address, chainId: $chainId) {
      address
      name
      symbol
      asset {
        address
        symbol
        decimals
      }
      state {
        totalAssets
        totalAssetsUsd
        allocation {
          market {
            uniqueKey
            loanAsset { symbol, address, decimals }
            collateralAsset { symbol, address, decimals }
            lltv
            oracleAddress
            irmAddress
            state {
              supplyAssets
              supplyAssetsUsd
              borrowAssets
              borrowAssetsUsd
              liquidityAssets
              liquidityAssetsUsd
            }
          }
          supplyAssets
          supplyAssetsUsd
          supplyCap
        }
      }
      publicAllocatorConfig {
        fee
        flowCaps {
          market {
            uniqueKey
            loanAsset { symbol, address, decimals }
            collateralAsset { symbol, address, decimals }
            lltv
            oracleAddress
            irmAddress
          }
          maxIn
          maxOut
        }
      }
    }
  }
`;

export const VAULTS_LIST_QUERY = `
  query VaultsList($chainId: [Int!], $first: Int, $skip: Int) {
    vaults(
      where: { chainId_in: $chainId, publicAllocatorFee_lte: 1, totalAssetsUsd_gte: 100000 }
      first: $first
      skip: $skip
      orderBy: TotalAssetsUsd
      orderDirection: Desc
    ) {
      items {
        address
        name
        symbol
        asset { symbol decimals }
        state { totalAssetsUsd }
        publicAllocatorConfig {
          fee
          flowCaps { market { uniqueKey } }
        }
        chain { id network }
      }
      pageInfo { countTotal }
    }
  }
`;

export const MARKETS_SEARCH_QUERY = `
  query MarketsSearch($search: String!, $chainId: [Int!]) {
    markets(
      where: { search: $search, chainId_in: $chainId }
      first: 10
      orderBy: SupplyAssetsUsd
      orderDirection: Desc
    ) {
      items {
        uniqueKey
        loanAsset { symbol address decimals }
        collateralAsset { symbol address decimals }
        lltv
        state {
          supplyAssetsUsd
          borrowAssetsUsd
          liquidityAssetsUsd
        }
      }
    }
  }
`;

export const MARKET_BY_UNIQUEKEY_QUERY = `
  query MarketByUniqueKey($uniqueKey: [String!]!, $chainId: [Int!]) {
    markets(
      where: { uniqueKey_in: $uniqueKey, chainId_in: $chainId }
      first: 1
    ) {
      items {
        uniqueKey
        loanAsset { symbol address decimals }
        collateralAsset { symbol address decimals }
        lltv
        state {
          supplyAssetsUsd
          borrowAssetsUsd
          liquidityAssetsUsd
        }
      }
    }
  }
`;

export const VAULTS_BY_MARKET_QUERY = `
  query VaultsByMarket($marketUniqueKey: [String!], $chainId: [Int!]) {
    vaults(
      where: {
        marketUniqueKey_in: $marketUniqueKey
        chainId_in: $chainId
        publicAllocatorFee_lte: 1
        totalAssetsUsd_gte: 100000
      }
      first: 50
      orderBy: TotalAssetsUsd
      orderDirection: Desc
    ) {
      items {
        address
        name
        symbol
        asset { symbol decimals }
        state { totalAssetsUsd }
        publicAllocatorConfig {
          fee
          flowCaps {
            market {
              uniqueKey
              loanAsset { symbol }
              collateralAsset { symbol }
            }
            maxIn
            maxOut
          }
        }
      }
    }
  }
`;

export const VAULT_REALLOCATES_QUERY = `
  query VaultReallocates($vaultAddress: [String!]) {
    publicAllocatorReallocates(
      where: { vaultAddress_in: $vaultAddress }
      first: 20
    ) {
      items {
        timestamp
        assets
        type
        vault { address }
        market {
          uniqueKey
          loanAsset { symbol }
          collateralAsset { symbol }
        }
      }
    }
  }
`;
