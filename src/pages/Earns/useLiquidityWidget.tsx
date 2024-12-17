import { ChainId, LiquidityWidget, PoolType } from 'kyberswap-liquidity-widgets'
import { useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNetworkModalToggle, useNotify, useWalletModalToggle } from 'state/application/hooks'

import useFilter from './PoolExplorer/useFilter'

interface LiquidityParams {
  poolAddress: string
  chainId: ChainId
  source: string
  poolType: PoolType
  positionId?: string
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  connectedAccount: {
    address?: string | undefined
    chainId: number
  }
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>
}

const useLiquidityWidget = () => {
  const toggleWalletModal = useWalletModalToggle()
  const toggleNetworkModal = useNetworkModalToggle()
  const notify = useNotify()
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { filters } = useFilter()

  const [liquidityPoolParams, setLiquidityPoolParams] = useState<{
    poolAddress: string
    chainId: ChainId
    poolType: PoolType
    positionId?: string
  } | null>(null)

  const handleCloseZapInWidget = () => setLiquidityPoolParams(null)
  const handleOpenZapInWidget = (
    pool: { exchange: string; chainId?: number; address: string },
    positionId?: string,
  ) => {
    const supportedDexs = Object.keys(PoolType).map(item => item.replace('DEX_', '').replace('V3', '').toLowerCase())
    const formattedExchange = pool.exchange.toLowerCase().replaceAll('_', '').replaceAll('-', '').replaceAll('v3', '')
    const dex = supportedDexs.find(item => formattedExchange.includes(item) || item.includes(formattedExchange))
    if (!dex) {
      notify(
        {
          title: `Open pool detail failed`,
          summary: `Protocol ${pool.exchange} on ${
            NETWORKS_INFO[String(pool?.chainId || filters.chainId) as unknown as keyof typeof NETWORKS_INFO]?.name ||
            'this network'
          } is not supported`,
          type: NotificationType.ERROR,
        },
        8000,
      )
      return
    }
    setLiquidityPoolParams({
      poolAddress: pool.address,
      chainId: (pool.chainId || filters.chainId) as ChainId,
      poolType: PoolType[`DEX_${dex.toUpperCase()}V3` as keyof typeof PoolType],
      positionId,
    })
  }

  const liquidityParams: LiquidityParams | null = useMemo(
    () =>
      liquidityPoolParams
        ? {
            ...liquidityPoolParams,
            source: 'kyberswap-demo-zap',
            connectedAccount: {
              address: account,
              chainId: chainId,
            },
            onClose: handleCloseZapInWidget,
            onConnectWallet: toggleWalletModal,
            onSwitchChain: toggleNetworkModal,
            onSubmitTx: async (txData: { from: string; to: string; data: string; value: string; gasLimit: string }) => {
              if (!library) throw new Error('Library is not ready!')
              const res = await library?.getSigner().sendTransaction(txData)
              if (!res) throw new Error('Transaction failed')
              return res.hash
            },
          }
        : null,
    [account, chainId, library, liquidityPoolParams, toggleNetworkModal, toggleWalletModal],
  )

  const liquidityWidget = liquidityParams ? (
    <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={handleCloseZapInWidget}>
      <LiquidityWidget {...liquidityParams} />
    </Modal>
  ) : null

  return { liquidityWidget, liquidityParams, handleOpenZapInWidget }
}

export default useLiquidityWidget
