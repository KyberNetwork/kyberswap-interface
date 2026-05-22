import { Trans } from '@lingui/macro'
import { useCallback } from 'react'
import { isMobile } from 'react-device-detect'
import { useSelector } from 'react-redux'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ModalCenter } from 'components/Modal'
import { RowBetween } from 'components/Row'
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
  const dispatch = useAppDispatch()

  const handleDismiss = () => {
    dispatch(setConfirmData(initialStateConfirmModal))
  }

  return (
    <ModalCenter isOpen={isOpen} minHeight={false} maxWidth={isMobile ? '95vw' : 400}>
      <div className="m-0 flex w-full flex-col gap-5 p-6">
        <RowBetween>
          <span className="text-xl font-normal">{title || <Trans>Notification</Trans>}</span>
        </RowBetween>

        <span className="text-sm text-subText">{content}</span>

        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </ModalCenter>
  )
}

export default ModalConfirm
