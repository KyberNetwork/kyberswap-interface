import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType } from '@kyber/schema'
import { InfoHelper } from '@kyber/ui'
import { Trans } from '@lingui/macro'
import rgba from 'polished/lib/color/rgba'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { MAX_DEGEN_SLIPPAGE_IN_BIPS, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import { useDegenModeManager } from 'state/user/hooks'

const STORAGE_KEY_PREFIX = 'kyber_liquidity_widget_slippage'
const PRESET_SLIPPAGE_OPTIONS = [5, 10, 50, 100]

const parseSlippageInput = (value: string): number => Math.round(Number.parseFloat(value) * 100)
const formatSlippageInput = (value: number) => ((value * 100) / 10_000).toString()
const formatSlippageLabel = (value?: number) => (value ? `${Number(formatSlippageInput(value)).toFixed(2)}%` : '--')
const isPresetSlippage = (value?: number) => (value !== undefined ? PRESET_SLIPPAGE_OPTIONS.includes(value) : false)

const validateSlippageInput = (
  value: string,
  suggestedSlippage: number,
  isDegenMode: boolean,
): { isValid: boolean; message?: string } => {
  const maxSlippage = isDegenMode ? MAX_DEGEN_SLIPPAGE_IN_BIPS : MAX_NORMAL_SLIPPAGE_IN_BIPS
  if (value === '') return { isValid: true }

  const numberRegex = /^(\d+)\.?(\d{1,2})?$/
  if (!value.match(numberRegex)) return { isValid: false, message: 'Enter a valid slippage percentage' }

  const rawSlippage = parseSlippageInput(value)
  if (Number.isNaN(rawSlippage) || rawSlippage < 0) {
    return { isValid: false, message: 'Enter a valid slippage percentage' }
  }
  if (suggestedSlippage > 0 && rawSlippage < suggestedSlippage / 2) {
    return {
      isValid: true,
      message: 'Your slippage is set lower than usual, increasing the risk of transaction failure.',
    }
  }
  if (rawSlippage > maxSlippage) {
    return { isValid: false, message: 'Enter a smaller slippage percentage' }
  }
  if (suggestedSlippage > 0 && rawSlippage > 2 * suggestedSlippage) {
    return {
      isValid: true,
      message: 'Your slippage is set higher than usual, which may cause unexpected losses.',
    }
  }

  return { isValid: true }
}

const getSlippageStorageKey = (token0Symbol: string, token1Symbol: string, chainId: number, feeTier: number) => {
  const sortedSymbols = [token0Symbol, token1Symbol].sort()
  return `${STORAGE_KEY_PREFIX}_${sortedSymbols[0]}_${sortedSymbols[1]}_${chainId}_${feeTier}`
}

const SummaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
`

const Controls = styled.div`
  display: flex;
  align-items: stretch;
  border: 1px solid ${({ theme }) => theme.tabActive};
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
`

const Option = styled.button<{ $active: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  border: none;
  border-radius: 20px;
  background: ${({ theme, $active }) => ($active ? theme.tabActive : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  cursor: pointer;
  padding: 0px 8px;
  min-height: 32px;

  :hover {
    background: ${({ theme, $active }) => ($active ? rgba(theme.tabActive, 0.88) : 'rgba(255, 255, 255, 0.04)')};
  }
`

const InputWrap = styled.div<{ $active: boolean; $error?: boolean; $warning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 0;
  gap: 4px;
  min-width: 0;
  padding: 0px 8px;
  border-radius: 20px;
  background: ${({ theme, $active }) => ($active ? theme.tabActive : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  box-shadow: ${({ theme, $active, $error, $warning }) =>
    $active || $error || $warning
      ? `inset 0 0 0 1px ${$error ? theme.red : $warning ? theme.warning : theme.tabActive}`
      : 'none'};

  :hover {
    background: rgba(255, 255, 255, 0.04);
  }
`

const Input = styled.input`
  width: 56px;
  border: none;
  background: transparent;
  color: inherit;
  min-width: 0;
  outline: none;
  text-align: right;
`

const Suggestion = styled.button`
  width: fit-content;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  margin-left: 12px;
`

const Message = styled.div<{ $warning?: boolean }>`
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ theme, $warning }) => ($warning ? `${theme.warning}14` : `${theme.red}14`)};
  color: ${({ theme, $warning }) => ($warning ? theme.warning : theme.red)};
  font-size: 12px;
`

const Caret = styled(ChevronDown)<{ $open: boolean }>`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.subText};
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
  transition: transform 0.2s ease;
`

const SummaryLabel = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
`

const SummaryValue = styled(HStack)`
  color: inherit;
  font-size: 14px;
  font-weight: 500;
`

const InputSuffix = styled(Text)`
  margin: 0;
  color: inherit;
  font-size: 14px;
  line-height: 1;
`

interface SlippageControlProps {
  context?: {
    chainId: number
    poolType: PoolType
    pool: Pool
  }
  value?: {
    slippage?: number
    suggestedSlippage?: number
  }
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onSlippageChange?: (value: number) => void
}

export default function SlippageControl({ context, value, onTrackEvent, onSlippageChange }: SlippageControlProps) {
  // Context and incoming value
  const chainId = context?.chainId || 0
  const poolType = context?.poolType || PoolType.DEX_UNISWAPV3
  const pool = context?.pool
  const slippage = value?.slippage
  const suggestedSlippage = value?.suggestedSlippage || 0
  const [isDegenMode] = useDegenModeManager()

  // Local UI state
  const previousSlippageRef = useRef(slippage)
  const [customValue, setCustomValue] = useState('')
  const [isCustom, setIsCustom] = useState(Boolean(slippage && !isPresetSlippage(slippage)))
  const [isFocus, setIsFocus] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Pool metadata
  const token0Symbol = pool?.token0.symbol || ''
  const token1Symbol = pool?.token1.symbol || ''
  const feeTier = pool?.fee || 0

  // Derived validation state
  const { isValid, message } = validateSlippageInput(customValue, suggestedSlippage, isDegenMode)
  useEffect(() => {
    if (isFocus) return
    if (slippage === undefined) return
    if (isPresetSlippage(slippage) && !isCustom) {
      setCustomValue('')
      setIsCustom(false)
    } else {
      setCustomValue(formatSlippageInput(slippage))
      setIsCustom(true)
    }
  }, [isCustom, isFocus, slippage])

  const currentSlippageMessage = validateSlippageInput(
    slippage ? formatSlippageInput(slippage) : '',
    suggestedSlippage,
    isDegenMode,
  )
  const messageToShow = message || currentSlippageMessage.message
  const summaryValue = formatSlippageLabel(slippage)
  const suggestionLabel = formatSlippageLabel(suggestedSlippage)

  const fireSlippageEvent = (nextSlippage: number) => {
    if (!pool) return
    if (previousSlippageRef.current === undefined || nextSlippage === previousSlippageRef.current) return

    const dexNameObj = DEXES_INFO[poolType]?.name
    const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]

    onTrackEvent?.('LIQ_MAX_SLIPPAGE_CHANGED', {
      previous_slippage: (previousSlippageRef.current * 100) / 10_000,
      new_slippage: (nextSlippage * 100) / 10_000,
      pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      pool_protocol: dexName,
      chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
    })

    previousSlippageRef.current = nextSlippage
  }

  useEffect(() => {
    if (!pool) return
    if (!slippage || suggestedSlippage <= 0 || slippage === suggestedSlippage) return

    try {
      localStorage.setItem(getSlippageStorageKey(token0Symbol, token1Symbol, chainId, feeTier), slippage.toString())
    } catch (error) {
      console.warn('Failed to save slippage to localStorage:', error)
    }
  }, [chainId, feeTier, pool, slippage, suggestedSlippage, token0Symbol, token1Symbol])

  const applySlippage = (nextSlippage: number) => {
    onSlippageChange?.(nextSlippage)
    fireSlippageEvent(nextSlippage)
  }

  const syncCustomState = (nextSlippage: number) => {
    if (isPresetSlippage(nextSlippage)) {
      setCustomValue('')
      setIsCustom(false)
      return
    }

    setCustomValue(formatSlippageInput(nextSlippage))
    setIsCustom(true)
  }

  const handlePresetClick = (nextSlippage: number) => {
    setCustomValue('')
    setIsCustom(false)
    applySlippage(nextSlippage)
  }

  const handleCustomBlur = (value: string) => {
    setIsFocus(false)

    if (!value || !isValid) {
      const nextSlippage = slippage ?? (suggestedSlippage || 10)
      syncCustomState(nextSlippage)
      applySlippage(nextSlippage)
      return
    }

    applySlippage(parseSlippageInput(value))
  }

  const handleCustomChange = (value: string) => {
    if (value === '') {
      setCustomValue('')
      setIsCustom(false)
      return
    }

    if (!/^(\d+)\.?(\d{1,2})?$/.test(value)) return

    setCustomValue(value)
    setIsCustom(true)

    const validation = validateSlippageInput(value, suggestedSlippage, isDegenMode)
    if (validation.isValid) {
      onSlippageChange?.(parseSlippageInput(value))
    }
  }

  const handleSuggestionClick = () => {
    applySlippage(suggestedSlippage)
    syncCustomState(suggestedSlippage)
  }

  if (!context || !pool) return null

  return (
    <Stack gap={8}>
      <SummaryButton type="button" onClick={() => setIsExpanded(prev => !prev)}>
        <HStack align="center" gap={4}>
          <SummaryLabel>Max Slippage</SummaryLabel>
          <InfoHelper
            placement="bottom"
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price."
            color="#31cb9e"
            width="260px"
          />
        </HStack>
        <SummaryValue as="span" align="center" gap={4}>
          {summaryValue}
          <Caret $open={isExpanded} />
        </SummaryValue>
      </SummaryButton>

      {isExpanded && (
        <Controls>
          {PRESET_SLIPPAGE_OPTIONS.map(item => (
            <Option
              $active={slippage === item && !isCustom}
              key={item}
              onClick={() => handlePresetClick(item)}
              type="button"
            >
              {formatSlippageInput(item)}%
            </Option>
          ))}

          <InputWrap $active={isCustom} $error={Boolean(message && !isValid)} $warning={Boolean(message && isValid)}>
            <Input
              onBlur={event => handleCustomBlur(event.currentTarget.value)}
              onChange={event => handleCustomChange(event.target.value)}
              onFocus={() => {
                setIsFocus(true)
                setIsCustom(true)
              }}
              placeholder="Custom"
              value={customValue}
            />
            <InputSuffix>%</InputSuffix>
          </InputWrap>
        </Controls>
      )}

      {suggestedSlippage > 0 && slippage !== suggestedSlippage && (
        <Suggestion type="button" onClick={handleSuggestionClick}>
          <Trans>Suggestion</Trans>: {suggestionLabel}
        </Suggestion>
      )}

      {messageToShow && <Message $warning={isValid}>{messageToShow}</Message>}
    </Stack>
  )
}
