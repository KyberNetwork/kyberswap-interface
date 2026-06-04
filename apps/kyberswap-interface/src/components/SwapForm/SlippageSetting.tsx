import { Trans, t } from '@lingui/macro'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import SlippageControl from 'components/SlippageControl'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { Stack } from 'components/Stack'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import WarningNote from 'components/WarningNote'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY } from 'constants/index'
import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { SLIPPAGE_STATUS, SLIPPAGE_WARNING_MESSAGES, checkRangeSlippage, formatSlippage } from 'utils/slippage'

export const DropdownIcon = ({
  size,
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { size?: number }) => (
  <div
    {...rest}
    style={{ width: size || 12, height: size || 12, ...rest.style }}
    className={cn(
      'ml-1 flex items-center justify-center rounded-full p-0.5 text-white2 transition-all duration-200 ease-in-out',
      'data-[flip=true]:rotate-180',
      'data-[highlight=true]:animate-[ks-slippage-highlight_2s_infinite_alternate_ease-in-out] data-[highlight=true]:bg-primary/60',
      'data-[warning=true]:text-warning/90',
      className,
    )}
  >
    {children}
  </div>
)

type Props = {
  rightComponent?: ReactNode
  tooltip?: ReactNode
  slippageInfo?: {
    message: string
    isHigh: boolean
    isLow: boolean
    default: number
    presets: number[]
  }
}
const SlippageSetting = ({ rightComponent, tooltip, slippageInfo }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [expanded, setExpanded] = useState(false)
  const [isHighlight, setIsHighlight] = useState(false)
  const [triedSimulatedSlippage, setTriedSimulatedSlippage] = useState(false)
  const [isDegenMode] = useDegenModeManager()

  const { rawSlippage, setRawSlippage, isSlippageControlPinned } = useSlippageSettingByPage()

  const defaultSlippage = useDefaultSlippageByPair()
  const defaultSlp = slippageInfo ? slippageInfo.default : defaultSlippage

  const pairCategory = usePairCategory()
  const slippageStatus = slippageInfo
    ? slippageInfo.isHigh
      ? SLIPPAGE_STATUS.HIGH
      : slippageInfo.isLow
      ? SLIPPAGE_STATUS.LOW
      : SLIPPAGE_STATUS.NORMAL
    : checkRangeSlippage(rawSlippage, pairCategory)
  const isWarningSlippage = slippageInfo
    ? slippageInfo.isHigh || slippageInfo.isLow
    : slippageStatus !== SLIPPAGE_STATUS.NORMAL

  const msg = slippageInfo?.message ?? (SLIPPAGE_WARNING_MESSAGES[slippageStatus]?.[pairCategory] || '')

  const options = useMemo(
    () =>
      slippageInfo
        ? slippageInfo.presets
        : pairCategory === 'highVolatilityPair'
        ? DEFAULT_SLIPPAGES_HIGH_VOTALITY
        : DEFAULT_SLIPPAGES,
    [pairCategory, slippageInfo],
  )

  const actionFromUrl = searchParams.get('action')
  useEffect(() => {
    if (actionFromUrl === 'open-slippage-panel') {
      setExpanded(true)
      setTriedSimulatedSlippage(true)
      searchParams.delete('action')
      setSearchParams(searchParams)
      setIsHighlight(true)
      setTimeout(() => {
        setIsHighlight(false)
      }, 4000)
    }
  }, [actionFromUrl, searchParams, setSearchParams])

  if (!isSlippageControlPinned) {
    return null
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-between gap-1 text-subText">
        <div className="flex items-center gap-1">
          <TextDashed fontSize={12} fontWeight={500} className="flex h-fit items-center leading-none text-subText">
            <MouseoverTooltip
              placement="right"
              text={
                tooltip || (
                  <span>
                    <Trans>
                      During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                      <ExternalLink
                        href={
                          'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'
                        }
                      >
                        here ↗
                      </ExternalLink>
                    </Trans>
                  </span>
                )
              }
            >
              <Trans>Max Slippage</Trans>:
            </MouseoverTooltip>
          </TextDashed>
          <div role="button" onClick={() => setExpanded(e => !e)} className="flex cursor-pointer items-center gap-1">
            <span className={cn('text-sm font-medium leading-none', isWarningSlippage ? 'text-warning' : 'text-text')}>
              {msg ? (
                <MouseoverTooltip text={slippageInfo ? msg : t`Your slippage ${msg}`}>
                  {formatSlippage(rawSlippage)}
                </MouseoverTooltip>
              ) : (
                formatSlippage(rawSlippage)
              )}
            </span>

            <DropdownIcon data-flip={expanded} data-highlight={!expanded && defaultSlp !== rawSlippage}>
              <svg width="10" height="6" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.70711 3.29289L5.29289 1.70711C5.92286 1.07714 5.47669 0 4.58579 0H1.41421C0.523309 0 0.0771406 1.07714 0.707105 1.70711L2.29289 3.29289C2.68342 3.68342 3.31658 3.68342 3.70711 3.29289Z"
                  fill="#FAFAFA"
                />
              </svg>
            </DropdownIcon>
          </div>
        </div>
        {rightComponent}
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className={cn('min-h-0', isHighlight ? 'overflow-visible' : 'overflow-hidden')}>
          <Stack className="gap-3 pt-2">
            <Stack className="gap-1">
              <SlippageControl
                isHighlight={isHighlight}
                rawSlippage={rawSlippage}
                setRawSlippage={setRawSlippage}
                isWarning={isWarningSlippage}
                options={options}
              />
              {isDegenMode && expanded && (
                <span className="px-1.5 py-1 text-xs font-medium text-subText">
                  <Trans>Maximum slippage allowed for Degen mode is 50%</Trans>
                </span>
              )}
              {Math.abs(defaultSlp - rawSlippage) / defaultSlp > 0.2 && !triedSimulatedSlippage && (
                <div
                  role="button"
                  onClick={() => setRawSlippage(defaultSlp)}
                  className="flex w-fit cursor-pointer items-center gap-1 px-1 text-xs text-primary"
                >
                  <MouseoverTooltip text={<Trans>Dynamic entry based on trading pair.</Trans>} placement="bottom">
                    <span className="border-b border-dotted border-primary">
                      <Trans>Suggestion</Trans>
                    </span>
                  </MouseoverTooltip>
                  {(defaultSlp * 100) / 10_000}%
                </div>
              )}
            </Stack>

            {slippageInfo ? msg && <WarningNote shortText={msg} /> : <SlippageWarningNote rawSlippage={rawSlippage} />}
          </Stack>
        </div>
      </div>
    </div>
  )
}

export default SlippageSetting
