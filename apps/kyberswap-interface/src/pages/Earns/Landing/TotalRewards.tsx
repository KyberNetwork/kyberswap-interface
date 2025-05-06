import { t } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { Flex, Text } from 'rebass'
import { ReactComponent as KyberIcon } from 'assets/images/KNC.svg'
import { formatDisplayNumber } from 'utils/numbers'
import { RewardsNavigateButton } from 'pages/Earns/Landing/styles'
import { APP_PATHS } from 'constants/index'
import { FilterTag } from 'pages/Earns/PoolExplorer'
import PlayIcon from 'assets/svg/earn/play-icon.svg'
import { MEDIA_WIDTHS } from 'theme'
import { useMedia } from 'react-use'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'

const TotalRewards = () => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const totalRewards = 1276
  const tokenRewards = 'KNC'
  const rewardUsdValue = 876.76

  const btnPath = !account
    ? '#'
    : rewardUsdValue >= 10
    ? APP_PATHS.EARN_POSITIONS
    : `${APP_PATHS.EARN_POOLS}?tag=${FilterTag.FARMING_POOL}`

  const btnText = !account ? t`Connect wallet` : rewardUsdValue >= 10 ? t`Collect Rewards` : t`Earn Rewards`

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
              <Text>{formatDisplayNumber(totalRewards, { significantDigits: 4 })}</Text>
              <Text>{tokenRewards}</Text>
            </Flex>
            {rewardUsdValue > 0 ? (
              <Text width={'fit-content'} color={theme.subText} fontSize={upToSmall ? '16px' : undefined}>
                {formatDisplayNumber(rewardUsdValue, { significantDigits: 6, style: 'currency' })}
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

export default TotalRewards
