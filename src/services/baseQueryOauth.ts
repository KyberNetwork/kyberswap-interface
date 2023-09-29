import { KyberOauth2Api } from '@kybernetwork/oauth2'
import { BaseQueryFn, fetchBaseQuery } from '@reduxjs/toolkit/query'
import axios from 'axios'

import { checkApiDown } from 'utils/iamError'

const queryWithTokenAndTracking = async (config: any, baseUrl: string, withAccessToken = true) => {
  try {
    if (config.method?.toLowerCase() !== 'get') {
      // mapping rtk query vs axios
      config.data = config.data || config.body
    }
    config.url = (config.url.startsWith('http') ? '' : baseUrl) + config.url
    const result = await (withAccessToken ? KyberOauth2Api.call(config) : axios(config))
    return { data: result.data }
  } catch (err) {
    checkApiDown(err)
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
  ({ baseUrl = '', trackingOnly }: { baseUrl?: string; trackingOnly?: boolean }): BaseQueryFn =>
  async config => {
    return queryWithTokenAndTracking(config, baseUrl, !trackingOnly)
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
    return queryWithTokenAndTracking(args, baseUrl)
  }

export default baseQueryOauth
