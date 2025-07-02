import { useEffect, useState } from 'react'

const cached: Record<string, SolanaToken> = {}
const cachedByQuery: Record<string, SolanaToken[]> = {}

export interface SolanaToken {
  id: string
  name: string
  symbol: string
  icon: string
  logo: string
  decimals: number
  tokenProgram: string
}

export const useSolanaTokens = (query: string, skip = false) => {
  const [solanaTokens, setSolanaTokens] = useState<SolanaToken[]>(() =>
    cached[query]
      ? [cached[query]]
      : [
          {
            id: '11111111111111111111111111111111',
            name: 'Solana',
            symbol: 'SOL',
            icon: 'https://solana.com/favicon.png',
            logo: 'https://solana.com/favicon.png',
            decimals: 9,
            tokenProgram: '',
          },
        ],
  )

  useEffect(() => {
    if (skip) return
    if (cached[query]) {
      setSolanaTokens([cached[query]])
      return
    }
    if (cachedByQuery[query]) {
      setSolanaTokens(cachedByQuery[query])
      return
    }

    fetch(`https://datapi.jup.ag/v1/assets/search?query=${query}`)
      .then(res => res.json())
      .then(res => {
        const solTokens = res?.map((item: SolanaToken) => ({ ...item, logo: item.icon })) || []
        const t = [
          {
            id: '11111111111111111111111111111111',
            name: 'Solana',
            symbol: 'SOL',
            icon: 'https://solana.com/favicon.png',
            logo: 'https://solana.com/favicon.png',
            decimals: 9,
            tokenProgram: '',
          },
          ...solTokens,
        ]

        setSolanaTokens(t)
        t.forEach(i => {
          cached[i.id] = i
        })
        cachedByQuery[query] = t
      })
      .catch(error => {
        console.error('Failed to fetch near tokens:', error)
      })
  }, [query, skip])

  return {
    solanaTokens: solanaTokens || [],
  }
}
