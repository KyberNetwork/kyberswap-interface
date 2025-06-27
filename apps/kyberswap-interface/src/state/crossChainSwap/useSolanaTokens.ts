import { useEffect, useState } from 'react'

// A flag to ensure we only have one in-flight request
let fetchingQuery = ''

const cached: Record<string, SolanaToken> = {}

export interface SolanaToken {
  id: string
  name: string
  symbol: string
  icon: string
  logo: string
  decimals: number
  tokenProgram: string
}

export const useSolanaTokens = (query: string) => {
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
    if (cached[query]) {
      setSolanaTokens([cached[query]])
      return
    }
    if (fetchingQuery === query) return

    // Set the module-level flag to prevent other components from starting a fetch
    fetchingQuery = query

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
      })
      .catch(error => {
        console.error('Failed to fetch near tokens:', error)
      })
      .finally(() => {
        // Reset the in-flight flag
        fetchingQuery = ''
      })
  }, [query])

  return {
    solanaTokens: solanaTokens || [],
  }
}
