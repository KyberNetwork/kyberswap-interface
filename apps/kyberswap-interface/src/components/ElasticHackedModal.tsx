import { Trans } from '@lingui/macro'
import { Info, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonOutlined } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

type Props = {
  isOpen: boolean
  onClose?: () => void
  onConfirm?: () => void
}

const ElasticHackedModal = ({ isOpen, onClose, onConfirm }: Props) => {
  const theme = useTheme()

  return (
    <Modal isOpen={isOpen} width="480px" maxWidth="unset">
      <Flex flexDirection="column" padding="20px" bg={theme.background}>
        <Flex justifyContent="flex-end">
          <StyledCloseIcon onClick={onClose} />
        </Flex>
        <Flex justifyContent="center">
          <Info color={theme.warning} size={64} />
        </Flex>
        <Text marginTop="20px" textAlign="center" fontSize="16px" fontWeight={500} lineHeight="24px">
          <Trans>Attention</Trans>
        </Text>
        <Text marginTop="8px" textAlign="center" fontSize={14} lineHeight="20px" color={theme.subText}>
          <Trans>
            Adding liquidity to Elastic Pools and staking in Elastic Farms is temporarily unavailable. Kindly visit
            &quot;My Pool&quot; for prompt removal of your liquidity.
          </Trans>
        </Text>

        <Flex sx={{ gap: '16px' }} marginTop="20px">
          <ButtonOutlined style={{ flex: 1, fontSize: '16px', padding: '10px' }} onClick={onClose}>
            <Trans>Close</Trans>
          </ButtonOutlined>
          <ButtonConfirmed style={{ fontSize: '16px', flex: 1, padding: '10px' }} onClick={onConfirm}>
            <Trans>Go to My Pool</Trans>
          </ButtonConfirmed>
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ElasticHackedModal
