// import { t } from '@lingui/macro'
// import { zIndex } from 'html2canvas/dist/types/css/property-descriptors/z-index'
// import { useEffect, useState } from 'react'
// import { Clock } from 'react-feather'
// import { Flex, Text } from 'rebass'
// import { ReactComponent as KemIcon } from 'assets/svg/kyber/kem.svg'
// import InfoHelper from 'components/InfoHelper'
// import Loader from 'components/Loader'
// import TokenLogo from 'components/TokenLogo'
// import useTheme from 'hooks/useTheme'
import {
  // NextDistribution,
  // PositionAction,
  // RewardDetailInfo,
  RewardsSection, // VerticalDivider,
} from 'pages/Earns/PositionDetail/styles'
// import { ListClaimableTokens } from 'pages/Earns/UserPositions/styles'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ParsedPosition } from 'pages/Earns/types'

// import { formatDisplayNumber } from 'utils/numbers'

// const getNextWednesdayMidnightUTC = () => {
//   const now = new Date()
//   const nextWednesday = new Date(now)

//   // Set to next Wednesday (3 is Wednesday in getUTCDay())
//   nextWednesday.setUTCDate(now.getUTCDate() + ((3 - now.getUTCDay() + 7) % 7))
//   // Set to 10:00 AM UTC
//   nextWednesday.setUTCHours(10, 0, 0, 0)

//   // If we're already past this Wednesday's midnight, get next week's
//   if (now > nextWednesday) {
//     nextWednesday.setUTCDate(nextWednesday.getUTCDate() + 7)
//   }

//   return Math.floor(nextWednesday.getTime() / 1000)
// }

// const formatTimeRemaining = (seconds: number) => {
//   const days = Math.floor(seconds / 86400)
//   const hours = Math.floor((seconds % 86400) / 3600)
//   const minutes = Math.floor((seconds % 3600) / 60)
//   const secs = seconds % 60

//   return `${days}d ${hours}h ${minutes}m ${secs}s`
// }

const RewardSection = ({ position }: { position: ParsedPosition }) => {
  console.log('position', position)
  // const theme = useTheme()

  // const [timeRemaining, setTimeRemaining] = useState('')
  // const [nextDistributionTime] = useState(getNextWednesdayMidnightUTC())

  const {
    // rewardInfo,
    claimModal: claimRewardsModal,
    // onOpenClaim: onOpenClaimRewards,
    // claiming: rewardsClaiming,
  } = useKemRewards()
  // const rewardInfoThisPosition = rewardInfo?.nfts.find(item => item.nftId === position.tokenId)

  // useEffect(() => {
  //   const calculateTimeRemaining = () => {
  //     const now = Math.floor(Date.now() / 1000)
  //     const remaining = nextDistributionTime - now
  //     setTimeRemaining(formatTimeRemaining(remaining))
  //   }

  //   calculateTimeRemaining()
  //   const interval = setInterval(calculateTimeRemaining, 1000)
  //   return () => clearInterval(interval)
  // }, [nextDistributionTime])

  return (
    <>
      {claimRewardsModal}

      <RewardsSection>
        {/* <Flex alignItems={'center'} sx={{ gap: '20px' }}>
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Flex alignItems={'center'} sx={{ gap: 1 }}>
              <Text fontSize={14} color={theme.subText} lineHeight={'20PX'}>
                {t`Total Rewards`}
              </Text>
              <KemIcon width={20} height={20} />
            </Flex>
            <Text fontSize={20}>
              {formatDisplayNumber(rewardInfoThisPosition?.totalUsdValue || 0, {
                significantDigits: 6,
                style: 'currency',
              })}
            </Text>
          </Flex>

          {rewardInfoThisPosition?.totalUsdValue ? (
            <>
              {' '}
              <VerticalDivider height="44px" />
              <Flex flexDirection={'column'} sx={{ gap: 1 }}>
                {rewardInfoThisPosition?.tokens.map((item, index) => (
                  <Flex key={index} alignItems={'center'} sx={{ gap: '6px' }}>
                    <TokenLogo src={item.logo} size={16} />
                    <Text fontSize={16}>{formatDisplayNumber(item.totalAmount, { significantDigits: 6 })}</Text>
                    <Text fontSize={16}>{item.symbol}</Text>
                  </Flex>
                ))}
              </Flex>
            </>
          ) : null}
        </Flex>

        <RewardDetailInfo>
          <Flex width={'100%'} alignItems={'center'} justifyContent={'space-between'}>
            <Text fontSize={20}>
              {formatDisplayNumber(rewardInfoThisPosition?.claimedUsdValue || 0, {
                significantDigits: 6,
                style: 'currency',
              })}
            </Text>
            <Text fontSize={14} color={theme.subText}>
              {t`Claimed`}
            </Text>
          </Flex>

          <Flex width={'100%'} alignItems={'center'} justifyContent={'space-between'}>
            <Flex alignItems={'center'}>
              <Text fontSize={20}>
                {formatDisplayNumber(rewardInfoThisPosition?.pendingUsdValue || 0, {
                  significantDigits: 6,
                  style: 'currency',
                })}
              </Text>
              <InfoHelper
                text={t`Rewards that will be available within 2 days after the countdown completes.`}
                width="330px"
                placement="top"
                color={theme.text}
              />
            </Flex>
            <Text fontSize={14} color={theme.subText}>
              {t`Pending`}
            </Text>
          </Flex>

          <NextDistribution>
            <Flex alignItems={'center'}>
              <Text fontSize={14} color={theme.subText}>
                {t`Next distribution in`}
              </Text>
              <InfoHelper placement="top" width="fit-content" text={t`Rewards are distributed every 7 days`} />
            </Flex>
            <Flex alignItems={'center'} sx={{ gap: 1 }}>
              <Clock size={16} color={theme.subText} />
              <Text fontSize={14} color={theme.subText}>
                {timeRemaining}
              </Text>
            </Flex>
          </NextDistribution>

          <Flex width={'100%'} alignItems={'center'} justifyContent={'space-between'}>
            <Flex alignItems={'center'}>
              <Text fontSize={20}>
                {formatDisplayNumber(rewardInfoThisPosition?.claimableUsdValue || 0, {
                  significantDigits: 6,
                  style: 'currency',
                })}
              </Text>
              <InfoHelper
                color={theme.text}
                placement="top"
                width="fit-content"
                text={
                  <>
                    <Text>
                      {t`Rewards you can claim right now`}
                      {rewardInfoThisPosition?.claimableUsdValue ? '' : ': 0'}
                    </Text>
                    <ListClaimableTokens>
                      {rewardInfoThisPosition?.tokens.map((token, index) => (
                        <li key={`${token.address}-${index}`}>
                          {formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })} {token.symbol}
                        </li>
                      ))}
                    </ListClaimableTokens>
                  </>
                }
                style={{ position: 'relative', top: 2 }}
              />
            </Flex>
            <Text fontSize={14} color={theme.subText}>
              {t`Claimable`}
            </Text>
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
        </RewardDetailInfo> */}

        <div className="text-subText text-sm">In maintenance</div>
      </RewardsSection>
    </>
  )
}

export default RewardSection
