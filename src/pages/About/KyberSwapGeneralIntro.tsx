import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

const KyberSwapGeneralIntro = () => {
  const { networkInfo } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)')
  const { mixpanelHandler } = useMixpanel()

  const renderKyberSwapIntroDEX = () => {
    return (
      <Text
        as="span"
        sx={{
          fontWeight: 400,
          fontSize: '18px',
          lineHeight: '28px',
          textAlign: 'center',
        }}
      >
        <Trans>
          KyberSwap is a decentralized exchange (DEX) aggregator. We provide our traders with{' '}
          <b>superior token prices</b> by analyzing rates across thousands of exchanges instantly!
        </Trans>
      </Text>
    )
  }

  const renderSwapNowButton = () => {
    return (
      <ButtonPrimary
        onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
        as={Link}
        to={`${APP_PATHS.SWAP}/${networkInfo.route}?highlightBox=true`}
        style={{
          width: '216px',
          padding: '10px 12px',
          borderRadius: '32px',
        }}
      >
        <Repeat size={20} />
        <Text fontSize="14px" marginLeft="8px">
          <Trans>Swap Now</Trans>
        </Text>
      </ButtonPrimary>
    )
  }

  if (above768) {
    return (
      <Box
        sx={{
          marginTop: '32px',
          width: '100%',
          paddingLeft: '64px',
          paddingRight: '64px',

          display: 'grid',
          gap: '24px 72px ',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr auto',
          justifyItems: 'center',
        }}
      >
        {renderKyberSwapIntroDEX()}
        {renderSwapNowButton()}
      </Box>
    )
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        marginTop: '32px',
        width: '100%',
        paddingLeft: '32px',
        paddingRight: '32px',
        rowGap: '48px',
      }}
    >
      <Flex
        flexDirection={'column'}
        sx={{
          alignItems: 'center',
          rowGap: '16px',
        }}
      >
        {renderKyberSwapIntroDEX()}
        {renderSwapNowButton()}
      </Flex>
    </Flex>
  )
}

export default KyberSwapGeneralIntro
