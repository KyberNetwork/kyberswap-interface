import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import DesktopDarkPlaceholder from 'assets/images/my_earnings_placeholder_desktop_dark.png'
import DesktopLightPlaceholder from 'assets/images/my_earnings_placeholder_desktop_light.png'
import MobileDarkPlaceholder from 'assets/images/my_earnings_placeholder_mobile_dark.png'
import MobileLightPlaceholder from 'assets/images/my_earnings_placeholder_mobile_light.png'
import { ButtonPrimary } from 'components/Button'
import { useWalletModalToggle } from 'state/application/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

const Image = styled.img`
  width: 100%;
  max-height: 100%;
  object-fit: contain;
`

const Placeholder = () => {
  const toggleWalletModal = useWalletModalToggle()
  const [darkMode] = useDarkModeManager()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const getBackround = () => {
    if (upToSmall) {
      if (darkMode) {
        return MobileDarkPlaceholder
      }

      return MobileLightPlaceholder
    }

    if (darkMode) {
      return DesktopDarkPlaceholder
    }

    return DesktopLightPlaceholder
  }

  return (
    <Flex
      sx={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <Image src={getBackround()} />
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
