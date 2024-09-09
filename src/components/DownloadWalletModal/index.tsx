import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { X } from 'react-feather'
import { Image, Text } from 'rebass'
import styled from 'styled-components'

import bloctoIcon from 'assets/wallets-connect/bocto.svg'
import braveIcon from 'assets/wallets-connect/brave.svg'
import coin98Icon from 'assets/wallets-connect/coin98.svg'
import coinbaseIcon from 'assets/wallets-connect/coinbase.svg'
import krystalIcon from 'assets/wallets-connect/krystal.svg'
import metaMaskIcon from 'assets/wallets-connect/metamask.svg'
import rabbyIcon from 'assets/wallets-connect/rabby.svg'
import safeIcon from 'assets/wallets-connect/safe.svg'
import trustWalletIcon from 'assets/wallets-connect/trust-wallet.svg'
import zerionIcon from 'assets/wallets-connect/zerion.svg'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen } from 'state/application/hooks'
import { ButtonText } from 'theme'

const DownloadWalletRow = styled.a`
  display: flex;
  gap: 8px;
  border-radius: 999px;
  padding: 12px 16px;
  color: ${({ theme }) => theme.subText};
  font-size: 16px;
  font-weight: 500;
  background: ${({ theme }) => theme.buttonBlack};
  line-height: 24px;
  text-decoration: none;

  flex-basis: calc((100% - 20px) / 2); // 20px gap
  min-width: 170px;
  box-sizing: border-box;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-basis: 100%;
  `}

  :hover {
    background: ${({ theme }) => rgba(theme.buttonBlack, 0.6)};
  }
`

const wallets = [
  {
    name: 'Krystal',
    icon: krystalIcon,
    installLink: 'https://wallet.krystal.app',
  },

  {
    name: 'Rabby',
    icon: rabbyIcon,
    installLink: 'https://rabby.io',
  },

  {
    name: 'Zerion',
    icon: zerionIcon,
    installLink: 'https://zerion.io',
  },

  {
    name: 'Trust Wallet',
    icon: trustWalletIcon,
    installLink: 'https://trustwallet.com/vi/deeplink',
  },

  {
    name: 'Brave Wallet',
    icon: braveIcon,
    installLink: 'https://brave.com/download',
  },

  { name: 'Safe Wallet', icon: safeIcon, installLink: 'https://safe.global/wallet' },

  { name: 'Coinbase', icon: coinbaseIcon, installLink: 'https://www.coinbase.com/wallet' },
  { name: 'Coin98', icon: coin98Icon, installLink: 'https://wallet.coin98.com/' },
  { name: 'Blocto', icon: bloctoIcon, installLink: 'https://blocto.io/download' },
  {
    name: 'MetaMask',
    icon: metaMaskIcon,
    installLink: 'https://metamask.io/download',
  },
]

export default function DownloadWalletModal() {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.DOWNLOAD_WALLET)
  const closeModal = useCloseModal(ApplicationModal.DOWNLOAD_WALLET)
  return (
    <Modal isOpen={isOpen} onDismiss={closeModal} maxWidth="600px">
      <Column width="100%" padding="30px 24px" overflowY="scroll">
        <RowBetween>
          <Text fontSize="20px" fontWeight="500">
            <Trans>Download a Wallet</Trans>
          </Text>

          <ButtonText onClick={closeModal} style={{ lineHeight: 0 }}>
            <X size={24} color={theme.text} />
          </ButtonText>
        </RowBetween>

        <Row gap="20px" marginTop="24px" flexWrap="wrap">
          {wallets
            .filter(e => e.installLink)
            .map(item => (
              <DownloadWalletRow
                key={item.installLink}
                href={item.installLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image width="24px" maxHeight="24px" src={item.icon} />
                {item.name}
              </DownloadWalletRow>
            ))}
        </Row>
      </Column>
    </Modal>
  )
}
