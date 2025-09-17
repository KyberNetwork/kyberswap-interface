import { AcrossClient, createAcrossClient } from '@across-protocol/app-sdk'
import { SvmSpokeIdl } from '@across-protocol/contracts'
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createApproveCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { WalletClient, formatUnits } from 'viem'
import { arbitrum, base, blast, bsc, linea, mainnet, optimism, polygon, scroll, unichain, zksync } from 'viem/chains'

import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { SolanaToken } from 'state/crossChainSwap'
import { isEvmChain } from 'utils'

import { Quote } from '../registry'
import {
  BaseSwapAdapter,
  Chain,
  EvmQuoteParams,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from './BaseSwapAdapter'

const API_URL = 'https://app.across.to/api/suggested-fees'

function evmToSolanaPK(evmAddress: string): PublicKey {
  const hex = evmAddress.replace(/^0x/, '').toLowerCase()
  if (hex.length !== 40) throw new Error('Invalid EVM address')

  const buf = Buffer.alloc(32)
  Buffer.from(hex, 'hex').copy(buf, 12) // right-align, zero-pad left 12 bytes
  return new PublicKey(buf)
}

export class AcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: `0x008a`,
      chains: [mainnet, arbitrum, bsc, optimism, linea, polygon, zksync, base, scroll, blast, unichain],
      rpcUrls: [
        ChainId.MAINNET,
        ChainId.ARBITRUM,
        ChainId.BSCMAINNET,
        ChainId.OPTIMISM,
        ChainId.LINEA,
        ChainId.MATIC,
        ChainId.ZKSYNC,
        ChainId.BASE,
        ChainId.SCROLL,
        ChainId.BLAST,
        ChainId.UNICHAIN,
      ].reduce((acc, cur) => {
        return { ...acc, [cur]: NETWORKS_INFO[cur].defaultRpcUrl }
      }, {}),
    })
  }

  private async derivePdas(depositor: PublicKey, inputToken: PublicKey, destinationChainId: bigint) {
    const seed = 0n
    const programId = new PublicKey(SvmSpokeIdl.address)

    // Create 8-byte little-endian buffer for seed
    const seedBuffer = Buffer.alloc(8)
    seedBuffer.writeBigUInt64LE(seed, 0)

    const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state'), seedBuffer], programId)

    // Derive route PDA as required by deposit_v3 IDL
    const destinationChainBuffer = Buffer.alloc(8)
    destinationChainBuffer.writeBigUInt64LE(destinationChainId, 0)
    const [routePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('route'), inputToken.toBuffer(), seedBuffer, destinationChainBuffer],
      programId,
    )

    const depositorTokenAccount = getAssociatedTokenAddressSync(
      inputToken,
      depositor,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [statePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), inputToken.toBuffer()],
      programId,
    )

    const [eventAuthority] = PublicKey.findProgramAddressSync([Buffer.from('__event_authority')], programId)

    return { statePda, routePda, depositorTokenAccount, vaultPda, eventAuthority }
  }

  private _createApproveInstruction(
    depositorTokenAccount: PublicKey,
    inputTokenAddress: PublicKey,
    delegatePda: PublicKey,
    inputAmount: bigint,
    inputTokenDecimals: number,
    signerPublicKey: PublicKey,
  ): TransactionInstruction {
    return createApproveCheckedInstruction(
      depositorTokenAccount,
      inputTokenAddress,
      delegatePda,
      signerPublicKey,
      inputAmount,
      inputTokenDecimals,
      undefined,
      TOKEN_PROGRAM_ID,
    )
  }

  private createDepositInstruction(params: {
    depositor: PublicKey
    recipient: PublicKey
    inputToken: PublicKey
    outputToken: PublicKey
    inputAmount: bigint
    outputAmount: bigint
    destinationChainId: bigint
    exclusiveRelayer: PublicKey
    quoteTimestamp: number
    fillDeadline: number
    exclusivityParameter: number
    message: Uint8Array
    depositorTokenAccount: PublicKey
    statePda: PublicKey
    routePda: PublicKey
    vaultPda: PublicKey
    eventAuthority: PublicKey
  }): TransactionInstruction {
    const programId = new PublicKey(SvmSpokeIdl.address)
    console.log(SvmSpokeIdl)

    // Encode instruction data for depositV3 following Across IDL specification
    // Based on the Anchor IDL, depositV3 has method discriminator + parameters
    const discriminator = Buffer.from([242, 35, 198, 137, 82, 225, 242, 182]) // depositV3 method discriminator

    // Calculate total buffer size
    const bufferSize =
      8 + // discriminator
      32 + // depositor (Pubkey)
      32 + // recipient (Pubkey)
      32 + // inputToken (Pubkey)
      32 + // outputToken (Pubkey)
      8 + // inputAmount (u64)
      8 + // outputAmount (u64)
      8 + // destinationChainId (u64)
      32 + // exclusiveRelayer (Pubkey)
      4 + // quoteTimestamp (u32)
      4 + // fillDeadline (u32)
      4 + // exclusivityParameter (u32)
      4 +
      params.message.length // message (Vec<u8>)

    const instructionData = Buffer.alloc(bufferSize)
    let offset = 0

    // Write method discriminator (8 bytes)
    discriminator.copy(instructionData, offset)
    offset += 8

    // Write depositor pubkey (32 bytes)
    params.depositor.toBuffer().copy(instructionData, offset)
    offset += 32

    // Write recipient pubkey (32 bytes)
    params.recipient.toBuffer().copy(instructionData, offset)
    offset += 32

    // Write inputToken pubkey (32 bytes)
    params.inputToken.toBuffer().copy(instructionData, offset)
    offset += 32

    // Write outputToken pubkey (32 bytes)
    params.outputToken.toBuffer().copy(instructionData, offset)
    offset += 32

    // Write inputAmount (8 bytes, little endian)
    instructionData.writeBigUInt64LE(params.inputAmount, offset)
    offset += 8

    // Write outputAmount (8 bytes, little endian)
    instructionData.writeBigUInt64LE(params.outputAmount, offset)
    offset += 8

    // Write destinationChainId (8 bytes, little endian)
    instructionData.writeBigUInt64LE(params.destinationChainId, offset)
    offset += 8

    // Write exclusiveRelayer pubkey (32 bytes)
    params.exclusiveRelayer.toBuffer().copy(instructionData, offset)
    offset += 32

    // Write quoteTimestamp (4 bytes, little endian)
    instructionData.writeUInt32LE(params.quoteTimestamp, offset)
    offset += 4

    // Write fillDeadline (4 bytes, little endian)
    instructionData.writeUInt32LE(params.fillDeadline, offset)
    offset += 4

    // Write exclusivityParameter (4 bytes, little endian)
    instructionData.writeUInt32LE(params.exclusivityParameter, offset)
    offset += 4

    // Write message length (4 bytes, little endian) and message data
    instructionData.writeUInt32LE(params.message.length, offset)
    offset += 4
    if (params.message.length > 0) {
      Buffer.from(params.message).copy(instructionData, offset)
    }
    const keys = [
      { pubkey: params.depositor, isSigner: true, isWritable: true },
      { pubkey: params.statePda, isSigner: false, isWritable: true },
      { pubkey: params.routePda, isSigner: false, isWritable: false }, // route PDA
      { pubkey: params.depositorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.vaultPda, isSigner: false, isWritable: true },
      { pubkey: params.inputToken, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: params.eventAuthority, isSigner: false, isWritable: false },
      { pubkey: programId, isSigner: false, isWritable: false },
    ]

    return new TransactionInstruction({
      keys,
      programId,
      data: instructionData,
    })
  }

  getName(): string {
    return 'Across'
  }
  getIcon(): string {
    return 'https://across.to/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [
      ChainId.MAINNET,
      ChainId.ARBITRUM,
      ChainId.OPTIMISM,
      ChainId.LINEA,
      ChainId.MATIC,
      ChainId.ZKSYNC,
      ChainId.BASE,
      ChainId.SCROLL,
      ChainId.BLAST,
      ChainId.UNICHAIN,
      ChainId.BSCMAINNET,
      // NonEvmChain.Solana,
    ]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    try {
      let res
      const isFromSol = params.fromChain === NonEvmChain.Solana
      if (isFromSol && isEvmChain(params.toChain)) {
        const reqParams = new URLSearchParams({
          inputToken: (params.fromToken as SolanaToken).id,
          outputToken: (params.toToken as Token).wrapped.address,
          destinationChainId: params.toChain.toString(),
          originChainId: '34268394551451',
          amount: params.amount,
          skipAmountLimit: 'true',
          allowUnmatchedDecimals: 'true',
        })

        res = await fetch(`${API_URL}?${reqParams}`).then(res => res.json())
      } else {
        const p = params as EvmQuoteParams
        res = await this.acrossClient.getSwapQuote({
          route: {
            originChainId: +params.fromChain,
            destinationChainId: +params.toChain,
            inputToken: (p.fromToken.isNative ? ZERO_ADDRESS : p.fromToken.wrapped.address) as `0x${string}`,
            outputToken: (p.toToken.isNative ? ZERO_ADDRESS : p.toToken.wrapped.address) as `0x${string}`,
          },
          amount: params.amount,
          appFee: params.feeBps / 10_000,
          appFeeRecipient: CROSS_CHAIN_FEE_RECEIVER,
          slippage: (params.slippage * 100) / 10_000,
          depositor: params.sender,
        })
      }

      // across only have bridge then we can treat token in and out price usd are the same in case price service is not supported
      const isSameToken = params.fromToken.symbol === params.toToken.symbol
      const tokenInUsd =
        isSameToken && NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain) && params.tokenOutUsd
          ? params.tokenOutUsd
          : params.tokenInUsd
      const tokenOutUsd =
        isSameToken && NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain) && params.tokenInUsd
          ? params.tokenInUsd
          : params.tokenOutUsd

      const outputAmount = BigInt(isFromSol ? res.outputAmount : res.expectedOutputAmount)
      const formattedOutputAmount = formatUnits(outputAmount, params.toToken.decimals)
      const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

      const inputUsd = tokenInUsd * +formattedInputAmount
      const outputUsd = tokenOutUsd * +formattedOutputAmount

      return {
        quoteParams: params,
        outputAmount,
        formattedOutputAmount,
        inputUsd: tokenInUsd * +formatUnits(BigInt(params.amount), params.fromToken.decimals),
        outputUsd: tokenOutUsd * +formattedOutputAmount,
        rate: +formattedOutputAmount / +formattedInputAmount,
        timeEstimate: isFromSol ? res.estimatedFillTimeSec : res.expectedFillTime,
        priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
        // TODO: what is gas fee for across
        gasFeeUsd: 0,
        contractAddress: isFromSol ? ZERO_ADDRESS : res.checks.allowance.spender,
        rawQuote: res,

        protocolFee: 0,
        platformFeePercent: (params.feeBps * 100) / 10_000,
      }
    } catch (e) {
      console.log('Across getQuote error', e)
      throw e
    }
  }

  async executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    sendTransaction?: WalletAdapterProps['sendTransaction'],
    connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    const isFromSol = quote.quote.quoteParams.fromChain === NonEvmChain.Solana

    if (isFromSol) {
      if (!connection || !sendTransaction)
        throw new Error('Connection and sendTransaction are required for Solana swap')

      return new Promise<NormalizedTxResponse>(async (resolve, reject) => {
        try {
          const rawQuote = quote.quote.rawQuote
          const depositor = new PublicKey(quote.quote.quoteParams.sender)

          // Convert recipient address if it's in EVM format
          const recipientAddr = quote.quote.quoteParams.recipient
          const recipient = recipientAddr.startsWith('0x') ? evmToSolanaPK(recipientAddr) : new PublicKey(recipientAddr)

          const inputToken = new PublicKey((quote.quote.quoteParams.fromToken as SolanaToken).id)
          const outputToken = evmToSolanaPK(rawQuote.outputToken.address)
          const exclusiveRelayer = evmToSolanaPK(rawQuote.exclusiveRelayer) // Using fee receiver as relayer

          const inputAmount = BigInt(quote.quote.quoteParams.amount)
          const outputAmount = BigInt(rawQuote.outputAmount)
          const destinationChainId = BigInt(rawQuote.outputToken.chainId)
          const quoteTimestamp = rawQuote.quoteTimestamp >>> 0
          const fillDeadline = rawQuote.fillDeadline >>> 0
          const exclusivityParameter = rawQuote.exclusivityParameter >>> 0
          const message = new Uint8Array([])

          // Derive PDAs
          const { statePda, routePda, depositorTokenAccount, vaultPda, eventAuthority } = await this.derivePdas(
            depositor,
            inputToken,
            destinationChainId,
          )

          // Create transaction manually like Across frontend does
          const transaction = new Transaction()

          // Create approve instruction (approve state PDA to spend tokens)
          const approveInstruction = this._createApproveInstruction(
            depositorTokenAccount,
            inputToken,
            statePda,
            inputAmount,
            (quote.quote.quoteParams.fromToken as SolanaToken).decimals,
            depositor,
          )

          // Create deposit instruction following Across pattern
          const depositInstruction = this.createDepositInstruction({
            depositor,
            recipient,
            inputToken,
            outputToken,
            inputAmount,
            outputAmount,
            destinationChainId,
            exclusiveRelayer,
            quoteTimestamp,
            fillDeadline,
            exclusivityParameter,
            message,
            depositorTokenAccount,
            statePda,
            routePda,
            vaultPda,
            eventAuthority,
          })

          // Add both instructions to transaction (approve first, then deposit)
          transaction.add(approveInstruction, depositInstruction)

          // Sign and send transaction using wallet adapter
          const signature = await sendTransaction(transaction, connection)

          try {
            const latestBlockhash = await connection.getLatestBlockhash()

            // Wait for confirmation with timeout
            const confirmation = await Promise.race([
              connection.confirmTransaction(
                {
                  signature,
                  blockhash: latestBlockhash.blockhash,
                  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                },
                'confirmed',
              ),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000),
              ),
            ])

            const confirmationResult = confirmation as { value: { err: any } }
            if (confirmationResult.value.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(confirmationResult.value.err)}`)
            }

            console.log('Transaction confirmed successfully!')
          } catch (confirmError) {
            console.error('Transaction confirmation failed:', confirmError)

            // Check if transaction actually succeeded despite timeout
            const txStatus = await connection.getSignatureStatus(signature)
            if (txStatus?.value?.confirmationStatus !== 'confirmed') {
              throw new Error(`Transaction was not confirmed: ${confirmError.message}`)
            }
          }

          resolve({
            sender: quote.quote.quoteParams.sender,
            sourceTxHash: signature,
            adapter: this.getName(),
            id: signature,
            sourceChain: quote.quote.quoteParams.fromChain,
            targetChain: quote.quote.quoteParams.toChain,
            inputAmount: quote.quote.quoteParams.amount,
            outputAmount: quote.quote.outputAmount.toString(),
            sourceToken: quote.quote.quoteParams.fromToken,
            targetToken: quote.quote.quoteParams.toToken,
            timestamp: new Date().getTime(),
          })
        } catch (error) {
          reject(error)
        }
      })
    }

    // For EVM chains, use the original implementation
    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      this.acrossClient
        .executeSwapQuote({
          walletClient: walletClient as any,
          swapQuote: quote.quote.rawQuote as any,
          onProgress: progress => {
            if (progress.step === 'swap' && 'txHash' in progress) {
              resolve({
                sender: quote.quote.quoteParams.sender,
                sourceTxHash: progress.txHash,
                adapter: this.getName(),
                id: progress.txHash,
                sourceChain: quote.quote.quoteParams.fromChain,
                targetChain: quote.quote.quoteParams.toChain,
                inputAmount: quote.quote.quoteParams.amount,
                outputAmount: quote.quote.outputAmount.toString(),
                sourceToken: quote.quote.quoteParams.fromToken,
                targetToken: quote.quote.quoteParams.toToken,
                timestamp: new Date().getTime(),
              })
            }
          },
        })
        .catch(reject)
    })
  }
  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const res = await fetch(`https://app.across.to/api/deposit/status?depositTxHash=${params.sourceTxHash}`).then(
        res => res.json(),
      )
      return {
        txHash: res.fillTx || '',
        status: res.status === 'refunded' ? 'Refunded' : res.status === 'filled' ? 'Success' : 'Processing',
      }
    } catch (error) {
      console.error('Error fetching transaction status:', error)
      return {
        txHash: '',
        status: 'Processing',
      }
    }
  }
}
