import { CSSProperties } from 'react'

import { cn } from 'utils/cn'

const inputRegex = /^\d*\.?\d*$/
const signedInputRegex = /^[+-]?\d*\.?\d*$/

type Props = {
  value: string | number
  onUserInput?: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  allowNegative?: boolean
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>

const NumericalInput = ({
  value,
  onUserInput,
  placeholder,
  maxLength = 79,
  error,
  fontSize,
  align,
  className,
  style,
  disabled,
  allowNegative,
  onKeyDown,
  ...rest
}: Props) => {
  const enforcer = (nextUserInput: string) => {
    const regex = allowNegative ? signedInputRegex : inputRegex
    if (nextUserInput === '' || regex.test(nextUserInput)) {
      onUserInput?.(nextUserInput)
    }
  }

  const handleStep = (step: 1 | -1) => {
    const numericValue = Number(value || 0)
    if (!Number.isFinite(numericValue)) return
    const nextValue = numericValue + step
    onUserInput?.(String(!allowNegative && nextValue < 0 ? 0 : nextValue))
  }

  // Only set fontSize inline when caller explicitly passes one — otherwise leave
  // the size to the className (default `text-2xl` below) so consumers can
  // override with `text-xs` / `text-sm` via the className prop.
  const inline: CSSProperties = {
    ...(fontSize ? { fontSize } : {}),
    textAlign: align,
    ...style,
  }
  // `disabled` color uses -webkit-text-fill-color so the disabled overlay matches `theme.border`.
  if (disabled) {
    ;(inline as Record<string, string>)['WebkitTextFillColor'] = 'var(--ks-border)'
  }

  return (
    <input
      {...rest}
      disabled={disabled}
      value={value}
      onChange={event => {
        // replace commas with periods (period is the decimal separator)
        enforcer(event.target.value.replace(/,/g, '.'))
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault()
          handleStep(event.key === 'ArrowUp' ? 1 : -1)
        }
      }}
      inputMode="decimal"
      title={value.toString()}
      autoComplete="off"
      autoCorrect="off"
      type="text"
      pattern={allowNegative ? '^[+\\-]?[0-9]*[.,]?[0-9]*$' : '^[0-9]*[.,]?[0-9]*$'}
      placeholder={placeholder || '0.0'}
      minLength={1}
      maxLength={maxLength}
      spellCheck="false"
      className={cn(
        'relative w-0 flex-1 truncate border-none bg-buttonBlack p-0 text-2xl font-medium outline-none placeholder:text-text4',
        '[-webkit-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
        error ? 'text-red1' : disabled ? 'cursor-auto text-disableText opacity-100' : 'text-text',
        className,
      )}
      style={inline}
    />
  )
}

export default NumericalInput
