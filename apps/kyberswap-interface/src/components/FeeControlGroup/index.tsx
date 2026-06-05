import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import CustomFeeInput from 'components/FeeControlGroup/CustomFeeInput'
import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { ClientNameMapping, DEFAULT_TIPS } from 'constants/index'
import { cn } from 'utils/cn'

const FeeControlGroup = () => {
  const { feeAmount, enableTip, clientId, clientName } = useGetFeeConfig() ?? {}
  const [searchParams, setSearchParams] = useSearchParams()
  const feeValue = Number.parseFloat(feeAmount ?? '0')
  const [isCustomActive, setIsCustomActive] = useState(!DEFAULT_TIPS.includes(feeValue))

  const handleFeeChange = (next: number) => {
    if (enableTip) {
      searchParams.set('feeAmount', next.toString())
      setSearchParams(searchParams)
    }
  }

  useEffect(() => {
    if (!DEFAULT_TIPS.includes(feeValue)) {
      setIsCustomActive(true)
    }
  }, [feeValue])

  if (!enableTip) {
    return null
  }

  const configuredClientName = clientName && clientName !== clientId ? clientName : ''
  const mappedClientName = ClientNameMapping[clientId || '']
  const tipRecipientName = configuredClientName || mappedClientName || 'the link sharer'
  const hasTipRecipientName = Boolean(configuredClientName || mappedClientName)

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-white-04 p-3">
      <p className="flex min-w-0 items-center text-xs font-medium text-subText">
        <span className="shrink-0">
          <Trans>
            No hidden fees! Your <span className="text-text">optional tips</span> support
          </Trans>
          &nbsp;
        </span>
        <span className={cn('min-w-0 truncate', hasTipRecipientName && 'text-text')}>{tipRecipientName}</span>
      </p>

      <div className="flex items-stretch rounded-[20px] border border-border bg-background">
        {DEFAULT_TIPS.map(tip => {
          const isActive = tip === feeValue && !isCustomActive
          return (
            <button
              type="button"
              key={tip}
              onClick={() => {
                setIsCustomActive(false)
                handleFeeChange(tip)
              }}
              className={cn(
                'h-7 min-w-0 flex-1 cursor-pointer rounded-full px-2 text-sm hover:bg-buttonGray',
                isActive ? 'bg-tabActive text-text ' : 'bg-transparent text-subText',
              )}
            >
              {tip ? `${tip / 100}%` : <Trans>No tip</Trans>}
            </button>
          )
        })}
        <CustomFeeInput
          value={feeValue}
          isActive={isCustomActive}
          onActiveChange={setIsCustomActive}
          onChange={handleFeeChange}
        />
      </div>
    </div>
  )
}

export default FeeControlGroup
