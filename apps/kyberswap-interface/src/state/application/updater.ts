import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useGetKyberswapConfigurationQuery } from 'services/ksSetting'
import { useBlockNumber as useWagmiBlockNumber } from 'wagmi'

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
    // Dispatch the new height to Redux; the multicall hooks pick it up via
    // `useBlockNumberFor` and pass it as wagmi's `blockNumber` parameter,
    // which makes TanStack Query's queryKey depend on the block. That gives
    // every read a per-chain, background-refetch-on-block behaviour without
    // a global cache invalidation pass.
    dispatch(updateBlockNumber({ chainId, blockNumber: Number(blockNumber) }))
  }, [windowVisible, dispatch, blockNumber, chainId])

  return null
}
