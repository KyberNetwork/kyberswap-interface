import { t } from '@lingui/macro'
import { useState } from 'react'

import NumericalInput from 'components/NumericalInput'
import { HStack } from 'components/Stack'
import { cn } from 'utils/cn'

type Props = {
  presets: readonly number[]
  value: string
  normalizeInput: (value: string) => string | undefined
  showPositiveSign?: boolean
  warnOnNegative?: boolean
  /** Use red for negative trigger percentages and green for positive ones. */
  colorByDirection?: boolean
  testIdPrefix?: string
  onChange: (value: string) => void
  onPresetSelect: (percent: number) => void
  onCustomBlur?: () => void
}

const PercentPresetSelector = ({
  presets,
  value,
  normalizeInput,
  showPositiveSign,
  warnOnNegative,
  colorByDirection,
  testIdPrefix,
  onChange,
  onPresetSelect,
  onCustomBlur,
}: Props) => {
  const [editing, setEditing] = useState<{ value: string; active: boolean } | null>(null)
  const percent = Number(value)
  const hasValue = value !== '' && Number.isFinite(percent)
  const isCustomActive = editing ? editing.active : hasValue && !presets.includes(percent)
  const displayValue = editing ? editing.value : isCustomActive ? value : ''
  const isWarning = warnOnNegative && Number(displayValue) < 0

  const handleInput = (nextValue: string) => {
    const normalizedValue = normalizeInput(nextValue)
    if (normalizedValue === undefined) return

    const isIncomplete = !normalizedValue || normalizedValue === '-' || normalizedValue === '+'
    setEditing({
      value: normalizedValue,
      active: isIncomplete ? false : normalizedValue.endsWith('.') ? isCustomActive : true,
    })
    if (isIncomplete) {
      onChange('')
      return
    }
    if (!normalizedValue.endsWith('.')) onChange(normalizedValue)
  }

  return (
    <HStack className="flex-wrap items-center gap-1">
      <div
        className={cn(
          'flex h-6 w-[82px] items-center rounded-lg border px-2 text-xs font-medium transition-colors',
          isCustomActive
            ? 'border-primary-50 bg-tabActive text-text hover:bg-buttonGray'
            : 'border-border/60 text-subText hover:border-border-primary hover:text-primary',
          isWarning && 'border-warning/50',
          colorByDirection &&
            isCustomActive && ['hover:bg-tabActive', Number(displayValue) < 0 ? 'border-red/50' : 'border-primary-50'],
        )}
      >
        {showPositiveSign && (
          <span className="shrink-0">{Number(displayValue) > 0 && !/^[+-]/.test(displayValue) ? '+' : ''}</span>
        )}
        <NumericalInput
          className="h-5 bg-transparent text-xs font-medium text-inherit placeholder:text-inherit"
          data-testid={testIdPrefix ? `${testIdPrefix}-input` : undefined}
          aria-label={t`Custom percentage`}
          value={displayValue}
          placeholder={t`Custom`}
          onUserInput={handleInput}
          onFocus={() => setEditing({ value, active: true })}
          onBlur={() => {
            setEditing(null)
            onCustomBlur?.()
          }}
          maxLength={8}
          allowNegative
        />
        <span className="shrink-0">%</span>
      </div>
      {presets.map(preset => (
        <button
          key={preset}
          type="button"
          data-testid={
            testIdPrefix ? `${testIdPrefix}-preset-${preset < 0 ? 'minus' : 'plus'}-${Math.abs(preset)}` : undefined
          }
          aria-pressed={hasValue && percent === preset && !isCustomActive}
          className={cn(
            'h-6 rounded-lg border px-2 text-xs font-medium transition-colors',
            hasValue && percent === preset && !isCustomActive
              ? 'border-primary-50 bg-tabActive text-text hover:bg-buttonGray'
              : 'border-border/60 text-subText hover:border-border-primary hover:text-primary',
            colorByDirection && [
              'hover:bg-tabActive hover:text-text',
              preset < 0 ? 'hover:border-red/50' : 'hover:border-primary-50',
              hasValue && percent === preset && !isCustomActive && (preset < 0 ? 'border-red/50' : 'border-primary-50'),
            ],
          )}
          onClick={() => {
            setEditing(null)
            onPresetSelect(preset)
          }}
        >
          {preset > 0 ? `+${preset}` : preset}%
        </button>
      ))}
    </HStack>
  )
}

export default PercentPresetSelector
