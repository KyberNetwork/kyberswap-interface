import { BaseQueryFn, FetchArgs, FetchBaseQueryError, createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { AFFILIATE_SERVICE_URL, OAUTH_INTERCEPTOR_URL } from 'constants/env'
import { LS_ACCESS_TOKEN_KEY, LS_REFRESH_TOKEN_KEY } from 'hooks/useAuth'

const baseQuery = fetchBaseQuery({
  baseUrl: AFFILIATE_SERVICE_URL,
  prepareHeaders: headers => {
    // this method should retrieve the token without a hook
    const token = localStorage.getItem(LS_ACCESS_TOKEN_KEY)

    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions)

  //if (result.error && result.error.status === 401) {
  // api doesn't return header Access-Control-Allow-Origin then rtk understand it as CORS error and return "TypeError: Failed to fetch"
  // https://stackoverflow.com/questions/71709379/rtk-query-fetchbasequery-returning-fetch-error-instead-of-401
  if (result.error && (result.error.status === 401 || result.error.status === 'FETCH_ERROR')) {
    // try to get a new token
    const refreshResult = await fetch(`${OAUTH_INTERCEPTOR_URL}/v1/oauth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: localStorage.getItem(LS_REFRESH_TOKEN_KEY),
      }),
    }).then(res => res.json())

    if (refreshResult?.accessToken) {
      // store the new token in the store or wherever you keep it
      localStorage.setItem(LS_ACCESS_TOKEN_KEY, refreshResult.accessToken)
      localStorage.setItem(LS_REFRESH_TOKEN_KEY, refreshResult.refreshToken)
      // retry the initial query
      result = await baseQuery(args, api, extraOptions)
    } else {
      // refresh failed - do something like redirect to login or show a "retry" button
      localStorage.removeItem(LS_ACCESS_TOKEN_KEY)
      localStorage.removeItem(LS_REFRESH_TOKEN_KEY)
    }
  }
  return result
}

const affiliateApi = createApi({
  reducerPath: 'affiliateApi',
  baseQuery: baseQueryWithReauth,
  endpoints: builder => ({
    createSession: builder.mutation<unknown, string>({
      query: refCode => ({
        url: `/v1/public/affiliates/session`,
        method: 'POST',
        body: { refCode },
      }),
    }),
  }),
})

export const { useCreateSessionMutation } = affiliateApi

export default affiliateApi
