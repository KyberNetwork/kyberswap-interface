import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { Stack } from 'components/Stack'
import { cn } from 'utils/cn'

export type CollapsiblePresetControlOption = {
  label: ReactNode
  value: number
}

export type CollapsiblePresetControlProps = {
  children?: ReactNode
  className?: string
  collapseButtonAriaLabel?: string
  customInputAriaLabel?: string
  customPlaceholder?: string
  customPrefix?: ReactNode
  customSuffix?: ReactNode
  defaultExpanded?: boolean
  defaultValue?: number
  disabled?: boolean
  expanded?: boolean
  formatCustomInput?: (value: number) => string
  formatValue: (value: number) => ReactNode
  isValueAllowed?: (value: number) => boolean
  label: ReactNode
  maxFractionDigits?: number
  maxIntegerDigits?: number
  onChange?: (value: number) => void
  onExpandedChange?: (expanded: boolean) => void
  options: readonly CollapsiblePresetControlOption[]
  value?: number
  valueClassName?: string
}

const defaultFormatCustomInput = (value: number) => String(value)

const CollapsiblePresetControl = ({
  children,
  className,
  collapseButtonAriaLabel = 'Toggle preset options',
  customInputAriaLabel = 'Custom value',
  customPlaceholder = 'Custom',
  customPrefix,
  customSuffix,
  defaultExpanded = false,
  defaultValue,
  disabled = false,
  expanded,
  formatCustomInput = defaultFormatCustomInput,
  formatValue,
  isValueAllowed = () => true,
  label,
  maxFractionDigits = 2,
  maxIntegerDigits = 6,
  onChange,
  onExpandedChange,
  options,
  value,
  valueClassName,
}: CollapsiblePresetControlProps) => {
  const initialValue = defaultValue ?? options[0]?.value ?? 0
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const [internalValue, setInternalValue] = useState(initialValue)
  const currentValue = value ?? internalValue
  const [isCustom, setIsCustom] = useState(!options.some(option => option.value === currentValue))
  const [customInput, setCustomInput] = useState(() => (isCustom ? formatCustomInput(currentValue) : ''))
  const [isInputFocused, setIsInputFocused] = useState(false)

  const isExpanded = expanded ?? internalExpanded
  const isReadOnly = value !== undefined && !onChange
  const inputPattern = useMemo(() => {
    const fraction = maxFractionDigits > 0 ? `(\\.\\d{0,${maxFractionDigits}})?` : ''
    return new RegExp(`^\\d{0,${maxIntegerDigits}}${fraction}$`)
  }, [maxFractionDigits, maxIntegerDigits])

  useEffect(() => {
    if (isInputFocused) return

    const nextIsCustom = !options.some(option => option.value === currentValue)
    setIsCustom(nextIsCustom)
    setCustomInput(nextIsCustom ? formatCustomInput(currentValue) : '')
  }, [currentValue, formatCustomInput, isInputFocused, options])

  useEffect(() => {
    if (value !== undefined) setInternalValue(value)
  }, [value])

  const setExpanded = (nextExpanded: boolean) => {
    if (expanded === undefined) setInternalExpanded(nextExpanded)
    onExpandedChange?.(nextExpanded)
  }

  const resetCustomInput = () => {
    const nextIsCustom = !options.some(option => option.value === currentValue)
    setIsCustom(nextIsCustom)
    setCustomInput(nextIsCustom ? formatCustomInput(currentValue) : '')
  }

  const handleValueChange = (nextValue: number) => {
    if (value === undefined) setInternalValue(nextValue)
    onChange?.(nextValue)
  }

  const handleCustomInputChange = (nextInput: string) => {
    if (!inputPattern.test(nextInput)) return

    setCustomInput(nextInput)
    setIsCustom(true)
    if (!nextInput) return

    const nextValue = Number(nextInput)
    if (Number.isFinite(nextValue) && isValueAllowed(nextValue)) handleValueChange(nextValue)
  }

  return (
    <Stack className={cn('gap-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-subText">{label}</span>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={collapseButtonAriaLabel}
          disabled={disabled}
          onClick={() => setExpanded(!isExpanded)}
          className="flex min-w-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={cn('truncate text-sm font-medium text-text', valueClassName)}>
            {formatValue(currentValue)}
          </span>
          <ChevronDown
            size={16}
            className={cn('shrink-0 text-subText transition-transform duration-200', isExpanded && 'rotate-180')}
          />
        </button>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <Stack className="gap-2">
            <div className="flex items-stretch rounded-[20px] border border-border bg-background" role="group">
              {options.map(option => {
                const active = !isCustom && option.value === currentValue

                return (
                  <button
                    type="button"
                    key={option.value}
                    aria-pressed={active}
                    disabled={disabled || isReadOnly}
                    onClick={() => {
                      setIsCustom(false)
                      setCustomInput('')
                      handleValueChange(option.value)
                    }}
                    className={cn(
                      'min-h-8 min-w-0 flex-1 cursor-pointer rounded-[20px] border-0 bg-transparent px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50',
                      active ? 'bg-tabActive font-medium text-text' : 'text-subText hover:bg-buttonGray',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}

              <div
                data-active={isCustom}
                data-disabled={disabled || isReadOnly}
                onClick={() => !disabled && !isReadOnly && inputRef.current?.focus()}
                className="flex min-h-8 min-w-0 flex-1 cursor-text items-center justify-center gap-1 rounded-[20px] px-2 text-sm text-subText hover:bg-buttonGray data-[disabled=true]:cursor-not-allowed data-[active=true]:bg-tabActive data-[active=true]:font-medium data-[active=true]:text-text data-[disabled=true]:opacity-50"
              >
                {customPrefix}
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  aria-label={customInputAriaLabel}
                  disabled={disabled || isReadOnly}
                  placeholder={customPlaceholder}
                  value={customInput}
                  onBlur={() => {
                    setIsInputFocused(false)
                    if (!customInput || !isValueAllowed(Number(customInput))) resetCustomInput()
                  }}
                  onChange={event => handleCustomInputChange(event.target.value)}
                  onFocus={() => {
                    setIsInputFocused(true)
                    setIsCustom(true)
                  }}
                  className="w-14 min-w-0 border-0 bg-transparent p-0 text-right text-[13px] font-medium text-inherit outline-none placeholder:text-inherit placeholder:opacity-60 disabled:cursor-not-allowed"
                />
                {customSuffix}
              </div>
            </div>
            {children}
          </Stack>
        </div>
      </div>
    </Stack>
  )
}

export default CollapsiblePresetControl
