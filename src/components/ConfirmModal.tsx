import { Trans } from '@lingui/macro'
import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { setConfirmData } from 'state/application/actions'
import { ConfirmModalState, initialStateConfirmModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

const Wrapper = styled.div`
  margin: 0;
  padding: 24px 24px;
  width: 100%;
  display: flex;
  gap: 20px;
  flex-direction: column;
`

const useShowConfirm = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (data: ConfirmModalState) => {
      dispatch(setConfirmData(data))
    },
    [dispatch],
  )
}

const ModalConfirm: React.FC = () => {
  const { isOpen, onCancel, onConfirm, cancelText, confirmText } = useSelector(
    (state: AppState) => state.application.confirmModal,
  )
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const showConfirm = useShowConfirm()
  useEffect(() => {
    window.showConfirm = showConfirm
  }, [showConfirm])

  const handleDismiss = () => {
    dispatch(setConfirmData(initialStateConfirmModal))
  }

  return (
    <Modal isOpen={isOpen} minHeight={false} maxWidth={400}>
      <Wrapper>
        <RowBetween>
          <Text fontSize={20} fontWeight={400}>
            <Trans>Notification</Trans>
          </Text>
        </RowBetween>

        <Text as="span" fontSize="14px" color={theme.subText}>
          <Trans>Your session is expire, Sign-in to continue?</Trans>
        </Text>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {onCancel && (
            <ButtonOutlined
              borderRadius="24px"
              height="36px"
              flex="1 1 100%"
              onClick={() => {
                onCancel?.()
                handleDismiss()
              }}
            >
              {cancelText || <Trans>Cancel</Trans>}
            </ButtonOutlined>
          )}

          <ButtonPrimary
            borderRadius="24px"
            height="36px"
            flex="1 1 100%"
            onClick={() => {
              onConfirm?.()
              handleDismiss()
            }}
          >
            {confirmText || <Trans>Confirm</Trans>}
          </ButtonPrimary>
        </Flex>
      </Wrapper>
    </Modal>
  )
}

export default ModalConfirm
