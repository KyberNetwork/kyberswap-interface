// Bridge utilities for the ethers.js → viem migration.
//
// These helpers exist only to keep legacy ethers callers working while files
// are migrated to viem one-by-one. Each helper should disappear once its last
// caller is migrated; the module itself is expected to be deleted in the
// final cleanup phase. This is the one file where importing ethers is
// intentional, so the project-wide `no-restricted-imports` rule is silenced.

/* eslint-disable no-restricted-imports */
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import { Hash, PublicClient } from 'viem'

export const bigNumberToBigInt = (value: BigNumber): bigint => BigInt(value.toString())

export const bigIntToBigNumber = (value: bigint): BigNumber => BigNumber.from(value.toString())

// Wraps a viem transaction hash in an ethers-shaped TransactionResponse so
// callers that still type their callbacks as `(tx: TransactionResponse)` keep
// working while the underlying send path moves to viem. Only `hash` and
// `wait()` are populated — those are the only fields the codebase actually
// reads. Remove this once Phase 6 finishes and callers consume `Hash` directly.
export function hashToTxResponse(hash: Hash, publicClient: PublicClient): TransactionResponse {
  const wait = async (confirmations?: number): Promise<TransactionReceipt> => {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations,
    })
    return receipt as unknown as TransactionReceipt
  }

  return { hash, wait } as unknown as TransactionResponse
}
