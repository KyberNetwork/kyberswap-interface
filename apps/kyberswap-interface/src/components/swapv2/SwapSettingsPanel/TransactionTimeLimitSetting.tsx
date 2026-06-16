import { Trans } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'

import { SettingsLabel, SettingsRow } from 'components/swapv2/SwapSettingsPanel/components'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useUserTransactionTTL } from 'state/user/hooks'
import { cn } from 'utils/cn'

type Props = {
  className?: string
}

const validateDeadlineString = (str: string): boolean => {
  const value = Number.parseInt(str, 10)

  if (str.length > '10000'.length) {
    return false
  }

  if (Number.isNaN(value) || String(Math.floor(value)) !== str) {
    return false
  }

  if (0 < value && value < 10000) {
    return true
  }

  return false
}

const TransactionTimeLimitSetting: React.FC<Props> = ({ className }) => {
  const { trackingHandler } = useTracking()

  const [deadline, setDeadline] = useUserTransactionTTL()
  const [deadlineInput, setDeadlineInput] = useState(String(Math.floor(deadline / 60)))
  const inputRef = useRef<HTMLInputElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)

  const isValid = validateDeadlineString(deadlineInput)

  const handleCommitChange = () => {
    if (!validateDeadlineString(deadlineInput)) {
      return
    }

    const newDeadline = parseInt(deadlineInput, 10) * 60
    if (newDeadline !== deadline) {
      trackingHandler(TRACKING_EVENT_TYPE.TRANSACTION_TIME_LIMIT_CHANGED, {
        previous_value: deadline / 60,
        new_value: newDeadline / 60,
      })
    }
    setDeadline(newDeadline)
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitChange()
      inputRef.current?.blur()
    }
  }

  const handleWrapperMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== inputRef.current) {
      e.preventDefault()
      inputRef.current?.focus()
    }
  }

  useOnClickOutside(inputWrapperRef, () => handleCommitChange())

  useEffect(() => {
    setDeadlineInput(String(Math.floor(deadline / 60)))
  }, [deadline])

  return (
    <SettingsRow className={className}>
      <SettingsLabel
        tooltip={
          <span>
            <Trans>Transaction will revert if it is pending for longer than the indicated time.</Trans>
          </span>
        }
      >
        <Trans>Transaction time limit</Trans>
      </SettingsLabel>

      <div
        ref={inputWrapperRef}
        className="flex h-7 cursor-text items-center gap-x-0.5 rounded-full border border-transparent bg-tabBackground px-2 text-xs font-medium transition-colors focus-within:border-border hover:border-border"
        onMouseDown={handleWrapperMouseDown}
      >
        <div className="w-[60px]">
          <input
            ref={inputRef}
            placeholder={String(deadline / 60)}
            value={deadlineInput}
            onChange={e => setDeadlineInput(e.target.value)}
            onBlur={handleCommitChange}
            onKeyUp={handleKeyUp}
            className={cn(
              'w-full border-0 bg-transparent text-right text-xs font-medium outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              isValid ? 'text-text' : 'text-red1',
            )}
          />
        </div>
        <span className="text-xs font-medium leading-4">
          <Trans>mins</Trans>
        </span>
      </div>
    </SettingsRow>
  )
}

export default TransactionTimeLimitSetting
