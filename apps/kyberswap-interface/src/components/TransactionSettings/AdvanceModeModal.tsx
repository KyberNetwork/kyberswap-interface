import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'

import { ButtonOutlined, ButtonWarning } from 'components/Button'
import Modal from 'components/Modal'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDegenModeManager } from 'state/user/hooks'

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
      <div className="flex w-full flex-col bg-tableHeader p-5">
        <div className="flex items-center justify-between">
          <span className="text-xl font-medium leading-6 text-text">
            <Trans>Are you sure?</Trans>
          </span>

          <X onClick={() => setShow(false)} className="size-6 cursor-pointer text-text [&>*]:stroke-current" />
        </div>

        <p className="m-0 mt-6 text-sm font-medium leading-5 text-subText">
          <Trans>
            Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
            result in bad rates and loss of funds. Be cautious.
          </Trans>
        </p>

        <p className="m-0 mt-6 text-sm font-normal leading-6 text-text">
          <Trans>
            Please type the word <span className="cursor-not-allowed select-none text-warning">Confirm</span> below to
            enable Degen Mode
          </Trans>
        </p>

        <input
          className="mt-6 rounded-full border-none bg-buttonBlack px-4 py-2 text-sm font-medium leading-5 text-text outline-none placeholder:text-disableText"
          placeholder="Confirm"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          onKeyUp={e => {
            if (e.key === 'Enter') {
              handleConfirm()
            }
          }}
        />

        <div className="mt-6 flex justify-center gap-4">
          <ButtonOutlined
            className="flex-1 p-2.5 text-base"
            onClick={() => {
              setConfirmText('')
              setShow(false)
            }}
          >
            <Trans>No, go back</Trans>
          </ButtonOutlined>
          <ButtonWarning
            disabled={confirmText.trim().toLowerCase() !== 'confirm'}
            className="flex-1 p-2.5 text-base"
            onClick={handleConfirm}
          >
            <Trans>Confirm</Trans>
          </ButtonWarning>
        </div>
      </div>
    </Modal>
  )
}

export default AdvanceModeModal
