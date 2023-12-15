import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { IPhaseData } from 'hooks/useClaimReward'
import { GasPriceData } from 'hooks/useGasPriceFromDeBank'

const externalApi = createApi({
  reducerPath: 'externalApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: builder => ({
    getClaimRewards: builder.query<IPhaseData[], { url: string; account?: string }>({
      query: ({ url }) => ({
        url,
      }),
    }),
    getGasPrice: builder.query<GasPriceData, { chainSlug: string }>({
      query: ({ chainSlug }) => ({
        url: 'https://openapi.debank.com/v1/wallet/gas_market',
        params: { chain_id: chainSlug },
      }),
    }),
  }),
})

export default externalApi
