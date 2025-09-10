import { useEffect, useState } from 'react'
import { usePrevious } from 'react-use'

let reduceTimeout: NodeJS.Timeout

export default function useReduceFetchInterval() {
  const [reduceFetchInterval, setReduceFetchInterval] = useState(false)

  const previousReduce = usePrevious(reduceFetchInterval)

  useEffect(() => {
    if (reduceFetchInterval && !previousReduce) {
      reduceTimeout = setTimeout(() => {
        setReduceFetchInterval(false)
      }, 30 * 1000)
    }

    return () => {
      if (reduceTimeout) clearTimeout(reduceTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceFetchInterval])

  return {
    reduceFetchInterval,
    setReduceFetchInterval,
  }
}
