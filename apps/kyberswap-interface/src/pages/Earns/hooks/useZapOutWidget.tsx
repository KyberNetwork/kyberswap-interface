import { ChainId as ZapOutChainId, PoolType as ZapOutDex, ZapOut } from '@kyberswap/zap-out-widgets'
import '@kyberswap/zap-out-widgets/dist/style.css'

import { useEffect, useMemo, useState } from 'react'
import { usePreviousDistinct } from 'react-use'
import { EarnDex, EarnDex2 } from 'pages/Earns/constants'
import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'
import { t } from '@lingui/macro'

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
  [EarnDex2.DEX_UNISWAPV3]: ZapOutDex.DEX_UNISWAPV3,
  [EarnDex2.DEX_PANCAKESWAPV3]: ZapOutDex.DEX_PANCAKESWAPV3,
  [EarnDex2.DEX_SUSHISWAPV3]: ZapOutDex.DEX_SUSHISWAPV3,
  [EarnDex2.DEX_QUICKSWAPV3ALGEBRA]: ZapOutDex.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex2.DEX_CAMELOTV3]: ZapOutDex.DEX_CAMELOTV3,
  [EarnDex2.DEX_THENAFUSION]: ZapOutDex.DEX_THENAFUSION,
  [EarnDex2.DEX_KODIAK_V3]: ZapOutDex.DEX_KODIAK_V3,
  [EarnDex2.DEX_UNISWAPV2]: ZapOutDex.DEX_UNISWAPV2,
  [EarnDex2.DEX_UNISWAP_V4]: ZapOutDex.DEX_UNISWAP_V4,
}

const useZapOutWidget = () => {
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
            onClose: () => setZapOutPureParams(null),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(zapOutPureParams.chainId as number),
            onSubmitTx: async (txData: { from: string; to: string; value: string; data: string }) => {
              try {
                if (!library) throw new Error('Library is not ready!')
                const res = await library?.getSigner().sendTransaction(txData)
                if (!res) throw new Error('Transaction failed')
                return res.hash
              } catch (e) {
                console.log(e)
                throw e
              }
            },
          }
        : null,
    [account, chainId, changeNetwork, library, toggleWalletModal, zapOutPureParams, refCode],
  )

  const handleOpenZapOut = (position: { dex: string; chainId: number; poolAddress: string; id: string }) => {
    const poolType = zapOutDexMapping[position.dex as keyof typeof zapOutDexMapping]
    if (!poolType) {
      notify(
        {
          type: NotificationType.ERROR,
          title: t`Pool Type is not supported`,
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

  const previousAccount = usePreviousDistinct(account)

  useEffect(() => {
    if (account && previousAccount) setZapOutPureParams(null)
  }, [account, previousAccount])

  const widget = zapOutParams ? (
    <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={() => setZapOutPureParams(null)}>
      <ZapOut {...zapOutParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapOut }
}

export default useZapOutWidget
