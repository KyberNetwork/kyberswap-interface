import { ChainId, LiquidityWidget, PoolType } from 'kyberswap-liquidity-widgets'
import { useState } from 'react'
import { EarnPool } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useWeb3React } from 'hooks'
import { useNetworkModalToggle, useNotify, useWalletModalToggle } from 'state/application/hooks'

import useFilter from './PoolExplorer/useFilter'

interface LiquidityParams {
  provider: any
  poolAddress: string
  chainId: ChainId
  source: string
  poolType: PoolType
  onDismiss: () => void
  onConnectWallet: () => void
  onChangeNetwork: () => void
}

const useLiquidityWidget = () => {
  const { library } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const toggleNetworkModal = useNetworkModalToggle()
  const notify = useNotify()
  const { filters } = useFilter()

  const [liquidityParams, setLiquidityParams] = useState<LiquidityParams | null>(null)

  const handleCloseZapInWidget = () => setLiquidityParams(null)
  const handleOpenZapInWidget = (pool: EarnPool) => {
    const supportedDexs = Object.keys(PoolType).map(item => item.replace('DEX_', '').replace('V3', '').toLowerCase())
    const dex = supportedDexs.find(item => pool.exchange.toLowerCase().includes(item))
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
      onDismiss: handleCloseZapInWidget,
      onConnectWallet: toggleWalletModal,
      onChangeNetwork: toggleNetworkModal,
    })
  }

  const liquidityWidget = liquidityParams ? (
    <Modal isOpen maxWidth={760} width="fit-content" onDismiss={handleCloseZapInWidget}>
      <LiquidityWidget {...liquidityParams} />
    </Modal>
  ) : null

  return { liquidityWidget, liquidityParams, handleOpenZapInWidget }
}

export default useLiquidityWidget
