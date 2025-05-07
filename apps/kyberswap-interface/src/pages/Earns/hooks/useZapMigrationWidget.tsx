import { ZapMigration, ChainId as ZapMigrationChainId, Dex as ZapMigrationDex } from '@kyberswap/zap-migration-widgets'
import '@kyberswap/zap-migration-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { EarnDex, earnSupportedProtocols } from 'pages/Earns/constants'
import { navigateToPositionAfterZap } from 'pages/Earns/utils'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { getCookieValue } from 'utils'

interface MigrateLiquidityPureParams {
  from: {
    dex: ZapMigrationDex
    poolId: string
    positionId: string | number
  }
  to: {
    dex: ZapMigrationDex
    poolId: string
    positionId?: string | number
  }
  chainId: ZapMigrationChainId
  initialTick?: { tickUpper: number; tickLower: number }
}

interface MigrateLiquidityParams extends MigrateLiquidityPureParams {
  client: string
  connectedAccount: {
    address: string | undefined
    chainId: ZapMigrationChainId
  }
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string }) => Promise<string>
}

export interface ZapMigrationInfo {
  from: {
    dex: EarnDex
    poolId: string
    positionId: string | number
  }
  to: {
    dex: EarnDex
    poolId: string
    positionId?: string | number
  }
  chainId: number
  initialTick?: { tickUpper: number; tickLower: number }
}

const zapMigrationDexMapping: Record<EarnDex, ZapMigrationDex | null> = {
  [EarnDex.DEX_UNISWAPV3]: ZapMigrationDex.DEX_UNISWAPV3,
  [EarnDex.DEX_PANCAKESWAPV3]: ZapMigrationDex.DEX_PANCAKESWAPV3,
  [EarnDex.DEX_SUSHISWAPV3]: ZapMigrationDex.DEX_SUSHISWAPV3,
  [EarnDex.DEX_QUICKSWAPV3ALGEBRA]: ZapMigrationDex.DEX_QUICKSWAPV3ALGEBRA,
  [EarnDex.DEX_CAMELOTV3]: ZapMigrationDex.DEX_CAMELOTV3,
  [EarnDex.DEX_THENAFUSION]: ZapMigrationDex.DEX_THENAFUSION,
  [EarnDex.DEX_KODIAK_V3]: ZapMigrationDex.DEX_KODIAK_V3,
  [EarnDex.DEX_UNISWAPV2]: ZapMigrationDex.DEX_UNISWAPV2,
  [EarnDex.DEX_UNISWAP_V4]: ZapMigrationDex.DEX_UNISWAP_V4,
}

const useZapMigrationWidget = () => {
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const navigate = useNavigate()
  const refCode = getCookieValue('refCode')
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [migrateLiquidityPureParams, setMigrateLiquidityPureParams] = useState<MigrateLiquidityPureParams | null>(null)

  const handleNavigateToPosition = useCallback(
    async (txHash: string, chainId: number, targetDex: ZapMigrationDex, targetPoolId: string) => {
      if (!library) return

      const dexIndex = Object.values(zapMigrationDexMapping).findIndex(
        (item, index) =>
          item === targetDex && earnSupportedProtocols.includes(Object.keys(zapMigrationDexMapping)[index]),
      )
      if (dexIndex === -1) {
        console.error('Cannot find dex')
        return
      }
      const dex = Object.keys(zapMigrationDexMapping)[dexIndex] as EarnDex

      navigateToPositionAfterZap(library, txHash, chainId, dex, targetPoolId, navigate)
    },
    [library, navigate],
  )

  const handleOpenZapMigration = ({ from, to, chainId, initialTick }: ZapMigrationInfo) => {
    const sourceDex = zapMigrationDexMapping[from.dex]
    const targetDex = zapMigrationDexMapping[to.dex]

    if (!sourceDex || !targetDex) {
      notify(
        {
          title: `Protocol ${!sourceDex ? from.dex : to.dex} is not supported!`,
          type: NotificationType.ERROR,
        },
        5_000,
      )
      return
    }

    setMigrateLiquidityPureParams({
      from: {
        dex: sourceDex,
        poolId: from.poolId,
        positionId: from.positionId,
      },
      to: {
        dex: targetDex,
        poolId: to.poolId,
        positionId: to.positionId,
      },
      chainId: chainId as ZapMigrationChainId,
      initialTick,
    })
  }

  const migrateLiquidityParams: MigrateLiquidityParams | null = useMemo(
    () =>
      migrateLiquidityPureParams
        ? {
            ...migrateLiquidityPureParams,
            client: 'kyberswap-earn',
            referral: refCode,
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as ZapMigrationChainId,
            },
            onViewPosition: (txHash: string) => {
              const { chainId } = migrateLiquidityPureParams
              const { dex: targetDex, poolId: targetPoolId } = migrateLiquidityPureParams.to
              setMigrateLiquidityPureParams(null)
              handleNavigateToPosition(txHash, chainId, targetDex, targetPoolId)
            },
            onClose: () => setMigrateLiquidityPureParams(null),
            onBack: () => setMigrateLiquidityPureParams(null),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(migrateLiquidityPureParams.chainId as number),
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
    [
      migrateLiquidityPureParams,
      refCode,
      account,
      chainId,
      toggleWalletModal,
      handleNavigateToPosition,
      changeNetwork,
      library,
    ],
  )

  const previousAccount = usePreviousDistinct(account)

  useEffect(() => {
    if (account && previousAccount) setMigrateLiquidityPureParams(null)
  }, [account, previousAccount])

  const widget = migrateLiquidityParams ? (
    <Modal
      isOpen
      mobileFullWidth
      maxWidth={760}
      width={'760px'}
      onDismiss={() => setMigrateLiquidityPureParams(null)}
      zindex={9999}
    >
      <ZapMigration {...migrateLiquidityParams} />
    </Modal>
  ) : null

  return { widget, handleOpenZapMigration }
}

export default useZapMigrationWidget
