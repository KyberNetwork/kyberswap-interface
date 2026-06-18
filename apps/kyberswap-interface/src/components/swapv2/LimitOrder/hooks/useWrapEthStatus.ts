import { useEffect, useState } from 'react'
import { usePrevious } from 'react-use'

import { useIsTransactionPending } from 'state/transactions/hooks'

export const useWrapEthStatus = (switchToWeth: () => void) => {
  const [txHashWrapped, setTxHashWrapped] = useState<string>()

  const isWrappingEth = useIsTransactionPending(txHashWrapped)
  const prevIsWrappingEth = usePrevious(isWrappingEth)

  useEffect(() => {
    if (!isWrappingEth) {
      setTxHashWrapped('')
    }
  }, [isWrappingEth])

  useEffect(() => {
    if (prevIsWrappingEth === true && isWrappingEth === false) {
      switchToWeth()
    }
  }, [prevIsWrappingEth, isWrappingEth, switchToWeth])

  return { isWrappingEth, setTxHashWrapped }
}
