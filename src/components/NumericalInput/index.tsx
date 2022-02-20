import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled from 'styled-components'
import { t } from '@lingui/macro'
import { escapeRegExp } from '../../utils'
import _ from 'lodash'

const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string }>`
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text)};
  position: relative;
  font-weight: 500;
  outline: none;
  border: none;
  width: 100%;
  background-color: ${({ theme }) => theme.buttonBlack};
  font-size: ${({ fontSize }) => fontSize ?? '24px'};
  text-align: ${({ align }) => align && align};
  color: ${({ disabled, theme }) => (disabled ? theme.disableText : theme.text)};
  white-space: nowrap;
  overflow: hidden;
  padding: 0px;
  padding-right: 4px;
  -webkit-appearance: textfield;

  ${({ disabled, theme }) =>
    disabled && `cursor: not-allowed; opacity: 1; -webkit-text-fill-color: ${theme.disableText}`};

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }

  @media only screen and (max-width: 400px) {
    font-size: 22px;
  }
`

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

const WrapperInput = styled.div`
  flex: 1;
`
export const Input = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  disabled,
  ...rest
}: {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput)
    }
  }
  const inputRef = useRef<HTMLInputElement>(null)
  const el = inputRef.current
  const [scrollable, setScrollable] = useState<boolean>(false)
  const [scrolling, setScrolling] = useState<boolean>(false)

  const debounceToStartScrolling = useCallback(
    _.debounce(() => {
      setScrolling(previous => (!previous ? true : previous))
    }, 3000),
    []
  )

  useEffect(() => {
    if (el && el.scrollWidth > el.clientWidth + 20) {
      setScrollable(true)
      debounceToStartScrolling()
    } else {
      setScrollable(false)
      debounceToStartScrolling.cancel()
    }
  }, [el, el?.scrollWidth, el?.clientWidth, value])

  useEffect(() => {
    let interval: any
    let timeout: any
    if (!el || !scrollable) return
    debounceToStartScrolling.cancel()
    if (scrolling) {
      interval = setInterval(() => {
        el.scrollLeft += 1
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth) {
          setScrolling(false)
        }
      }, 35)
    } else {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth) {
        timeout = setTimeout(function() {
          el.scrollLeft = 0
          debounceToStartScrolling()
        }, 3000)
      }
    }

    return () => {
      interval && clearInterval(interval)
      timeout && clearTimeout(timeout)
    }
  }, [scrolling, el, value])

  return (
    <WrapperInput
      onMouseEnter={
        disabled
          ? () => {
              setScrolling(false)
              debounceToStartScrolling.cancel()
            }
          : undefined
      }
      onMouseLeave={disabled ? () => setScrolling(true) : undefined}
    >
      <StyledInput
        {...rest}
        value={value}
        onChange={event => {
          // replace commas with periods, because dmmexchange exclusively uses period as the decimal separator
          enforcer(event.target.value.replace(/,/g, '.'))
        }}
        // universal input options
        inputMode="decimal"
        title={t`Token Amount`}
        autoComplete="off"
        autoCorrect="off"
        // text-specific options
        type="text"
        pattern="^[0-9]*[.,]?[0-9]*$"
        placeholder={placeholder || '0.0'}
        minLength={1}
        maxLength={79}
        spellCheck="false"
        ref={inputRef as any}
        onFocus={() => {
          if (!disabled) setScrolling(false)
        }}
        onBlur={debounceToStartScrolling}
        disabled={disabled}
      />
    </WrapperInput>
  )
})

export default Input

// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
