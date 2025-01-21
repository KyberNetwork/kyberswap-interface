import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AFFILIATE_SERVICE_URL } from 'constants/env'

import { useAuth } from './useAuth'

export const useAffiliate = () => {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('refCode')

  const { accessToken, login } = useAuth()

  useEffect(() => {
    if (!refCode) return
    if (!accessToken) {
      login()
    } else {
      fetch(`${AFFILIATE_SERVICE_URL}/v1/public/affiliates/session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refCode }),
      })
        .then(res => res.json())
        .then(console.log)
    }
  }, [refCode, login, accessToken])
}
