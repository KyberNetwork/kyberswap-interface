import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import produce from 'immer'

import { NETWORKS_INFO } from 'constants/networks'
import {
  aggregateAccountEarnings,
  aggregatePoolEarnings,
  fillEmptyDaysForPositionEarnings,
  fillHistoricalEarningsForEmptyDays,
  removeEmptyTokenEarnings,
} from 'pages/MyEarnings/utils'

import {
  GetClassicEarningParams,
  GetClassicEarningResponse,
  GetElasticEarningParams,
  GetElasticEarningResponse,
  MetaResponse,
} from './types'

const earningApi = createApi({
  reducerPath: 'earningApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pool-farm.dev.kyberengineering.io' }),
  endpoints: builder => ({
    getElasticEarning: builder.query<GetElasticEarningResponse, GetElasticEarningParams>({
      query: ({ account, chainIds }) => ({
        url: `/all-chain/api/v1/elastic/portfolio`,
        params: {
          account,
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
        },
      }),
      transformResponse: (response: MetaResponse<GetElasticEarningResponse>) => {
        return aggregateAccountEarnings(
          aggregatePoolEarnings(
            fillEmptyDaysForPositionEarnings(removeEmptyTokenEarnings(response.data as GetElasticEarningResponse)),
          ),
        ) as GetElasticEarningResponse
      },
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getElasticLegacyEarning: builder.query<GetElasticEarningResponse, GetElasticEarningParams>({
      query: ({ account, chainIds }) => ({
        url: `/all-chain/api/v1/elastic-legacy/portfolio`,
        params: {
          account,
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
        },
      }),
      transformResponse: (response: MetaResponse<GetElasticEarningResponse>) => {
        return aggregateAccountEarnings(
          aggregatePoolEarnings(
            fillEmptyDaysForPositionEarnings(removeEmptyTokenEarnings(response.data as GetElasticEarningResponse)),
          ),
        ) as GetElasticEarningResponse
      },
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getClassicEarning: builder.query<GetClassicEarningResponse, GetClassicEarningParams>({
      query: ({ account, chainIds }) => ({
        url: `/all-chain/api/v1/classic/portfolio`,
        params: {
          account,
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
        },
      }),
      transformResponse: (response: MetaResponse<GetClassicEarningResponse>) => {
        if (!response.data) {
          return {} as GetClassicEarningResponse
        }

        const cleanedData = removeEmptyTokenEarnings(response.data)

        const data = produce(cleanedData, draft => {
          Object.keys(draft).forEach(chainRoute => {
            draft[chainRoute].positions.forEach(position => {
              const earnings = fillHistoricalEarningsForEmptyDays(position.historicalEarning)
              position.historicalEarning = earnings
            })
          })
        })

        return aggregateAccountEarnings(data) as GetClassicEarningResponse
      },
      keepUnusedDataFor: 300, // 5 minutes
    }),
  }),
})

export default earningApi
export const {
  useGetElasticEarningQuery,
  useGetElasticLegacyEarningQuery,
  useGetClassicEarningQuery,

  useLazyGetElasticEarningQuery,
  useLazyGetElasticLegacyEarningQuery,
  useLazyGetClassicEarningQuery,
} = earningApi
