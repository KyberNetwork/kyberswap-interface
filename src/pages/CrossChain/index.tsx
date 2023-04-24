import { Squid } from '@0xsquid/sdk'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { memo, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import WarningIcon from 'components/Icons/WarningIcon'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useCrossChainState } from 'state/crossChain/hooks'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { DisclaimerCrossChain } from '../Bridge/Disclaimer'
import SwapForm from './SwapForm'

const isTest = window.location.href.includes('test') // todo
const AXELAR_SCAN_URL = isTest ? 'https://testnet.axelarscan.io/gmp/' : 'https://axelarscan.io/gmp/'

export const getAxelarScanUrl = (srcTxHash: string) => `${AXELAR_SCAN_URL}${srcTxHash}`

// todo lazy load
function CrossChain() {
  const theme = useTheme()
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
            baseUrl: isTest ? 'https://testnet.api.0xsquid.com' : 'https://api.0xsquid.com',
          })
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
