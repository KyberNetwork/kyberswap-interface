import { useCallback } from 'react'
import _ from 'lodash'

export default function useThrottle(cb: (...args: any) => any, delay: number) {
  // TODO: explain?
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(_.throttle(cb, delay), [])
}
