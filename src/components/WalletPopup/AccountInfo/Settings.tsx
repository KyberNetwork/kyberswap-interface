import KyberOauth2 from '@kybernetwork/oauth2'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { BarChart2, LogOut, Settings as SettingsIcon } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import MenuFlyout from 'components/MenuFlyout'
import { PROMM_ANALYTICS_URL } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useDisconnectWallet from 'hooks/useDisconnectWallet'
import { useSessionInfo } from 'state/authen/hooks'
import { ExternalLink } from 'theme'

const shareStyleMenuItem = css`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 12px;
  color: ${({ theme }) => theme.text};
  :hover {
    color: ${({ theme }) => theme.primary};
    text-decoration: none;
    background-color: ${({ theme }) => rgba(theme.background, 0.2)};
  }
`

const MenuItem = styled.div`
  ${shareStyleMenuItem}
`

const MenuItemLink = styled(ExternalLink)`
  ${shareStyleMenuItem}
`

const IconWrapper = styled.div`
  display: flex;
  width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
`

const customStyleMenu = { padding: '8px 0px' }

const Settings: React.FC = () => {
  const disconnectWallet = useDisconnectWallet()
  const { chainId, account = '' } = useActiveWeb3React()
  const { isLogin } = useSessionInfo()

  return (
    <MenuFlyout
      trigger={
        <IconWrapper>
          <SettingsIcon size={20} cursor="pointer" />
        </IconWrapper>
      }
      modalWhenMobile={false}
      customStyle={customStyleMenu}
    >
      <Column>
        {chainId !== ChainId.SOLANA && (
          <MenuItemLink href={`${PROMM_ANALYTICS_URL[chainId]}/account/${account}`}>
            <BarChart2 size={16} />
            <Trans>Analytics ↗</Trans>
          </MenuItemLink>
        )}
        <MenuItem onClick={disconnectWallet}>
          <LogOut size={16} />
          <Text>
            <Trans>Disconnect</Trans>
          </Text>
        </MenuItem>
        {isLogin && (
          <MenuItem onClick={() => KyberOauth2.logout()}>
            <LogOut size={16} />
            <Trans>Sign out</Trans>
          </MenuItem>
        )}
      </Column>
    </MenuFlyout>
  )
}

export default Settings
