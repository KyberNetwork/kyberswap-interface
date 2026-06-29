import { Suspense, lazy } from 'react'

import { ReactComponent as MenuIcon } from 'assets/svg/all_icon.svg'
import ClaimRewardModal from 'components/Menu/ClaimRewardModal'
import FaucetModal from 'components/Menu/FaucetModal'
import MenuContent from 'components/Menu/MenuContent'
import { Divider } from 'components/Menu/MenuItems'
import { ClaimRewardsAction } from 'components/Menu/components/ClaimRewardsAction'
import { LegacySection } from 'components/Menu/components/LegacySection'
import { MainMenuSection } from 'components/Menu/components/MainMenuSection'
import { PreferencesSection } from 'components/Menu/components/PreferencesSection'
import { useTipLinkGeneratorModal } from 'components/Menu/hooks/useTipLinkGeneratorModal'
import MenuFlyout from 'components/MenuFlyout'
import { HStack } from 'components/Stack'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { FAUCET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { cn } from 'utils/cn'

export { NewLabel } from 'components/Menu/MenuItems'

// Lazy: keeps the TipLink generator and its heavy deps (@kyber/token-selector, schema, the share
// banner) off the eager entry chunk — the modal loads only when the user opens it.
const TipLinkGeneratorModal = lazy(() => import('components/TipLinkGeneratorModal'))

const MENU_FLYOUT_BROWSER_CLASS = '!right-[-8px] !w-[230px] !min-w-0 !p-0 max-lg:!bottom-14 max-lg:!top-auto'
const MENU_FLYOUT_MOBILE_CLASS = '!p-0 overflow-y-scroll'

const Menu = () => {
  const { chainId } = useActiveWeb3React()

  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const { trackingHandler } = useTracking()
  const { closeTipLinkGenerator, openTipLinkGenerator, showTipLinkGenerator, tipLinkMounted } =
    useTipLinkGeneratorModal()

  return (
    <HStack className="relative items-center justify-center border-none text-left">
      <MenuFlyout
        trigger={
          <button
            onClick={() => {
              if (!open) {
                trackingHandler(TRACKING_EVENT_TYPE.MENU_DROPDOWN_OPENED, {})
              }
              toggle()
            }}
            aria-label="Menu"
            id={TutorialIds.BUTTON_MENU_HEADER}
            className={cn(
              'flex size-10 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 outline-none hover:text-text',
              open ? 'text-text' : 'text-subText',
            )}
          >
            <MenuIcon width={18} height={18} />
          </button>
        }
        className={MENU_FLYOUT_BROWSER_CLASS}
        mobileClassName={MENU_FLYOUT_MOBILE_CLASS}
        isOpen={open}
        toggle={toggle}
        hasArrow
      >
        <MenuContent toggle={toggle}>
          <LegacySection toggle={toggle} />
          <Divider />

          <MainMenuSection openTipLinkGenerator={openTipLinkGenerator} toggle={toggle} />
          <Divider />

          <PreferencesSection toggle={toggle} />
          <Divider />

          <ClaimRewardsAction />
        </MenuContent>
      </MenuFlyout>

      <ClaimRewardModal />
      {FAUCET_NETWORKS.includes(chainId) && <FaucetModal />}
      {tipLinkMounted && (
        <Suspense fallback={null}>
          <TipLinkGeneratorModal isOpen={showTipLinkGenerator} onDismiss={closeTipLinkGenerator} />
        </Suspense>
      )}
    </HStack>
  )
}

export default Menu
