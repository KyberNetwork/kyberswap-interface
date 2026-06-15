import { useQuery } from '@tanstack/react-query'

import SolanaIcon from 'assets/images/SOL.png'
import { SOLANA_NATIVE } from 'constants/index'

const cached: Record<string, SolanaToken> = {}
const cachedByQuery: Record<string, SolanaToken[]> = {}

const nativeSolana: SolanaToken = {
  id: SOLANA_NATIVE,
  name: 'Solana',
  symbol: 'SOL',
  icon: SolanaIcon,
  logo: SolanaIcon,
  decimals: 9,
  tokenProgram: '',
}

export interface SolanaToken {
  id: string
  name: string
  symbol: string
  icon: string
  logo: string
  decimals: number
  tokenProgram: string
}

const fetchSolanaTokens = async (query: string) => {
  if (cached[query]) return [cached[query]]
  if (cachedByQuery[query]) return cachedByQuery[query]

  const res: SolanaToken[] = await fetch(`https://datapi.jup.ag/v1/assets/search?query=${query}`).then(res =>
    res.json(),
  )

  const tokens = [
    nativeSolana,
    ...(res?.map(item => ({
      ...item,
      symbol: item.id === 'So11111111111111111111111111111111111111112' ? 'WSOL' : item.symbol,
      logo: item.icon,
    })) || []),
  ]

  tokens.forEach(token => {
    cached[token.id] = token
  })
  cachedByQuery[query] = tokens

  return tokens
}

export const useSolanaTokens = (query: string, skip = false) => {
  const { data, isLoading } = useQuery({
    queryKey: ['cross-chain-solana-tokens', query],
    queryFn: () => fetchSolanaTokens(query),
    enabled: !skip,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return {
    solanaTokens: data || [],
    isLoadingSolanaTokens: isLoading,
  }
}
