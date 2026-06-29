import { Suspense, lazy } from 'react'
import { isMobile } from 'react-device-detect'

import { ReactComponent as MenuIcon } from 'assets/svg/all_icon.svg'
import ClaimRewardModal from 'components/Menu/ClaimRewardModal'
import FaucetModal from 'components/Menu/FaucetModal'
import { Divider } from 'components/Menu/MenuItems'
import { BottomSection } from 'components/Menu/components/BottomSection'
import { LegacySection } from 'components/Menu/components/LegacySection'
import { MainMenuSection } from 'components/Menu/components/MainMenuSection'
import { PreferencesSection } from 'components/Menu/components/PreferencesSection'
import { useMenuScrollIndicator } from 'components/Menu/hooks/useMenuScrollIndicator'
import { useTipLinkGeneratorModal } from 'components/Menu/hooks/useTipLinkGeneratorModal'
import MenuFlyout from 'components/MenuFlyout'
import { HStack, Stack } from 'components/Stack'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { FAUCET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'

// Lazy: keeps the TipLink generator and its heavy deps (@kyber/token-selector, schema, the share
// banner) off the eager entry chunk — the modal loads only when the user opens it.
const TipLinkGeneratorModal = lazy(() => import('components/TipLinkGeneratorModal'))

const Menu = () => {
  const { chainId } = useActiveWeb3React()

  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const { trackingHandler } = useTracking()
  const { closeTipLinkGenerator, openTipLinkGenerator, showTipLinkGenerator, tipLinkMounted } =
    useTipLinkGeneratorModal()
  const { setScrollContainerNode, showScroll } = useMenuScrollIndicator()

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
            <MenuIcon className="size-5" />
          </button>
        }
        className="!-right-2 !w-60 !min-w-0 !p-0 max-lg:!bottom-14 max-lg:!top-auto"
        mobileClassName="!p-0 overflow-y-scroll"
        isOpen={open}
        toggle={toggle}
        hasArrow
      >
        <Stack
          ref={setScrollContainerNode}
          className="relative max-h-[calc(100dvh-theme(spacing.40))] overflow-y-auto pb-3"
        >
          {isMobile && (
            <CloseIcon aria-label="Close menu" className="absolute right-5 top-5 z-[3] text-subText" onClick={toggle} />
          )}

          <LegacySection toggle={toggle} />
          <Divider />

          <MainMenuSection openTipLinkGenerator={openTipLinkGenerator} toggle={toggle} />
          <Divider />

          <PreferencesSection toggle={toggle} />
          <Divider />

          <BottomSection showScroll={showScroll} />
        </Stack>
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
