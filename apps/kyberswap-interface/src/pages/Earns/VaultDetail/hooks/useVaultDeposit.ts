import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback } from 'react'

import { useZapSwap } from 'pages/Earns/hooks/useZapSwap'
import { safeBigInt } from 'pages/Earns/utils/vault'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { formatUnits } from 'utils/viem'

type UseVaultDepositArgs = {
  chainId: number
  /** Vault share token — the aggregator mints it through the vault's teller. */
  shareTokenAddress?: string
  shareTokenSymbol?: string
  shareTokenDecimals: number
  currency?: Currency
  parsedAmount?: CurrencyAmount<Currency>
  /** Slippage in basis points. */
  slippage: number
  onSubmitted?: () => void
  pausePolling?: boolean
}

export const useVaultDeposit = ({
  chainId,
  shareTokenAddress,
  shareTokenSymbol,
  shareTokenDecimals,
  currency,
  parsedAmount,
  slippage,
  onSubmitted,
  pausePolling,
}: UseVaultDepositArgs) => {
  const tokenInAddress = currency?.isNative ? NATIVE_TOKEN_ADDRESS : currency?.wrapped.address

  const buildExtraInfo = useCallback(
    (quoteAmountOutRaw: string) => ({
      tokenAmountIn: parsedAmount?.toSignificant(6) ?? '',
      tokenAmountOut: formatUnits(safeBigInt(quoteAmountOutRaw), shareTokenDecimals),
      tokenSymbolIn: currency?.symbol ?? '',
      tokenAddressIn: tokenInAddress ?? '',
      tokenSymbolOut: shareTokenSymbol ?? '',
      tokenAddressOut: shareTokenAddress ?? '',
    }),
    [parsedAmount, shareTokenDecimals, currency?.symbol, tokenInAddress, shareTokenSymbol, shareTokenAddress],
  )

  const swap = useZapSwap({
    chainId,
    tokenInAddress,
    tokenOutAddress: shareTokenAddress,
    amountInRaw: parsedAmount?.quotient.toString(),
    approvalAmount: parsedAmount,
    slippage,
    transactionType: TRANSACTION_TYPE.EARN_VAULT_DEPOSIT,
    errorTitle: t`Deposit failed`,
    buildExtraInfo,
    onSubmitted,
    pausePolling,
  })

  return {
    ...swap,
    sharesOutRaw: swap.amountOutRaw,
    minSharesOutRaw: swap.minAmountOutRaw,
    deposit: swap.submit,
  }
}
