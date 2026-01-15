import { Currency } from '@kyberswap/ks-sdk-core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { getPublicClient } from '@wagmi/core'
import { WalletClient, formatUnits } from 'viem'

import { wagmiConfig } from 'components/Web3Provider'
import { CROSS_CHAIN_FEE_RECEIVER, CROSS_CHAIN_FEE_RECEIVER_SOLANA, ZERO_ADDRESS } from 'constants/index'
import { MAINNET_NETWORKS } from 'constants/networks'
import { SolanaToken } from 'state/crossChainSwap'

import { Quote } from '../registry'
import {
  BaseSwapAdapter,
  Chain,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from './BaseSwapAdapter'

interface Step {
  action: string
  tx: {
    data: string
    to: string
    value: string
  }
}

export class OrbiterAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'Orbiter'
  }
  getIcon(): string {
    return 'https://www.orbiter.finance/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [...MAINNET_NETWORKS]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const fromToken = params.fromToken as any
    const toToken = params.toToken as any
    const body = {
      sourceChainId: params.fromChain === 'solana' ? 'SOLANA_MAIN' : params.fromChain.toString(),
      destChainId: params.toChain === 'solana' ? 'SOLANA_MAIN' : params.toChain.toString(),
      sourceToken:
        params.fromChain === 'solana'
          ? (params.fromToken as SolanaToken).id
          : fromToken.isNative
          ? ZERO_ADDRESS
          : fromToken.address,

      destToken:
        params.toChain === 'solana'
          ? (params.toToken as SolanaToken).id
          : toToken.isNative
          ? ZERO_ADDRESS
          : toToken.address,
      amount: params.amount.toString(),
      userAddress: params.sender,
      targetRecipient: params.recipient,
      slippage: params.slippage / 10_000,
      feeConfig: {
        feeRecipient: params.fromChain === 'solana' ? CROSS_CHAIN_FEE_RECEIVER_SOLANA : CROSS_CHAIN_FEE_RECEIVER,
        feePercent: (params.feeBps / 10000).toString(),
      },
      channel: 'kyberswap',
    }
    const res = await fetch(`https://api.orbiter.finance/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(res => res.result)

    const formattedOutputAmount = formatUnits(BigInt(res.details?.destTokenAmount || '0'), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    const inputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain)
      ? Number(res.details?.sourceAmountUSD || 0)
      : params.tokenInUsd * +formattedInputAmount
    const outputUsd = NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)
      ? Number(res.details?.destAmountUSD || 0)
      : params.tokenOutUsd * +formattedOutputAmount

    const haveApproval = res.steps.some((step: Step) => step.action === 'approve')
    const approvalContract = res.steps.find((step: Step) => step.action === 'swap' || step.action === 'bridge')

    return {
      quoteParams: params,
      outputAmount: BigInt(res.details?.destTokenAmount || '0'),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      //rate: Number(resp.details?.rate || 0),
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: 10,
      contractAddress: haveApproval ? approvalContract?.tx.to || ZERO_ADDRESS : ZERO_ADDRESS,
      rawQuote: res,
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWallet?: ReturnType<typeof useWalletSelector>,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendSolanaFn?: WalletAdapterProps['sendTransaction'],
    solanaConnection?: Connection,
  ): Promise<NormalizedTxResponse> {
    if (quote.quoteParams.fromChain === 'solana') {
      if (!solanaConnection || !sendSolanaFn) throw new Error('Connection is not defined for Solana swap')
      const encodedData = quote.rawQuote.steps?.[0]?.tx?.data
      const txBuffer = Buffer.from(encodedData, 'base64')

      // Try to deserialize as VersionedTransaction first
      let transaction
      try {
        transaction = VersionedTransaction.deserialize(txBuffer as any)
        console.log('Parsed as VersionedTransaction')
      } catch (versionedError) {
        console.log('Failed to parse as VersionedTransaction, trying legacy Transaction')
        try {
          transaction = Transaction.from(txBuffer)
          console.log('Parsed as legacy Transaction')
        } catch (legacyError) {
          throw new Error('Could not parse transaction as either VersionedTransaction or legacy Transaction')
        }
      }

      console.log('Transaction parsed successfully:', transaction)

      const waitForConfirmation = async (txId: string) => {
        try {
          const latestBlockhash = await solanaConnection.getLatestBlockhash()

          // Wait for confirmation with timeout
          const confirmation = await Promise.race([
            solanaConnection.confirmTransaction(
              {
                signature: txId,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
              },
              'confirmed',
            ),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)),
          ])

          const confirmationResult = confirmation as { value: { err: any } }
          if (confirmationResult.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmationResult.value.err)}`)
          }

          console.log('Transaction confirmed successfully!')
        } catch (confirmError) {
          console.error('Transaction confirmation failed:', confirmError)

          // Check if transaction actually succeeded despite timeout
          const txStatus = await solanaConnection.getSignatureStatus(txId)
          if (txStatus?.value?.confirmationStatus !== 'confirmed') {
            throw new Error(`Transaction was not confirmed: ${confirmError.message}`)
          }
        }
      }

      // Send through wallet adapter
      const signature = await sendSolanaFn(transaction, solanaConnection)
      await waitForConfirmation(signature)

      return {
        sender: quote.quoteParams.sender,
        id: signature,
        sourceTxHash: signature,
        adapter: this.getName(),
        sourceChain: quote.quoteParams.fromChain,
        targetChain: quote.quoteParams.toChain,
        inputAmount: quote.quoteParams.amount,
        outputAmount: quote.outputAmount.toString(),
        sourceToken: quote.quoteParams.fromToken,
        targetToken: quote.quoteParams.toToken,
        timestamp: new Date().getTime(),
        amountInUsd: quote.inputUsd,
        amountOutUsd: quote.outputUsd,
        platformFeePercent: quote.platformFeePercent,
        recipient: quote.quoteParams.recipient,
      }
    }

    const steps = quote.rawQuote.steps.filter((st: Step) => st.action !== 'approve') // already approve before

    const account = walletClient.account?.address
    if (!account) throw new Error('WalletClient account is not defined')
    const txs = await Promise.all(
      steps.map(async (step: Step) => {
        const tx = await walletClient.sendTransaction({
          chain: undefined,
          account,
          to: step.tx.to as `0x${string}`,
          value: BigInt(step.tx.value),
          data: step.tx.data as `0x${string}`,
        })
        return tx
      }),
    )

    if (!txs || txs.length === 0) throw new Error('No transactions found after executing swap steps')

    return {
      sender: quote.quoteParams.sender,
      sourceTxHash: txs[txs.length - 1],
      adapter: this.getName(),
      id: txs[txs.length - 1],
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: new Date().getTime(),
      amountInUsd: quote.inputUsd,
      amountOutUsd: quote.outputUsd,
      platformFeePercent: quote.platformFeePercent,
      recipient: quote.quoteParams.recipient,
    }
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    if (p.sourceChain !== 'solana') {
      const publicClient = getPublicClient(wagmiConfig, {
        chainId: p.sourceChain as any,
      })
      const receipt = await publicClient?.getTransactionReceipt({
        hash: p.id as `0x${string}`,
      })
      if (receipt?.status === 'reverted') {
        return {
          txHash: '',
          status: 'Failed',
        }
      }
    }

    const res = await fetch(`https://api.orbiter.finance/transaction/${p.id}`).then(r => r.json())
    return {
      txHash: res.result.targetId || '',
      // this is from orbiter source code, their docs dont have info for this
      // https://github.com/Orbiter-Finance/OrbiterFE-V2/blob/2b35399aad581e666c45a829e0151485f4007c93/src/views/statistics/LatestTransactions.vue#L115
      status:
        res.result.opStatus === -1
          ? 'Failed'
          : res.result.opStatus === 80
          ? 'Refunded'
          : res.result.opStatus !== 98 && res.result.opStatus !== 99
          ? 'Processing'
          : 'Success',
    }
  }
}
