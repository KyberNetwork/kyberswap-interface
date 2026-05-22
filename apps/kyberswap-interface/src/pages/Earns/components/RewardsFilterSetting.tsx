import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'

import ClaimThresholdControl from 'components/ClaimThresholdControl'
import { formatThresholdValue } from 'components/ClaimThresholdControl/CustomClaimThresholdInput'
import { cn } from 'utils/cn'

import PositionStatusControl, { POSITION_STATUS_OPTIONS, PositionStatus } from './PositionStatusControl'

type Props = {
  thresholdValue?: number
  positionStatus?: PositionStatus
  onThresholdChange?: (value: number) => void
  onPositionStatusChange?: (value: PositionStatus) => void
}

export const RewardsFilterSetting = ({
  thresholdValue,
  positionStatus,
  onThresholdChange,
  onPositionStatusChange,
}: Props) => {
  const [thresholdExpanded, setThresholdExpanded] = useState(false)
  const [statusExpanded, setStatusExpanded] = useState(false)

  const thresholdDisplayValue = formatThresholdValue(thresholdValue)
  const isExpanded = statusExpanded || thresholdExpanded
  const expandedHeight = statusExpanded ? 48 : thresholdExpanded ? 90 : 0

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex cursor-pointer items-center gap-1"
          onClick={() => {
            setStatusExpanded(val => {
              const next = !val
              if (next) setThresholdExpanded(false)
              return next
            })
          }}
        >
          <span className="text-sm text-subText">
            <Trans>Position Status</Trans>
          </span>
          <span className="text-sm text-text">
            {POSITION_STATUS_OPTIONS.find(option => option.value === positionStatus)?.label || ''}
          </span>
          <div
            data-flip={statusExpanded}
            className="h-4 text-subText transition-all duration-200 ease-in-out data-[flip=true]:rotate-180"
          >
            <ChevronDown width={16} height={16} />
          </div>
        </div>

        <div
          className="flex cursor-pointer items-center gap-1"
          onClick={() => {
            setThresholdExpanded(prev => {
              const next = !prev
              if (next) setStatusExpanded(false)
              return next
            })
          }}
        >
          <span className="text-sm text-subText">
            <Trans>Claim threshold</Trans>
          </span>
          <span className="text-sm text-text">{thresholdDisplayValue}</span>
          <div
            data-flip={thresholdExpanded}
            className="h-4 text-subText transition-all duration-200 ease-in-out data-[flip=true]:rotate-180"
          >
            <ChevronDown width={16} height={16} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 overflow-hidden transition-[height,padding] duration-200 ease-in-out',
          isExpanded ? 'pt-3 max-sm:min-h-fit' : 'pt-0',
        )}
        style={{ height: isExpanded ? `${expandedHeight}px` : '0' }}
      >
        {statusExpanded && <PositionStatusControl value={positionStatus} onChange={onPositionStatusChange} />}
        {thresholdExpanded && (
          <>
            <span className="text-xs text-subText">
              <Trans>
                Only position with rewards above this estimated value will be included in the claim. Others will remain
                unclaimed.
              </Trans>
            </span>
            <ClaimThresholdControl value={thresholdValue} onChange={onThresholdChange} />
          </>
        )}
      </div>
    </div>
  )
}
