import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Currency, CurrencyAmount, WETH } from '@namgold/ks-sdk-core'
import { Program } from '@project-serum/anchor'
import * as anchor from '@project-serum/anchor'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import {
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'

import { SolanaAggregatorPrograms } from 'constants/idl/solana_aggregator_programs'
import connection from 'state/connection/connection'

// import connection from 'state/connection/connection'
import { Aggregator, Swap } from './aggregator'

export function createIdempotentAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): TransactionInstruction {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({
    keys,
    programId: associatedTokenProgramId,
    data: Buffer.from([1]),
  })
}

export const createWrapSOLInstruction = async (
  account: PublicKey,
  amountIn: CurrencyAmount<Currency>,
): Promise<TransactionInstruction[]> => {
  if (amountIn.currency.isNative) {
    const associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, account)
    const WSOLBalance = await connection.getTokenAccountBalance(associatedTokenAccount)
    const WSOLAmount = CurrencyAmount.fromRawAmount(WETH[ChainId.SOLANA], WSOLBalance.value.amount)
    if (WSOLAmount.lessThan(amountIn)) {
      const wrapSOLIx = createIdempotentAssociatedTokenAccountInstruction(
        account,
        associatedTokenAccount,
        account,
        NATIVE_MINT,
      )

      const transferIx = SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: associatedTokenAccount,
        lamports: BigInt(amountIn.quotient.toString()),
      })
      const syncNativeIx = createSyncNativeInstruction(associatedTokenAccount)

      return [wrapSOLIx, transferIx, syncNativeIx]
    }
  }
  return []
}
const createUnwrapSOLInstruction = async (
  account: PublicKey,
  amountOut: CurrencyAmount<Currency>,
): Promise<TransactionInstruction | null> => {
  if (amountOut.currency.isNative) {
    const associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, account)
    const unwrapSOLIx = createCloseAccountInstruction(associatedTokenAccount, account, account)
    return unwrapSOLIx
  }
  return null
}

const createSolanaRecordAmountInstruction = (
  state: Keypair,
  account: PublicKey,
  program: Program<SolanaAggregatorPrograms>,
  trade: Aggregator,
) => {
  const recordAmountIx = program.instruction.recordAmount({
    accounts: {
      state: state.publicKey,
      signer: account,
      tokenOut: trade.outputAmount.currency.isNative
        ? WETH[ChainId.SOLANA].address
        : trade.outputAmount.currency.address,
      systemProgram: SystemProgram.programId,
    },
  })
  return recordAmountIx
}

const createSolanaCheckDeltaInstruction = (
  state: Keypair,
  account: PublicKey,
  program: Program<SolanaAggregatorPrograms>,
  trade: Aggregator,
) => {
  const checkDeltaIx = program.instruction.checkDelta(new anchor.BN(95 * 1_000_000), {
    accounts: {
      user: account,
      state: state.publicKey,
      tokenOut: trade.outputAmount.currency.isNative
        ? WETH[ChainId.SOLANA].address
        : trade.outputAmount.currency.address,
    },
  })
  return checkDeltaIx
}

// const programAccount = {
//   OrcaV2: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
//   Serum: '',
//   RaydiumV5: '5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h',
//   WhirlPool: '',
//   Saber: '',
//   RaydiumV4: '',
//   Mercurial: '',
// }

const createSwapInstruction = (
  state: Keypair,
  account: PublicKey,
  program: Program<SolanaAggregatorPrograms>,
  swaps: Swap[],
) => {
  const instructions: TransactionInstruction[] = []
  swaps.forEach(swap => {
    return
  })
  return instructions
}

export const createSolanaSwapTransaction = async (
  account: PublicKey,
  program: Program<SolanaAggregatorPrograms>,
  programAccount: string,
  trade: Aggregator,
  value: BigNumber,
): Promise<Transaction> => {
  const state = Keypair.generate()
  const instructions: TransactionInstruction[] = []

  const wrapSOLInstruction = await createWrapSOLInstruction(account, trade.inputAmount)
  instructions.push(...wrapSOLInstruction)

  const recordAmountIx = createSolanaRecordAmountInstruction(state, account, program, trade)
  instructions.push(recordAmountIx)

  trade.swaps.forEach((swap, index) => {
    const swapInstruction = createSwapInstruction(state, account, program, swap)
    instructions.push(...swapInstruction)
  })

  const checkDeltaIx = createSolanaCheckDeltaInstruction(state, account, program, trade)
  instructions.push(checkDeltaIx)

  const unwrapSOLInstruction = await createUnwrapSOLInstruction(account, trade.inputAmount)
  unwrapSOLInstruction && instructions.push(unwrapSOLInstruction)

  const latestBlockhash = await connection.getLatestBlockhash()
  const tx = new Transaction(latestBlockhash)
  tx.add(...instructions)
  // tx.sign(account, state)

  return tx
}
