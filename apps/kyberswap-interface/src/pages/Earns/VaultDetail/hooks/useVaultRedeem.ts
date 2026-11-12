import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { VaultSupportedAsset } from 'services/vault'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { friendlyError } from 'utils/errorMessage'
import { Address, encodeFunctionData, erc4626Abi, formatUnits } from 'utils/viem'

type UseVaultRedeemArgs = {
  chainId: number
  /** The ERC-4626 vault, which is also the share token being burned. */
  vaultAddress?: string
  /** Shares to redeem, in raw units. */
  shares?: bigint
  shareToken?: Token
  /** The vault's underlying, which is what a redemption pays. */
  assetOut?: VaultSupportedAsset
  /** What the vault quoted for `shares`; recorded on the transaction as the amount coming back. */
  expectedAssets?: bigint
}

/**
 * Redeems shares on a vault that pays out in the same transaction. The owner burns their own shares
 * and receives the underlying directly, so there is no allowance to grant and nothing to wait for
 * beyond the receipt.
 */
export const useVaultRedeem = ({
  chainId,
  vaultAddress,
  shares,
  shareToken,
  assetOut,
  expectedAssets,
}: UseVaultRedeemArgs) => {
  const { account } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  /**
   * Returns the transaction hash so a step sequence can wait for its receipt. A failure is reported
   * here and then rethrown, so the sequence can tell a refusal from any other failure.
   *
   * `trackingPayload` rides on the transaction, for the events sent once its receipt is in.
   */
  const redeem = useCallback(
    async (trackingPayload?: Record<string, unknown>): Promise<string | undefined> => {
      if (!account || !vaultAddress || !shareToken || !assetOut) return undefined
      if (!shares || shares <= 0n || expectedAssets === undefined) return undefined

      setSubmitError(null)
      setIsSubmitting(true)

      try {
        const data = encodeFunctionData({
          abi: erc4626Abi,
          functionName: 'redeem',
          // The wallet is both the owner of the shares and the receiver of the assets.
          args: [shares, account as Address, account as Address],
        })

        const { txHash: hash, error } = await submitTransaction({
          account,
          chainId: chainId as ChainId,
          txData: { to: vaultAddress, data, value: '0' },
          isSmartConnector,
        })

        if (error || !hash) throw error || new Error('Transaction was not submitted')

        addTransactionWithType({
          hash,
          type: TRANSACTION_TYPE.EARN_VAULT_WITHDRAW,
          extraInfo: {
            tokenAmountIn: formatUnits(shares, shareToken.decimals),
            tokenAmountOut: formatUnits(expectedAssets, assetOut.decimals),
            tokenSymbolIn: shareToken.symbol ?? '',
            tokenAddressIn: shareToken.address,
            tokenSymbolOut: assetOut.symbol,
            tokenAddressOut: assetOut.assetAddress,
            trackingPayload,
          },
        })
        return hash
      } catch (error) {
        const message = friendlyError(error as Error)
        setSubmitError(message)
        notify({ title: t`Withdrawal failed`, summary: message, type: NotificationType.ERROR }, 8000)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      account,
      vaultAddress,
      shareToken,
      assetOut,
      shares,
      expectedAssets,
      chainId,
      isSmartConnector,
      addTransactionWithType,
      notify,
    ],
  )

  return { redeem, isSubmitting, submitError }
}
