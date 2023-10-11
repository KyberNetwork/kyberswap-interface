import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { X } from 'react-feather'
import { Image, Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { connections } from 'constants/wallets'
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
          {Object.values(connections)
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
