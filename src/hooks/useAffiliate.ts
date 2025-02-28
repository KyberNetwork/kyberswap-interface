import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AFFILIATE_SERVICE_URL } from 'constants/env'

export const useAffiliate = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const refCode = searchParams.get('r')

  useEffect(() => {
    if (!refCode) return

    fetch(`${AFFILIATE_SERVICE_URL}/v1/public/affiliates/${refCode}/info`)
      .then(res => res.json())
      .then(res => {
        const duration = res?.info?.sessionDurationSecond
        if (!duration) return

        const expireTime = new Date().getTime() + 1000 * duration
        const d = new Date()
        d.setTime(expireTime)
        document.cookie = `refCode=${refCode};expires=${d.toUTCString()};path=/`
        searchParams.delete('refCode')
        setSearchParams(searchParams)
      })
  }, [refCode, searchParams, setSearchParams])
}
