import { BigNumber } from '@ethersproject/bignumber'
import { JSBI } from '@kyberswap/ks-sdk-classic'
import { ChainId, Fraction, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useState } from 'react'

import { ERC20_ABI } from 'constants/abis/erc20'
import { useContractForReading, useTokenContract, useTokenContractForReading } from 'hooks/useContract'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { isAddress } from 'utils'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)
  const totalSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.result?.[0]

  return token && totalSupply ? TokenAmount.fromRawAmount(token, totalSupply.toString()) : undefined
}

export function useTotalSupplyV2(chainId: ChainId, tokenAddress: string): number {
  const contract = useTokenContractForReading(tokenAddress, chainId)
  const [totalSupply, setTotalSupply] = useState<number>(0)
  const { readProvider } = useKyberSwapConfig(chainId)

  const addressCheckSum = isAddress(chainId, tokenAddress)
  const tokenContract = useContractForReading(addressCheckSum ? addressCheckSum : undefined, ERC20_ABI, chainId)

  const fetchTotalSupply = useCallback(async () => {
    const getTotalSupply = async (): Promise<number> => {
      try {
        if (!chainId || !readProvider) {
          return 0
        }

        const rawTotalSupply = await contract?.totalSupply()
        const decimals = await contract?.decimals()

        return Number(
          new Fraction(rawTotalSupply.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toFixed(8),
        )
      } catch (e) {
        return 0
      }
    }

    const totalSupply = await getTotalSupply()
    setTotalSupply(totalSupply)
  }, [chainId, contract, readProvider])

  useEffect(() => {
    if (tokenContract) {
      fetchTotalSupply()
    }
  }, [fetchTotalSupply, tokenContract])

  return totalSupply
}
