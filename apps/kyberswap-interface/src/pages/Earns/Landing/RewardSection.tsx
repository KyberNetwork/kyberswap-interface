import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import PlayIcon from 'assets/svg/earn/play-icon.svg'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { HeroRewardRow, RewardsNavigateButton } from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const RewardSection = () => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { rewardInfo, isLoadingRewardInfo } = useKemRewards()
  const { totalUsdValue: merklRewardUsdValue } = useMerklRewards()

  const totalRewardUsdValue = (rewardInfo?.totalUsdValue || 0) + (merklRewardUsdValue || 0)

  const btnPath = !account
    ? '#'
    : totalRewardUsdValue >= 10
    ? APP_PATHS.EARN_POSITIONS
    : `${APP_PATHS.EARN_POOLS}?tag=${FilterTag.FARMING_POOL}`

  const btnText = !account ? t`Connect wallet` : totalRewardUsdValue >= 10 ? t`Collect Rewards` : t`Earn Rewards`

  const handleClickBtn = () => {
    if (!account) toggleWalletModal()
  }

  return (
    <HeroRewardRow>
      <Flex alignItems="center" sx={{ gap: '20px' }}>
        <Text fontSize={16} color={theme.subText} sx={{ textTransform: 'uppercase' }}>
          {t`Total Rewards`}
        </Text>
        {isLoadingRewardInfo ? (
          <PositionSkeleton width={120} height={32} />
        ) : (
          <Text fontSize={28} lineHeight="32px">
            {formatDisplayNumber(totalRewardUsdValue, { significantDigits: 6, style: 'currency' })}
          </Text>
        )}
      </Flex>
      <RewardsNavigateButton to={btnPath} onClick={handleClickBtn}>
        <Text fontSize={14} color={theme.primary} fontWeight={500} sx={{ textTransform: 'uppercase' }}>
          {btnText}
        </Text>
        <img src={PlayIcon} alt={t`Play icon`} width={upToSmall ? 24 : 28} height={upToSmall ? 24 : 28} />
      </RewardsNavigateButton>
    </HeroRewardRow>
  )
}

export default RewardSection
