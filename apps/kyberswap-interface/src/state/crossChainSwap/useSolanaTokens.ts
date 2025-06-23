import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { setLoadingSolanaTokens, updateSolanaTokens } from '.'

// A flag to ensure we only have one in-flight request
let isSolanaTokensFetchInProgress = false

export interface SolanaToken {
  id: string
  name: string
  symbol: string
  icon: string
  logo: string
  decimals: number
  tokenProgram: string
}
export const useSolanaTokens = () => {
  const { solanaTokens, isLoadingSolanaTokens } = useAppSelector(state => state.crossChainSwap)
  const dispatch = useAppDispatch()
  const hasTokens = useMemo(() => solanaTokens?.length > 0, [solanaTokens?.length])

  useEffect(() => {
    // Only fetch if we don't have tokens AND we're not already loading tokens
    // AND there's not already a fetch in progress
    if (hasTokens || isLoadingSolanaTokens || isSolanaTokensFetchInProgress) return

    // Set the module-level flag to prevent other components from starting a fetch
    isSolanaTokensFetchInProgress = true

    // Set loading state in Redux so other components can see we're loading
    dispatch(setLoadingSolanaTokens(true))

    fetch(`https://datapi.jup.ag/v1/assets/search?query=`)
      .then(res => res.json())
      .then(res => {
        dispatch(updateSolanaTokens(res?.map((item: SolanaToken) => ({ ...item, logo: item.icon })) || []))
      })
      .catch(error => {
        console.error('Failed to fetch near tokens:', error)
        // Reset loading state on error
        dispatch(setLoadingSolanaTokens(false))
      })
      .finally(() => {
        // Reset the in-flight flag
        isSolanaTokensFetchInProgress = false
      })
  }, [hasTokens, isLoadingSolanaTokens, dispatch])

  return {
    solanaTokens: solanaTokens || [],
    isLoadingSolanaTokens,
  }
}
