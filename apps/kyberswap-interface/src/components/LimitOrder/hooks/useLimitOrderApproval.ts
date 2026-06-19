import { ChainId, Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { readContract } from '@wagmi/core'

import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis'
import { Address } from 'utils/viem'

type UseLimitOrderApprovalArgs = {
  account: string | undefined
  amount: CurrencyAmount<Currency> | undefined
  chainId: ChainId
  currency: Currency | undefined
  spender: string | undefined
  isAllowanceEnough?: (allowance: TokenAmount) => boolean
  passWhenInvalidInput?: boolean
}

export const useLimitOrderApproval = ({
  account,
  amount,
  chainId,
  currency,
  spender,
  isAllowanceEnough,
  passWhenInvalidInput = false,
}: UseLimitOrderApprovalArgs) => {
  return async () => {
    if (!currency || currency.isNative || !account || !spender || !amount) return passWhenInvalidInput

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
  }
}
