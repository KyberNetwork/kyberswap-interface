import { POOL_CATEGORY, Token } from '@kyber/schema'
import { LiquidityWidget } from '@kyberswap/liquidity-widgets'
import { ZapCreateWidget as ZapWidget } from '@kyberswap/zap-create-widgets'
import '@kyberswap/zap-create-widgets/dist/style.css'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
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

const useZapCreatePoolWidget = () => {
  const locale = useActiveLocale()
  const toggleWalletModal = useWalletModalToggle()
  const { account, chainId: connectedChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { library } = useWeb3React()
  const navigate = useNavigate()
  const addTransactionWithType = useTransactionAdder()

  const [config, setConfig] = useState<CreateConfig | null>(null)
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()

  const { rpc: defaultRpc } = useKyberSwapConfig(config?.chainId)

  const handleClose = useCallback(() => {
    setConfig(null)
    clearTracking()
  }, [clearTracking])

  useAccountChanged(handleClose)

  const handleNavigateToPosition = useCallback(
    async (txHash: string, config: CreateConfig) => {
      if (!library || !config) return
      const poolAddress = await fetchExistingPoolAddress(config)

      if (!poolAddress) return

      navigateToPositionAfterZap(library, txHash, config.chainId, config.protocol, poolAddress, navigate)
    },
    [library, navigate],
  )

  const widgetProps = useMemo(() => {
    if (!config) return null

    const poolType = ZAPIN_DEX_MAPPING[config.protocol]
    const isCreate = !config.poolAddress

    return {
      isCreate,
      baseProps: {
        chainId: config.chainId,
        poolType,
        connectedAccount: {
          address: account,
          chainId: connectedChainId ?? config.chainId,
        },
        poolAddress: config.poolAddress ?? '',
        rpcUrl: defaultRpc,
        source: 'kyberswap-earn',
        locale,
        txStatus,
        txHashMapping: originalToCurrentHash,
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
          additionalInfo?:
            | {
                type: 'zap'
                tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>
                pool: string
                dexLogo: string
              }
            | {
                type: 'erc20_approval'
                tokenAddress: string
                tokenSymbol?: string
                dexName?: string
              },
        ) => {
          const res = await submitTransaction({ library, txData })
          const { txHash, error } = res

          if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

          // Track this tx hash for status updates
          addTrackedTxHash(txHash)

          if (additionalInfo?.type === 'zap' && config) {
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
          } else if (additionalInfo?.type === 'erc20_approval') {
            addTransactionWithType({
              hash: txHash,
              type: TRANSACTION_TYPE.APPROVE,
              extraInfo: {
                tokenAddress: additionalInfo.tokenAddress,
                summary: additionalInfo.tokenSymbol,
              },
            })
          }

          return res.txHash
        },
      },
      createPoolConfig: {
        token0: config.token0,
        token1: config.token1,
        poolCategory: config.poolCategory,
        fee: config.fee,
      },
    }
  }, [
    account,
    addTrackedTxHash,
    addTransactionWithType,
    changeNetwork,
    config,
    connectedChainId,
    defaultRpc,
    handleClose,
    handleNavigateToPosition,
    library,
    locale,
    originalToCurrentHash,
    toggleWalletModal,
    txStatus,
  ])

  const widget = widgetProps ? (
    <Modal isOpen mobileFullWidth maxWidth={900} width={'900px'} onDismiss={handleClose}>
      {widgetProps.isCreate ? (
        <ZapWidget {...widgetProps.baseProps} createPoolConfig={widgetProps.createPoolConfig} />
      ) : (
        <LiquidityWidget {...widgetProps.baseProps} fromCreatePoolFlow={true} />
      )}
    </Modal>
  ) : null

  const openWidget = useCallback((newConfig: CreateConfig) => {
    const [token0, token1] = sortTokensByAddress(newConfig.token0, newConfig.token1)
    setConfig({
      ...newConfig,
      token0,
      token1,
    })
  }, [])

  return {
    widget,
    open: openWidget,
  }
}

export default useZapCreatePoolWidget
