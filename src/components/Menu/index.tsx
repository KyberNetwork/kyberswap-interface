import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useRef } from 'react'
import { isMobile } from 'react-device-detect'
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

const ClaimRewardButton = styled(ButtonPrimary)`
  margin-top: 20px;
  padding: 11px;
  font-size: 14px;
  width: max-content;
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
  const { pendingTx } = useClaimReward()
  const { mixpanelHandler } = useMixpanel()
  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton active={open} onClick={toggle} aria-label="Menu">
        <StyledMenuIcon />
      </StyledMenuButton>

      <MenuFlyout node={node} browserCustomStyle={MenuFlyoutBrowserStyle} isOpen={open} toggle={toggle} hasArrow>
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

          <ClaimRewardButton
            disabled={!account || (!!chainId && NETWORKS_INFO[chainId].classic.claimReward === '') || pendingTx}
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.CLAIM_REWARDS_INITIATED)
              toggleClaimPopup()
            }}
          >
            {pendingTx ? (
              <>
                <Loader style={{ marginRight: '5px' }} stroke={theme.disableText} /> <Trans>Claiming...</Trans>
              </>
            ) : (
              <Trans>Claim Rewards</Trans>
            )}
          </ClaimRewardButton>
          {!!process.env.REACT_APP_TAG && (
            <Text
              fontSize="10px"
              fontWeight={300}
              color={theme.subText}
              mt="16px"
              textAlign={isMobile ? 'left' : 'center'}
            >
              kyberswap@{process.env.REACT_APP_TAG}
            </Text>
          )}
        </Flex>
      </MenuFlyout>
      <ClaimRewardModal />
      {chainId && [ChainId.BTTC, ChainId.RINKEBY].includes(chainId) && <FaucetModal />}
    </StyledMenu>
  )
}

export default Menu
