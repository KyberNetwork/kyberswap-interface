import { LoginMethod } from '@kyberswap/oauth2'
import { Trans } from '@lingui/macro'
import React, { useCallback } from 'react'
import { Text } from 'rebass'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Wallet from 'components/Icons/Wallet'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import useAutoSignIn from 'pages/Oauth/AuthForm/useAutoSignIn'
import { FlowStatus } from 'pages/Oauth/Login'
import { useWalletModalToggle } from 'state/application/hooks'

const ButtonEth = ({
  loading,
  disabled,
  onClick,
  flowStatus,
  primary,
}: {
  disabled: boolean
  loading: boolean
  onClick: () => void
  flowStatus: FlowStatus
  primary: boolean
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

  const propsEth = {
    height: '36px',
    id: 'btnLoginEth',
    onClick: (e: MouseEvent) => {
      e.preventDefault()
      onClickEth()
    },
    disabled: disabled || loading,
    children: (
      <>
        {loading ? (
          <>
            <Loader />
            &nbsp;{' '}
            <Text sx={{ whiteSpace: 'nowrap' }}>
              {' '}
              <Trans>Signing In</Trans>
            </Text>
          </>
        ) : (
          <>
            <Wallet />
            &nbsp; <Trans>Sign-In with Wallet</Trans>
          </>
        )}
      </>
    ),
  }
  return React.createElement(primary ? ButtonPrimary : ButtonLight, propsEth)
}

export default ButtonEth
