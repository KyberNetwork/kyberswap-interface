import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useGetKyberswapConfigurationQuery } from 'services/ksSetting'
import { useBlockNumber as useWagmiBlockNumber } from 'wagmi'

import { queryClient } from 'components/Web3Provider'
import { useActiveWeb3React } from 'hooks'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { updateBlockNumber } from 'state/application/actions'

export default function Updater(): null {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch()
  const windowVisible = useIsWindowVisible()

  useGetKyberswapConfigurationQuery(chainId)

  const { data: blockNumber } = useWagmiBlockNumber({
    chainId: chainId as number,
    watch: windowVisible,
  })

  useEffect(() => {
    if (!chainId || blockNumber === undefined || !windowVisible) return
    dispatch(updateBlockNumber({ chainId, blockNumber: Number(blockNumber) }))
    // Invalidate cached wagmi contract reads so multicall-backed hooks
    // (`useSingleCallResult` etc.) re-fetch on every new block, matching the
    // pre-migration redux-multicall semantics. The default TanStack Query
    // `staleTime: 0` only triggers refetch on focus/reconnect, not on block
    // advance, so balances / reserves / positions would otherwise go stale.
    queryClient.invalidateQueries({ queryKey: ['readContract'] })
    queryClient.invalidateQueries({ queryKey: ['readContracts'] })
  }, [windowVisible, dispatch, blockNumber, chainId])

  return null
}
