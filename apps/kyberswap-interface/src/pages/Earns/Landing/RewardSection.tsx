import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import PlayIcon from 'assets/svg/earn/play-icon.svg'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { RewardsNavigateButton } from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const RewardSection = () => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { rewardInfo } = useKemRewards()

  const totalRewardUsdValue = rewardInfo?.totalUsdValue || 0

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
    <Flex
      flexDirection={upToSmall ? 'column' : 'row'}
      alignItems={upToSmall ? 'center' : 'flex-end'}
      justifyContent={'center'}
      sx={{ gap: upToSmall ? '28px' : 4 }}
    >
      <Flex flexDirection={upToSmall ? 'column' : 'row'} alignItems={'center'} sx={{ gap: upToSmall ? 3 : '20px' }}>
        <Text
          fontSize={upToSmall ? 18 : 16}
          color={theme.subText}
          sx={{ textTransform: 'uppercase', position: 'relative', top: 1 }}
        >
          {t`Total rewards`}
        </Text>
        <Text fontSize={28}>
          {formatDisplayNumber(totalRewardUsdValue, { significantDigits: 6, style: 'currency' })}
        </Text>
      </Flex>
      <RewardsNavigateButton to={btnPath} onClick={handleClickBtn}>
        <Text fontSize={14} color={theme.primary} fontWeight={500} sx={{ textTransform: 'uppercase' }}>
          {btnText}
        </Text>
        <img src={PlayIcon} alt={t`Play icon`} width={36} height={36} />
      </RewardsNavigateButton>
    </Flex>
  )
}

export default RewardSection
