import { Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import Wallet from 'components/Icons/Wallet'
import Loader from 'components/Loader'

const ButtonEth = ({
  loading,
  disabled,
  onClick,
}: {
  disabled: boolean
  loading: boolean
  onClick: (e: React.MouseEvent) => void
}) => {
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
