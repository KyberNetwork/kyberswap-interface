import { useState } from 'react'
import styled from 'styled-components'
import useTheme from '../hooks/useTheme'
import BackIcon from '../assets/back1.svg'
import { Dex } from '../hooks/useSwap'
import AlertIcon from '../assets/alert.svg'
import InfoHelper from './InfoHelper'

const Label = styled.div`
  font-size: 0.75rem;
  text-align: left;
`

const Input = styled.input<{ isActive: boolean }>`
  background: ${({ theme, isActive }) => (isActive ? theme.dialog : theme.secondary)};
  border: none;
  outline: none;
  color: ${({ theme }) => theme.text};
  text-align: right;
  width: 100%;
  font-size: 12px;
  padding: 0;

  :focus {
    background: ${({ theme }) => theme.dialog};
  }
`

const SlippageWrapper = styled.div`
  border-radius: 999px;
  margin-top: 8px;
  background: ${({ theme }) => theme.secondary};
  padding: 2px;
  display: flex;
`

const SlippageItem = styled.div<{ isActive: boolean }>`
  position: relative;
  border-radius: 999px;
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  font-size: 12px;
  padding: 4px;
  font-weight: 500;
  flex: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  background: ${({ theme, isActive }) => (isActive ? theme.dialog : theme.secondary)};
  cursor: pointer;
  :hover {
    background: ${({ theme }) => theme.dialog};
    input {
      background: ${({ theme }) => theme.dialog};
    }
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TTLInput = styled.div`
  display: flex;
  padding: 6px 8px;
  gap: 4px;
  border-radius: 999px;
  background: ${({ theme }) => theme.secondary};
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  font-weight: 500;
  text-align: right;

  input {
    border: none;
    outline: none;
    padding: 0;
    background: transparent;
    text-align: right;
    color: ${({ theme }) => theme.text};
  }
`

export const BPS = 10_000
export const MAX_SLIPPAGE_IN_BIPS = 2_000

export const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)
export const validateSlippageInput = (str: string): { isValid: boolean; message?: string } => {
  if (str === '') {
    return {
      isValid: true,
    }
  }

  const numberRegex = /^\s*([0-9]+)(\.\d+)?\s*$/
  if (!str.match(numberRegex)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    }
  }

  const rawSlippage = parseSlippageInput(str)

  if (Number.isNaN(rawSlippage)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    }
  }

  if (rawSlippage < 0) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    }
  } else if (rawSlippage < 50) {
    return {
      isValid: true,
      message: `Your transaction may fail`,
    }
  } else if (rawSlippage > MAX_SLIPPAGE_IN_BIPS) {
    return {
      isValid: false,
      message: `Enter a smaller slippage percentage`,
    }
  } else if (rawSlippage > 500) {
    return {
      isValid: true,
      message: `Your transaction may be frontrun`,
    }
  }

  return {
    isValid: true,
  }
}

export const SlippageInput = ({
  slippage,
  setSlippage,
}: {
  slippage: number
  setSlippage: (value: number) => void
}) => {
  const [v, setV] = useState(() => {
    if ([5, 10, 50, 100].includes(slippage)) return ''
    return ((slippage * 100) / BPS).toString()
  })

  const theme = useTheme()
  const [isFocus, setIsFocus] = useState(false)
  const { isValid, message } = validateSlippageInput(v)

  return (
    <>
      <SlippageWrapper>
        <SlippageItem isActive={slippage === 5} onClick={() => setSlippage(5)}>
          0.05%
        </SlippageItem>
        <SlippageItem isActive={slippage === 10} onClick={() => setSlippage(10)}>
          0.1%
        </SlippageItem>
        <SlippageItem isActive={slippage === 50} onClick={() => setSlippage(50)}>
          0.5%
        </SlippageItem>
        <SlippageItem isActive={slippage === 100} onClick={() => setSlippage(100)}>
          1%
        </SlippageItem>
        <SlippageItem
          isActive={![5, 10, 50, 100].includes(slippage)}
          style={{
            flex: 3,
            background: isFocus ? theme.dialog : undefined,
            border: message ? (isValid ? `1px solid ${theme.warning}` : `1px solid ${theme.error}`) : undefined,
          }}
        >
          {message && (
            <AlertIcon
              style={{
                position: 'absolute',
                top: 2,
                left: 4,
                width: 20,
                height: 20,
                color: isValid ? theme.warning : theme.error,
              }}
            />
          )}
          <Input
            isActive={![5, 10, 50, 100].includes(slippage)}
            placeholder="Custom"
            onFocus={() => setIsFocus(true)}
            onBlur={() => {
              setIsFocus(false)
              if (isValid) setSlippage(parseSlippageInput(v))
            }}
            value={v}
            onChange={e => setV(e.target.value)}
          />
          <span>%</span>
        </SlippageItem>
      </SlippageWrapper>
      {message && (
        <div
          style={{
            fontSize: '12px',
            color: isValid ? theme.warning : theme.error,
            textAlign: 'left',
            marginTop: '4px',
          }}
        >
          {message}
        </div>
      )}
    </>
  )
}

function Settings({
  slippage,
  setSlippage,
  deadline,
  setDeadline,
  allDexes,
  excludedDexes,
  onShowSource,
}: {
  slippage: number
  setSlippage: (value: number) => void
  deadline: number
  setDeadline: (value: number) => void
  allDexes: Dex[]
  excludedDexes: Dex[]
  onShowSource: () => void
}) {
  const theme = useTheme()

  return (
    <>
      <div>
        <Label>
          Max Slippage
          <InfoHelper
            color={theme.text}
            text={`Transaction will revert if there is an adverse rate change that is higher than this %`}
          />
        </Label>
        <SlippageInput slippage={slippage} setSlippage={setSlippage} />
      </div>

      <Row>
        <Label>
          Transaction Time Limit
          <InfoHelper
            color={theme.text}
            text="Transaction will revert if it is pending for longer than the indicated time"
          />
        </Label>
        <TTLInput>
          <input
            maxLength={5}
            placeholder="20"
            value={deadline ? deadline.toString() : ''}
            style={{ fontSize: '12px' }}
            onChange={e => {
              const v = +e.target.value
                .trim()
                .replace(/[^0-9.]/g, '')
                .replace(/(\..*?)\..*/g, '$1')
                .replace(/^0[^.]/, '0')
              setDeadline(v)
            }}
          />
          <span style={{ color: theme.subText }}>mins</span>
        </TTLInput>
      </Row>

      <Row>
        <Label>
          Liquidity Sources
          <InfoHelper color={theme.text} text={`Your trade is routed through one or more of these liquidity sources`} />
        </Label>
        <div
          role="button"
          onClick={onShowSource}
          style={{
            alignItems: 'center',
            display: 'flex',
            fontSize: 12,
            fontWeight: 500,
            gap: 4,
            cursor: 'pointer',
          }}
        >
          {allDexes.length - excludedDexes.length || allDexes.length} out of {allDexes.length} selected
          <BackIcon
            style={{
              transform: 'rotate(-180deg)',
              width: '16px',
              color: theme.subText,
            }}
          />
        </div>
      </Row>
    </>
  )
}

export default Settings
