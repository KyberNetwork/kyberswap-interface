import type {
  PrepareAddCapitalRequest,
  PrepareAddCapitalResponse,
  PrepareClosePositionRequest,
  PrepareClosePositionResponse,
  PrepareManualSellRequest,
  PrepareManualSellResponse,
  PrepareStartCopyRequest,
  PrepareStartCopyResponse,
  PrepareStopCopyRequest,
  PrepareStopCopyResponse,
  PrepareWithdrawQuoteRequest,
  PrepareWithdrawQuoteResponse,
} from 'services/copyTrading/types/preparedActions'

import copyTradingBaseApi from '../baseApi'
import { pathPart } from '../queryParams'

const preparedActionApi = copyTradingBaseApi.injectEndpoints({
  endpoints: builder => ({
    prepareStartCopy: builder.mutation<PrepareStartCopyResponse, PrepareStartCopyRequest>({
      query: ({ ownerAddress, agentId, ...body }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/agents/' + pathPart(agentId) + ':prepareStartCopy',
        method: 'POST',
        body,
      }),
    }),
    prepareAddCapital: builder.mutation<PrepareAddCapitalResponse, PrepareAddCapitalRequest>({
      query: ({ ownerAddress, copyRunId, ...body }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/copy-runs/' + pathPart(copyRunId) + ':prepareAddCapital',
        method: 'POST',
        body,
      }),
    }),
    prepareStopCopy: builder.mutation<PrepareStopCopyResponse, PrepareStopCopyRequest>({
      query: ({ ownerAddress, copyRunId, ...body }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/copy-runs/' + pathPart(copyRunId) + ':prepareStopCopy',
        method: 'POST',
        body,
      }),
    }),
    prepareWithdrawQuote: builder.mutation<PrepareWithdrawQuoteResponse, PrepareWithdrawQuoteRequest>({
      query: ({ ownerAddress, copyRunId, amountRaw }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/copy-runs/' + pathPart(copyRunId) + ':prepareWithdrawQuote',
        method: 'POST',
        body: { amountRaw },
      }),
    }),
    prepareManualSell: builder.mutation<PrepareManualSellResponse, PrepareManualSellRequest>({
      query: ({
        ownerAddress,
        copyRunId,
        userPositionId,
        slippageBps,
        expectedUnresolvedSkipCount,
        expectedSellRatioRaw,
      }) => ({
        url:
          '/users/' +
          pathPart(ownerAddress) +
          '/copy-runs/' +
          pathPart(copyRunId) +
          '/positions/' +
          pathPart(userPositionId) +
          ':prepareManualSell',
        method: 'POST',
        body: { slippageBps, expectedUnresolvedSkipCount, expectedSellRatioRaw },
      }),
    }),
    prepareClosePosition: builder.mutation<PrepareClosePositionResponse, PrepareClosePositionRequest>({
      query: ({ ownerAddress, copyRunId, userPositionId, slippageBps }) => ({
        url:
          '/users/' +
          pathPart(ownerAddress) +
          '/copy-runs/' +
          pathPart(copyRunId) +
          '/positions/' +
          pathPart(userPositionId) +
          ':prepareClosePosition',
        method: 'POST',
        body: { slippageBps },
      }),
    }),
  }),
})

export default preparedActionApi
