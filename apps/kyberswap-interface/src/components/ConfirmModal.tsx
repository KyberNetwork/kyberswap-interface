import { Trans } from '@lingui/macro'
import { useCallback } from 'react'
import { isMobile } from 'react-device-detect'
import { useSelector } from 'react-redux'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ModalCenter } from 'components/Modal'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { setConfirmData } from 'state/application/actions'
import { ConfirmModalState, initialStateConfirmModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

export const useShowConfirm = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (data: ConfirmModalState) => {
      dispatch(setConfirmData(data))
    },
    [dispatch],
  )
}

const ModalConfirm: React.FC = () => {
  const { isOpen, onCancel, onConfirm, cancelText, confirmText, content, title } = useSelector(
    (state: AppState) => state.application.confirmModal,
  )
  const theme = useTheme()
  const dispatch = useAppDispatch()

  const handleDismiss = () => {
    dispatch(setConfirmData(initialStateConfirmModal))
  }

  return (
    <ModalCenter isOpen={isOpen} minHeight={false} maxWidth={isMobile ? '95vw' : 400}>
      <div className="m-0 flex w-full flex-col gap-5 p-6">
        <RowBetween>
          <Text fontSize={20} fontWeight={400}>
            {title || <Trans>Notification</Trans>}
          </Text>
        </RowBetween>

        <Text as="span" fontSize="14px" color={theme.subText}>
          {content}
        </Text>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {cancelText && (
            <ButtonOutlined
              borderRadius="24px"
              height="36px"
              flex="1 1 100%"
              onClick={() => {
                onCancel?.()
                handleDismiss()
              }}
            >
              {cancelText}
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
      </div>
    </ModalCenter>
  )
}

export default ModalConfirm
