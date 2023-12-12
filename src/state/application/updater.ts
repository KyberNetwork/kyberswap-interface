import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useGetKyberswapConfigurationQuery } from 'services/ksSetting'

import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useKyberSwapConfig } from 'state/application/hooks'

import { updateBlockNumber } from './actions'

export default function Updater(): null {
  const { chainId } = useActiveWeb3React()

  const { readProvider } = useKyberSwapConfig()
  const dispatch = useDispatch()

  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId,
    blockNumber: null,
  })

  useGetKyberswapConfigurationQuery(chainId)

  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      setState(state => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber }
          return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return {
          chainId,
          blockNumber,
        }
      })
    },
    [chainId],
  )

  // attach/detach listeners
  useEffect(() => {
    if (!readProvider || !windowVisible) return undefined

    setState({ chainId, blockNumber: null })

    readProvider
      .getBlockNumber()
      .then(blockNumberCallback)
      .catch((error: any) => console.error(`Failed to get block number for chainId: ${chainId}`, error))

    readProvider.on('block', blockNumberCallback)
    return () => {
      readProvider.removeListener('block', blockNumberCallback)
    }
  }, [dispatch, chainId, readProvider, blockNumberCallback, windowVisible])

  const debouncedState = useDebounce(state, 100)

  useEffect(() => {
    if (!debouncedState.chainId || !debouncedState.blockNumber || !windowVisible) return
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }))
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId])

  return null
}
