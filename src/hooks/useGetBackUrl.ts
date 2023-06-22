import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const BACK_URL_PARAM_KEY = 'back_url'

const useGetBackUrl = (): (() => URL | undefined) => {
  const [searchParams] = useSearchParams()

  const getBackUrl = useCallback(() => {
    const back_url = searchParams.get(BACK_URL_PARAM_KEY)
    if (!back_url) {
      return undefined
    }

    try {
      const url = new URL(back_url)
      return url
    } catch (e) {
      return undefined
    }
  }, [searchParams])

  return getBackUrl
}

export default useGetBackUrl
