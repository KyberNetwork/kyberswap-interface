import { LoginMethod } from '@kyberswap/oauth2'
import { useEffect, useRef } from 'react'

import { useActiveWeb3React } from 'hooks'
import { FlowStatus } from 'pages/Oauth/Login'

const useAutoSignIn = ({
  onClick,
  method,
  flowStatus: { flowReady, autoLoginMethod },
}: {
  onClick: (e?: React.MouseEvent) => void
  method: LoginMethod
  flowStatus: FlowStatus
}) => {
  const autoSelect = useRef(false)
  const { account } = useActiveWeb3React()
  useEffect(() => {
    if (autoSelect.current || !flowReady || autoLoginMethod !== method) return
    if (
      (autoLoginMethod === LoginMethod.ETH && account) ||
      [LoginMethod.GOOGLE, LoginMethod.EMAIL].includes(autoLoginMethod)
    ) {
      autoSelect.current = true
      onClick?.()
    }
  }, [flowReady, autoLoginMethod, onClick, method, account])
}

export default useAutoSignIn
