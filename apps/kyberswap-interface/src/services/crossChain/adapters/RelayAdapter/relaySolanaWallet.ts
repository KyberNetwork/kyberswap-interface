import { AdaptedWallet, LogLevel, getClient } from '@relayprotocol/relay-sdk'
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'

/**
 * Keep this adapter local instead of importing @reservoir0x/relay-solana-wallet-adapter.
 * That package still imports getClient/LogLevel from @reservoir0x/relay-sdk, while this app
 * creates and executes Relay quotes with @relayprotocol/relay-sdk. Relay's client is a
 * package-level singleton, so the package adapter reads an uninitialized client and can crash
 * after sending the Solana transaction when it calls client.log(...). This adapter mirrors the
 * package implementation but uses the same @relayprotocol/relay-sdk singleton as RelayAdapter.
 */
export const adaptRelaySolanaWallet = (
  walletAddress: string,
  chainId: number,
  connection: Connection,
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction,
    options?: SendOptions,
  ) => Promise<{ signature: TransactionSignature }>,
): AdaptedWallet => ({
  vmType: 'svm',
  getChainId: async () => chainId,
  address: async () => walletAddress,
  handleSignMessageStep: async () => {
    throw new Error('Message signing not implemented for Solana')
  },
  handleSendTransactionStep: async (_chainId, stepItem) => {
    const instructions =
      stepItem.data?.instructions?.map(
        instruction =>
          new TransactionInstruction({
            keys: instruction.keys.map(key => ({
              isSigner: key.isSigner,
              isWritable: key.isWritable,
              pubkey: new PublicKey(key.pubkey),
            })),
            programId: new PublicKey(instruction.programId),
            data: Buffer.from(instruction.data, 'hex'),
          }),
      ) ?? []

    const addressLookupTableAccounts = await Promise.all(
      stepItem.data?.addressLookupTableAddresses?.map(async address => {
        const lookupTable = await connection.getAddressLookupTable(new PublicKey(address))
        return lookupTable.value
      }) ?? [],
    )

    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(walletAddress),
      instructions,
      recentBlockhash: await connection.getLatestBlockhash().then(blockhash => blockhash.blockhash),
    }).compileToV0Message(addressLookupTableAccounts.filter(Boolean) as AddressLookupTableAccount[])

    const transaction = new VersionedTransaction(messageV0)
    const signature = await signAndSendTransaction(transaction)
    getClient()?.log(['Transaction Signature obtained', signature], LogLevel.Verbose)

    return signature.signature
  },
  handleConfirmTransactionStep: async txHash => {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
    const result = await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: txHash,
    })

    if (result.value.err) {
      throw new Error(`Transaction failed: ${result.value.err}`)
    }

    return {
      blockHash: result.context.slot.toString(),
      blockNumber: result.context.slot,
      txHash,
    }
  },
  switchChain: async () => {
    throw new Error('Not yet implemented')
  },
})
