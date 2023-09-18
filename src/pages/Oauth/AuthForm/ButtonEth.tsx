import { LoginMethod } from '@kybernetwork/oauth2'
import { useCallback } from 'react'
import { Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import Wallet from 'components/Icons/Wallet'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import { useAutoSignIn } from 'pages/Oauth/AuthForm'
import { FlowStatus } from 'pages/Oauth/Login'
import { useWalletModalToggle } from 'state/application/hooks'

const ButtonEth = ({
  loading,
  disabled,
  onClick,
  flowStatus,
}: {
  disabled: boolean
  loading: boolean
  onClick: () => void
  flowStatus: FlowStatus
}) => {
  const toggleWalletModal = useWalletModalToggle()
  const { account } = useActiveWeb3React()

  const onClickEth = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault?.()
      !account ? toggleWalletModal() : onClick()
    },
    [toggleWalletModal, onClick, account],
  )

  useAutoSignIn({ onClick: onClickEth, flowStatus, method: LoginMethod.ETH })

  return (
    <ButtonPrimary
      width={'230px'}
      height={'36px'}
      className="login-btn"
      id={'btnLoginGoogle'}
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? (
        <>
          <Loader />
          &nbsp; <Text style={{ whiteSpace: 'nowrap' }}> Signing In</Text>
        </>
      ) : (
        <>
          <Wallet />
          &nbsp; Sign-In with Wallet
        </>
      )}
    </ButtonPrimary>
  )
}

export default ButtonEth
