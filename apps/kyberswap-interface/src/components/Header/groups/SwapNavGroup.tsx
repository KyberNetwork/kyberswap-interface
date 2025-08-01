import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'

//import { ReactComponent as MasterCard } from 'assets/buy-crypto/master-card.svg'
//import { ReactComponent as Visa } from 'assets/buy-crypto/visa.svg'
//import { ReactComponent as BuyCrypto } from 'assets/svg/buy_crypto.svg'
import { ReactComponent as CrossChainIcon } from 'assets/svg/cross_chain_icon.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { DropdownTextAnchor, StyledNavLink } from 'components/Header/styleds'
import { NewLabel } from 'components/Menu'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS, CHAINS_SUPPORT_CROSS_CHAIN } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
//import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { isInSafeApp, isSupportLimitOrder } from 'utils'

import NavGroup from './NavGroup'

const IconWrapper = styled.div`
  flex: 0 0 16px;
  display: flex;
  width: 16px;
  height: 16px;
  align-items: center;
`

//const VisaSVG = styled(Visa)`
//  path {
//    fill: ${({ theme }) => theme.text};
//  }
//`

//const StyledBuyCrypto = styled(BuyCrypto)`
//  path {
//    fill: currentColor;
//  }
//`

const SwapNavGroup = () => {
  const { networkInfo, chainId } = useActiveWeb3React()
  const { pathname } = useLocation()
  const upToXXSmall = useMedia('(max-width: 420px)')

  const [{ show: isShowTutorial = false, stepInfo }] = useTutorialSwapGuide()

  const isActive = [APP_PATHS.SWAP, APP_PATHS.BUY_CRYPTO, APP_PATHS.LIMIT, APP_PATHS.CROSS_CHAIN].some(path =>
    pathname.startsWith(path),
  )

  return (
    <NavGroup
      dropdownAlign={upToXXSmall ? 'center' : 'left'}
      isActive={isActive}
      forceOpen={isShowTutorial && stepInfo?.selector === `#${TutorialIds.BRIDGE_LINKS}`}
      anchor={
        <DropdownTextAnchor>
          <Trans>Trade</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Flex flexDirection={'column'} id={TutorialIds.BRIDGE_LINKS} minWidth={upToXXSmall ? '230px' : '250px'}>
          <StyledNavLink
            id={`swapv2-nav-link`}
            to={`${APP_PATHS.SWAP}/${networkInfo.route}`}
            style={{ flexDirection: 'column' }}
          >
            <Flex alignItems="center" sx={{ gap: '12px' }}>
              <IconWrapper>
                <Repeat size={16} />
              </IconWrapper>
              <Trans>Swap</Trans>
            </Flex>
          </StyledNavLink>

          {isSupportLimitOrder(chainId) && (
            <StyledNavLink
              id="limit-order-nav-link"
              to={`${APP_PATHS.LIMIT}/${networkInfo.route}`}
              style={{ flexDirection: 'column', width: '100%' }}
            >
              <Flex alignItems="center" sx={{ gap: '12px' }}>
                <IconWrapper>
                  <LimitOrderIcon />
                </IconWrapper>
                <Flex alignItems={'center'} sx={{ flex: 1 }} justifyContent={'space-between'}>
                  <Trans>Limit Order</Trans>
                </Flex>
              </Flex>
            </StyledNavLink>
          )}

          {CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && !isInSafeApp && (
            <StyledNavLink
              id="cross-chain-nav-link"
              to={APP_PATHS.CROSS_CHAIN}
              style={{ flexDirection: 'column', width: '100%' }}
            >
              <Flex alignItems="center" sx={{ gap: '12px' }}>
                <IconWrapper>
                  <CrossChainIcon height={15} />
                </IconWrapper>
                <Flex>
                  <Trans>Cross-Chain</Trans>
                  <NewLabel>New</NewLabel>
                </Flex>
              </Flex>
            </StyledNavLink>
          )}

          {/*
          <StyledNavLink
            id="buy-crypto-nav-link"
            to={APP_PATHS.BUY_CRYPTO}
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.SWAP_BUY_CRYPTO_CLICKED)
            }}
            style={{ flexDirection: 'column', width: '100%' }}
          >
            <Flex alignItems="center" sx={{ gap: '12px' }} justifyContent="space-between">
              <IconWrapper>
                <StyledBuyCrypto />
              </IconWrapper>
              <Flex alignItems={'center'} sx={{ flex: 1 }} justifyContent={'space-between'}>
                <Trans>Buy Crypto</Trans>
                <Flex sx={{ gap: '8px' }}>
                  <VisaSVG width="20" height="20" />
                  <MasterCard width="20" height="20" />
                </Flex>
              </Flex>
            </Flex>
          </StyledNavLink>

          */}
        </Flex>
      }
    />
  )
}

export default SwapNavGroup
