import { ChainId } from '@kyberswap/ks-sdk-core'
import { ZapOut, ChainId as ZapOutChainId, PoolType as ZapOutDex } from '@kyberswap/zap-out-widgets'
import '@kyberswap/zap-out-widgets/dist/style.css'
import { useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EarnDex, Exchange, protocolGroupNameToExchangeMapping } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'

export interface ZapOutInfo {
  position: {
    dex: EarnDex | Exchange
    chainId: number
    poolAddress: string
    id: string
  }
}

const zapOutDexMapping: Record<EarnDex | Exchange, ZapOutDex> = {
  [EarnDex.DEX_UNISWAPV3]: ZapOutDex.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: ZapOutDex.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: ZapOutDex.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: ZapOutDex.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: ZapOutDex.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: ZapOutDex.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: ZapOutDex.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: ZapOutDex.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: ZapOutDex.DEX_UNISWAP_V4,
  [EarnDex.DEX_UNISWAP_V4_FAIRFLOW]: ZapOutDex.DEX_UNISWAP_V4_FAIRFLOW,
  [EarnDex.DEX_PANCAKE_INFINITY_CL]: ZapOutDex.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_UNISWAPV3]: ZapOutDex.DEX_UNISWAPV3,
  [Exchange.DEX_PANCAKESWAPV3]: ZapOutDex.DEX_PANCAKESWAPV3,
  [Exchange.DEX_SUSHISWAPV3]: ZapOutDex.DEX_SUSHISWAPV3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: ZapOutDex.DEX_QUICKSWAPV3ALGEBRA,
  [Exchange.DEX_CAMELOTV3]: ZapOutDex.DEX_CAMELOTV3,
  [Exchange.DEX_THENAFUSION]: ZapOutDex.DEX_THENAFUSION,
  [Exchange.DEX_KODIAK_V3]: ZapOutDex.DEX_KODIAK_V3,
  [Exchange.DEX_UNISWAPV2]: ZapOutDex.DEX_UNISWAPV2,
  [Exchange.DEX_UNISWAP_V4]: ZapOutDex.DEX_UNISWAP_V4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: ZapOutDex.DEX_UNISWAP_V4_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL]: ZapOutDex.DEX_PANCAKE_INFINITY_CL,
}

const useZapOutWidget = (onRefreshPosition?: (props: CheckClosedPositionParams) => void) => {
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [zapOutPureParams, setZapOutPureParams] = useState<{
    positionId: string
    poolType: ZapOutDex
    poolAddress: string
    chainId: ZapOutChainId
  } | null>(null)

  const zapOutParams = useMemo(
    () =>
      zapOutPureParams
        ? {
            ...zapOutPureParams,
            source: 'kyberswap-earn',
            referral: refCode,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapOutChainId,
            },
            onClose: () => {
              setTimeout(() => {
                const foundEntry = Object.entries(zapOutDexMapping).find(
                  ([_, zapOutDex]) => zapOutDex === zapOutPureParams.poolType,
                )
                let dex = foundEntry?.[0] as EarnDex | Exchange

                if (dex && Object.values(Exchange).includes(dex as Exchange)) {
                  dex = Object.entries(protocolGroupNameToExchangeMapping).find(
                    ([_, exchange]) => exchange === dex,
                  )?.[0] as EarnDex
                }

                onRefreshPosition?.({
                  tokenId: zapOutPureParams.positionId,
                  dex: dex as EarnDex,
                  poolAddress: zapOutPureParams.poolAddress,
                  chainId: zapOutPureParams.chainId as unknown as ChainId,
                })
              }, 500)
              setZapOutPureParams(null)
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(zapOutPureParams.chainId as number),
            onSubmitTx: async (txData: { from: string; to: string; value: string; data: string }) => {
              const res = await submitTransaction({ library, txData })
              const { txHash, error } = res
              if (!txHash || error) throw new Error(error?.message || 'Transaction failed')
              return txHash
            },
          }
        : null,
    [account, chainId, changeNetwork, library, toggleWalletModal, zapOutPureParams, refCode, onRefreshPosition],
  )

  const handleOpenZapOut = ({ position }: ZapOutInfo) => {
    const poolType = zapOutDexMapping[position.dex]
    if (!poolType) {
      notify(
        {
          title: `Protocol ${position.dex} is not supported!`,
          type: NotificationType.ERROR,
        },
        5_000,
      )
      return
    }

    setZapOutPureParams({
      poolType,
      chainId: position.chainId as ZapOutChainId,
      poolAddress: position.poolAddress,
      positionId: position.id,
    })
  }

  useAccountChanged(() => setZapOutPureParams(null))

  const widget = zapOutParams ? (
    <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={() => setZapOutPureParams(null)}>
      <ZapOut {...zapOutParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapOut }
}

export default useZapOutWidget
