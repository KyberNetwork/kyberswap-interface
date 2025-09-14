import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import { InfoHelperWithDelay } from 'components/InfoHelper'
import Modal from 'components/Modal'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import { Badge, BadgeType, ChainImage, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { Wrapper } from 'pages/Earns/components/ClaimModal/styles'
import { ParsedPosition } from 'pages/Earns/types'

const Content = styled.div`
  display: flex;
  flex-direction: row;
`

export const SmartExit = ({
  isOpen,
  onDismiss,
  position,
}: {
  isOpen: boolean
  onDismiss: () => void
  position: ParsedPosition
}) => {
  const theme = useTheme()
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} width="100vw" maxWidth="800px">
      <Flex width="100%" flexDirection="column" padding="20px">
        <Flex justifyContent="space-between" alignItems="center" mb="16px">
          <Text fontSize={20} fontWeight={500}>
            <Trans>Set Up Smart Exit</Trans>
          </Text>
          <X onClick={onDismiss} />
        </Flex>

        <PositionDetailHeader
          style={{ flexDirection: 'row' }}
          position={position}
          showBackIcon={false}
          isLoading={false}
          initialLoading={false}
          rightComponent={<div>menu</div>}
        />
      </Flex>
    </Modal>
  )
}
