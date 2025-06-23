import { Currency } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTokenSigningContract } from 'hooks/useContract'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

export default function useSendToken(currency: Currency | undefined, recipient: string, amount: string) {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [estimateGas, setGasFee] = useState<number | null>(null)
  const tokenContract = useTokenSigningContract(currency?.wrapped.address)
  const addTransactionWithType = useTransactionAdder()
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!currency || !amount || !recipient) {
      setGasFee(null)
      return
    }
    async function getGasFee() {
      try {
        if (!library || !tokenContract || !currency) {
          setGasFee(null)
          return
        }
        const promise = currency?.isNative
          ? library.getSigner().estimateGas({
              from: account,
              to: recipient,
              value: ethers.utils.parseEther(amount),
            })
          : tokenContract.estimateGas.transfer(recipient, ethers.utils.parseUnits(amount, currency.decimals))

        const [estimateGas, gasPrice] = await Promise.all([promise, library.getSigner().getGasPrice()])
        const format = gasPrice && estimateGas ? ethers.utils.formatEther(estimateGas.mul(gasPrice)) : null
        setGasFee(format ? parseFloat(format) : null)
      } catch (error) {
        setGasFee(null)
      }
    }
    getGasFee()
  }, [library, account, amount, currency, recipient, tokenContract])

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
      if (!account || !tokenContract || !library || !amount || !recipient || !currency) {
        return Promise.reject('wrong input')
      }
      const currentGasPrice = await library.getSigner().getGasPrice()
      const gasPrice = ethers.utils.hexlify(currentGasPrice)
      setIsSending(true)
      let transaction
      if (currency.isNative) {
        const tx = { from: account, to: recipient, value: ethers.utils.parseEther(amount), gasPrice }
        transaction = await library.getSigner().sendTransaction(tx)
      } else {
        const numberOfTokens = ethers.utils.parseUnits(amount, currency.decimals)
        transaction = await tokenContract.transfer(recipient, numberOfTokens)
      }
      addTransaction(transaction.hash)
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      throw error
    }
    return
  }, [amount, account, currency, library, recipient, tokenContract, addTransaction])

  return { sendToken: sendTokenEvm, isSending, estimateGas }
}
