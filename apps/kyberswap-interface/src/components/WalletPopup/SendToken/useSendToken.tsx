import { Currency } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import { useCallback, useEffect, useState } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import ERC20_ABI from 'constants/abis/erc20.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { Abi, Address, Hex, encodeFunctionData, formatEther, parseEther, parseUnits } from 'utils/viem'

export default function useSendToken(currency: Currency | undefined, recipient: string, amount: string) {
  const { account, chainId } = useActiveWeb3React()
  const { library, isSmartConnector } = useWeb3React()
  const [estimateGas, setGasFee] = useState<number | null>(null)
  const addTransactionWithType = useTransactionAdder()
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!currency || !amount || !recipient || !account) {
      setGasFee(null)
      return
    }
    async function getGasFee() {
      try {
        const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
        if (!publicClient || !currency || !account) {
          setGasFee(null)
          return
        }
        const estimateParams = currency.isNative
          ? {
              account: account as Address,
              to: recipient as Address,
              value: parseEther(amount),
            }
          : {
              account: account as Address,
              to: currency.wrapped.address as Address,
              data: encodeFunctionData({
                abi: ERC20_ABI as Abi,
                functionName: 'transfer',
                args: [recipient as Address, parseUnits(amount, currency.decimals)],
              }),
            }
        const [gasEstimate, gasPrice] = await Promise.all([
          (publicClient as any).estimateGas(estimateParams) as Promise<bigint>,
          publicClient.getGasPrice(),
        ])
        const format = gasPrice && gasEstimate ? formatEther(gasEstimate * gasPrice) : null
        setGasFee(format ? parseFloat(format) : null)
      } catch (error) {
        setGasFee(null)
      }
    }
    getGasFee()
  }, [account, amount, currency, recipient, chainId])

  const addTransaction = useCallback(
    (hash: string) => {
      if (!currency) return
      addTransactionWithType({
        type: TRANSACTION_TYPE.TRANSFER_TOKEN,
        hash,
        extraInfo: {
          tokenAddress: currency.wrapped.address,
          tokenAmount: amount,
          tokenSymbol: currency.symbol ?? '',
          contract: recipient,
        },
      })
    },
    [currency, amount, addTransactionWithType, recipient],
  )

  const sendTokenEvm = useCallback(async () => {
    try {
      if (!account || !library || !amount || !recipient || !currency) {
        return Promise.reject('wrong input')
      }
      setIsSending(true)
      const isNative = currency.isNative
      const contractAddress = isNative ? recipient : currency.wrapped.address
      const value = isNative ? parseEther(amount) : 0n
      const encodedData = (
        isNative
          ? '0x'
          : encodeFunctionData({
              abi: ERC20_ABI as Abi,
              functionName: 'transfer',
              args: [recipient as Address, parseUnits(amount, currency.decimals)],
            })
      ) as Hex
      const transaction = await sendEVMTransaction({
        account,
        library,
        contractAddress,
        encodedData,
        value,
        errorInfo: { name: ErrorName.SwapError, wallet: undefined },
        isSmartConnector,
        chainId,
      })
      if (transaction?.hash) addTransaction(transaction.hash)
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      throw error
    }
    return
  }, [amount, account, currency, library, recipient, isSmartConnector, chainId, addTransaction])

  return { sendToken: sendTokenEvm, isSending, estimateGas }
}
