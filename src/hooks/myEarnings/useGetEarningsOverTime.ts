import { useEffect, useState } from 'react'

import { earningsOverTimeMock } from './mocks'

const useGetEarningsOverTime = () => {
  const [isValidating, setValidating] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setValidating(false)
    }, 3_000)
  }, [])

  return {
    data: isValidating ? undefined : earningsOverTimeMock,
    isValidating,
  }
}

export default useGetEarningsOverTime
