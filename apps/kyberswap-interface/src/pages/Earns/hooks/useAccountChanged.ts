import { useEffect } from 'react'
import { usePreviousDistinct } from 'react-use'

import { useActiveWeb3React } from 'hooks'

const useAccountChanged = (action: () => void) => {
  const { account } = useActiveWeb3React()
  const previousAccount = usePreviousDistinct(account)

  useEffect(() => {
    if (account && previousAccount && account !== previousAccount) action()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, previousAccount])
}

export default useAccountChanged
