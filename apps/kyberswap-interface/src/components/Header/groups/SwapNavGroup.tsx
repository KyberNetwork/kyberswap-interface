import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as CrossChainIcon } from 'assets/svg/cross_chain_icon.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import NavGroup, { type DropdownAlign } from 'components/Header/groups/NavGroup'
import { DropdownTextAnchor, NewLabel, StyledNavLink } from 'components/Header/styleds'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS, CHAINS_SUPPORT_CROSS_CHAIN } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isInSafeApp, isSupportLimitOrder } from 'utils'
import { cn } from 'utils/cn'
import { isSwapLikePath } from 'utils/routes'

const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex size-4 flex-[0_0_16px] items-center">{children}</div>
)

type Props = {
  dropdownAlign?: DropdownAlign
}

const SwapNavGroup = ({ dropdownAlign }: Props) => {
  const { networkInfo, chainId } = useActiveWeb3React()
  const { pathname } = useLocation()
  const isActive =
    isSwapLikePath(pathname) || [APP_PATHS.LIMIT, APP_PATHS.CROSS_CHAIN].some(path => pathname.startsWith(path))

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [{ show: isShowTutorial = false, stepInfo }] = useTutorialSwapGuide()

  return (
    <NavGroup
      dropdownAlign={dropdownAlign}
      isActive={isActive}
      forceOpen={isShowTutorial && stepInfo?.selector === `#${TutorialIds.BRIDGE_LINKS}`}
      anchor={
        <DropdownTextAnchor>
          <Trans>Trade</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <div
          id={TutorialIds.BRIDGE_LINKS}
          className={cn('flex flex-col', upToSmall ? 'min-w-[180px]' : 'min-w-[240px]')}
        >
          <StyledNavLink
            id={`swapv2-nav-link`}
            to={`${APP_PATHS.SWAP}/${networkInfo.route}`}
            style={{ flexDirection: 'column' }}
          >
            <div className="flex items-center gap-3">
              <IconWrapper>
                <Repeat size={16} />
              </IconWrapper>
              <Trans>Swap</Trans>
            </div>
          </StyledNavLink>

          {isSupportLimitOrder(chainId) && (
            <StyledNavLink
              id="limit-order-nav-link"
              to={`${APP_PATHS.LIMIT}/${networkInfo.route}`}
              style={{ flexDirection: 'column', width: '100%' }}
            >
              <div className="flex items-center gap-3">
                <IconWrapper>
                  <LimitOrderIcon />
                </IconWrapper>
                <div className="flex flex-1 items-center justify-between">
                  <Trans>Limit Order</Trans>
                </div>
              </div>
            </StyledNavLink>
          )}

          {CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && !isInSafeApp && (
            <StyledNavLink
              id="cross-chain-nav-link"
              to={APP_PATHS.CROSS_CHAIN}
              style={{ flexDirection: 'column', width: '100%' }}
            >
              <div className="flex items-center gap-3">
                <IconWrapper>
                  <CrossChainIcon height={15} />
                </IconWrapper>
                <div className="flex">
                  <Trans>Cross-Chain</Trans>
                  <NewLabel isNew>New</NewLabel>
                </div>
              </div>
            </StyledNavLink>
          )}
        </div>
      }
    />
  )
}

export default SwapNavGroup
