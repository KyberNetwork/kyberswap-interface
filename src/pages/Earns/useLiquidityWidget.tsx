import { ChainId, LiquidityWidget, PoolType } from 'kyberswap-liquidity-widgets'
import { useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useWeb3React } from 'hooks'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

import useFilter from './PoolExplorer/useFilter'

interface LiquidityParams {
  provider: any
  poolAddress: string
  chainId: ChainId
  source: string
  poolType: PoolType
  positionId?: string
  onDismiss: () => void
  onConnectWallet: () => void
}

const useLiquidityWidget = () => {
  const { library } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const { filters } = useFilter()

  const [liquidityParams, setLiquidityParams] = useState<LiquidityParams | null>(null)

  const handleCloseZapInWidget = () => setLiquidityParams(null)
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
    setLiquidityParams({
      provider: library,
      poolAddress: pool.address,
      chainId: (pool.chainId || filters.chainId) as ChainId,
      source: 'kyberswap-demo-zap',
      poolType: PoolType[`DEX_${dex.toUpperCase()}V3` as keyof typeof PoolType],
      positionId,
      onDismiss: handleCloseZapInWidget,
      onConnectWallet: toggleWalletModal,
    })
  }

  const liquidityWidget = liquidityParams ? (
    <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={handleCloseZapInWidget}>
      <LiquidityWidget {...liquidityParams} />
    </Modal>
  ) : null

  return { liquidityWidget, liquidityParams, handleOpenZapInWidget }
}

export default useLiquidityWidget
