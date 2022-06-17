import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ALL_SUPPORT_NETWORKS_ID, NETWORKS_INFO } from 'constants/networks'
import { SUBGRAPH_BLOCK_NUMBER } from './queries'

async function getExchangeSubgraphClient(chainId: ChainId): Promise<ApolloClient<NormalizedCacheObject>> {
  const subgraphUrls = NETWORKS_INFO[chainId].classicClient

  if (subgraphUrls.length === 1) {
    return new ApolloClient({
      uri: subgraphUrls[0],
      cache: new InMemoryCache(),
    })
  }

  const subgraphClients = subgraphUrls.map(
    uri =>
      new ApolloClient({
        uri,
        cache: new InMemoryCache(),
      }),
  )

  const subgraphPromises = subgraphClients.map(client =>
    client
      .query({
        query: SUBGRAPH_BLOCK_NUMBER(),
        fetchPolicy: 'network-only',
      })
      .catch(e => {
        console.error(e)
        return e
      }),
  )

  const subgraphQueryResults = await Promise.all(subgraphPromises)

  const subgraphBlockNumbers = subgraphQueryResults.map(res =>
    res instanceof Error ? 0 : res?.data?._meta?.block?.number || 0,
  )

  let bestIndex = 0
  let maxBlockNumber = 0

  for (let i = 0; i < subgraphClients.length; i += 1) {
    if (subgraphBlockNumbers[i] > maxBlockNumber) {
      maxBlockNumber = subgraphBlockNumbers[i]
      bestIndex = i
    }
  }

  return subgraphClients[bestIndex]
}

export const getExchangeSubgraphClients = async () => {
  const chainIds = ALL_SUPPORT_NETWORKS_ID
  const promises = chainIds.map(chainId => getExchangeSubgraphClient(chainId))

  const res = await Promise.all(promises)

  return chainIds.reduce((obj, key, index) => ({ ...obj, [key]: res[index] }), {})
}
