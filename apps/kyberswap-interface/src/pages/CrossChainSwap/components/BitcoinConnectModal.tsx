import dayjs from 'dayjs'
import { darken } from 'polished'
import { useEffect } from 'react'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import {
  CloseIcon,
  ContentWrapper,
  OptionGrid,
  TermAndCondition,
  UpperSection,
} from 'components/Header/web3/WalletModal'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { TERM_FILES_PATH } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { ExternalLink } from 'theme'

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const Option = styled.div<{ disabled?: boolean; selected?: boolean }>`
  height: 36px;
  width: 100%;
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: ${({ disabled, selected }) => (disabled || selected ? 'not-allowed' : 'pointer')};
  border-radius: 999px;
  background-color: ${({ theme, selected }) => darken(selected ? 0.1 : 0, theme.tableHeader)};

  &:hover {
    text-decoration: none;
    ${({ disabled }) =>
      disabled
        ? ''
        : css`
            background-color: ${({ theme }) => darken(0.1, theme.tableHeader)};
            color: ${({ theme }) => theme.text} !important;
          `}
  }
  ${({ disabled, theme }) =>
    disabled
      ? `
      filter: grayscale(100%);
      color: ${theme.border};
    `
      : ''}
`
const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`

export const BitcoinConnectModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()
  const theme = useTheme()

  const { walletInfo, availableWallets, connectingWallet, setConnectingWallet } = useBitcoinWallet()

  useEffect(() => {
    if (walletInfo.isConnected) {
      setConnectingWallet(null)
      onDismiss()
    }
  }, [walletInfo.isConnected, onDismiss, setConnectingWallet])

  if (walletInfo.isConnected) return null

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => {
        setConnectingWallet(null)
        onDismiss()
      }}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock={true}
      bypassFocusLock={true}
      zindex={99999}
    >
      <Wrapper>
        <UpperSection>
          <RowBetween marginBottom="26px" gap="20px">
            <Text fontSize="20px" fontWeight="500">
              Connect your Bitcoin Wallet
            </Text>
            <CloseIcon
              onClick={() => {
                setConnectingWallet(null)
                onDismiss()
              }}
            >
              <Close />
            </CloseIcon>
          </RowBetween>

          <TermAndCondition
            onClick={() => {
              setIsAcceptedTerm(!isAcceptedTerm)
            }}
          >
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              data-testid="accept-term"
              style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
            />
            <Text color={theme.subText}>
              Accept{' '}
              <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                KyberSwap&lsquo;s Terms of Use
              </ExternalLink>{' '}
              and{' '}
              <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                Privacy Policy
              </ExternalLink>
              {'. '}
              <Text fontSize={10} as="span">
                Last updated: {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}
              </Text>
            </Text>
          </TermAndCondition>

          <ContentWrapper>
            <OptionGrid>
              {availableWallets.map(wallet => {
                return (
                  <Option
                    role="button"
                    disabled={!isAcceptedTerm || (connectingWallet !== null && connectingWallet !== wallet.type)}
                    selected={connectingWallet === wallet.type}
                    key={wallet.type}
                    onClick={() => {
                      if (connectingWallet) return
                      wallet.connect()
                    }}
                  >
                    <Flex alignItems="center" width="100%" sx={{ gap: '8px' }}>
                      <img
                        src={wallet.logo}
                        alt=""
                        width={20}
                        height={20}
                        style={{
                          borderRadius: '50%',
                        }}
                      />
                      <HeaderText>{wallet.name}</HeaderText>
                      {connectingWallet === wallet.type && <Loader color={theme.white} />}
                    </Flex>
                    <Text color={theme.subText} fontSize={12} minWidth="max-content">
                      {wallet.isInstalled() && 'Detected'}
                    </Text>
                  </Option>
                )
              })}
            </OptionGrid>
          </ContentWrapper>
        </UpperSection>
      </Wrapper>
    </Modal>
  )
}
