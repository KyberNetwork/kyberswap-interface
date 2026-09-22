import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'

import { useZapSwap } from 'pages/Earns/hooks/useZapSwap'
import { safeBigInt } from 'pages/Earns/utils/vault'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { formatUnits } from 'utils/viem'

/** One token being spent, with the amount already parsed against its own decimals. */
export type VaultDepositInput = {
  currency: Currency
  parsedAmount: CurrencyAmount<Currency>
}

type UseVaultDepositArgs = {
  chainId: number
  /** Vault share token — the aggregator mints it through the vault's teller. */
  shareTokenAddress?: string
  shareTokenSymbol?: string
  shareTokenDecimals: number
  /** Every token the deposit spends, in the order the form lists them. */
  inputs: VaultDepositInput[]
  /** Slippage in basis points. */
  slippage: number
  pausePolling?: boolean
}

export const useVaultDeposit = ({
  chainId,
  shareTokenAddress,
  shareTokenSymbol,
  shareTokenDecimals,
  inputs,
  slippage,
  pausePolling,
}: UseVaultDepositArgs) => {
  const tokensIn = useMemo(
    () =>
      inputs.map(input => ({
        address: input.currency.isNative ? NATIVE_TOKEN_ADDRESS : input.currency.wrapped.address,
        amountRaw: input.parsedAmount.quotient.toString(),
      })),
    [inputs],
  )

  const buildExtraInfo = useCallback(
    (quoteAmountOutRaw: string) => {
      const spent = inputs.map(input => `${input.parsedAmount.toSignificant(6)} ${input.currency.symbol ?? ''}`.trim())
      const first = inputs[0]
      const isMultiToken = spent.length > 1

      return {
        tokenAmountIn: first?.parsedAmount.toSignificant(6) ?? '',
        // "amount symbol" has room for one token, so several are spelled out in the display field
        // and the symbol left empty rather than naming only the first of them.
        tokenAmountInDisplay: isMultiToken ? spent.join(' + ') : undefined,
        tokenSymbolIn: isMultiToken ? '' : first?.currency.symbol ?? '',
        tokenAddressIn: tokensIn[0]?.address ?? '',
        tokenAmountOut: formatUnits(safeBigInt(quoteAmountOutRaw), shareTokenDecimals),
        tokenSymbolOut: shareTokenSymbol ?? '',
        tokenAddressOut: shareTokenAddress ?? '',
      }
    },
    [inputs, tokensIn, shareTokenDecimals, shareTokenSymbol, shareTokenAddress],
  )

  // Allowances are not read here: a deposit can spend several tokens, and the form owns one
  // allowance per token so the step sequence can ask for them in turn.
  const swap = useZapSwap({
    chainId,
    tokensIn,
    tokenOutAddress: shareTokenAddress,
    slippage,
    transactionType: TRANSACTION_TYPE.EARN_VAULT_DEPOSIT,
    errorTitle: t`Deposit failed`,
    buildExtraInfo,
    pausePolling,
  })

  return {
    ...swap,
    sharesOutRaw: swap.amountOutRaw,
    minSharesOutRaw: swap.minAmountOutRaw,
    deposit: swap.submit,
  }
}
