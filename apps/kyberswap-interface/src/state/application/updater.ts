import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useGetKyberswapConfigurationQuery } from 'services/ksSetting'
import { useBlockNumber as useWagmiBlockNumber } from 'wagmi'

import { useActiveWeb3React } from 'hooks'
import useIsWindowVisible from 'hooks/useIsWindowVisible'

import { updateBlockNumber } from './actions'

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
  }, [windowVisible, dispatch, blockNumber, chainId])

  return null
}
