import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType } from '@kyber/schema'
import { InfoHelper } from '@kyber/ui'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { MAX_DEGEN_SLIPPAGE_IN_BIPS, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { getSlippageNotice, getSlippageStorageKey } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { useDegenModeManager } from 'state/user/hooks'

const PRESET_SLIPPAGE_OPTIONS = [5, 10, 50, 100]
const SLIPPAGE_INPUT_REGEX = /^(\d+)\.?(\d{1,2})?$/

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

  if (!value.match(SLIPPAGE_INPUT_REGEX)) return { isValid: false, message: 'Enter a valid slippage percentage' }

  const rawSlippage = parseSlippageInput(value)

  if (Number.isNaN(rawSlippage) || rawSlippage < 0) {
    return { isValid: false, message: 'Enter a valid slippage percentage' }
  }

  const notice = getSlippageNotice(rawSlippage, suggestedSlippage)
  if (notice && rawSlippage < suggestedSlippage / 2) return { isValid: true, message: notice.message }

  if (rawSlippage > maxSlippage) {
    return { isValid: false, message: 'Enter a smaller slippage percentage' }
  }

  if (notice) return { isValid: true, message: notice.message }

  return { isValid: true }
}

const SummaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.buttonGray};
  }
`

const Controls = styled.div`
  display: flex;
  align-items: stretch;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
`

const Option = styled.button<{ $active: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  min-height: 32px;
  padding: 0px 8px 0px 12px;
  border: none;
  border-radius: 20px;
  background: ${({ theme, $active }) => ($active ? theme.tabActive : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  cursor: pointer;

  :hover {
    background: ${({ theme, $active }) => ($active ? rgba(theme.tabActive, 0.8) : theme.buttonGray)};
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

  :hover {
    background: ${({ theme, $active }) => ($active ? theme.tabActive : theme.background)};
  }
`

const Input = styled.input`
  width: 56px;
  border: none;
  background: transparent;
  color: inherit;
  min-width: 0;
  padding: 0px;
  font-weight: 500;
  outline: none;
  text-align: right;
`

const Suggestion = styled.button`
  width: fit-content;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  margin-left: 12px;

  :hover {
    filter: brightness(1.12);
  }
`

const Caret = styled(ChevronDown)<{ $open: boolean }>`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.subText};
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
  transition: transform 0.2s ease;
`

type SlippageControlProps = {
  context: {
    chainId: number
    poolType: PoolType
    pool: Pool
  }
  value?: {
    slippage?: number
    suggestedSlippage?: number
  }
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onSlippageChange?: (value: number) => void
}

const SlippageControl = ({ context, value, onTrackEvent, onSlippageChange }: SlippageControlProps) => {
  const theme = useTheme()
  const { chainId, poolType, pool } = context
  const slippage = value?.slippage
  const suggestedSlippage = value?.suggestedSlippage || 0
  const [isDegenMode] = useDegenModeManager()

  const previousSlippageRef = useRef(slippage)
  const [customValue, setCustomValue] = useState('')
  const [isCustom, setIsCustom] = useState(Boolean(slippage && !isPresetSlippage(slippage)))
  const [isFocus, setIsFocus] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const token0Symbol = pool.token0.symbol
  const token1Symbol = pool.token1.symbol
  const feeTier = pool.fee || 0

  const dexNameInfo = DEXES_INFO[poolType]?.name
  const dexName = !dexNameInfo ? '' : typeof dexNameInfo === 'string' ? dexNameInfo : dexNameInfo[chainId]
  const { isValid, message } = validateSlippageInput(customValue, suggestedSlippage, isDegenMode)
  const appliedSlippageValidation = validateSlippageInput(
    slippage ? formatSlippageInput(slippage) : '',
    suggestedSlippage,
    isDegenMode,
  )
  const messageToShow = message || appliedSlippageValidation.message

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

  const fireSlippageEvent = (nextSlippage: number) => {
    if (previousSlippageRef.current === undefined || nextSlippage === previousSlippageRef.current) return

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

  const syncCustomStateFromSlippage = (nextSlippage: number) => {
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
      syncCustomStateFromSlippage(nextSlippage)
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

    if (!SLIPPAGE_INPUT_REGEX.test(value)) return

    setCustomValue(value)
    setIsCustom(true)

    const validation = validateSlippageInput(value, suggestedSlippage, isDegenMode)
    if (validation.isValid) {
      onSlippageChange?.(parseSlippageInput(value))
    }
  }

  const handleSuggestionClick = () => {
    applySlippage(suggestedSlippage)
    syncCustomStateFromSlippage(suggestedSlippage)
  }

  return (
    <Stack gap={8}>
      <SummaryButton type="button" aria-expanded={isExpanded} onClick={() => setIsExpanded(prev => !prev)}>
        <HStack align="center" gap={4}>
          <Text color={theme.text} fontSize={14}>
            Max Slippage
          </Text>
          <InfoHelper
            placement="bottom"
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price."
            color={theme.primary}
            width="280px"
          />
        </HStack>
        <HStack as="span" align="center" gap={4}>
          <Text as="span" color={theme.text} fontSize={14} fontWeight={500}>
            {formatSlippageLabel(slippage)}
          </Text>
          <Caret $open={isExpanded} />
        </HStack>
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
            <Text as="span" fontSize={14}>
              %
            </Text>
          </InputWrap>
        </Controls>
      )}

      {suggestedSlippage > 0 && slippage !== suggestedSlippage && (
        <Suggestion type="button" onClick={handleSuggestionClick}>
          <Trans>Suggestion</Trans>: {formatSlippageLabel(suggestedSlippage)}
        </Suggestion>
      )}

      {messageToShow && <NoteCard $tone={isValid ? 'warning' : 'error'}>{messageToShow}</NoteCard>}
    </Stack>
  )
}

export default SlippageControl
