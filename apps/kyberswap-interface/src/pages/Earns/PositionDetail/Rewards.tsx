import { t } from '@lingui/macro'
import { Clock } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ReactComponent as KemIcon } from 'assets/svg/kyber/kem.svg'
import useTheme from 'hooks/useTheme'
import { NextDistribution, PositionAction, RewardsSection } from 'pages/Earns/PositionDetail/styles'

const Rewards = () => {
  const theme = useTheme()

  return (
    <RewardsSection>
      <Flex alignItems={'center'} justifyContent={'space-between'}>
        <Flex alignItems={'center'} sx={{ gap: 1 }}>
          <KemIcon />
          <Text fontSize={14} color={theme.subText} lineHeight={'20PX'}>
            {t`TOTAL REWARDS`}
          </Text>
        </Flex>
        <Text fontSize={20}>238.64 KNC</Text>
      </Flex>

      <NextDistribution>
        <Text
          fontSize={14}
          color={theme.subText}
          sx={{ textDecoration: 'underline dashed', textUnderlineOffset: '4px' }}
        >
          {t`Next distribution in:`}
        </Text>
        <Flex alignItems={'center'} sx={{ gap: 1 }}>
          <Clock size={16} color={theme.subText} />
          <Text fontSize={14} color={theme.subText}>
            6d 12h 30m 45s
          </Text>
        </Flex>
      </NextDistribution>

      <Flex alignItems={'flex-end'} justifyContent={'space-between'}>
        <Flex flexDirection={'column'} sx={{ gap: '6px' }}>
          <Text fontSize={14} color={theme.subText}>
            Claimable Rewards
          </Text>
          <Text fontSize={20}>12 KNC</Text>
        </Flex>
        <PositionAction small outline mobileAutoWidth disabled>
          {t`Claim`}
        </PositionAction>
      </Flex>
    </RewardsSection>
  )
}

export default Rewards
