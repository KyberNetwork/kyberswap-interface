import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { Dispatch, SetStateAction, useState } from 'react'

import { ButtonErrorStyle, ButtonOutlined } from 'components/Button'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { CloseIcon } from 'theme/components'

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
          <span className="text-sm font-medium text-subText">
            <Trans>
              Due to market conditions, your output has been updated from {parsedAmountOut?.toSignificant(10)}{' '}
              {parsedAmountOut?.currency?.symbol} to {parsedAmountOutFromBuild?.toSignificant(10)}{' '}
              {parsedAmountOut?.currency?.symbol} ({formattedOutputChangePercent}%).
            </Trans>
          </span>

          <span className="text-sm font-normal text-text">
            <Trans>
              Please type the word <span className="font-medium text-warning">Confirm</span> below to accept this new
              amount.
            </Trans>
          </span>

          <input
            placeholder="Confirm"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            onKeyUp={e => {
              if (e.key === 'Enter') {
                handleConfirm()
              }
            }}
            className="rounded-full border-none bg-buttonBlack px-4 py-2 text-sm font-medium text-text outline-none placeholder:text-disableText"
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
          <ButtonErrorStyle
            disabled={confirmText.trim().toLowerCase() !== 'confirm'}
            className="flex-1 p-2.5 text-sm"
            onClick={handleConfirm}
          >
            <Trans>Confirm</Trans>
          </ButtonErrorStyle>
        </HStack>
      </Stack>
    </Modal>
  )
}
