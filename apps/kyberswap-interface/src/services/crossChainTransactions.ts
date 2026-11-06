import { type BaseQueryFn, type FetchArgs, createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import { z } from 'zod'

import { CROSSCHAIN_AGGREGATOR_API } from 'constants/env'
import { isBackendResolved, transactionIdentity } from 'state/crossChainSwap/model'

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
export type BackendTransaction = z.infer<typeof backendTransactionSchema>
export type RecordedTransaction = z.infer<typeof recordedTransactionSchema>
export type TransactionApiError = { status: number | string; code?: number }
export const isPermanentTransactionError = (error: TransactionApiError) =>
  typeof error.status === 'number' &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 408 &&
  error.status !== 429

const fetchQuery = fetchBaseQuery({ baseUrl: `${CROSSCHAIN_AGGREGATOR_API}/api/v1/transactions`, timeout: 15_000 })

type TransactionBaseQueryOptions = {
  schema?: z.ZodType
  transform?: (data: unknown, args: FetchArgs) => unknown
}

const baseQuery: BaseQueryFn<FetchArgs, unknown, TransactionApiError, TransactionBaseQueryOptions> = async (
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
  if (!parsed?.success) return { error: { status: 502 } }
  return { data: options.transform ? options.transform(parsed.data, args) : parsed.data }
}

const crossChainTransactionsApi = createApi({
  reducerPath: 'crossChainTransactionsApi',
  baseQuery: retry(baseQuery, { maxRetries: 0 }),
  // Registration and detail responses are cached here; local sync owns settlement.
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
  }),
})

export const { useGetTransactionQuery, useRecordTransactionMutation } = crossChainTransactionsApi
export default crossChainTransactionsApi
