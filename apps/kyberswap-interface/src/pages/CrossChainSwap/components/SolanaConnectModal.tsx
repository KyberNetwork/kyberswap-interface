import { t } from '@lingui/macro'
import { Adapter, WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { Text } from 'rebass'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { ContentWrapper, OptionGrid } from 'components/Header/web3/WalletModal'
import { HeaderText, IconWrapper, OptionCardClickable, OptionCardLeft } from 'components/Header/web3/WalletModal/Option'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { TERM_FILES_PATH } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { CloseIcon, TermAndCondition, UpperSection, Wrapper } from 'pages/CrossChainSwap/components/TermAndPolicy'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { ExternalLink } from 'theme'

const SolanaConnectModal = () => {
  const { isOpen, setIsOpen } = useSolanaConnectModal()
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()
  const theme = useTheme()

  const adaptersWithStandardAdapters = useStandardWalletAdapters([])

  const listedWallets = useMemo(
    () =>
      adaptersWithStandardAdapters.filter(
        adapter => adapter.readyState === WalletReadyState.Installed && adapter.name !== 'HOT Wallet',
      ),
    [adaptersWithStandardAdapters],
  )

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen])

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleClose}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock
      bypassFocusLock
      zindex={99999}
    >
      <Wrapper>
        <UpperSection>
          <RowBetween marginBottom="26px" gap="20px">
            <Text>{t`Connect your Wallet`}</Text>
            <CloseIcon onClick={handleClose}>
              <Close />
            </CloseIcon>
          </RowBetween>
          <TermAndCondition onClick={() => setIsAcceptedTerm(!isAcceptedTerm)}>
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              onChange={() => {}}
              data-testid="accept-term"
              style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
            />
            <Text color={theme.subText}>
              <span>{t`Accept`}</span>{' '}
              <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                <span>{t`KyberSwap's Terms of Use`}</span>
              </ExternalLink>{' '}
              <span>{t`and`}</span>{' '}
              <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                <span>{t`Privacy Policy`}</span>
              </ExternalLink>
              {'. '}
              <Text fontSize={10} as="span">
                {t`Last updated:`} {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}
              </Text>
            </Text>
          </TermAndCondition>
          <ContentWrapper>
            <OptionGrid>
              {listedWallets.map(w => (
                <Option key={w.name} wallet={w} onCloseModal={handleClose} />
              ))}
            </OptionGrid>
          </ContentWrapper>
        </UpperSection>
      </Wrapper>
    </Modal>
  )
}

const Option = ({ wallet, onCloseModal }: { wallet: Adapter; onCloseModal: () => void }) => {
  const [isAcceptedTerm] = useIsAcceptedTerm()
  const { select } = useWallet()

  const { name, icon } = wallet

  const content = (
    <OptionCardClickable
      role="button"
      id={`solana-connect-${name}`}
      onClick={() => {
        if (isAcceptedTerm) {
          select(name)
          onCloseModal()
        }
      }}
      connected={false}
      isDisabled={!isAcceptedTerm}
    >
      <IconWrapper>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText>{name}</HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )

  return content
}

export default SolanaConnectModal
