import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import { RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APP_PATHS, BIPS_BASE, CHAINS_SUPPORT_FEE_CONFIGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { isSupportKyberDao, useGasRefundTier } from 'hooks/kyberdao'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ExternalLink, TYPE } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'

const IconWrapper = styled.div<{ $flip: boolean }>`
  transform: rotate(${({ $flip }) => (!$flip ? '0deg' : '-180deg')});
  transition: transform 300ms;
`
const ContentWrapper = styled(AutoColumn)<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => ($expanded ? '500px' : 0)};
  margin-top: ${({ $expanded }) => ($expanded ? '12px' : 0)};
  transition: margin-top 300ms ease, height 300ms ease;
  overflow: hidden;
`

type WrapperProps = {
  $visible: boolean
  $disabled: boolean
}
const Wrapper = styled.div.attrs<WrapperProps>(props => ({
  'data-visible': props.$visible,
  'data-disabled': props.$disabled,
}))<WrapperProps>`
  display: none;
  padding: 0;
  width: 100%;
  max-width: 425px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  max-height: 0;
  transition: height 300ms ease-in-out, transform 300ms;
  border: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;

  &[data-visible='true'] {
    display: block;
    padding: 12px 12px;
    max-height: max-content;
    color: ${({ theme }) => theme.text};
  }

  &[data-disabled='true'] {
    color: ${({ theme }) => theme.subText};
  }
`

const formatPercent = (v: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    style: 'percent',
  })

  return formatter.format(v)
}

type TooltipTextOfSwapFeeProps = {
  feeBips: string | undefined
  feeAmountText: string
}
export const TooltipTextOfSwapFee: React.FC<TooltipTextOfSwapFeeProps> = ({ feeBips, feeAmountText }) => {
  const feePercent = formatPercent(Number(feeBips) / Number(BIPS_BASE.toString()))
  const hereLink = (
    <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/instantly-swap-at-superior-rates#swap-fees-supporting-transactions-on-low-trading-volume-chains">
      <b>
        <Trans>here</Trans> ↗
      </b>
    </ExternalLink>
  )

  if (!feeAmountText || !feePercent) {
    return <Trans>Read more about the fees {hereLink}</Trans>
  }

  return (
    <Trans>
      A {feePercent} fee ({feeAmountText}) will incur on this swap. The Est. Output amount you see above is inclusive of
      this fee. Read more about the fees {hereLink}
    </Trans>
  )
}

const SwapFee: React.FC = () => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const { routeSummary } = useSwapFormContext()

  if (!CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId)) {
    return null
  }

  const {
    formattedAmount: feeAmount = '',
    formattedAmountUsd: feeAmountUsd = '',
    currency = undefined,
  } = routeSummary?.fee || {}

  const feeAmountWithSymbol = feeAmount && currency?.symbol ? `${feeAmount} ${currency.symbol}` : ''

  return (
    <RowBetween>
      <RowFixed>
        <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
          <MouseoverTooltip
            text={
              <TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={routeSummary?.extraFee?.feeAmount} />
            }
            placement="right"
          >
            <Trans>Est. Swap Fee</Trans>
          </MouseoverTooltip>
        </TextDashed>
      </RowFixed>

      <RowFixed>
        <TYPE.black color={theme.text} fontSize={12}>
          {feeAmountUsd || feeAmountWithSymbol || '--'}
        </TYPE.black>
      </RowFixed>
    </RowBetween>
  )
}

type Props = {
  routeSummary: DetailedRouteSummary | undefined
  slippage: number
}
const TradeSummary: React.FC<Props> = ({ routeSummary, slippage }) => {
  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()
  const { gasRefundPerCentage } = useGasRefundTier()
  const [expanded, setExpanded] = useState(true)
  const [alreadyVisible, setAlreadyVisible] = useState(false)
  const { parsedAmountOut, priceImpact, gasUsd } = routeSummary || {}
  const hasTrade = !!routeSummary?.route

  const priceImpactResult = checkPriceImpact(priceImpact)

  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <Text
        as="span"
        sx={{
          color: theme.text,
          fontWeight: '500',
          whiteSpace: 'nowrap',
        }}
      >
        {formattedNum(minimumAmountOut.toSignificant(10), false, 10)} {currencyOut.symbol}
      </Text>
    ) : (
      ''
    )

  const { mixpanelHandler } = useMixpanel()
  const handleClickExpand = () => {
    setExpanded(prev => !prev)
    mixpanelHandler(MIXPANEL_TYPE.SWAP_MORE_INFO_CLICK, { option: expanded ? 'Close' : 'Open' })
  }

  useEffect(() => {
    if (hasTrade) {
      setAlreadyVisible(true)
    }
  }, [hasTrade])

  return (
    <Wrapper $visible={alreadyVisible} $disabled={!hasTrade}>
      <AutoColumn>
        <RowBetween style={{ cursor: 'pointer' }} onClick={handleClickExpand} role="button">
          <Text fontSize={12} fontWeight={500} color={theme.text}>
            <Trans>MORE INFORMATION</Trans>
          </Text>
          <IconWrapper $flip={expanded}>
            <DropdownSVG color={theme.text} />
          </IconWrapper>
        </RowBetween>
        <ContentWrapper $expanded={expanded} gap="0.75rem">
          <Divider />
          <RowBetween>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip
                  width="200px"
                  text={<Trans>You will receive at least this amount or your transaction will revert</Trans>}
                  placement="right"
                >
                  <Trans>Minimum Received</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>
            <RowFixed>
              <TYPE.black color={theme.text} fontSize={12}>
                {minimumAmountOutStr || '--'}
              </TYPE.black>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip text={<Trans>Estimated network fee for your transaction</Trans>} placement="right">
                  <Trans>Est. Gas Fee</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {gasUsd ? formattedNum(gasUsd, true) : '--'}
            </TYPE.black>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip
                  text={
                    <div>
                      <Trans>Estimated change in price due to the size of your transaction.</Trans>
                      <Trans>
                        <Text fontSize={12}>
                          Read more{' '}
                          <a
                            href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <b>here ↗</b>
                          </a>
                        </Text>
                      </Trans>
                    </div>
                  }
                  placement="right"
                >
                  <Trans>Price Impact</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>
            <TYPE.black
              fontSize={12}
              color={priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text}
            >
              {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
            </TYPE.black>
          </RowBetween>

          {isSupportKyberDao(chainId) && (
            <RowBetween>
              <RowFixed>
                <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                  <MouseoverTooltip
                    text={
                      <Trans>
                        Stake KNC in KyberDAO to get gas refund. Read more{' '}
                        <ExternalLink href="https://docs.kyberswap.com/governance/knc-token/gas-refund-program">
                          here ↗
                        </ExternalLink>
                      </Trans>
                    }
                    placement="right"
                  >
                    <Trans>Gas Refund</Trans>
                  </MouseoverTooltip>
                </TextDashed>
              </RowFixed>
              <NavLink
                to={APP_PATHS.KYBERDAO_KNC_UTILITY}
                onClick={() => {
                  mixpanelHandler(MIXPANEL_TYPE.GAS_REFUND_SOURCE_CLICK, { source: 'Swap_page_more_info' })
                }}
              >
                <ButtonLight padding="0px 8px" width="fit-content" fontSize={10} fontWeight={500} lineHeight="16px">
                  <Trans>{account ? gasRefundPerCentage * 100 : '--'}% Refund</Trans>
                </ButtonLight>
              </NavLink>
            </RowBetween>
          )}
          <SwapFee />
        </ContentWrapper>
      </AutoColumn>
    </Wrapper>
  )
}

export default TradeSummary
