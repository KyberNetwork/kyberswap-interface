import { ChainId, LiquidityWidget, PoolType } from 'kyberswap-liquidity-widgets'
import { useState } from 'react'
import { EarnPool } from 'services/zapEarn'

import Modal from 'components/Modal'
import { useWeb3React } from 'hooks'
import { useNetworkModalToggle, useWalletModalToggle } from 'state/application/hooks'

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
  const { filters } = useFilter()

  const [liquidityParams, setLiquidityParams] = useState<LiquidityParams | null>(null)

  const handleCloseZapInWidget = () => setLiquidityParams(null)
  const handleOpenZapInWidget = (pool: EarnPool) => {
    const supportedDexs = Object.keys(PoolType).map(item => item.replace('DEX_', '').replace('V3', '').toLowerCase())
    const dex = supportedDexs.find(item => pool.exchange.toLowerCase().includes(item))
    if (!dex) return
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
