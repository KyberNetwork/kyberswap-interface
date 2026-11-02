import { z } from 'zod'

const amount = z.string().regex(/^\d+$/)
const eventSchema = z.object({
  chainName: z.string().min(1),
  rawAmount: z.string().regex(/^-?(?:0x[0-9a-f]+|\d+)$/i),
  token: z.string().min(1),
  wallet: z.string().min(1),
})
const rowSchema = z.object({
  events: z.array(eventSchema),
  extra: z.object({
    sourceTxHash: z.string().optional(),
    txHash: z.string().optional(),
    destTxHash: z.string().nullish(),
    provider: z.string().optional(),
    client: z.string().optional(),
    quoteId: z.string().optional(),
    actualOutput: amount.nullish(),
    quotedOutput: amount.nullish(),
    quotedMinOutput: amount.nullish(),
    inputUsd: z.union([z.string(), z.number()]).nullish(),
    outputUsd: z.union([z.string(), z.number()]).nullish(),
    timeEstimate: z.number().int().nonnegative().optional(),
    verification: z.enum(['pending', 'verified', 'mismatched', 'not_found']).optional(),
  }),
  fromChainName: z.string().min(1),
  toChainName: z.string().min(1),
  status: z.enum(['success', 'failed', 'refunded', 'pending', 'processing', 'in_progress', 'unknown']),
  timestamp: z.string().datetime({ offset: true }),
  txType: z.enum(['cross_chain', 'swap']),
  wallet: z.string().min(1),
})

export type IndexedTransaction = {
  id: string
  quoteId: string
  sourceTxHash: string
  verification: 'pending' | 'verified' | 'mismatched' | 'not_found'
  status: 'unknown' | 'in_progress' | 'success' | 'failed' | 'refunded'
  provider: string
  fromChain: string
  fromToken: string
  fromAmount: string
  toChain: string
  toToken: string
  sender: string
  recipient: string
  destTxHash: string | null
  quotedOutput: string
  quotedMinOutput: string
  actualOutput: string | null
  inputUsd: number | null
  outputUsd: number | null
  timeEstimate: number
  createdAt: string
  completedAt: string | null
  expiredAt: string | null
  historyType: 'cross_chain' | 'swap'
  historyWallet: string
}

export type IndexedTransactionPage = {
  transactions: IndexedTransaction[]
  nextCursor: string | null
  /** Oldest raw index row, including rows the UI cannot display. */
  oldestTimestamp?: number
}

const usd = (value: string | number | null | undefined) => {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const rawAmountToUnits = (value: string) => {
  const negative = value.startsWith('-')
  const raw = negative ? value.slice(1) : value
  const units = raw.toLowerCase().startsWith('0x') ? BigInt(raw) : BigInt(raw)
  return { negative, units }
}

/** Maps the KD wallet index contract into the history domain's indexed record.
 * It intentionally does not use the aggregator registration/detail contract. */
export const walletTransactionToIndexed = (value: unknown): IndexedTransaction | undefined => {
  const parsed = rowSchema.safeParse(value)
  if (!parsed.success) return undefined
  const row = parsed.data
  const source = row.events.filter(event => event.chainName === row.fromChainName && event.rawAmount.startsWith('-'))
  const target = row.events.filter(event => event.chainName === row.toChainName && !event.rawAmount.startsWith('-'))
  const completePair = source.length === 1 && target.length === 1
  const extra = row.extra
  const hash = extra.sourceTxHash || extra.txHash
  if (!hash) return undefined
  const status = row.status === 'pending' || row.status === 'processing' ? 'in_progress' : row.status
  const terminal = ['success', 'failed', 'refunded'].includes(status)
  const output = completePair ? rawAmountToUnits(target[0].rawAmount).units.toString() : '0'
  return {
    id: JSON.stringify([row.fromChainName, hash]),
    quoteId: extra.quoteId || '',
    sourceTxHash: hash,
    verification: extra.verification || (terminal ? 'verified' : 'pending'),
    status,
    provider: extra.provider || extra.client || 'kyberswap',
    fromChain: row.fromChainName,
    fromToken: completePair ? source[0].token : '',
    fromAmount: completePair ? rawAmountToUnits(source[0].rawAmount).units.toString() : '0',
    toChain: row.toChainName,
    toToken: completePair ? target[0].token : '',
    sender: completePair ? source[0].wallet : '',
    recipient: completePair ? target[0].wallet : '',
    destTxHash: extra.destTxHash || (row.txType === 'swap' ? hash : null),
    quotedOutput: extra.quotedOutput ?? output,
    quotedMinOutput: extra.quotedMinOutput ?? output,
    actualOutput: extra.actualOutput ?? (terminal ? output : null),
    inputUsd: usd(extra.inputUsd),
    outputUsd: usd(extra.outputUsd),
    timeEstimate: extra.timeEstimate ?? 0,
    createdAt: row.timestamp,
    completedAt: terminal ? row.timestamp : null,
    expiredAt: null,
    historyType: row.txType,
    historyWallet: row.wallet,
  }
}

export const indexedTransactionPageFromWalletRows = (rows: unknown[], offset: number): IndexedTransactionPage => ({
  transactions: rows.flatMap(row => {
    const transaction = walletTransactionToIndexed(row)
    return transaction ? [transaction] : []
  }),
  // KD exposes offset/limit only. RTK treats the next offset as an opaque cursor;
  // count raw rows so unsupported records never stall pagination.
  nextCursor: rows.length === 10 ? String(offset + rows.length) : null,
  oldestTimestamp: rows.reduce<number | undefined>((oldest, row) => {
    const parsed = z.object({ timestamp: z.string().datetime({ offset: true }) }).safeParse(row)
    if (!parsed.success) return oldest
    const timestamp = Date.parse(parsed.data.timestamp)
    return oldest === undefined ? timestamp : Math.min(oldest, timestamp)
  }, undefined),
})
