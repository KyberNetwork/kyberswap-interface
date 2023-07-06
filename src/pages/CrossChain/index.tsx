import { Squid } from '@0xsquid/sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { memo, useEffect, useMemo, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import WarningIcon from 'components/Icons/WarningIcon'
import { CROSS_CHAIN_CONFIG } from 'constants/env'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useCrossChainHandlers, useCrossChainState } from 'state/crossChain/hooks'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { DisclaimerCrossChain } from '../Bridge/Disclaimer'
import SwapForm from './SwapForm'

export const getAxelarScanUrl = (srcTxHash: string) => `${CROSS_CHAIN_CONFIG.AXELAR_SCAN_URL}${srcTxHash}`

function CrossChain({ visible }: { visible: boolean }) {
  const theme = useTheme()
  const { chainId, isSolana } = useActiveWeb3React()
  const [{ squidInstance, chainIdOut, chains }, setCrossChainState] = useCrossChainState()
  const listChainOut = useMemo(() => chains.filter(e => e !== chainId), [chains, chainId])

  const curChainId = useRef(chainId)

  curChainId.current = chainId
  const loading = useRef(false)
  const { selectCurrencyIn, selectDestChain, selectCurrencyOut } = useCrossChainHandlers()

  useEffect(() => {
    selectCurrencyIn(NativeCurrencies[chainId])
  }, [chainId, selectCurrencyIn])

  useEffect(() => {
    chainIdOut && selectCurrencyOut(NativeCurrencies[chainIdOut])
  }, [selectCurrencyOut, chainIdOut])

  useEffect(() => {
    if (chainId === chainIdOut || !chainIdOut) selectDestChain(listChainOut[0])
  }, [chainId, listChainOut, chainIdOut, selectDestChain])

  useEffect(() => {
    ;(async () => {
      try {
        let squid = squidInstance
        if (loading.current) return
        loading.current = true
        if (!squid) {
          squid = new Squid({ baseUrl: CROSS_CHAIN_CONFIG.API_DOMAIN, integratorId: CROSS_CHAIN_CONFIG.INTEGRATOR_ID })
        }
        await squid.init()
        const { chains = [], tokens = [] } = squid
        const chainSupports = (chains.map(e => e.chainId) as ChainId[]).filter(id => !!NETWORKS_INFO_CONFIG[id])
        const formattedTokens: WrappedTokenInfo[] = []
        tokens.forEach(token => {
          if (typeof token.chainId === 'string' || !chainSupports.includes(token.chainId)) return
          formattedTokens.push(new WrappedTokenInfo(token as TokenInfo))
        })
        setCrossChainState({
          chains: chainSupports,
          tokens: formattedTokens,
          loadingToken: false,
          squidInstance: squid,
        })
      } catch (error) {
      } finally {
        loading.current = false
      }
    })()
  }, [squidInstance, setCrossChainState])

  if (!visible) return null
  if (isSolana) return <Navigate to="/" />
  if (String(squidInstance?.isInMaintenanceMode) === 'true')
    return (
      <Flex style={{ gap: '8px' }} alignItems={'center'}>
        <WarningIcon color={theme.warning} size={40} />
        <Text color={theme.warning} fontSize={14}>
          <Trans>
            Service is not available because of maintenance activities. Please try again after a few minutes.
          </Trans>
        </Text>
      </Flex>
    )
  return (
    <>
      <DisclaimerCrossChain />
      <SwapForm />
    </>
  )
}
export default memo(CrossChain)
