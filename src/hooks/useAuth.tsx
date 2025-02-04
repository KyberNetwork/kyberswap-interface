import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { OAUTH_INTERCEPTOR_URL } from 'constants/env'
import { useWeb3React } from 'hooks'

const AuthContext = createContext<
  | {
      accessToken: string
      refreshToken: string
      login: () => void
    }
  | undefined
>(undefined)

export const LS_ACCESS_TOKEN_KEY = 'kyberswap_access_token'
export const LS_REFRESH_TOKEN_KEY = 'kyberswap_refresh_token'

function parseJwt(token: string) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join(''),
  )

  return JSON.parse(jsonPayload)
}

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { library, account } = useWeb3React()

  const [accessToken, setAccessToken] = useState(localStorage.getItem(LS_ACCESS_TOKEN_KEY) || '')
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem(LS_REFRESH_TOKEN_KEY) || '')

  useEffect(() => {
    if (accessToken && account) {
      const { sub } = parseJwt(accessToken)
      if (sub.toLowerCase() !== account.toLowerCase()) {
        setAccessToken('')
        setRefreshToken('')
        localStorage.removeItem(LS_ACCESS_TOKEN_KEY)
        localStorage.removeItem(LS_REFRESH_TOKEN_KEY)
      }
    }
  }, [account, accessToken])

  const login = useCallback(async () => {
    const accounts = await library?.listAccounts()
    if (!accounts?.length) return
    const issuedAt = new Date().toISOString()
    const msg = `Click sign to "TODO" at Kyberswap.com without logging in.\nThis request won’t trigger any blockchain transaction or cost any gas fee. Expires in 7 days. \n\nIssued at: ${issuedAt}`
    const signature = await library?.send('personal_sign', [`0x${Buffer.from(msg, 'utf8').toString('hex')}`, account])

    const res = await fetch(`${OAUTH_INTERCEPTOR_URL}/v1/oauth/web3/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: account,
        message: msg,
        signature,
      }),
    }).then(res => res.json())

    if (res?.accessToken && res?.refreshToken) {
      setAccessToken(res.accessToken)
      setRefreshToken(res.refreshToken)
      localStorage.setItem(LS_ACCESS_TOKEN_KEY, res.accessToken)
      localStorage.setItem(LS_REFRESH_TOKEN_KEY, res.refreshToken)
    }
  }, [account, library])

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

export const useAuth = () => {
  return (
    useContext(AuthContext) || {
      accessToken: '',
      refreshToken: '',
      login: () => {
        //
      },
    }
  )
}
