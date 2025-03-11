import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { FetchBalancesArg, fetchBalancesQuery } from 'hooks/bridge'
import { TokenAmountLoading } from 'state/wallet/hooks'

const contractQuery = createApi({
  reducerPath: 'contractQuery',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: builder => ({
    fetchBalances: builder.query<TokenAmountLoading[], FetchBalancesArg>({
      queryFn: async (arg: FetchBalancesArg) => {
        const data = await fetchBalancesQuery(arg)
        return { data }
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const { account, tokens, chainId } = queryArgs
        return { account, tokens, chainId }
      },
      keepUnusedDataFor: 10,
    }),
  }),
})

export const { useFetchBalancesQuery } = contractQuery

export default contractQuery
