import { captureException } from '@sentry/react'
import { AxiosError } from 'axios'

import { BFF_API, ENV_LEVEL } from 'constants/env'
import { AGGREGATOR_API_PATHS } from 'constants/index'
import { ENV_TYPE } from 'constants/type'

const ErrorInfo = {
  routeApiError: 0,
  iamApoError: 0,
  errorThreshold: 2,
  sentAlertIamApi: false,
  sentAlertRouteApi: false,
}

const isIamApiDown = () => ErrorInfo.iamApoError >= ErrorInfo.errorThreshold
const isRouteApiDown = () => ErrorInfo.routeApiError >= ErrorInfo.errorThreshold

const sendError = (name: string, apiUrl: string, trackData: any) => {
  if (ENV_LEVEL < ENV_TYPE.STG) return
  const error = new Error(`${name} Error: ${apiUrl}`)
  error.name = `${name} was down`
  captureException(error, { level: 'fatal', extra: { args: JSON.stringify(trackData, null, 2) } })
}

// hot fix to prevent spam for now.
const blacklistPathBff = ['/v1/notification/me']

/**
 * check error status: blocked, maybe cors issues or  server down
 * only check bff api + 2 route apis
 */
export const checkIamDown = (axiosErr: AxiosError) => {
  const statusCode = axiosErr?.response?.status
  const response = axiosErr?.response?.data

  const isDie =
    navigator.onLine && // not track when internet issue
    statusCode !== 401 && // not track when token expired
    (!response || // block cors
      (statusCode === 404 && response === '404 page not found') || // wrong path
      (statusCode && statusCode >= 500 && statusCode <= 599)) // server down

  const trackData = {
    config: {
      data: axiosErr?.config?.data,
      headers: axiosErr?.config?.headers,
      params: axiosErr?.config?.params,
      url: axiosErr?.config?.url,
    },
    response,
    statusCode,
    message: axiosErr?.message,
    code: axiosErr?.code,
  }
  const apiUrl = axiosErr?.config?.url ?? ''

  const isRouteApiDie =
    isDie && (apiUrl.endsWith(AGGREGATOR_API_PATHS.GET_ROUTE) || apiUrl.endsWith(AGGREGATOR_API_PATHS.BUILD_ROUTE))

  const isIamDie = isDie && apiUrl.startsWith(BFF_API) && !blacklistPathBff.some(path => apiUrl.endsWith(path))

  if (isRouteApiDie) {
    ErrorInfo.routeApiError++
    if (isRouteApiDown() && !ErrorInfo.sentAlertRouteApi) {
      ErrorInfo.sentAlertRouteApi = true
      sendError('Route API', apiUrl, trackData)
    }
  }
  if (isIamDie) {
    ErrorInfo.iamApoError++
    if (isIamApiDown() && !ErrorInfo.sentAlertIamApi) {
      ErrorInfo.sentAlertIamApi = true
      sendError('IAM API', apiUrl, trackData)
    }
  }
  if (isRouteApiDie || isIamDie) {
    console.error(`${apiUrl} was down`, trackData)
  }
}
