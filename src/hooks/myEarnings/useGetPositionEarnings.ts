import { useEffect, useState } from 'react'

import { positionEarnings } from './mocks'

const useGetPositionEarnings = () => {
  const [isValidating, setValidating] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setValidating(false)
    }, 3_000)
  }, [])

  return {
    data: isValidating ? undefined : positionEarnings,
    isValidating,
  }
}

export default useGetPositionEarnings
