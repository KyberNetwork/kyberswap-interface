import { Router } from '@namgold/dmm-solana-sdk'
import { useMemo } from 'react'

import useContext from './useContext'

const useRouter = () => {
  const context = useContext()

  const router = useMemo(() => (context ? new Router(context) : null), [context])
  return router
}

export default useRouter
