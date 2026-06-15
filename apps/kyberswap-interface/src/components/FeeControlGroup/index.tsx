import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import CustomFeeInput from 'components/FeeControlGroup/CustomFeeInput'
import { HStack, Stack } from 'components/Stack'
import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { DEFAULT_TIPS } from 'constants/index'
import { cn } from 'utils/cn'

const FeeControlGroup = () => {
  const { feeAmount, enableTip, creatorName } = useGetFeeConfig() ?? {}
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

  return (
    <Stack className="w-full gap-2 rounded-lg bg-white-04 p-3">
      <HStack as="p" className="min-w-0 items-center text-xs font-medium text-subText">
        <span className="shrink-0">
          <Trans>
            No hidden fees! Your <span className="text-text">optional tips</span> support
          </Trans>
          &nbsp;
        </span>
        <span className={cn('min-w-0 truncate', !!creatorName && 'text-text')}>{creatorName || 'the link sharer'}</span>
      </HStack>

      <HStack className="items-stretch rounded-[20px] border border-border bg-background">
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
                isActive ? 'bg-tabActive text-text' : 'bg-transparent text-subText',
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
      </HStack>
    </Stack>
  )
}

export default FeeControlGroup
