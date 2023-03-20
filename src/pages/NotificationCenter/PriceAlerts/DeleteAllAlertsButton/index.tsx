import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Trash, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useDeleteAllAlertsMutation } from 'services/priceAlert'
import styled from 'styled-components'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  margin: 0;
  padding: 24px 24px;
  width: 100%;
  display: flex;
  gap: 20px;
  flex-direction: column;
`

const CloseIcon = styled(X)`
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
`

// TODO: test disconnect wallet/change network while confirming
// TODO: clear based on which tab is active
const DeleteAllAlertsButton = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [isModalOpen, setModalOpen] = useState(false)
  const [deleteAll, result] = useDeleteAllAlertsMutation()
  const { isLoading } = result

  const handleClickDeleteAll = async () => {
    account && deleteAll(account)
  }

  const handleDismiss = () => {
    setModalOpen(false)
  }

  return (
    <>
      <ButtonEmpty
        style={{
          width: '80px',
          whiteSpace: 'nowrap',
          height: '24px',
          color: theme.red,
          padding: 0,
          gap: '4px',
        }}
        onClick={() => {
          setModalOpen(true)
        }}
        disabled={isLoading}
      >
        <Trash size="16px" /> <Trans>Clear All</Trans>
      </ButtonEmpty>

      <Modal isOpen={isModalOpen} onDismiss={handleDismiss} minHeight={false} maxWidth={400}>
        <Wrapper>
          <RowBetween>
            <Text fontSize={20} fontWeight={400}>
              <Trans>Delete All Alerts</Trans>
            </Text>
            <CloseIcon onClick={handleDismiss} />
          </RowBetween>

          <Text as="span" fontSize="14px" color={theme.subText}>
            <Trans>Are you sure you want to delete all your alerts?</Trans>
          </Text>

          <Flex
            sx={{
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <ButtonPrimary
              borderRadius="24px"
              height="36px"
              flex="1 1 100%"
              onClick={handleDismiss}
              disabled={isLoading}
            >
              <Trans>No, go back</Trans>
            </ButtonPrimary>

            <ButtonOutlined
              borderRadius="24px"
              height="36px"
              flex="1 1 100%"
              onClick={handleClickDeleteAll}
              disabled={isLoading}
            >
              <Trans>Delete All Alerts</Trans>
            </ButtonOutlined>
          </Flex>
        </Wrapper>
      </Modal>
    </>
  )
}

export default DeleteAllAlertsButton
