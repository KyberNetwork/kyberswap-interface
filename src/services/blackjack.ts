import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { BLACKJACK_API } from 'constants/env'

type BlackjackCheck = {
  blacklisted: boolean
  expiryMs: string
  reason: number
}

type BlackjackResponse = {
  data: {
    wallets: BlackjackCheck[]
  }
}

const blackjackApi = createApi({
  reducerPath: 'blackjackApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BLACKJACK_API}/v1`,
  }),
  endpoints: builder => ({
    checkBlackjack: builder.query<BlackjackCheck, string>({
      query: (address: string) => ({
        url: '/check',
        params: {
          wallets: address,
        },
      }),
      transformResponse: (res: BlackjackResponse): BlackjackCheck => {
        return res.data.wallets[0]
      },
    }),
  }),
})

export const { useCheckBlackjackQuery } = blackjackApi

export default blackjackApi
