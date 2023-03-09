import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Trash, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useDeleteSingleAlertMutation } from 'services/priceAlert'
import styled from 'styled-components'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import AlertType from 'pages/NotificationCenter/PriceAlerts/AlertType'
import NetworkInlineDisplay from 'pages/NotificationCenter/PriceAlerts/NetworkInlineDisplay'
import TokenInlineDisplay from 'pages/NotificationCenter/PriceAlerts/TokenInlineDisplay'
import { PriceAlert } from 'pages/NotificationCenter/const'

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

const Container = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 24px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

// TODO: test disconnect wallet/change network while confirming

type Props = {
  alert: PriceAlert
}
const DeleteSingleAlertButton: React.FC<Props> = ({ alert }) => {
  const theme = useTheme()
  const [isModalOpen, setModalOpen] = useState(false)
  const [deleteSingleAlert, result] = useDeleteSingleAlertMutation()
  const { isLoading } = result

  const handleClickDeleteAll = async () => {
    deleteSingleAlert(alert.id)
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
        <Trash size="16px" /> <Trans>Delete</Trans>
      </ButtonEmpty>

      <Modal isOpen={isModalOpen} onDismiss={handleDismiss} minHeight={false} maxWidth={400}>
        <Wrapper>
          <RowBetween>
            <Text fontSize={20} fontWeight={400}>
              <Trans>Delete Alert</Trans>
            </Text>
            <CloseIcon onClick={handleDismiss} />
          </RowBetween>

          <Text as="span" fontSize="14px" color={theme.subText}>
            <Trans>Are you sure you want to delete this alert?</Trans>
          </Text>

          <Container>
            <Flex
              sx={{
                flex: '1 1 fit-content',
                alignItems: 'center',
                fontSize: '14px',
                color: theme.subText,
                columnGap: '6px',
                flexWrap: 'wrap',
                lineHeight: '20px',
              }}
            >
              <Trans>Alert when the price of</Trans>
              <TokenInlineDisplay
                symbol={alert.tokenInSymbol}
                logoUrl={alert.tokenInLogoURL}
                amount={alert.tokenInAmount}
              />
              <Trans>to</Trans>
              <TokenInlineDisplay symbol={alert.tokenOutSymbol} logoUrl={alert.tokenOutLogoURL} />
              <Trans>on</Trans>
              <NetworkInlineDisplay chainId={ChainId.AVAXMAINNET} />
              <Trans>goes</Trans> <AlertType type={alert.type} />
              <Flex
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexWrap: 'nowrap',
                  gap: '4px',
                }}
              >
                <TokenInlineDisplay symbol={alert.tokenOutSymbol} amount={alert.threshold} />
                <Trans>per token</Trans>
              </Flex>
            </Flex>

            {alert.note ? (
              <Text
                as="span"
                sx={{
                  fontSize: '12px',
                  overflowWrap: 'break-word',
                  lineHeight: '16px',
                  color: theme.subText,
                }}
              >
                <Trans>Note</Trans>:{' '}
                <Text
                  as="span"
                  sx={{
                    overflowWrap: 'break-word',
                    color: theme.text,
                    fontWeight: 500,
                  }}
                >
                  {alert.note}
                </Text>
              </Text>
            ) : null}
          </Container>

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
              <Trans>Delete</Trans>
            </ButtonOutlined>
          </Flex>
        </Wrapper>
      </Modal>
    </>
  )
}

export default DeleteSingleAlertButton
