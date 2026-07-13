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

// Socket's main backend is restricted to whitelisted origins; use the public backend for localhost and test links.
const SOCKET_API_BASE_URL =
  typeof window !== 'undefined' && window.location?.hostname === KYBERSWAP_DOMAIN
    ? SOCKET_BACKEND_API_BASE_URL
    : SOCKET_PUBLIC_API_BASE_URL

export const bungeeApi = axios.create({
  baseURL: SOCKET_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    affiliate: BUNGEE_AFFILIATE_ID,
  },
  validateStatus: () => true,
})

export const getBungeeQuote = (params: SocketQuoteParams) =>
  bungeeApi.get<SocketQuoteResponse>('/v3/swap/quote', { params })

export const getBungeeStatus = (params: SocketStatusParams) =>
  bungeeApi.get<SocketStatusResponse>('/v3/swap/status', { params })
