import {
  AddressLookupTableAccount,
  AddressLookupTableProgram,
  Commitment,
  Message,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'

import connection from 'state/connection/connection'
import { filterTruthy } from 'utils'

const lookupTablesByPool = (async () => {
  const result: { LOOKUP_TABLES_BY_POOL: { [tableAddress: string]: string[] } } = {
    LOOKUP_TABLES_BY_POOL: {},
  }
  const authority = new PublicKey('9YqphVt2hdE7RaL3YBCCP49thJbSovwgZQhyHjvgi1L3') // Kyber's lookuptable account owner
  const tableAccs = await connection.getProgramAccounts(AddressLookupTableProgram.programId, {
    commitment: 'confirmed',
    filters: [
      {
        memcmp: {
          offset:
            4 + // Variant
            8 + // DeactivationSlot
            8 + // LastExtendedSlot
            1 + // LastExtendedSlotStartIndex
            1, // HasAuthority
          bytes: authority.toBase58(),
        },
      },
    ],
  })
  const tables: AddressLookupTableAccount[] = []
  tableAccs.forEach(acc => {
    tables.push(
      new AddressLookupTableAccount({
        key: acc.pubkey,
        state: AddressLookupTableAccount.deserialize(acc.account.data),
      }),
    )
  })
  for (const table of tables) {
    result.LOOKUP_TABLES_BY_POOL[table.key.toBase58()] = table.state.addresses.map(i => i.toBase58())
  }
  return result
})()
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
  preTxs?: TransactionInstruction[] | null | undefined,
  postTxs?: TransactionInstruction[] | null | undefined,
): Promise<VersionedTransaction> {
  const LOOKUP_TABLES_BY_POOL = (await lookupTablesByPool).LOOKUP_TABLES_BY_POOL
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
  const instructions: TransactionInstruction[] = []
  if (preTxs) instructions.push(...preTxs)
  instructions.push(...tx.instructions)
  if (postTxs) instructions.push(...postTxs)
  const versionedMessage = new TransactionMessage({
    payerKey: payer,
    instructions,
    recentBlockhash,
  }).compileToV0Message(lookupTables)

  return new VersionedTransaction(versionedMessage)
}
