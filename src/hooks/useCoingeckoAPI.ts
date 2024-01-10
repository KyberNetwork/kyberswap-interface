import { COINGECKO_API_URL } from 'constants/index'

export default function useCoingeckoAPI() {
  return COINGECKO_API_URL
  // const { authenticationSuccess } = useSessionInfo()
  // return authenticationSuccess ? COINGECKO_BFF_API_URL : COINGECKO_API_URL
}
