import { POOL_CATEGORY, Token } from '@kyber/schema'
// Eager, not with the lazy JS below: each widget's status dialog is styled by utilities scoped under the
// widget's own root class, which ship only in these stylesheets (the app's eager @kyber/ui styles use a
// different scope and don't reach them). They must be present whenever the widgets can open.
import '@kyberswap/liquidity-widgets/dist/style.css'
import '@kyberswap/zap-create-widgets/dist/style.css'
import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LocalLoader from 'components/LocalLoader'
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
import { friendlyError } from 'utils/errorMessage'

// Both widgets only render inside the modal below, so lazy-load their JS to keep them out of every /earn
// route chunk that calls this hook.
const ZapWidget = lazy(() =>
  import('@kyberswap/zap-create-widgets').then(widget => ({ default: widget.ZapCreateWidget })),
)

const LiquidityWidget = lazy(() =>
  import('@kyberswap/liquidity-widgets').then(widget => ({ default: widget.LiquidityWidget })),
)

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
  const { isSmartConnector } = useWeb3React()
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
      if (!config) return
      const poolAddress = await fetchExistingPoolAddress(config)

      if (!poolAddress) return

      navigateToPositionAfterZap(txHash, config.chainId, config.protocol, poolAddress, navigate)
    },
    [navigate],
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
                type: 'erc20_approval' | 'nft_approval' | 'nft_approval_all'
                tokenAddress: string
                tokenSymbol?: string
                dexName?: string
              },
        ) => {
          const res = await submitTransaction({ account, chainId: connectedChainId, txData, isSmartConnector })
          const { txHash, error } = res

          if (!txHash || error) throw new Error(error ? friendlyError(error) : 'Transaction failed')

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
          } else if (
            additionalInfo?.type === 'erc20_approval' ||
            additionalInfo?.type === 'nft_approval' ||
            additionalInfo?.type === 'nft_approval_all'
          ) {
            addTransactionWithType({
              hash: txHash,
              type: TRANSACTION_TYPE.APPROVE,
              extraInfo: {
                tokenAddress: additionalInfo.tokenAddress,
                summary: additionalInfo.tokenSymbol,
              },
            })
          }

          return txHash
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
    isSmartConnector,
    locale,
    originalToCurrentHash,
    toggleWalletModal,
    txStatus,
  ])

  const widget = widgetProps ? (
    <Modal isOpen mobileFullWidth maxWidth={900} width={'900px'} onDismiss={handleClose}>
      <Suspense fallback={<LocalLoader />}>
        {widgetProps.isCreate ? (
          <ZapWidget {...widgetProps.baseProps} createPoolConfig={widgetProps.createPoolConfig} />
        ) : (
          <LiquidityWidget {...widgetProps.baseProps} fromCreatePoolFlow={true} />
        )}
      </Suspense>
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
