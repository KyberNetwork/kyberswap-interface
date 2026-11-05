import type { Currency } from 'types/crossChain'

export const matchesToken = (token: Currency | string, query: string) => {
  if (typeof token === 'string') return token.toLowerCase().includes(query)
  return [
    token.symbol,
    'name' in token ? token.name : undefined,
    'address' in token ? token.address : undefined,
    'id' in token ? token.id : undefined,
    'assetId' in token ? token.assetId : undefined,
    'contractAddress' in token ? token.contractAddress : undefined,
  ].some(value => value?.toLowerCase().includes(query))
}
