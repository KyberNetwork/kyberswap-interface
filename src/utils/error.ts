import { captureException } from '@sentry/react'
import { AxiosError } from 'axios'

import { BFF_API } from 'constants/env'
import { ROUTES_API_PATHS } from 'constants/index'

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
  const error = new Error(`${name} Error: ${apiUrl}`)
  error.name = `${name} was down`
  captureException(error, { level: 'fatal', extra: { args: JSON.stringify(trackData, null, 2) } })
}

/**
 * check error status: blocked, maybe cors issues or  server down
 * only check bff api + 2 route apis
 */
export const checkIamDown = (axiosErr: AxiosError) => {
  const isDie =
    navigator.onLine &&
    (!axiosErr?.response?.data ||
      (axiosErr?.response?.status === 404 && axiosErr?.response?.data === '404 page not found'))

  const trackData = {
    config: {
      data: axiosErr?.config?.data,
      headers: axiosErr?.config?.headers,
      params: axiosErr?.config?.params,
      url: axiosErr?.config?.url,
    },
    response: axiosErr?.response?.data,
    status: axiosErr?.response?.status,
  }
  const apiUrl = axiosErr?.config?.url ?? ''

  const isRouteApiDie =
    isDie && (apiUrl.endsWith(ROUTES_API_PATHS.GET_ROUTE) || apiUrl.endsWith(ROUTES_API_PATHS.BUILD_ROUTE))

  const isIamDie = isDie && apiUrl.startsWith(BFF_API)

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
}
