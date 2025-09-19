import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function useForceLoading() {
  const [searchParams, setSearchParams] = useSearchParams()
  const forceLoading = searchParams.get('forceLoading')

  const hadForceLoading = useRef(forceLoading ? true : false).current

  const removeForceLoading = useCallback(() => {
    searchParams.delete('forceLoading')
    setSearchParams(searchParams)
  }, [searchParams, setSearchParams])

  return { forceLoading, hadForceLoading, removeForceLoading }
}
