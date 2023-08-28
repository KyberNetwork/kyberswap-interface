import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { X } from 'react-feather'
import { Flex, Image, Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen } from 'state/application/hooks'
import { useDarkModeManager } from 'state/user/hooks'
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
  width: calc(50% - 10px);
  :hover {
    background: ${({ theme }) => rgba(theme.buttonBlack, 0.6)};
  }
`

export default function DownloadWalletModal() {
  const theme = useTheme()
  const [isDarkMode] = useDarkModeManager()
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
          {Object.values(SUPPORTED_WALLETS)
            .filter(e => e.installLink)
            .map(item => (
              <DownloadWalletRow
                key={item.installLink}
                href={item.installLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image width="24px" src={isDarkMode ? item.icon : item.iconLight} />
                {item.name}
              </DownloadWalletRow>
            ))}
        </Row>
      </Column>
    </Modal>
  )
}
