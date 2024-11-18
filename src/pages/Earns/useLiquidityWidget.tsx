import { ChainId, LiquidityWidget, PoolType } from 'kyberswap-liquidity-widgets'
import { useState } from 'react'
import { EarnPool } from 'services/zapEarn'

import Modal from 'components/Modal'
import { useWeb3React } from 'hooks'
import { useNetworkModalToggle, useWalletModalToggle } from 'state/application/hooks'

// import useFilter from './PoolExplorer/useFilter'

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
  //   const { filters } = useFilter()

  const [liquidityParams, setLiquidityParams] = useState<LiquidityParams | null>(null)

  const handleCloseZapInWidget = () => setLiquidityParams(null)
  const handleOpenZapInWidget = (_pool: EarnPool) => {
    // if (!Object.keys(PoolType).includes(`DEX_${pool.exchange.toUpperCase()}`)) return
    setLiquidityParams({
      provider: library,
      // poolAddress: pool.address,
      // chainId: (pool.chainId || filters.chainId) as ChainId,
      poolAddress: '0x641C00A822e8b671738d32a431a4Fb6074E5c79d',
      chainId: ChainId.Arbitrum,
      onDismiss: handleCloseZapInWidget,
      source: 'kyberswap-demo-zap',
      //   poolType: PoolType[`DEX_${pool.exchange.toUpperCase()}` as keyof typeof PoolType],
      poolType: PoolType.DEX_PANCAKESWAPV3,
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
