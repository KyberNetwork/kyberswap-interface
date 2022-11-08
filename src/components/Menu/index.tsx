import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useRef } from 'react'
import { Menu as MenuIcon } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import MenuFlyout from 'components/MenuFlyout'
import Preferences from 'components/Preferences'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useClaimReward from 'hooks/useClaimReward'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

import ClaimRewardModal from './ClaimRewardModal'
import FaucetModal from './FaucetModal'
import MenuItems from './MenuItems'

const Divider = styled.div`
  width: 100%;
  height: 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text};
  }
`

const StyledMenuButton = styled.button<{ active?: boolean }>`
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};

  border-radius: 999px;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyoutBrowserStyle = css`
  min-width: 17rem;
  right: -11px;
`

const MenuFlyoutMobileStyle = css`
  overflow: auto;
`

const ClaimRewardButton = styled(ButtonPrimary)`
  padding: 12px;
  font-size: 14px;
  width: 100%;
`

export const NewLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.red};
  height: calc(100% + 4px);
  margin-left: 2px;
`

const Menu: React.FC = () => {
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const { pendingTx: isClaiming } = useClaimReward()
  const { mixpanelHandler } = useMixpanel()
  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton active={open} onClick={toggle} aria-label="Menu">
        <StyledMenuIcon />
      </StyledMenuButton>

      <MenuFlyout
        node={node}
        mobileCustomStyle={MenuFlyoutMobileStyle}
        browserCustomStyle={MenuFlyoutBrowserStyle}
        isOpen={open}
        toggle={toggle}
        hasArrow
      >
        <Flex
          sx={{
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <MenuItems />

          <Divider />

          <Preferences />

          <Divider />

          <Flex
            sx={{
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <ClaimRewardButton
              disabled={!account || (!!chainId && NETWORKS_INFO[chainId].classic.claimReward === '') || isClaiming}
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.CLAIM_REWARDS_INITIATED)
                toggleClaimPopup()
              }}
            >
              {isClaiming ? (
                <>
                  <Loader style={{ marginRight: '5px' }} stroke={theme.disableText} /> <Trans>Claiming...</Trans>
                </>
              ) : (
                <Trans>Claim Rewards</Trans>
              )}
            </ClaimRewardButton>
            {!!process.env.REACT_APP_TAG && (
              <Text fontSize="12px" lineHeight="12px" fontWeight={400} color={theme.subText} textAlign="center">
                kyberswap@{process.env.REACT_APP_TAG}
              </Text>
            )}
          </Flex>
        </Flex>
      </MenuFlyout>
      <ClaimRewardModal />
      {chainId && [ChainId.BTTC, ChainId.RINKEBY].includes(chainId) && <FaucetModal />}
    </StyledMenu>
  )
}

export default Menu
