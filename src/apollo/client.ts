import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { createClient, NETWORKS_INFO } from 'constants/networks'

export const defaultExchangeClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/dynamic-amm/dynamic-amm',
  cache: new InMemoryCache(),
})

export const exchangeClients: { [chainId in ChainId]: ApolloClient<NormalizedCacheObject> } = Object.fromEntries(
  Object.values(NETWORKS_INFO).map(networkInfo => [networkInfo.chainId, createClient(networkInfo.classicClient[0])]),
) as any
