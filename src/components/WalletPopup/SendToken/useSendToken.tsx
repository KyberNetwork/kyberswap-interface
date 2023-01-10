import { Currency } from '@kyberswap/ks-sdk-core'
import { TOKEN_PROGRAM_ID, createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTokenContract } from 'hooks/useContract'
import connection from 'state/connection/connection'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

export default function useSendToken(currency: Currency | undefined, recipient: string, amount: string) {
  const { account, isEVM, walletSolana, isSolana } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [estimateGas, setGasFee] = useState<number | null>(null)
  const tokenContract = useTokenContract(currency?.wrapped.address)
  const addTransactionWithType = useTransactionAdder()
  const [isSending, setIsSending] = useState(false)
  const { publicKey } = useWallet()

  const sendTokenSolana = useCallback(async () => {
    try {
      const amountIn = tryParseAmount(amount, currency)
      if (!publicKey || !currency || !amount || !recipient || !amountIn || !walletSolana) {
        return Promise.reject('wrong input')
      }
      setIsSending(true)
      let transaction: Transaction
      const recipientAddress = new PublicKey(recipient)
      const { blockhash } = await connection.getLatestBlockhash('finalized')
      if (!currency.isNative) {
        const tokenKey = new PublicKey(currency.wrapped.address)
        const [fromTokenAccount, toTokenAccount] = await Promise.all([
          getOrCreateAssociatedTokenAccount(connection, publicKey as any, tokenKey, publicKey),
          getOrCreateAssociatedTokenAccount(connection, publicKey as any, tokenKey, recipientAddress),
        ])
        transaction = new Transaction().add(
          createTransferInstruction(
            fromTokenAccount.address,
            toTokenAccount.address,
            publicKey,
            parseFloat(amount) * LAMPORTS_PER_SOL,
            [],
            TOKEN_PROGRAM_ID,
          ),
        )
      } else {
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientAddress,
            lamports: BigInt(amountIn.quotient.toString()),
          }),
        )
      }

      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTx = await (walletSolana.wallet?.adapter as SignerWalletAdapter)?.signTransaction(transaction)
      const hash = await connection.sendRawTransaction(Buffer.from(signedTx.serialize()))

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
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      throw error
    }
    return
  }, [publicKey, recipient, amount, addTransactionWithType, walletSolana, currency])

  useEffect(() => {
    async function getGasFee() {
      try {
        if (!library || !tokenContract || !currency || !amount || !recipient || !library || isSolana) {
          setGasFee(null)
          return
        }
        const promise = currency?.isNative
          ? library.estimateGas({
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
  }, [library, account, amount, currency, tokenContract, recipient, isSolana])

  const sendToken = useCallback(async () => {
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
      addTransactionWithType({
        type: TRANSACTION_TYPE.TRANSFER_TOKEN,
        hash: transaction.hash,
        extraInfo: {
          tokenAddress: currency.wrapped.address,
          tokenAmount: amount,
          tokenSymbol: currency.symbol ?? '',
          contract: recipient,
        },
      })
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      throw error
    }
    return
  }, [amount, account, currency, library, recipient, tokenContract, addTransactionWithType])

  return { sendToken: isEVM ? sendToken : sendTokenSolana, isSending, estimateGas }
}
