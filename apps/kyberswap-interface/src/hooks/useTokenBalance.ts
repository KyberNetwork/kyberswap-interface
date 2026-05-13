import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'

import ERC20_ABI from 'constants/abis/erc20.json'
import { useActiveWeb3React } from 'hooks'
import useTransactionStatus from 'hooks/useTransactionStatus'
import { isAddress } from 'utils'
import { Address } from 'utils/viem'

interface BalanceProps {
  value: bigint
  decimals: number
}

const EMPTY_BALANCE: BalanceProps = { value: 0n, decimals: 18 }

function useTokenBalance(tokenAddress: string, customChainId?: ChainId) {
  const [balance, setBalance] = useState<BalanceProps>(EMPTY_BALANCE)
  const { account, chainId: activeChainId } = useActiveWeb3React()
  const chainId = customChainId || activeChainId
  const publicClient = usePublicClient({ chainId: chainId as number })
  // allows balance to update given transaction updates
  const currentTransactionStatus = useTransactionStatus()
  const addressCheckSum = isAddress(chainId, tokenAddress)

  const fetchBalance = useCallback(async () => {
    if (!account || !publicClient || !addressCheckSum) {
      setBalance(EMPTY_BALANCE)
      return
    }
    try {
      if (addressCheckSum === WETH[chainId].address) {
        const ethBalance = await publicClient.getBalance({ address: account as Address })
        setBalance({ value: ethBalance, decimals: 18 })
        return
      }
      const [rawBalance, decimals] = await Promise.all([
        publicClient.readContract({
          address: addressCheckSum as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [account],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: addressCheckSum as Address,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as Promise<number>,
      ])
      setBalance({ value: rawBalance, decimals })
    } catch {
      setBalance(EMPTY_BALANCE)
    }
  }, [account, publicClient, addressCheckSum, chainId])

  useEffect(() => {
    fetchBalance()
  }, [currentTransactionStatus, fetchBalance])

  return balance
}

export default useTokenBalance
