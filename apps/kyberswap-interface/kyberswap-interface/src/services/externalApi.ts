import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { IPhaseData } from 'hooks/useClaimReward'

const externalApi = createApi({
  reducerPath: 'externalApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: builder => ({
    getClaimRewards: builder.query<IPhaseData[], { url: string; account?: string }>({
      query: ({ url }) => ({
        url,
      }),
    }),
  }),
})

export default externalApi
