import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import produce from 'immer'

import { POOL_FARM_BASE_URL } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import {
  aggregateAccountEarnings,
  aggregatePoolEarnings,
  aggregatePositionEarnings,
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
  baseQuery: fetchBaseQuery({ baseUrl: POOL_FARM_BASE_URL }),
  keepUnusedDataFor: 180,
  endpoints: builder => ({
    getElasticEarning: builder.query<GetElasticEarningResponse, GetElasticEarningParams>({
      async queryFn({ account, chainIds }, _queryApi, _extraOptions, fetchWithBQ) {
        const params = {
          account,
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
          includeMyPoolApr: true,
          includeMyFarmApr: true,
          perPage: 1000,
          page: 1,
          includeHistorical: true,
        }

        const [positionsRes, earningRes] = await Promise.all([
          fetchWithBQ({
            url: '/all-chain/api/v1/elastic-new/positions',
            params,
          }),

          fetchWithBQ({
            url: '/all-chain/api/v1/elastic-new/earnings',
            params: {
              account,
              chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
            },
          }),
        ])

        const positionData: GetElasticEarningResponse = (positionsRes?.data as any).data as GetElasticEarningResponse

        const aggregateData = Object.keys(positionData).reduce((acc, chainName) => {
          if (!positionData?.[chainName]) return acc
          return {
            ...acc,
            [chainName]: {
              positions: positionData?.[chainName].positions.map(pos => {
                const historicalEarning = ((earningRes?.data as any)?.data?.[chainName]?.[pos.id] || []).reverse()
                return {
                  ...pos,
                  historicalEarning,
                }
              }),
            },
          }
        }, {})

        const data = aggregateAccountEarnings(
          aggregatePoolEarnings(
            fillEmptyDaysForPositionEarnings(
              aggregatePositionEarnings(removeEmptyTokenEarnings(aggregateData as GetElasticEarningResponse)),
            ),
          ),
        ) as GetElasticEarningResponse

        return { data }
      },
    }),
    getElasticLegacyEarning: builder.query<GetElasticEarningResponse, GetElasticEarningParams>({
      async queryFn({ account, chainIds }, _queryApi, _extraOptions, fetchWithBQ) {
        const params = {
          account,
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
          includeMyPoolApr: true,
          includeMyFarmApr: true,
          perPage: 1000,
          page: 1,
          includeHistorical: true,
        }

        const [positionsRes, earningRes] = await Promise.all([
          fetchWithBQ({
            url: '/all-chain/api/v1/elastic-legacy/positions',
            params,
          }),

          fetchWithBQ({
            url: '/all-chain/api/v1/elastic-legacy/earnings',
            params: {
              account,
              chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
            },
          }),
        ])

        const positionData: GetElasticEarningResponse = (positionsRes?.data as any).data as GetElasticEarningResponse

        const aggregateData = Object.keys(positionData).reduce((acc, chainName) => {
          return {
            ...acc,
            [chainName]: {
              positions: positionData?.[chainName].positions.map(pos => {
                const historicalEarning = ((earningRes?.data as any)?.data?.[chainName]?.[pos.id] || []).reverse()
                return {
                  ...pos,
                  historicalEarning,
                }
              }),
            },
          }
        }, {})

        const data = aggregateAccountEarnings(
          aggregatePoolEarnings(
            fillEmptyDaysForPositionEarnings(
              aggregatePositionEarnings(removeEmptyTokenEarnings(aggregateData as GetElasticEarningResponse)),
            ),
          ),
        ) as GetElasticEarningResponse

        return { data }
      },
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

        const cleanedData = aggregatePositionEarnings(removeEmptyTokenEarnings(response.data))

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
