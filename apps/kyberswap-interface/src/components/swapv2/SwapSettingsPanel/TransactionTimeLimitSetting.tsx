import { Trans } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'

import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
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

  useOnClickOutside(inputRef, () => handleCommitChange())

  useEffect(() => {
    setDeadlineInput(String(Math.floor(deadline / 60)))
  }, [deadline])

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center">
        <TextDashed fontSize={12} fontWeight={400} className="text-subText">
          <MouseoverTooltip
            text={
              <span>
                <Trans>Transaction will revert if it is pending for longer than the indicated time.</Trans>
              </span>
            }
            placement="right"
          >
            <Trans>Transaction time limit</Trans>
          </MouseoverTooltip>
        </TextDashed>
      </div>

      <div className="flex h-7 items-center gap-x-0.5 rounded-[40px] bg-tabBackground px-2 text-xs font-medium leading-4">
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
    </div>
  )
}

export default TransactionTimeLimitSetting
