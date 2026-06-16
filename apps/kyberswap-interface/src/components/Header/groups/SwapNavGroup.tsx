import { Trans } from '@lingui/macro'
import { Repeat, Wind } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as CrossChainIcon } from 'assets/svg/cross_chain_icon.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import NavGroup from 'components/Header/groups/NavGroup'
import { DropdownTextAnchor, StyledNavLink } from 'components/Header/styleds'
import { NewLabel } from 'components/Menu'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { isDustSwapSupported } from 'constants/dustLiquidation'
import { APP_PATHS, CHAINS_SUPPORT_CROSS_CHAIN } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { isInSafeApp, isSupportLimitOrder } from 'utils'
import { cn } from 'utils/cn'

const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex size-4 flex-[0_0_16px] items-center">{children}</div>
)

const SwapNavGroup = () => {
  const { networkInfo, chainId } = useActiveWeb3React()
  const { pathname } = useLocation()
  const upTo430 = useMedia('(max-width: 430px)')

  const [{ show: isShowTutorial = false, stepInfo }] = useTutorialSwapGuide()

  const isActive = [APP_PATHS.SWAP, APP_PATHS.LIMIT, APP_PATHS.CROSS_CHAIN, APP_PATHS.DUST].some(path =>
    pathname.startsWith(path),
  )

  return (
    <NavGroup
      dropdownAlign={upTo430 ? 'center' : 'left'}
      isActive={isActive}
      forceOpen={isShowTutorial && stepInfo?.selector === `#${TutorialIds.BRIDGE_LINKS}`}
      anchor={
        <DropdownTextAnchor>
          <Trans>Trade</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <div id={TutorialIds.BRIDGE_LINKS} className={cn('flex flex-col', upTo430 ? 'min-w-[160px]' : 'min-w-[250px]')}>
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

          {isDustSwapSupported(chainId) && (
            <StyledNavLink id="dust-nav-link" to={APP_PATHS.DUST} style={{ flexDirection: 'column', width: '100%' }}>
              <div className="flex items-center gap-3">
                <IconWrapper>
                  <Wind size={16} />
                </IconWrapper>
                <div className="flex">
                  <Trans>Dust Liquidation</Trans>
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
