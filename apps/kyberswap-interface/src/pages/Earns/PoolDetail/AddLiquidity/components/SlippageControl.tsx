import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType, ZapRouteDetail } from '@kyber/schema'
import { translateZapMessage } from '@kyber/ui'
import { PI_LEVEL, getZapImpact } from '@kyber/utils'
import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { HStack, Stack } from 'components/Stack'
import { MAX_DEGEN_SLIPPAGE_IN_BIPS, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import TooltipText from 'pages/Earns/PoolDetail/AddLiquidity/components/TooltipText'
import { getSlippageNotice, getSlippageStorageKey } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { useDegenModeManager } from 'state/user/hooks'
import { cn } from 'utils/cn'

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

type SlippageControlProps = {
  context: {
    chainId: number
    poolType: PoolType
    pool: Pool
  }
  value?: {
    slippage?: number
    suggestedSlippage?: number
    route?: ZapRouteDetail | null
  }
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onSlippageChange?: (value: number) => void
}

const SlippageControl = ({ context, value, onTrackEvent, onSlippageChange }: SlippageControlProps) => {
  const theme = useTheme()
  const { chainId, poolType, pool } = context
  const slippage = value?.slippage
  const suggestedSlippage = value?.suggestedSlippage || 0
  const route = value?.route

  const previousValueRef = useRef(slippage)
  const [isDegenMode] = useDegenModeManager()
  const [customInput, setCustomInput] = useState('')
  const [isCustom, setIsCustom] = useState(Boolean(slippage && !isPresetSlippage(slippage)))
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const token0Symbol = pool.token0.symbol
  const token1Symbol = pool.token1.symbol
  const feeTier = pool.fee || 0

  const dexNameInfo = DEXES_INFO[poolType]?.name
  const dexName = !dexNameInfo ? '' : typeof dexNameInfo === 'string' ? dexNameInfo : dexNameInfo[chainId]
  const { isValid, message } = validateSlippageInput(customInput, suggestedSlippage, isDegenMode)
  const appliedSlippageValidation = validateSlippageInput(
    slippage ? formatSlippageInput(slippage) : '',
    suggestedSlippage,
    isDegenMode,
  )
  const warningMessage = message || appliedSlippageValidation.message
  const valueColor = warningMessage ? (isValid ? theme.warning : theme.red) : theme.text

  useEffect(() => {
    if (isInputFocused) return
    if (slippage === undefined) return

    if (isPresetSlippage(slippage) && !isCustom) {
      setCustomInput('')
      setIsCustom(false)
    } else {
      setCustomInput(formatSlippageInput(slippage))
      setIsCustom(true)
    }
  }, [isCustom, isInputFocused, slippage])

  const fireSlippageEvent = (nextSlippage: number) => {
    if (previousValueRef.current === undefined || nextSlippage === previousValueRef.current) return

    onTrackEvent?.('LIQ_MAX_SLIPPAGE_CHANGED', {
      previous_slippage: (previousValueRef.current * 100) / 10_000,
      new_slippage: (nextSlippage * 100) / 10_000,
      pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      pool_protocol: dexName,
      chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
    })

    previousValueRef.current = nextSlippage
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

  const syncCustomState = (nextSlippage: number) => {
    if (isPresetSlippage(nextSlippage)) {
      setCustomInput('')
      setIsCustom(false)
      return
    }

    setCustomInput(formatSlippageInput(nextSlippage))
    setIsCustom(true)
  }

  const handlePresetClick = (nextSlippage: number) => {
    setCustomInput('')
    setIsCustom(false)

    applySlippage(nextSlippage)
  }

  const handleCustomInputBlur = (value: string) => {
    setIsInputFocused(false)

    if (!value || !isValid) {
      const nextSlippage = slippage ?? (suggestedSlippage || 10)
      syncCustomState(nextSlippage)
      applySlippage(nextSlippage)
      return
    }

    applySlippage(parseSlippageInput(value))
  }

  const handleCustomInputChange = (value: string) => {
    if (value === '') {
      setCustomInput('')
      setIsCustom(false)
      return
    }

    if (!SLIPPAGE_INPUT_REGEX.test(value)) return

    setCustomInput(value)
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

  return (
    <Stack className="gap-2">
      <Stack className="w-full gap-2 rounded-xl border border-border bg-background px-3 py-2 text-text hover:bg-darkText">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 border-none bg-transparent p-0 text-inherit"
        >
          <HStack className="w-full items-center justify-between gap-4">
            <TooltipText
              tooltip="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price."
              placement="bottom"
              className="text-subText"
              fontSize={14}
              width="fit-content"
            >
              Max Slippage
            </TooltipText>
            <HStack as="span" className="items-center gap-1">
              <span className="text-sm font-medium" style={{ color: valueColor }}>
                {formatSlippageLabel(slippage)}
              </span>
              <ChevronDown
                className={cn(
                  'size-4 text-subText transition-transform duration-200 ease-out',
                  isExpanded && 'rotate-180',
                )}
              />
            </HStack>
          </HStack>
        </button>

        {isExpanded && (
          <>
            <div className="flex items-stretch rounded-[20px] border border-border bg-background">
              {PRESET_SLIPPAGE_OPTIONS.map(item => (
                <button
                  type="button"
                  key={item}
                  onClick={() => handlePresetClick(item)}
                  className={cn(
                    'min-h-8 min-w-0 flex-1 cursor-pointer rounded-[20px] border-none pl-3 pr-2 text-sm',
                    slippage === item && !isCustom
                      ? 'bg-tabActive font-medium text-text hover:bg-tabActive/80'
                      : 'bg-transparent font-normal text-subText hover:bg-buttonGray',
                  )}
                >
                  {formatSlippageInput(item)}%
                </button>
              ))}

              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[20px] px-2',
                  isCustom
                    ? 'bg-tabActive text-text hover:bg-tabActive'
                    : 'bg-transparent text-subText hover:bg-background',
                )}
              >
                <input
                  onBlur={event => handleCustomInputBlur(event.currentTarget.value)}
                  onChange={event => handleCustomInputChange(event.target.value)}
                  onFocus={() => {
                    setIsInputFocused(true)
                    setIsCustom(true)
                  }}
                  placeholder="Custom"
                  value={customInput}
                  className="w-14 min-w-0 border-none bg-transparent p-0 text-right font-medium text-inherit outline-none"
                />
                <span className="text-sm">%</span>
              </div>
            </div>

            {suggestedSlippage > 0 && slippage !== suggestedSlippage && (
              <button
                type="button"
                onClick={handleSuggestionClick}
                className="w-fit cursor-pointer border-none bg-transparent p-0 text-sm text-primary hover:brightness-[1.12]"
              >
                <Trans>Suggestion</Trans>: {formatSlippageLabel(suggestedSlippage)}
              </button>
            )}

            {warningMessage ? <NoteCard $tone={isValid ? 'warning' : 'error'}>{warningMessage}</NoteCard> : null}
          </>
        )}

        <ZapImpact route={route} />
      </Stack>
    </Stack>
  )
}

const ZapImpact = ({ route }: { route?: ZapRouteDetail | null }) => {
  const theme = useTheme()
  const impact = getZapImpact(route?.zapDetails.priceImpact, route?.zapDetails.suggestedSlippage || 100)
  const [isDegenMode] = useDegenModeManager()

  const isWarning = impact.level === PI_LEVEL.HIGH
  const isError = impact.level === PI_LEVEL.VERY_HIGH || impact.level === PI_LEVEL.INVALID
  const hasWarning = Boolean(route) && (isWarning || isError)

  const warningMessage =
    !isDegenMode && isError
      ? 'To protect against very high zap impact, preview is disabled for this route. Turn on Degen Mode in settings if you still want to continue.'
      : translateZapMessage(impact.msg)
  const valueColor =
    impact.display === '--' ? theme.subText : isError ? theme.red : isWarning ? theme.warning : theme.text

  return (
    <>
      <HStack className="w-full items-center justify-between gap-4">
        <TooltipText
          tooltip="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
          placement="bottom"
          className="text-subText"
          fontSize={14}
          width="fit-content"
        >
          Zap Impact
        </TooltipText>
        <span className="text-sm font-medium" style={{ color: valueColor }}>
          {impact.display || '--'}
        </span>
      </HStack>

      {hasWarning && warningMessage ? (
        <NoteCard $tone={isWarning ? 'warning' : 'error'}>{warningMessage}</NoteCard>
      ) : null}
    </>
  )
}

export default SlippageControl
