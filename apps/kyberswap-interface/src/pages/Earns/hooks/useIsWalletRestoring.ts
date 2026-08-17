import { useEffect, useState } from 'react'

import { useAccount } from 'hooks/useAccount'

export default function useIsWalletRestoring() {
  const { status } = useAccount()
  const [hasPassedInitialRender, setHasPassedInitialRender] = useState(false)

  useEffect(() => {
    setHasPassedInitialRender(true)
  }, [])

  return !hasPassedInitialRender || status === 'connecting' || status === 'reconnecting'
}
