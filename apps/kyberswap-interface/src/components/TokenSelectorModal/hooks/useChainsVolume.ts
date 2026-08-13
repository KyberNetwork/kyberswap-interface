import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

type ChainVolumeEntry = { chainId?: number; totalVolumeUsd?: number }
type ChainsVolumeResponse = { data?: { chains?: ChainVolumeEntry[]; period?: string } }

const CHAINS_VOLUME_URL = `${import.meta.env.VITE_KYBER_AI_API_URL}/v1/chains/volume`

/**
 * Trailing USD volume per chain (the API's own window, currently 7d), keyed by chain id. Used to rank
 * the chain selector; chains the API omits are simply absent, so callers can sort them last.
 */
export const useChainsVolume = (enabled = true): Record<number, number> => {
  const { data } = useQuery({
    queryKey: ['chains-volume'],
    enabled,
    queryFn: async (): Promise<ChainsVolumeResponse> => {
      const res = await fetch(CHAINS_VOLUME_URL)
      return res.json()
    },
    // Chain volumes move on a multi-day window; no need to refetch while browsing.
    staleTime: 600_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  return useMemo(() => {
    const result: Record<number, number> = {}
    data?.data?.chains?.forEach(entry => {
      if (entry?.chainId !== undefined) result[entry.chainId] = entry.totalVolumeUsd ?? 0
    })
    return result
  }, [data])
}
