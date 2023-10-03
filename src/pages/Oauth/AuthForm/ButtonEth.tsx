import { LoginMethod } from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import { useCallback } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
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
  showBtnCancel,
  onClickCancel,
}: {
  disabled: boolean
  loading: boolean
  onClick: () => void
  onClickCancel: () => void
  flowStatus: FlowStatus
  showBtnCancel: boolean
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
    <Flex style={{ justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
      {showBtnCancel && (
        <ButtonOutlined
          width="230px"
          onClick={e => {
            e.preventDefault()
            onClickCancel()
          }}
          height="36px"
        >
          Cancel
        </ButtonOutlined>
      )}
      <ButtonPrimary
        width="230px"
        height="36px"
        className="login-btn"
        id={'btnLoginEth'}
        onClick={onClick}
        disabled={disabled}
      >
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
      </ButtonPrimary>
    </Flex>
  )
}

export default ButtonEth
