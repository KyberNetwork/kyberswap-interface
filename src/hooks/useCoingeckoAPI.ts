import { COINGECKO_API_URL, COINGECKO_BFF_API_URL } from 'constants/index'
import { useSessionInfo } from 'state/authen/hooks'

export default function useCoingeckoAPI() {
  const { authenticationSuccess } = useSessionInfo()
  return authenticationSuccess ? COINGECKO_BFF_API_URL : COINGECKO_API_URL
}
