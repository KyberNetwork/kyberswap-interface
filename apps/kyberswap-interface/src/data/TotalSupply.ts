import { BigNumber } from '@ethersproject/bignumber'
import { Token, TokenAmount } from '@kyberswap/ks-sdk-core'

import { useTokenReadingContract } from 'hooks/useContract'
import { useSingleCallResult } from 'state/multicall/hooks'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): TokenAmount | undefined {
  const contract = useTokenReadingContract(token?.address)
  const totalSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.result?.[0]

  return token && totalSupply ? TokenAmount.fromRawAmount(token, totalSupply.toString()) : undefined
}
