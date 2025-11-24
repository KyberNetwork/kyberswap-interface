import { POOL_CATEGORY, Token } from '@kyber/schema'
import { WidgetMode, LiquidityWidget as ZapWidget } from '@kyberswap/zap-create-widgets'
import '@kyberswap/zap-create-widgets/dist/style.css'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING, getDexFromPoolType } from 'pages/Earns/constants/dexMappings'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import { submitTransaction } from 'pages/Earns/utils'
import { fetchExistingPoolAddress, navigateToPositionAfterZap, sortTokensByAddress } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

type CreateConfig = {
  chainId: number
  protocol: Exchange
  token0: Token
  token1: Token
  poolCategory: POOL_CATEGORY
  fee: number
  poolAddress?: string | null
}

type WidgetConfig = CreateConfig & {
  mode: WidgetMode
  poolAddress?: string | null
}

const useZapCreatePoolWidget = () => {
  const locale = useActiveLocale()
  const toggleWalletModal = useWalletModalToggle()
  const { account, chainId: connectedChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { library } = useWeb3React()
  const navigate = useNavigate()
  const addTransactionWithType = useTransactionAdder()

  const [config, setConfig] = useState<WidgetConfig | null>(null)

  const { rpc: defaultRpc } = useKyberSwapConfig(config?.chainId)

  const handleClose = useCallback(() => {
    setConfig(null)
  }, [])

  useAccountChanged(handleClose)

  const handleNavigateToPosition = useCallback(
    async (txHash: string, config: WidgetConfig) => {
      if (!library || !config) return
      const poolAddress = await fetchExistingPoolAddress(config)

      const poolType = ZAPIN_DEX_MAPPING[config.protocol]
      const dex = getDexFromPoolType(poolType)

      if (!dex || !poolAddress) return

      navigateToPositionAfterZap(library, txHash, config.chainId, dex, poolAddress, navigate)
    },
    [library, navigate],
  )

  const widgetProps = useMemo(() => {
    if (!config) return null

    return {
      chainId: config.chainId,
      poolType: ZAPIN_DEX_MAPPING[config.protocol],
      connectedAccount: {
        address: account,
        chainId: connectedChainId ?? config.chainId,
      },
      poolAddress: config.poolAddress ?? '',
      rpcUrl: defaultRpc,
      mode: config.mode,
      createPoolConfig:
        config.mode === WidgetMode.CREATE
          ? {
              token0: config.token0,
              token1: config.token1,
              poolCategory: config.poolCategory,
              fee: config.fee,
            }
          : undefined,
      source: 'kyberswap-earn',
      locale,
      onViewPosition: (txHash: string) => {
        handleNavigateToPosition(txHash, config)
        handleClose()
      },
      onClose: () => {
        handleClose()
      },
      onConnectWallet: toggleWalletModal,
      onSwitchChain: () => changeNetwork(config.chainId),
      onSubmitTx: async (
        txData: { from: string; to: string; data: string; value: string; gasLimit: string },
        additionalInfo?: {
          tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>
          pool: string
          dexLogo: string
        },
      ) => {
        const res = await submitTransaction({ library, txData })
        const { txHash, error } = res

        if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

        if (config && additionalInfo) {
          addTransactionWithType({
            hash: txHash,
            type: TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
            extraInfo: {
              pool: additionalInfo.pool,
              tokensIn: additionalInfo.tokensIn,
              dexLogoUrl: additionalInfo.dexLogo,
              dex: config.protocol,
            },
          })
        }

        return res.txHash
      },
    }
  }, [
    account,
    addTransactionWithType,
    changeNetwork,
    config,
    connectedChainId,
    defaultRpc,
    handleClose,
    handleNavigateToPosition,
    library,
    locale,
    toggleWalletModal,
  ])

  const widget = widgetProps ? (
    <Modal isOpen mobileFullWidth maxWidth={900} width={'900px'} onDismiss={handleClose}>
      <ZapWidget {...widgetProps} />
    </Modal>
  ) : null

  const openWidget = useCallback((newConfig: CreateConfig) => {
    const [token0, token1] = sortTokensByAddress(newConfig.token0, newConfig.token1)
    const mode = newConfig.poolAddress ? WidgetMode.IN : WidgetMode.CREATE
    setConfig({
      ...newConfig,
      token0,
      token1,
      mode,
    })
  }, [])

  return {
    widget,
    open: openWidget,
  }
}

export default useZapCreatePoolWidget
