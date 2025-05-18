import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Clock } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ReactComponent as KemIcon } from 'assets/svg/kyber/kem.svg'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NextDistribution, PositionAction, RewardsSection } from 'pages/Earns/PositionDetail/styles'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'

import { ParsedPosition } from '../types'

const getNextWednesdayMidnightUTC = () => {
  const now = new Date()
  const nextWednesday = new Date(now)

  // Set to next Wednesday (3 is Wednesday in getUTCDay())
  nextWednesday.setUTCDate(now.getUTCDate() + ((3 - now.getUTCDay() + 7) % 7))
  // Set to 12:00 AM UTC (midnight)
  nextWednesday.setUTCHours(0, 0, 0, 0)

  // If we're already past this Wednesday's midnight, get next week's
  if (now > nextWednesday) {
    nextWednesday.setUTCDate(nextWednesday.getUTCDate() + 7)
  }

  return Math.floor(nextWednesday.getTime() / 1000)
}

const formatTimeRemaining = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${days}d ${hours}h ${minutes}m ${secs}s`
}

const Rewards = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()

  const [timeRemaining, setTimeRemaining] = useState('')
  const [nextDistributionTime] = useState(getNextWednesdayMidnightUTC())

  const {
    rewardInfo,
    claimModal: claimRewardsModal,
    onOpenClaim: onOpenClaimRewards,
    claiming: rewardsClaiming,
  } = useKemRewards()
  const rewardInfoThisChain = chainId ? rewardInfo?.chains.find(item => item.chainId === chainId) : null
  const rewardInfoThisPosition = rewardInfoThisChain?.nfts.find(item => item.nftId === position.tokenId)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = nextDistributionTime - now
      setTimeRemaining(formatTimeRemaining(remaining))
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)
    return () => clearInterval(interval)
  }, [nextDistributionTime])

  return (
    <>
      {claimRewardsModal}

      <RewardsSection>
        <Flex alignItems={'center'} justifyContent={'space-between'}>
          <Flex alignItems={'center'} sx={{ gap: 1 }}>
            <KemIcon />
            <Text fontSize={14} color={theme.subText} lineHeight={'20PX'}>
              {t`TOTAL REWARDS`}
            </Text>
          </Flex>
          <Text fontSize={20}>{rewardInfoThisPosition?.totalAmount || 0} KNC</Text>
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
              {timeRemaining}
            </Text>
          </Flex>
        </NextDistribution>

        <Flex alignItems={'flex-end'} justifyContent={'space-between'}>
          <Flex flexDirection={'column'} sx={{ gap: '6px' }}>
            <Text fontSize={14} color={theme.subText}>
              {t`Claimable Rewards`}
            </Text>
            <Text fontSize={20}>{rewardInfoThisPosition?.claimableAmount || 0} KNC</Text>
          </Flex>
          <PositionAction
            small
            outline
            mobileAutoWidth
            disabled={!rewardInfoThisPosition?.claimableUsdValue || rewardsClaiming}
            onClick={() =>
              rewardInfoThisPosition?.claimableUsdValue &&
              !rewardsClaiming &&
              onOpenClaimRewards(rewardInfoThisPosition.nftId, position.chain.id)
            }
          >
            {rewardsClaiming && <Loader size="14px" />}
            {rewardsClaiming ? t`Claiming` : t`Claim`}
          </PositionAction>
        </Flex>
      </RewardsSection>
    </>
  )
}

export default Rewards
