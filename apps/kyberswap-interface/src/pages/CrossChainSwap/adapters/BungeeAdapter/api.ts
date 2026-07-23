import axios from 'axios'

import { KYBERSWAP_DOMAIN } from 'constants/index'
import {
  type SocketQuoteParams,
  type SocketQuoteResponse,
  type SocketStatusParams,
  type SocketStatusResponse,
} from 'pages/CrossChainSwap/adapters/BungeeAdapter/types'

const BUNGEE_AFFILIATE_ID =
  '609913096e183f62cecd07e9c13f82e04ffbbdceb5fef75aad43e6cbff367039708902197e0b2b78b1d76cb0837ad0b318baedceb5fef75aad43e6cb'

const SOCKET_BACKEND_API_BASE_URL = 'https://backend.socket.tech'
const SOCKET_PUBLIC_API_BASE_URL = 'https://public-backend.socket.tech'
const SOCKET_API_HEADERS = {
  'Content-Type': 'application/json',
  affiliate: BUNGEE_AFFILIATE_ID,
}

// Socket's main backend is restricted to whitelisted origins; use the public backend for localhost and test links.
const SOCKET_API_BASE_URL =
  typeof window !== 'undefined' && window.location?.hostname === KYBERSWAP_DOMAIN
    ? SOCKET_BACKEND_API_BASE_URL
    : SOCKET_PUBLIC_API_BASE_URL

export const bungeeApi = axios.create({
  baseURL: SOCKET_API_BASE_URL,
  headers: SOCKET_API_HEADERS,
  validateStatus: () => true,
})

export const getBungeeQuote = (params: SocketQuoteParams) =>
  bungeeApi.get<SocketQuoteResponse>('/v3/swap/quote', { params })

export const getBungeeStatus = async (params: SocketStatusParams) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, String(value))
  })

  // kyberswap.com serves `Referrer-Policy: same-origin`; override it for Socket's domain-whitelist check.
  const response = await fetch(`${SOCKET_API_BASE_URL}/v3/swap/status?${searchParams}`, {
    headers: SOCKET_API_HEADERS,
    referrerPolicy: 'origin',
  })

  return {
    data: (await response.json()) as SocketStatusResponse,
  }
}
