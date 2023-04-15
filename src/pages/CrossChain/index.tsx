import { Squid } from '@0xsquid/sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { memo, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useCrossChainState } from 'state/bridge/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { DisclaimerCrossChain } from '../Bridge/Disclaimer'
import SwapForm from './SwapForm'

// todo lazy load
function CrossChain() {
  const [isInMaintenanceMode, setIsInMaintenanceMode] = useState(false)

  const { chainId, isSolana } = useActiveWeb3React()
  const [{ squidInstance }, setCrossChainState] = useCrossChainState()
  const curChainId = useRef(chainId)
  curChainId.current = chainId
  const loading = useRef(false)
  useEffect(() => {
    ;(async () => {
      try {
        let squid = squidInstance
        if (loading.current) return
        loading.current = true
        if (!squid) {
          squid = new Squid({
            baseUrl: 'https://testnet.api.0xsquid.com', //'https://api.0xsquid.com' || 'https://testnet.api.0xsquid.com',
          })
        }
        await squid.init() // todo too many call
        // cache ???
        const { chains = [], tokens = [], isInMaintenanceMode } = squid
        const chainSupports = (chains.map(e => e.chainId) as ChainId[]).filter(id => !!NETWORKS_INFO_CONFIG[id])
        setIsInMaintenanceMode(isInMaintenanceMode + '' === 'true')
        const formattedTokens = [] as any
        tokens.forEach(token => {
          if (typeof token.chainId === 'string' || !chainSupports.includes(token.chainId)) return
          formattedTokens.push(new WrappedTokenInfo(token as any)) // todo
        })
        setCrossChainState({
          chains: chainSupports,
          tokens: formattedTokens,
          loadingToken: false,
          squidInstance: squid,
        })
        // todo rename dong bo birdge state
      } catch (error) {
      } finally {
        loading.current = false
      }
    })()
  }, [squidInstance, setCrossChainState])

  if (isSolana) return <Navigate to="/" />
  if (isInMaintenanceMode) return <div>todo bao tri roi</div>
  return (
    <>
      <DisclaimerCrossChain />
      <SwapForm />
    </>
  )
}
export default memo(CrossChain)
