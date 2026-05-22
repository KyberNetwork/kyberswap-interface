import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { Dispatch, SetStateAction, useState } from 'react'
import { X } from 'react-feather'

import { ButtonErrorStyle, ButtonOutlined } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'

export default function SwapModalAreYouSure({
  show,
  setShow,
  setHasAcceptedNewAmount,
  parsedAmountOut,
  parsedAmountOutFromBuild,
  formattedOutputChangePercent,
}: {
  show: boolean
  setShow: Dispatch<SetStateAction<boolean>>
  setHasAcceptedNewAmount: Dispatch<SetStateAction<boolean>>
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  parsedAmountOutFromBuild: CurrencyAmount<Currency> | undefined
  formattedOutputChangePercent: string
}) {
  const [confirmText, setConfirmText] = useState('')

  const handleConfirm = () => {
    if (confirmText.trim().toLowerCase() === 'confirm') {
      setHasAcceptedNewAmount(true)
      setConfirmText('')
      setShow(false)
    }
  }

  const theme = useTheme()

  return (
    <Modal
      isOpen={show}
      onDismiss={() => {
        setConfirmText('')
        setShow(false)
      }}
      maxHeight={100}
    >
      <div className="flex w-full flex-col bg-tableHeader p-6 pb-7">
        <div className="flex items-center justify-between">
          <span className="text-xl font-medium">
            <Trans>Are you sure?</Trans>
          </span>

          <X color={theme.text} className="size-7 cursor-pointer" onClick={() => setShow(false)} />
        </div>

        <span className="mt-7 text-sm">
          <Trans>
            Due to market conditions, your output has been updated from {parsedAmountOut?.toSignificant(10)}{' '}
            {parsedAmountOut?.currency?.symbol} to {parsedAmountOutFromBuild?.toSignificant(10)}{' '}
            {parsedAmountOut?.currency?.symbol} ({formattedOutputChangePercent}%).
          </Trans>
        </span>

        <span className="mt-7 text-sm">
          <Trans>
            If you&apos;re okay with this, please type the word &apos;confirm&apos; below to accept this new amount.
          </Trans>
        </span>

        <input
          placeholder="confirm"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          onKeyUp={e => {
            if (e.key === 'Enter') {
              handleConfirm()
            }
          }}
          className="mt-6 rounded-full border-0 bg-buttonBlack px-4 py-2 text-base text-text outline-none placeholder:text-disableText"
        />
        <div className="mt-7 flex justify-center gap-4">
          <ButtonOutlined
            style={{
              flex: 1,
              fontSize: '14px',
              padding: '10px',
            }}
            onClick={() => {
              setConfirmText('')
              setShow(false)
            }}
          >
            <Trans>No, go back</Trans>
          </ButtonOutlined>
          <ButtonErrorStyle
            disabled={confirmText.trim().toLowerCase() !== 'confirm'}
            style={{ fontSize: '14px', flex: 1, padding: '10px' }}
            onClick={handleConfirm}
          >
            <Trans>Confirm</Trans>
          </ButtonErrorStyle>
        </div>
      </div>
    </Modal>
  )
}
