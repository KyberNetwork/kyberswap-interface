import { Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback } from 'react'
import { VaultSupportedAsset } from 'services/vault'

import { useVaultTransaction } from 'pages/Earns/VaultDetail/hooks/useVaultTransaction'
import { TRANSACTION_TYPE } from 'state/transactions/type'
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
  const { account, send, isSubmitting, submitError } = useVaultTransaction({
    chainId,
    errorTitle: t`Withdrawal failed`,
  })

  /** `trackingPayload` rides on the transaction, for the events sent once its receipt is in. */
  const redeem = useCallback(
    async (trackingPayload?: Record<string, unknown>): Promise<string | undefined> => {
      if (!account || !vaultAddress || !shareToken || !assetOut) return undefined
      if (!shares || shares <= 0n || expectedAssets === undefined) return undefined

      return send({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: erc4626Abi,
          functionName: 'redeem',
          // The wallet is both the owner of the shares and the receiver of the assets.
          args: [shares, account as Address, account as Address],
        }),
        record: {
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
        },
      })
    },
    [account, vaultAddress, shareToken, assetOut, shares, expectedAssets, send],
  )

  return { redeem, isSubmitting, submitError }
}
