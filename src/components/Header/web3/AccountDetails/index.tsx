import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { LogOut } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import CopyHelper from 'components/Copy'
import { RowBetween, RowFit } from 'components/Row'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useDisconnectWallet from 'hooks/useDisconnectWallet'
import useENSName from 'hooks/useENSName'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { ButtonText } from 'theme'
import { shortenAddress } from 'utils'

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  font-weight: 500;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const AccountGroupingRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  justify-content: space-between;
  align-items: center;
  font-weight: 400;
  color: ${({ theme }) => theme.text};

  div {
    ${({ theme }) => theme.flexRowNoWrap}
    align-items: center;
  }
`

const YourAccount = styled.div`
  padding: 16px 12px;
  border-radius: 16px;
  background: ${({ theme }) => theme.buttonBlack};
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 8px;
`

const AccountControl = styled.div`
  display: flex;
  justify-content: space-between;
  min-width: 0;
  width: 100%;

  font-weight: 500;
  font-size: 14px;

  a:hover {
    text-decoration: underline;
  }

  p {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const CloseIcon = styled.div`
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text};
  }
`

const WalletName = styled.div`
  width: initial;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

interface AccountDetailsProps {
  toggleWalletModal: () => void
  openOptions: () => void
}

export default function AccountDetails({ toggleWalletModal, openOptions }: AccountDetailsProps) {
  const { chainId, account, walletKey, isEVM } = useActiveWeb3React()
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()
  const { ENSName } = useENSName(isEVM ? account ?? undefined : undefined)

  function formatConnectorName(): JSX.Element | null {
    if (!walletKey) {
      console.error('Cannot find the wallet connected')
      return null
    }

    return (
      <WalletName>
        <Trans>Connected with {SUPPORTED_WALLETS[walletKey].name}</Trans>
      </WalletName>
    )
  }

  const handleDisconnect = useDisconnectWallet()

  return (
    <UpperSection>
      <HeaderRow>
        <Trans>Your Account</Trans>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
      </HeaderRow>

      <Flex flexDirection="column" marginY="8px" paddingX="20px">
        <RowBetween>
          <Text>{formatConnectorName()}</Text>
          <ButtonText onClick={handleDisconnect}>
            <RowFit color={theme.subText} gap="4px">
              <LogOut size={16} />{' '}
              <Text fontSize={14}>
                <Trans>Disconnect</Trans>
              </Text>
            </RowFit>
          </ButtonText>
        </RowBetween>
        <YourAccount>
          <AccountGroupingRow id="web3-account-identifier-row">
            <AccountControl>
              <div>
                {walletKey && (
                  <IconWrapper size={16}>
                    <img
                      src={isDarkMode ? SUPPORTED_WALLETS[walletKey].icon : SUPPORTED_WALLETS[walletKey].iconLight}
                      alt={SUPPORTED_WALLETS[walletKey].name + ' icon'}
                    />
                  </IconWrapper>
                )}

                <p> {ENSName || (isMobile && account ? shortenAddress(chainId, account, 10) : account)}</p>
              </div>
            </AccountControl>
          </AccountGroupingRow>

          <CopyHelper toCopy={account || ''} />
        </YourAccount>
      </Flex>
    </UpperSection>
  )
}
