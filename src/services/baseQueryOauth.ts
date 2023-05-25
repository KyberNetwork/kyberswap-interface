import KyberOauth2, { TokenExpireError } from '@kybernetwork/oauth2'
import { t } from '@lingui/macro'
import { BaseQueryFn, fetchBaseQuery } from '@reduxjs/toolkit/query'

const queryWithToken = async (config: any, baseUrl: string) => {
  try {
    if (config.method?.toLowerCase() !== 'get') {
      // mapping rtk query vs axios
      config.data = config.data || config.body
    }
    config.url = baseUrl + config.url
    const result = await KyberOauth2.callHttp(config)
    return { data: result.data }
  } catch (err) {
    const error = err as TokenExpireError
    if (error?.isTokenExpired) {
      window.showConfirm?.({
        isOpen: true,
        content: t`Your session has expired. Please sign-in to continue.`,
        onConfirm: () => KyberOauth2.authenticate(),
        confirmText: t`Sign-in`,
        title: t`Session Expired`,
      })
    }
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || err.message,
      },
    }
  }
}

// this query is use for private api call: this will attach access token in every request, auto refresh token if expired
const baseQueryOauth =
  ({ baseUrl = '' }: { baseUrl?: string }): BaseQueryFn =>
  async config => {
    return queryWithToken(config, baseUrl)
  }

// same as baseQueryOauth, but has flag to revert if meet incident
export const baseQueryOauthDynamic =
  ({ baseUrl = '' }: { baseUrl?: string }): BaseQueryFn =>
  async (args, WebApi, extraOptions) => {
    if (!args.authentication) {
      // to quickly revert if meet incident
      const rawBaseQuery = fetchBaseQuery({ baseUrl })
      return rawBaseQuery(args, WebApi, extraOptions)
    }
    return queryWithToken(args, baseUrl)
  }

export default baseQueryOauth
