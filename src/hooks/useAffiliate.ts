import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const useAffiliate = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const refCode = searchParams.get('refCode')

  useEffect(() => {
    if (!refCode) return

    // TODO: check refcode expired time
    const expireTime = new Date().getTime() + 1000 * 60 * 60 * 24 * 2 // 2 days
    const d = new Date()
    d.setTime(expireTime)
    document.cookie = `refCode=${refCode};expires=${d.toUTCString()};path=/`
    searchParams.delete('refCode')
    setSearchParams(searchParams)
  }, [refCode, searchParams, setSearchParams])
}
