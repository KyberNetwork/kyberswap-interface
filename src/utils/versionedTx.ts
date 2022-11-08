import { Commitment, Message, PublicKey, Transaction, TransactionMessage, VersionedTransaction } from '@solana/web3.js'

import { LOOKUP_TABLES_BY_POOL } from 'constants/lookupTablesByPool'
import connection from 'state/connection/connection'
import { filterTruthy } from 'utils'

/**
 * @param {Connection} connection Web3.js connection
 * @param {Commitment} commitment The level of commitment desired when querying state
 * @param {string} recentBlockhash Recent blockhash as base58 string
 * @param {Message} message Transaction message to be converted to VersionedTransaction
 * @param {{[key: string]: string}} lookupTableByPoolAddress The mapping from pool address to the address of lookup table that stores pubkeys for the pool
 * @return {Promise<VersionedTransaction>} The converted VersionedTransaction
 */
export async function convertToVersionedTx(
  commitment: Commitment,
  recentBlockhash: string,
  message: Message,
  payer: PublicKey,
): Promise<VersionedTransaction> {
  // get tables that can be used in this message
  const lookupTableAddrs: Array<PublicKey> = []
  for (const pubkey of message.accountKeys) {
    if (LOOKUP_TABLES_BY_POOL[pubkey.toBase58()]) {
      lookupTableAddrs.push(new PublicKey(LOOKUP_TABLES_BY_POOL[pubkey.toBase58()]))
    }
  }

  // load on-chain tables
  const lookupTables = filterTruthy(
    await Promise.all(
      lookupTableAddrs.map(pubkey => connection.getAddressLookupTable(pubkey, { commitment }).then(v => v.value)),
    ),
  )

  // convert to VersionedTransaction
  const tx = Transaction.populate(message)
  const versionedMessage = new TransactionMessage({
    payerKey: payer,
    instructions: tx.instructions,
    recentBlockhash,
  }).compileToV0Message(lookupTables)

  return new VersionedTransaction(versionedMessage)
}
