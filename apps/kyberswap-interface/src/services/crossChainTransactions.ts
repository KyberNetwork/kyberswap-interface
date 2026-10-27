import { createSelector } from '@reduxjs/toolkit'
import { type BaseQueryFn, type FetchArgs, createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import { z } from 'zod'

import { CROSSCHAIN_AGGREGATOR_API } from 'constants/env'
import { isBackendResolved, transactionIdentity } from 'pages/Swap/crossChain/transactions/model'

export const verificationSchema = z.enum(['pending', 'verified', 'mismatched', 'not_found'])
export const backendStatusSchema = z.enum(['unknown', 'in_progress', 'success', 'failed', 'refunded'])
const amountSchema = z.string().regex(/^\d+$/)
export const recordedTransactionSchema = z.object({
  id: z.string().uuid(),
  quoteId: z.string().min(1),
  sourceTxHash: z.string().min(1),
  verification: verificationSchema,
  status: backendStatusSchema,
})
export const backendTransactionSchema = recordedTransactionSchema.extend({
  provider: z.string(),
  fromChain: z.string(),
  fromToken: z.string(),
  fromAmount: amountSchema,
  toChain: z.string(),
  toToken: z.string(),
  sender: z.string(),
  recipient: z.string(),
  destTxHash: z.string().nullable(),
  quotedOutput: amountSchema,
  quotedMinOutput: amountSchema,
  actualOutput: amountSchema.nullable(),
  inputUsd: z.number().nullable(),
  outputUsd: z.number().nullable(),
  timeEstimate: z.number().int(),
  createdAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).nullable(),
  expiredAt: z.string().datetime({ offset: true }).nullable(),
})
export const transactionPageSchema = z.object({
  transactions: z.array(backendTransactionSchema),
  nextCursor: z.string().nullable(),
})
export type BackendTransaction = z.infer<typeof backendTransactionSchema>
export type RecordedTransaction = z.infer<typeof recordedTransactionSchema>
export type TransactionPage = z.infer<typeof transactionPageSchema>

export type TransactionApiError = { status: number | string; code?: number }
export const isPermanentTransactionError = (error: TransactionApiError) =>
  typeof error.status === 'number' &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 408 &&
  error.status !== 429

const fetchQuery = fetchBaseQuery({ baseUrl: `${CROSSCHAIN_AGGREGATOR_API}/api/v1/transactions`, timeout: 15_000 })
const baseQuery: BaseQueryFn<FetchArgs, unknown, TransactionApiError, { schema?: z.ZodType }> = async (
  args,
  api,
  options,
) => {
  const result = await fetchQuery(args, api, {})
  const envelope = z
    .object({ code: z.number(), data: z.unknown().optional() })
    .safeParse(result.error && 'data' in result.error ? result.error.data : result.data)
  // Never retain response messages: validation errors may echo the opaque quote token.
  if (result.error || !envelope.success || envelope.data.code !== 0)
    return { error: { status: result.error?.status ?? 502, code: envelope.success ? envelope.data.code : undefined } }
  const parsed = options.schema?.safeParse(envelope.data.data)
  return parsed?.success ? { data: parsed.data } : { error: { status: 502 } }
}

const crossChainTransactionsApi = createApi({
  reducerPath: 'crossChainTransactionsApi',
  baseQuery: retry(baseQuery, { maxRetries: 0 }),
  // Detail results bridge local removal and list loading, without a separate history cache.
  // RTK data is not persisted: after reload, a settled row depends on the list
  // returning it and can be temporarily absent if that list has not caught up.
  keepUnusedDataFor: 24 * 60 * 60,
  endpoints: builder => ({
    recordTransaction: builder.mutation<RecordedTransaction, { quoteToken: string; sourceTxHash: string }>({
      query: body => ({ url: '', method: 'POST', body }),
      extraOptions: { schema: recordedTransactionSchema },
    }),
    getTransaction: builder.query<
      BackendTransaction,
      { sourceTxHash: string; chain: string | number; quoteId?: string }
    >({
      query: ({ sourceTxHash, chain, quoteId }) => ({
        url: `/${encodeURIComponent(sourceTxHash)}`,
        params: { chain: String(chain), ...(quoteId ? { quoteId } : {}) },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${transactionIdentity(queryArgs.chain, queryArgs.sourceTxHash, queryArgs.quoteId || '')}`,
      merge: (current, incoming) => (isBackendResolved(current) && !isBackendResolved(incoming) ? current : incoming),
      extraOptions: { schema: backendTransactionSchema },
    }),
    getTransactions: builder.infiniteQuery<TransactionPage, string, string | undefined>({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: page => page.nextCursor ?? undefined,
      },
      query: ({ queryArg: sender, pageParam: cursor }) => ({ url: '', params: { sender, limit: 10, cursor } }),
      extraOptions: { schema: transactionPageSchema, maxRetries: 1 },
    }),
  }),
})

// List pages and detail reads share the RTK cache. Detail polling can enrich a
// loaded page or hand off a just-settled local row before its first list request.
export const selectBackendTransactions = createSelector(
  [
    (state: { crossChainTransactionsApi: ReturnType<typeof crossChainTransactionsApi.reducer> }) =>
      state.crossChainTransactionsApi.queries,
  ],
  queries => {
    const rows = new Map<string, BackendTransaction>()
    const merge = (row: BackendTransaction) => {
      if (!isBackendResolved(rows.get(row.id)) || isBackendResolved(row)) rows.set(row.id, row)
    }
    Object.values(queries).forEach(query => {
      if (query?.endpointName === 'getTransactions' && query.data)
        (query.data as { pages: TransactionPage[] }).pages.forEach(page => page.transactions.forEach(merge))
    })
    Object.values(queries).forEach(query => {
      if (query?.endpointName === 'getTransaction' && query.data) {
        const row = query.data as BackendTransaction
        // Unlisted pending/rejected registrations remain owned by local sync.
        // Do not restart them as server-only work after that sync stops.
        if (rows.has(row.id) || isBackendResolved(row)) merge(row)
      }
    })
    return [...rows.values()]
  },
)

export const { useGetTransactionsInfiniteQuery } = crossChainTransactionsApi
export default crossChainTransactionsApi
