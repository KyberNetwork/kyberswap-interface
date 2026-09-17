import { ChainId, Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { readContract } from '@wagmi/core'
import { useCallback } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { Address } from 'utils/viem'

type UseCheckAllowanceProps = {
  account: string | undefined
  amount: CurrencyAmount<Currency> | undefined
  chainId: ChainId
  currency: Currency | undefined
  spender: string | undefined
  isAllowanceEnough?: (allowance: TokenAmount) => boolean
}

/**
 * Reads the live allowance on demand. A wallet can grant approval outside the app, and the cached
 * allowance behind `useApproveCallback` lags a block or two, so a step sequence asks the chain
 * directly before deciding whether it still needs to approve.
 *
 * Returns false when it cannot tell: an unanswerable question is not an approval, and the caller
 * treats it as "still needs approving" rather than waving the transaction through.
 */
export const useCheckAllowance = ({
  account,
  amount,
  chainId,
  currency,
  spender,
  isAllowanceEnough,
}: UseCheckAllowanceProps) =>
  useCallback(async () => {
    // Native currency is spent by value, not pulled by a spender, so there is nothing to allow.
    if (currency?.isNative) return true
    if (!currency || !account || !spender || !amount) return false

    const allowance = (await readContract(wagmiConfig, {
      address: currency.wrapped.address as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, spender],
      chainId: chainId as number,
    })) as bigint

    const allowanceAmount = TokenAmount.fromRawAmount(currency.wrapped, allowance.toString())
    return isAllowanceEnough
      ? isAllowanceEnough(allowanceAmount)
      : allowanceAmount.greaterThan(amount) || allowanceAmount.equalTo(amount)
  }, [account, amount, chainId, currency, spender, isAllowanceEnough])
