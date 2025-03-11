import styled from 'styled-components'

import { useLastTruthy } from 'hooks/useLast'
import { OutputBridgeInfo } from 'state/crossChain/hooks'
import { RouteData } from 'state/crossChain/reducer'

import {
  AdvancedSwapDetails,
  AdvancedSwapDetailsProps,
  TradeSummaryBridge,
  TradeSummaryCrossChain,
} from './AdvancedSwapDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding: ${({ show }) => (show ? '12px' : '0')};
  width: 100%;
  max-width: 425px;
  border-radius: 16px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.buttonBlack};
  border: solid 1px ${({ theme, show }) => (show ? theme.border : 'none')};
  max-height: ${({ show }) => (show ? 'auto' : '0')};
  transition: height 300ms ease-in-out, transform 300ms;
  overflow: hidden;
  margin-top: 20px;
`

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const lastTrade = useLastTruthy(trade)

  return (
    <AdvancedDetailsFooter show={Boolean(trade)}>
      <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
    </AdvancedDetailsFooter>
  )
}

export function AdvancedSwapDetailsDropdownBridge({
  outputInfo,
  className,
}: {
  outputInfo: OutputBridgeInfo
  className?: string
}) {
  return (
    <AdvancedDetailsFooter show={true} style={{ marginTop: 0 }} className={className}>
      <TradeSummaryBridge outputInfo={outputInfo} />
    </AdvancedDetailsFooter>
  )
}

export function AdvancedSwapDetailsDropdownCrossChain({
  route,
  className,
}: {
  route: RouteData | undefined
  className?: string
}) {
  return (
    <AdvancedDetailsFooter show={true} style={{ marginTop: 0 }} className={className}>
      <TradeSummaryCrossChain route={route} />
    </AdvancedDetailsFooter>
  )
}
