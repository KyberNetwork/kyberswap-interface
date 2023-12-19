import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { BLACKJACK_API } from 'constants/env'
import { ApiValidateError } from 'constants/errors'
import { isArray, isBoolean, isNumber, isString, isStruct } from 'utils/validate'

const verifyBlackjackResponse = isStruct({
  data: isStruct({
    wallets: isArray(
      isStruct({
        blacklisted: isBoolean,
        updatedMs: isString,
        reason: isNumber,
      }),
    ),
  }),
})

const blackjackApi = createApi({
  reducerPath: 'blackjackApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BLACKJACK_API}/v1`,
  }),
  endpoints: builder => ({
    checkBlackjack: builder.query({
      query: (address: string) => ({
        url: '/check',
        params: {
          wallets: address,
        },
      }),
      transformResponse: (res: unknown, meta) => {
        if (verifyBlackjackResponse(res)) {
          return res.data.wallets[0]
        }
        throw new ApiValidateError(res, meta)
      },
    }),
  }),
})

export const { useCheckBlackjackQuery } = blackjackApi

export default blackjackApi
