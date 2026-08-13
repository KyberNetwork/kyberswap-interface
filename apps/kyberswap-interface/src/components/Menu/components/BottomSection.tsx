import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { ChevronDown } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { usePendingClaimRewardTx } from 'components/Menu/hooks/useClaimReward'
import { HStack, Stack } from 'components/Stack'
import { TAG } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { cn } from 'utils/cn'

type BottomSectionProps = {
  showScroll: boolean
}

export const BottomSection = ({ showScroll }: BottomSectionProps) => {
  const { account, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const pendingTx = usePendingClaimRewardTx()
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)

  return (
    <>
      <HStack className="justify-center px-5 py-2.5">
        <ButtonPrimary
          disabled={!account || !networkInfo.classic.claimReward || pendingTx}
          onClick={() => {
            trackingHandler(TRACKING_EVENT_TYPE.CLAIM_REWARDS_INITIATED)
            toggleClaimPopup()
          }}
          className="w-max px-5 py-2 text-sm"
        >
          {pendingTx ? (
            <HStack className="items-center gap-1">
              <Loader className="text-disableText" />
              <Trans>Claiming...</Trans>
            </HStack>
          ) : (
            <Trans>Claim Rewards</Trans>
          )}
        </ButtonPrimary>
      </HStack>

      <Stack className="items-center px-5 py-2.5">
        <span className="text-xs font-light leading-none text-subText">kyberswap@{TAG}</span>
      </Stack>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none sticky bottom-0 z-[2] flex w-full items-center justify-center [animation:floating_1s_ease_infinite_alternate-reverse]',
          isMobile ? 'h-5' : 'h-2',
          showScroll ? 'visible' : 'invisible',
        )}
      >
        <ChevronDown className="size-4 text-subText" />
      </div>
    </>
  )
}
