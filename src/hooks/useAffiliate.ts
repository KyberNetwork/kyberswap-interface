import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCreateSessionMutation } from 'services/affiliate'

import { useWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'

import { parseJwt, useAuth } from './useAuth'

export const useAffiliate = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const refCode = searchParams.get('refCode')

  const { account } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const { accessToken, login } = useAuth()

  const [createSession] = useCreateSessionMutation()

  const ref = useRef(false)

  useEffect(() => {
    if (!refCode) return

    // connect wallet first
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!accessToken || parseJwt(accessToken).sub.toLowerCase() !== account.toLowerCase()) {
      login()
    } else if (!ref.current) {
      ref.current = true
      createSession(refCode).then((res: any) => {
        // already handle refresh, if it's still return 401 here, that means we need to login again
        if (res.error && (res.error.status === 401 || res.error.status === 'FETCH_ERROR')) {
          ref.current = false
          login()
        } else {
          searchParams.delete('refCode')
          setSearchParams(searchParams)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refCode, accessToken, account, login])
}
