import { ZapOut, ChainId as ZapOutChainId, PoolType as ZapOutDex } from '@kyberswap/zap-out-widgets'
import '@kyberswap/zap-out-widgets/dist/style.css'
import { useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EarnDex, EarnDex2 } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'

export interface ZapOutInfo {
  position: {
    dex: EarnDex | EarnDex2
    chainId: number
    poolAddress: string
    id: string
  }
}

const zapOutDexMapping: Record<EarnDex | EarnDex2, ZapOutDex> = {
  [EarnDex.DEX_UNISWAPV3]: ZapOutDex.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: ZapOutDex.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: ZapOutDex.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: ZapOutDex.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: ZapOutDex.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: ZapOutDex.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: ZapOutDex.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: ZapOutDex.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: ZapOutDex.DEX_UNISWAP_V4,
  [EarnDex.DEX_UNISWAP_V4_KEM]: ZapOutDex.DEX_UNISWAP_V4_KEM,
  [EarnDex2.DEX_UNISWAPV3]: ZapOutDex.DEX_UNISWAPV3,
  [EarnDex2.DEX_PANCAKESWAPV3]: ZapOutDex.DEX_PANCAKESWAPV3,
  [EarnDex2.DEX_SUSHISWAPV3]: ZapOutDex.DEX_SUSHISWAPV3,
  [EarnDex2.DEX_QUICKSWAPV3ALGEBRA]: ZapOutDex.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex2.DEX_CAMELOTV3]: ZapOutDex.DEX_CAMELOTV3,
  [EarnDex2.DEX_THENAFUSION]: ZapOutDex.DEX_THENAFUSION,
  [EarnDex2.DEX_KODIAK_V3]: ZapOutDex.DEX_KODIAK_V3,
  [EarnDex2.DEX_UNISWAPV2]: ZapOutDex.DEX_UNISWAPV2,
  [EarnDex2.DEX_UNISWAP_V4]: ZapOutDex.DEX_UNISWAP_V4,
  [EarnDex2.DEX_UNISWAP_V4_KEM]: ZapOutDex.DEX_UNISWAP_V4_KEM,
}

const useZapOutWidget = (onRefreshPosition?: () => void) => {
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
              setZapOutPureParams(null)
              onRefreshPosition?.()
            },
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(zapOutPureParams.chainId as number),
            onSubmitTx: async (txData: { from: string; to: string; value: string; data: string }) => {
              const txHash = await submitTransaction({ library, txData })
              if (!txHash) throw new Error('Transaction failed')
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
