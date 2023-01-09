import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useRef, useState } from 'react'
import { BarChart2, LogOut, Settings } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import KyberPanelImage from 'assets/images/kyber_panel.png'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Loader from 'components/Loader'
import MenuFlyout from 'components/MenuFlyout'
import { PROMM_ANALYTICS_URL } from 'constants/index'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useDisconnectWallet from 'hooks/useDisconnectWallet'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLink, ExternalLinkIcon } from 'theme'
import { formatNumberWithPrecisionRange, getEtherscanLink, shortenAddress } from 'utils'

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

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
`
const shareStyleAbsolute = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const Image = styled.img`
  ${shareStyleAbsolute}
  z-index: 0;
`

const BlurImage = styled.div`
  ${shareStyleAbsolute}
  background: linear-gradient(113.18deg, ${({ theme }) => theme.background} -0.1%, rgba(0, 0, 0, 0) 98.9%);
  opacity: 0.6;
  border-radius: 20px;
  z-index: 1;
`

const Content = styled.div`
  ${shareStyleAbsolute}
  z-index: 2;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const customStyleMenu = { padding: '10px 0px' }

export default function AccountInfo({ totalBalanceInUsd }: { totalBalanceInUsd: number | null }) {
  const node = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setTimeout(() => setIsOpen(!isOpen), 100)
  const disconnectWallet = useDisconnectWallet()
  const { chainId, account = '', walletKey } = useActiveWeb3React()
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()

  return (
    <Wrapper>
      <Image src={KyberPanelImage} alt="wallet ui kyberswap" />
      <BlurImage />
      <Content>
        <Flex justifyContent={'space-between'} fontWeight="500">
          <Flex alignItems={'center'} style={{ gap: 5 }} color={theme.subText}>
            {walletKey && (
              <img
                height={20}
                src={isDarkMode ? SUPPORTED_WALLETS[walletKey].icon : SUPPORTED_WALLETS[walletKey].iconLight}
                alt={SUPPORTED_WALLETS[walletKey].name + ' icon'}
              />
            )}
            {shortenAddress(chainId, account, 5)}
            <CopyHelper toCopy={account} />
            <ExternalLinkIcon href={getEtherscanLink(chainId, account, 'address')} color={theme.subText} />
          </Flex>

          <div ref={node} onClick={toggle}>
            <Settings size={25} cursor="pointer" />
            <MenuFlyout
              node={node}
              isOpen={isOpen}
              toggle={toggle}
              browserCustomStyle={customStyleMenu}
              mobileCustomStyle={customStyleMenu}
            >
              <Column>
                {chainId !== ChainId.ETHW && chainId !== ChainId.SOLANA && (
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
              </Column>
            </MenuFlyout>
          </div>
        </Flex>

        <Text color={theme.subText} fontWeight="500">
          <Trans>Current Balance</Trans>
        </Text>

        <Text
          fontSize={'36px'}
          fontWeight="500"
          style={{ height: 42, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          {totalBalanceInUsd !== null ? (
            `$${formatNumberWithPrecisionRange(totalBalanceInUsd, 0, 8)}`
          ) : (
            <Loader size="30px" />
          )}
        </Text>
      </Content>
    </Wrapper>
  )
}
