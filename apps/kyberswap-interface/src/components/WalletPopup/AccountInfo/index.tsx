import { Trans } from '@lingui/macro'
import { ChevronRight, Eye, EyeOff, Star } from 'react-feather'

import CoinbaseSubscribeBtn from 'components/CoinbaseSubscribeBtn'
import Loader from 'components/Loader'
import CardBackground from 'components/WalletPopup/AccountInfo/CardBackground'
import { View } from 'components/WalletPopup/type'
import { useActiveWeb3React } from 'hooks'
import { useRewards } from 'hooks/useRewards'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { formatNumberWithPrecisionRange } from 'utils'
import { cn } from 'utils/cn'

type Props = {
  totalBalanceInUsd: number | null | string
  isMinimal: boolean
  toggleShowBalance: () => void
  showBalance: boolean
  setView: React.Dispatch<React.SetStateAction<string>>
}

export default function AccountInfo({ totalBalanceInUsd, isMinimal, showBalance, toggleShowBalance, setView }: Props) {
  const { trackingHandler } = useTracking()
  const { account } = useActiveWeb3React()
  const {
    totalReward: { usd },
  } = useRewards()

  return (
    <div data-minimal={isMinimal} className="flex flex-col gap-[14px] transition-all duration-100">
      <div className="-mt-4 ml-7">
        <CoinbaseSubscribeBtn />
      </div>
      <div className="relative w-full">
        <CardBackground noLogo={isMinimal} />
        <div
          className={cn('relative z-[2] flex size-full flex-col justify-between gap-1 px-4 py-3', isMinimal && 'p-3')}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div
                className="flex w-fit cursor-pointer gap-1"
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.BALANCE_VISIBILITY_TOGGLED, {
                    new_state: showBalance ? 'hidden' : 'visible',
                    total_balance_usd: totalBalanceInUsd,
                    wallet_address: account,
                  })
                  toggleShowBalance()
                }}
              >
                <span className="text-xs font-medium leading-4 text-subText">
                  <Trans>Total Balance</Trans>
                </span>
                {showBalance ? (
                  <EyeOff size={14} className="text-subText" />
                ) : (
                  <Eye size={14} className="text-subText" />
                )}
              </div>

              <span className={cn('truncate text-4xl font-medium', isMinimal && 'text-xl')}>
                {typeof totalBalanceInUsd === 'number' ? (
                  showBalance ? (
                    `$${formatNumberWithPrecisionRange(totalBalanceInUsd, 0, 8)}`
                  ) : (
                    '******'
                  )
                ) : typeof totalBalanceInUsd === 'string' ? (
                  totalBalanceInUsd
                ) : (
                  <Loader size="30px" />
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-full">
        <div className="flex flex-row content-center">
          <CardBackground noLogo />
          <div className="relative z-[2] flex size-full flex-col justify-between gap-1 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Star size={16} className="fill-subText text-subText" />
                <span className="text-xs font-medium leading-4 text-subText">
                  <Trans>Total Available Rewards</Trans>
                </span>
              </div>
              <div
                className="flex cursor-pointer items-center gap-1"
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.WALLET_REWARDS_VIEWED, {
                    total_rewards_usd: usd,
                    wallet_address: account,
                  })
                  setView(View().REWARD_CENTER)
                }}
              >
                <span className="text-xs font-medium leading-4 text-text">
                  ${formatNumberWithPrecisionRange(usd, 0, 8)}
                </span>
                <ChevronRight size={20} className="text-subText" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
