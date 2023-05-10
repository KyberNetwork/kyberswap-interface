import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import PlaceholderImage from 'assets/images/my-earnings-placeholder.png'
import { ButtonPrimary } from 'components/Button'
import { useWalletModalToggle } from 'state/application/hooks'

const Placeholder = () => {
  const toggleWalletModal = useWalletModalToggle()

  return (
    <Flex
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <img src={PlaceholderImage} />
      <Flex
        sx={{
          flexDirection: 'column',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate3d(-50%, -50%, 0)',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <Text
          sx={{
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '20px',
          }}
        >
          <Trans>Connect your wallet to view your earnings!</Trans>
        </Text>

        <ButtonPrimary
          style={{
            height: '36px',
            width: 'fit-content',
          }}
          onClick={toggleWalletModal}
        >
          Connect Wallet
        </ButtonPrimary>
      </Flex>
    </Flex>
  )
}

export default Placeholder
