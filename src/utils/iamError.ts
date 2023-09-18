import { captureException } from '@sentry/react'
import { AxiosError } from 'axios'

import { BFF_API, ENV_LEVEL, KS_SETTING_API } from 'constants/env'
import { AGGREGATOR_API_PATHS } from 'constants/index'
import { ENV_TYPE } from 'constants/type'

enum ErrorType {
  ROUTE_ERROR = 'Route API',
  IAM_ERROR = 'IAM API',
  KS_SETTING_ERROR = 'KsSetting API',
  NOT_TRACK = 'Not track',
}

const ErrorInfo = Object.values(ErrorType).reduce<Record<string, { sentAlert: boolean; errorCount: number }>>(
  (rs, cur) => {
    rs[cur] = { sentAlert: false, errorCount: 0 }
    return rs
  },
  {},
)

const apiDowns: string[] = []

const ERROR_THRESHOLD = 2
const isApiDown = (type: ErrorType) => ErrorInfo[type]?.errorCount >= ERROR_THRESHOLD

const sendError = (name: string, apiUrl: string, trackData: any) => {
  if (ENV_LEVEL < ENV_TYPE.STG) return
  const error = new Error(`${name} Error: ${apiUrl}`)
  error.name = `${name} was down`
  captureException(error, { level: 'fatal', extra: { args: JSON.stringify(trackData, null, 2) } })
}

// hot fix to prevent spam for now.
const blacklistPathBff = ['/v1/notification/me', '/v1/tokens/score']

let isOnline = true
function onConnect() {
  isOnline = true
}
function onDisconnect() {
  isOnline = false
}
window.addEventListener('online', onConnect, false)
window.addEventListener('offline', onDisconnect, false)

const getErrorType = (apiUrl: string) => {
  if (apiUrl.endsWith(AGGREGATOR_API_PATHS.GET_ROUTE) || apiUrl.endsWith(AGGREGATOR_API_PATHS.BUILD_ROUTE))
    return ErrorType.ROUTE_ERROR

  if (apiUrl.startsWith(BFF_API) && !blacklistPathBff.some(path => apiUrl.endsWith(path))) return ErrorType.IAM_ERROR

  if (apiUrl.startsWith(KS_SETTING_API)) return ErrorType.KS_SETTING_ERROR
  return ErrorType.NOT_TRACK
}

/**
 * check error status: blocked, maybe cors issues or  server down
 */
export const checkApiDown = (axiosErr: AxiosError) => {
  const statusCode = axiosErr?.response?.status
  const response = axiosErr?.response?.data

  const isDie =
    isOnline && // not track when internet issue
    statusCode !== 401 && // not track when token expired
    (!response || // block cors
      (statusCode === 404 && response === '404 page not found') || // wrong path
      (statusCode && statusCode >= 500 && statusCode <= 599)) // server down

  const apiUrl = axiosErr?.config?.url ?? ''
  if (isDie) apiDowns.push(apiUrl)

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
    tokenInfoSignIn: localStorage.o2_sign_in,
    tokenInfoGuest: localStorage.o2_guest,
    profileInfo: localStorage.redux_localstorage_simple_profile,
    apiDowns,
  }

  const errorType = getErrorType(apiUrl)

  if (isDie && errorType !== ErrorType.NOT_TRACK) {
    console.log(123, ErrorInfo)

    ErrorInfo[errorType].errorCount++
    console.log(123, ErrorInfo)

    if (isApiDown(errorType) && !ErrorInfo[errorType].sentAlert) {
      ErrorInfo[errorType].sentAlert = true
      sendError(errorType, apiUrl, trackData)
    }
    console.error(`${apiUrl} was down`, trackData)
  }
}
