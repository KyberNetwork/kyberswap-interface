import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType } from '@kyber/schema'
import { InfoHelper } from '@kyber/ui'
import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { MAX_DEGEN_SLIPPAGE_IN_BIPS, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import { useDegenModeManager } from 'state/user/hooks'

const STORAGE_KEY_PREFIX = 'kyber_liquidity_widget_slippage'

const parseSlippageInput = (value: string): number => Math.round(Number.parseFloat(value) * 100)

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
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
`

const Controls = styled.div`
  display: flex;
  align-items: stretch;
  min-height: 36px;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
`

const Option = styled.button<{ $active: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  border-radius: 20px;
  border: none;
  background: ${({ theme, $active }) => ($active ? theme.tabActive : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  cursor: pointer;
  min-height: 32px;
`

const InputWrap = styled.div<{ $active: boolean; $error?: boolean; $warning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 0;
  gap: 4px;
  min-width: 0;
  padding: 0 10px;
  border-radius: 20px;
  background: ${({ theme, $active }) => ($active ? theme.tabActive : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  box-shadow: ${({ theme, $active, $error, $warning }) =>
    $active || $error || $warning
      ? `inset 0 0 0 1px ${$error ? theme.red : $warning ? theme.warning : theme.tabActive}`
      : 'none'};
`

const Input = styled.input`
  width: 56px;
  border: none;
  background: transparent;
  color: inherit;
  min-width: 0;
  outline: none;
  text-align: center;
`

const Suggestion = styled.button`
  width: fit-content;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  font-size: 12px;
  padding: 0;
`

const Message = styled.div<{ $warning?: boolean }>`
  padding: 10px 12px;
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
  const chainId = context?.chainId || 0
  const poolType = context?.poolType || PoolType.DEX_UNISWAPV3
  const pool = context?.pool
  const slippage = value?.slippage
  const suggestedSlippage = value?.suggestedSlippage || 0
  const [isDegenMode] = useDegenModeManager()
  const previousSlippageRef = useRef(slippage)
  const [customValue, setCustomValue] = useState('')
  const [isFocus, setIsFocus] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const token0Symbol = pool?.token0.symbol || ''
  const token1Symbol = pool?.token1.symbol || ''
  const feeTier = pool?.fee || 0

  useEffect(() => {
    if (!slippage) return
    if ([5, 10, 50, 100].includes(slippage)) {
      setCustomValue('')
    } else {
      setCustomValue(((slippage * 100) / 10_000).toString())
    }
  }, [slippage])

  const { isValid, message } = validateSlippageInput(customValue, suggestedSlippage, isDegenMode)
  const currentSlippageMessage = validateSlippageInput(
    slippage ? ((slippage * 100) / 10_000).toString() : '',
    suggestedSlippage,
    isDegenMode,
  )

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

  if (!context || !pool) return null

  return (
    <Stack gap={8}>
      <SummaryButton type="button" onClick={() => setIsExpanded(prev => !prev)}>
        <HStack align="center" gap={6}>
          <SummaryLabel>Max Slippage</SummaryLabel>
          <InfoHelper
            placement="bottom"
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price."
            color="#31cb9e"
            width="260px"
          />
        </HStack>
        <SummaryValue as="span" align="center" gap={8}>
          {slippage ? `${Number(((slippage * 100) / 10_000).toFixed(2))}%` : '--'}
          <Caret $open={isExpanded} />
        </SummaryValue>
      </SummaryButton>

      {isExpanded && (
        <Stack gap={8} px="2px">
          <Controls>
            {[5, 10, 50, 100].map(item => (
              <Option
                $active={slippage === item}
                key={item}
                onClick={() => {
                  setCustomValue('')
                  applySlippage(item)
                }}
                type="button"
              >
                {(item * 100) / 10_000}%
              </Option>
            ))}

            <InputWrap
              $active={Boolean(slippage && ![5, 10, 50, 100].includes(slippage))}
              $error={Boolean(message && !isValid)}
              $warning={Boolean(message && isValid)}
            >
              <Input
                onBlur={event => {
                  setIsFocus(false)

                  if (!event.currentTarget.value) {
                    applySlippage(suggestedSlippage || 10)
                    setCustomValue('')
                    return
                  }

                  if (isValid) {
                    applySlippage(parseSlippageInput(event.currentTarget.value))
                  }
                }}
                onChange={event => {
                  const nextValue = event.target.value

                  if (nextValue === '') {
                    setCustomValue(nextValue)
                    return
                  }

                  if (!/^(\d+)\.?(\d{1,2})?$/.test(nextValue)) return

                  setCustomValue(nextValue)
                  const validation = validateSlippageInput(nextValue, suggestedSlippage, isDegenMode)
                  if (validation.isValid) {
                    onSlippageChange?.(parseSlippageInput(nextValue))
                  }
                }}
                onFocus={() => setIsFocus(true)}
                placeholder="Custom"
                value={customValue}
              />
              <InputSuffix>%</InputSuffix>
            </InputWrap>
          </Controls>

          {suggestedSlippage > 0 && slippage !== suggestedSlippage && (
            <Suggestion
              type="button"
              onClick={() => {
                applySlippage(suggestedSlippage)
                setCustomValue(
                  [5, 10, 50, 100].includes(suggestedSlippage) ? '' : ((suggestedSlippage * 100) / 10_000).toString(),
                )
              }}
            >
              <Trans>Suggestion</Trans>: {Number(((suggestedSlippage * 100) / 10_000).toFixed(2))}%
            </Suggestion>
          )}

          {(message || currentSlippageMessage.message) && !isFocus && (
            <Message $warning={isValid}>{message || currentSlippageMessage.message}</Message>
          )}
        </Stack>
      )}
    </Stack>
  )
}
