import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as KyberIcon } from 'assets/images/KNC.svg'
import PlayIcon from 'assets/svg/earn/play-icon.svg'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { RewardsNavigateButton } from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer'
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
      sx={{ gap: upToSmall ? '28px' : '32px' }}
    >
      <Flex
        flexDirection={'column'}
        alignItems={upToSmall ? 'center' : 'flex-start'}
        sx={{ gap: upToSmall ? '12px' : 2 }}
      >
        <Text color={theme.subText} sx={{ textTransform: 'uppercase' }}>
          {t`Total rewards`}
        </Text>
        <Flex alignContent={'center'} sx={{ gap: upToSmall ? 3 : 2, fontSize: upToSmall ? '24px' : '28px' }}>
          <KyberIcon
            width={upToSmall ? 40 : 32}
            height={upToSmall ? 40 : 32}
            style={{ position: 'relative', top: upToSmall ? 4 : 0 }}
          />
          <Flex flexDirection={upToSmall ? 'column' : 'row'} alignContent={'center'} sx={{ gap: upToSmall ? 0 : 2 }}>
            <Flex alignContent={'center'} sx={{ gap: 2 }}>
              <Text>{formatDisplayNumber(rewardInfo?.totalAmount || 0, { significantDigits: 6 })}</Text>
              <Text>KNC</Text>
            </Flex>
            {totalRewardUsdValue > 0 ? (
              <Text width={'fit-content'} color={theme.subText} fontSize={upToSmall ? '16px' : undefined}>
                {formatDisplayNumber(totalRewardUsdValue, { significantDigits: 6, style: 'currency' })}
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
      <RewardsNavigateButton to={btnPath} onClick={handleClickBtn}>
        <Text fontSize={14} color={theme.primary} fontWeight={500} sx={{ textTransform: 'uppercase' }}>
          {btnText}
        </Text>
        <img src={PlayIcon} alt="play" width={36} height={36} />
      </RewardsNavigateButton>
    </Flex>
  )
}

export default RewardSection
