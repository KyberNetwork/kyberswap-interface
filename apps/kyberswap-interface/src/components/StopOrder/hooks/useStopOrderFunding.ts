import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetStopOrderConfigQuery } from 'services/stopOrder'

import { StopOrderFundingShortfall, getStopOrderFundingShortfalls } from 'components/StopOrder/utils'
import { useActiveWeb3React } from 'hooks'
import { useTokenReadingContract } from 'hooks/useContract'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenBalances } from 'state/wallet/hooks'

const NO_TOKENS: Token[] = []

/**
 * Whether the wallet can still fund an open order: its balance of the sell token and the allowance it
 * granted the smartIntent contract, read on the order's own chain, against the order's amount. Asked
 * only for the rows on screen, and only while they are open.
 */
export const useStopOrderFunding = (
  { amountIn, chainId }: { amountIn: string; chainId: ChainId },
  sellCurrency: Token,
  enabled: boolean,
): StopOrderFundingShortfall[] => {
  const { account } = useActiveWeb3React()
  const isOn = enabled && !!account
  const { data: config } = useGetStopOrderConfigQuery(chainId, { skip: !isOn })
  const spender = config?.smartIntentAddress || undefined

  const tokens = useMemo(() => (isOn ? [sellCurrency] : NO_TOKENS), [isOn, sellCurrency])
  const balance = useTokenBalances(tokens, chainId)[sellCurrency.address]

  const contract = useTokenReadingContract(isOn && spender ? sellCurrency.address : undefined, chainId)
  const allowanceInputs = useMemo(() => [account, spender], [account, spender])
  const allowance = useSingleCallResult(contract, 'allowance', allowanceInputs).result?.[0]

  return useMemo(
    () =>
      getStopOrderFundingShortfalls(
        amountIn,
        balance ? BigInt(balance.quotient.toString()) : undefined,
        allowance !== undefined ? BigInt(String(allowance)) : undefined,
      ),
    [amountIn, balance, allowance],
  )
}
