import { Trans } from '@lingui/macro'
import { useState } from 'react'

import { ButtonOutlined, ButtonWarning } from 'components/Button'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDegenModeManager } from 'state/user/hooks'
import { CloseIcon } from 'theme/components'

function AdvanceModeModal({ show, setShow }: { show: boolean; setShow: (v: boolean) => void }) {
  const [, toggleDegenMode] = useDegenModeManager()
  const [confirmText, setConfirmText] = useState('')
  const { trackingHandler } = useTracking()

  const handleConfirm = () => {
    if (confirmText.trim().toLowerCase() === 'confirm') {
      trackingHandler(TRACKING_EVENT_TYPE.DEGEN_MODE_TOGGLE, {
        type: 'on',
      })
      toggleDegenMode()
      setConfirmText('')
      setShow(false)
    }
  }

  return (
    <Modal
      isOpen={show}
      onDismiss={() => {
        setConfirmText('')
        setShow(false)
      }}
      maxHeight={100}
      width="480px"
      maxWidth="unset"
    >
      <Stack className="w-full gap-6 bg-tableHeader p-5">
        <HStack className="items-center justify-between">
          <span className="text-xl font-medium text-text">
            <Trans>Are you sure?</Trans>
          </span>

          <CloseIcon onClick={() => setShow(false)} />
        </HStack>

        <Stack className="gap-4">
          <p className="m-0 text-sm font-medium text-subText">
            <Trans>
              Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
              result in bad rates and loss of funds. Be cautious.
            </Trans>
          </p>

          <p className="m-0 text-sm font-normal text-text">
            <Trans>
              Please type the word <span className="font-medium text-warning">Confirm</span> below to enable Degen Mode
            </Trans>
          </p>

          <input
            className="rounded-full border-none bg-buttonBlack px-4 py-2 text-sm font-medium text-text outline-none placeholder:text-disableText"
            placeholder="Confirm"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            onKeyUp={e => {
              if (e.key === 'Enter') {
                handleConfirm()
              }
            }}
          />
        </Stack>

        <HStack className="justify-center gap-4">
          <ButtonOutlined
            className="flex-1 p-2.5 text-sm"
            onClick={() => {
              setConfirmText('')
              setShow(false)
            }}
          >
            <Trans>No, go back</Trans>
          </ButtonOutlined>
          <ButtonWarning
            disabled={confirmText.trim().toLowerCase() !== 'confirm'}
            className="flex-1 p-2.5 text-sm"
            onClick={handleConfirm}
          >
            <Trans>Confirm</Trans>
          </ButtonWarning>
        </HStack>
      </Stack>
    </Modal>
  )
}

export default AdvanceModeModal
