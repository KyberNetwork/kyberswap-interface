import { t } from '@lingui/macro'
import { useMedia } from 'react-use'

import PlayIcon from 'assets/svg/earn/play-icon.svg'
import ScrambleNumber from 'components/ScrambleNumber'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { RewardsNavigateButton } from 'pages/Earns/Landing/styles'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const RewardSection = () => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
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
    <div className={cn('flex justify-center', upToSmall ? 'flex-col items-center gap-7' : 'flex-row items-end gap-4')}>
      <div className={cn('flex items-center', upToSmall ? 'flex-col gap-4' : 'flex-row gap-5')}>
        <span className={cn('relative top-px uppercase text-subText', upToSmall ? 'text-lg' : 'text-base')}>
          {t`Total rewards`}
        </span>
        {/* Fixed-width centered slot so the value appearing never reflows the label/button. The digits
            scramble then lock to the real number — same string length + tabular-nums = constant width. */}
        <div className="inline-flex min-w-[140px] items-center justify-center text-[28px]">
          {!isLoadingRewardInfo && (
            <ScrambleNumber
              value={totalRewardUsdValue}
              format={n => formatDisplayNumber(n, { significantDigits: 6, style: 'currency' })}
            />
          )}
        </div>
      </div>
      <RewardsNavigateButton to={btnPath} onClick={handleClickBtn}>
        <span className="text-sm font-medium uppercase text-primary">{btnText}</span>
        <img src={PlayIcon} alt={t`Play icon`} width={36} height={36} />
      </RewardsNavigateButton>
    </div>
  )
}

export default RewardSection
