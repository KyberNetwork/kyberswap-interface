import { createSelector } from '@reduxjs/toolkit'
import { type BaseQueryFn, type FetchArgs, createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import {
  type IndexedTransaction,
  type IndexedTransactionPage,
  WALLET_TRANSACTIONS_PAGE_SIZE,
  indexedTransactionPageFromWalletRows,
} from 'services/walletTransactions'
import { z } from 'zod'

import { isBackendResolved, transactionIdentity } from 'state/crossChainSwap/model'

export type WalletTransactionApiError = { status: number | string; code?: number }

const fetchQuery = fetchBaseQuery({ baseUrl: import.meta.env.VITE_KYBER_AI_API_URL, timeout: 15_000 })
const baseQuery: BaseQueryFn<
  FetchArgs,
  unknown,
  WalletTransactionApiError,
  { schema?: z.ZodType; transform?: (data: unknown, args: FetchArgs) => unknown }
> = async (args, api, options) => {
  const result = await fetchQuery(args, api, {})
  const envelope = z
    .object({ code: z.number(), data: z.unknown().optional() })
    .safeParse(result.error && 'data' in result.error ? result.error.data : result.data)
  if (result.error || !envelope.success || envelope.data.code !== 0)
    return { error: { status: result.error?.status ?? 502, code: envelope.success ? envelope.data.code : undefined } }
  const parsed = options.schema?.safeParse(envelope.data.data)
  if (!parsed?.success) return { error: { status: 502 } }
  return { data: options.transform ? options.transform(parsed.data, args) : parsed.data }
}

const walletTransactionsApi = createApi({
  reducerPath: 'walletTransactionsApi',
  baseQuery: retry(baseQuery, { maxRetries: 0 }),
  keepUnusedDataFor: 24 * 60 * 60,
  endpoints: builder => ({
    getTransactions: builder.infiniteQuery<IndexedTransactionPage, string, string | undefined>({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: page => page.nextCursor ?? undefined,
      },
      query: ({ queryArg: sender, pageParam: cursor }) => ({
        url: `/v1/wallets/uni/${encodeURIComponent(sender)}/transactions`,
        params: { offset: cursor ? Number(cursor) : 0, limit: WALLET_TRANSACTIONS_PAGE_SIZE },
      }),
      extraOptions: {
        schema: z.array(z.unknown()),
        transform: (data: unknown, args: FetchArgs) =>
          indexedTransactionPageFromWalletRows(data as unknown[], Number(args.params?.offset || 0)),
      },
    }),
  }),
})

export const selectIndexedTransactions = createSelector(
  [
    (state: { walletTransactionsApi: ReturnType<typeof walletTransactionsApi.reducer> }) =>
      state.walletTransactionsApi.queries,
  ],
  queries => {
    const rows = new Map<string, IndexedTransaction>()
    const merge = (row: IndexedTransaction) => {
      const key = transactionIdentity(row.fromChain, row.sourceTxHash, '')
      const current = rows.get(key)
      if (!isBackendResolved(current) || isBackendResolved(row)) rows.set(key, { ...current, ...row })
    }
    Object.values(queries).forEach(query => {
      if (query?.endpointName === 'getTransactions' && query.data)
        (query.data as { pages: IndexedTransactionPage[] }).pages.forEach(page => page.transactions.forEach(merge))
    })
    return [...rows.values()]
  },
)

export const useGetTransactionsInfiniteQueryState =
  walletTransactionsApi.endpoints.getTransactions.useInfiniteQueryState
export const useGetTransactionsInfiniteQuerySubscription =
  walletTransactionsApi.endpoints.getTransactions.useInfiniteQuerySubscription
export default walletTransactionsApi
