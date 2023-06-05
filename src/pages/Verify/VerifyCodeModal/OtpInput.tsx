import React from 'react'

type AllowedInputTypes = 'password' | 'text' | 'number'

type InputProps = Required<
  Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    | 'value'
    | 'onChange'
    | 'onFocus'
    | 'onBlur'
    | 'onKeyDown'
    | 'onPaste'
    | 'aria-label'
    | 'maxLength'
    | 'autoComplete'
    | 'style'
  > & {
    ref: React.RefCallback<HTMLInputElement>
    type: AllowedInputTypes
  }
>

interface OTPInputProps {
  /** Value of the OTP input */
  value?: string
  /** Number of OTP inputs to be rendered */
  numInputs?: number
  /** Callback to be called when the OTP value changes */
  onChange: (otp: string) => void
  /** Function to render the input */
  renderInput: (inputProps: InputProps, index: number) => React.ReactNode
  /** Whether the first input should be auto focused */
  shouldAutoFocus?: boolean
  /** Placeholder for the inputs */
  /** Style for the container */
  containerStyle?: React.CSSProperties
  /** Style for the input */
  inputStyle?: React.CSSProperties
  /** The type that will be passed to the input being rendered */
  inputType?: AllowedInputTypes
  onFocus?: () => void
  onBlur?: () => void
}

const OTPInput = ({
  value = '',
  numInputs = 6,
  onChange,
  renderInput,
  shouldAutoFocus = false,
  inputType = 'text',
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
}: OTPInputProps) => {
  const [activeInput, setActiveInput] = React.useState(0)
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([])

  const getOTPValue = () => (value ? value.toString().split('') : [])

  const isInputNum = inputType === 'number'

  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, numInputs)
  }, [numInputs])

  React.useEffect(() => {
    if (shouldAutoFocus) {
      inputRefs.current[0]?.focus()
    }
  }, [shouldAutoFocus])

  const isInputValueValid = (value: string) => {
    const isTypeValid = isInputNum ? !isNaN(Number(value)) : typeof value === 'string'
    return isTypeValid && value.trim().length >= 1
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    if (isInputValueValid(value)) {
      const otp = getOTPValue()
      const [first, second] = value.split('')
      const newValue = otp[activeInput] === first ? second : first
      changeCodeAtFocus(newValue)
      focusInput(activeInput + 1)
    } else {
      const nativeEvent = event.nativeEvent as InputEvent
      // for dealing with keyCode "229 Unidentified" on Android.
      if (nativeEvent.data === null && nativeEvent.inputType === 'deleteContentBackward') {
        event.preventDefault()
        changeCodeAtFocus('')
        focusInput(activeInput - 1)
      }
    }
  }

  const handleFocus = () => (index: number) => {
    onFocus?.()
    setActiveInput(index)
  }

  const handleBlur = () => {
    onBlur?.()
    setActiveInput(activeInput - 1)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const otp = getOTPValue()
    if ([event.code, event.key].includes('Backspace')) {
      event.preventDefault()
      changeCodeAtFocus('')
      if (!otp[activeInput]) focusInput(activeInput - 1)
    } else if (event.code === 'Delete') {
      event.preventDefault()
      changeCodeAtFocus('')
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault()
      focusInput(activeInput - 1)
    } else if (event.code === 'ArrowRight') {
      event.preventDefault()
      focusInput(activeInput + 1)
    }
    // React does not trigger onChange when the same value is entered
    // again. So we need to focus the next input manually in this case.
    else if (event.key === otp[activeInput]) {
      event.preventDefault()
      focusInput(activeInput + 1)
    } else if (
      event.code === 'Spacebar' ||
      event.code === 'Space' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown'
    ) {
      event.preventDefault()
    } else if (isNaN(+event.key)) {
      event.preventDefault()
    }
  }

  const focusInput = (index: number) => {
    const activeInput = Math.max(Math.min(numInputs - 1, index), 0)

    if (inputRefs.current[activeInput]) {
      inputRefs.current[activeInput]?.focus()
      setActiveInput(activeInput)
    }
  }

  const changeCodeAtFocus = (value: string) => {
    const otp = getOTPValue()
    otp[activeInput] = value[0]
    handleOTPChange(otp)
  }

  const handleOTPChange = (otp: Array<string>) => {
    const otpValue = otp.join('')
    onChange(otpValue)
  }

  const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()

    const otp = getOTPValue()
    let nextActiveInput = activeInput

    // Get pastedData in an array of max size (num of inputs - current position)
    const pastedData = event.clipboardData
      .getData('text/plain')
      .slice(0, numInputs - activeInput)
      .split('')

    // Prevent pasting if the clipboard data contains non-numeric values for number inputs
    if (isInputNum && pastedData.some(value => isNaN(Number(value)))) {
      return
    }

    // Paste data from focused input onwards
    for (let pos = 0; pos < numInputs; ++pos) {
      if (pos >= activeInput && pastedData.length > 0) {
        otp[pos] = pastedData.shift() ?? ''
        nextActiveInput++
      }
    }

    focusInput(nextActiveInput)
    handleOTPChange(otp)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', ...containerStyle }}>
      {Array.from({ length: numInputs }, (_, index) => index).map(index => (
        <React.Fragment key={index}>
          {renderInput(
            {
              value: getOTPValue()[index] ?? '',
              ref: element => (inputRefs.current[index] = element),
              onChange: handleChange,
              onFocus: () => handleFocus()(index),
              onBlur: handleBlur,
              onKeyDown,
              onPaste,
              autoComplete: 'off',
              maxLength: 1,
              'aria-label': `Please enter OTP character ${index + 1}`,
              style: { textAlign: 'center', ...inputStyle },
              type: inputType,
            },
            index,
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default OTPInput
