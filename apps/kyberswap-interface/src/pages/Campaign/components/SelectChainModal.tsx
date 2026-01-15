import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { CloseIcon } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'

const Option = styled(Flex)`
  padding: 14px;
  border-radius: 10px;
  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

export const SelectChainModal = ({
  showSelect,
  connect,
  setShowSelect,
  logo,
}: {
  showSelect: boolean
  connect: Record<string, () => void>
  setShowSelect: (show: boolean) => void
  logo: Record<string, string>
}) => {
  return (
    <Modal
      isOpen={showSelect}
      onDismiss={() => setShowSelect(false)}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock={true}
      bypassFocusLock={true}
      zindex={99999}
      width="240px"
    >
      <Flex width="100%" flexDirection="column" padding="24px">
        <RowBetween gap="20px" mb="24px">
          <Text fontSize="20px" fontWeight="500">
            <Trans>Select chain</Trans>
          </Text>
          <CloseIcon
            onClick={() => {
              setShowSelect(false)
            }}
          >
            <Close />
          </CloseIcon>
        </RowBetween>

        {Object.keys(logo).map(walletType => (
          <Option
            key={walletType}
            alignItems="center"
            sx={{ gap: '8px', cursor: 'pointer' }}
            role="button"
            fontWeight="500"
            onClick={() => {
              setShowSelect(false)
              connect[walletType]()
            }}
          >
            <img src={logo[walletType]} width={20} height={20} alt="" style={{ borderRadius: '50%' }} />
            <Text>{walletType}</Text>
          </Option>
        ))}
      </Flex>
    </Modal>
  )
}
