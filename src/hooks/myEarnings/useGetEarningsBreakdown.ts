import { useEffect, useState } from 'react'

import { myTotalEarningsMock } from './mocks'

const useGetEarningsBreakdown = () => {
  const [isValidating, setValidating] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setValidating(false)
    }, 2_000)
  }, [])

  return {
    data: isValidating ? undefined : myTotalEarningsMock,
    isValidating,
  }
}

export default useGetEarningsBreakdown
