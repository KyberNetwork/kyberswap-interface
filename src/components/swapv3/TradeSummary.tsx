import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useLastTruthy } from 'hooks/useLast'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { useOutputCurrency } from 'state/swap/hooks'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'

import { getFormattedFeeAmountUsd } from './utils'

const IconWrapper = styled.div<{ show: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ show }) => (!show ? '0deg' : '-180deg')});
  transition: transform 300ms;
`
const ContentWrapper = styled(AutoColumn)<{ show: boolean }>`
  max-height: ${({ show }) => (show ? '500px' : 0)};
  margin-top: ${({ show }) => (show ? '12px' : 0)};
  transition: margin-top 300ms ease, height 300ms ease;
  overflow: hidden;
`

const Wrapper = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'block' : 'none')};
  padding: ${({ show }) => (show ? '12px 16px' : '0')};
  width: 100%;
  max-width: 425px;
  border-radius: 16px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme, show }) => (show ? theme.border : 'none')};
  max-height: ${({ show }) => (show ? 'auto' : '0')};
  transition: height 300ms ease-in-out, transform 300ms;
  overflow: hidden;
`

const SummaryContent = () => {
  const { isEVM } = useActiveWeb3React()
  const theme = useTheme()
  const feeConfig = useSelector((state: AppState) => state.swap.feeConfig)
  const slippage = useSelector((state: AppState) => state.user.userSlippageTolerance)
  const storedTrade = useSelector((state: AppState) => state.swap.routeSummary)
  const lastTrade = useLastTruthy(storedTrade)
  const trade = storedTrade || lastTrade || undefined
  const [show, setShow] = useState(feeConfig ? true : false)
  const amountOut = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountOut)
  const currencyOut = useOutputCurrency()

  const isExactIn = true
  const minimumAmountOut = amountOut ? minimumAmountAfterSlippage(amountOut, slippage) : undefined
  const formattedFeeAmountUsd = getFormattedFeeAmountUsd(Number(trade?.amountInUsd || 0), feeConfig?.feeAmount)

  if (!trade) {
    return null
  }

  return (
    <AutoColumn>
      <RowBetween style={{ cursor: 'pointer' }} onClick={() => setShow(prev => !prev)} role="button">
        <Text fontSize={12} fontWeight={500} color={theme.text}>
          <Trans>MORE INFORMATION</Trans>
        </Text>
        <IconWrapper show={show}>
          <DropdownSVG />
        </IconWrapper>
      </RowBetween>
      <ContentWrapper show={show} gap="0.75rem">
        <Divider />
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              {isExactIn ? t`Minimum Received` : t`Maximum Sold`}
            </TYPE.black>
            <InfoHelper size={14} text={t`Minimum amount you will receive or your transaction will revert`} />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {minimumAmountOut && currencyOut ? (
                <>
                  {formattedNum(minimumAmountOut.toSignificant(10) || '0')} {currencyOut.symbol}
                </>
              ) : (
                '--'
              )}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        {isEVM && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Gas Fee</Trans>
              </TYPE.black>

              <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {trade.gasUsd ? formattedNum(trade.gasUsd?.toString(), true) : '--'}
            </TYPE.black>
          </RowBetween>
        )}

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              <Trans>Price Impact</Trans>
            </TYPE.black>
            <InfoHelper size={14} text={t`Estimated change in price due to the size of your transaction`} />
          </RowFixed>
          <TYPE.black
            fontSize={12}
            color={trade.priceImpact > 15 ? theme.red : trade.priceImpact > 5 ? theme.warning : theme.text}
          >
            {trade.priceImpact === -1
              ? '--'
              : trade.priceImpact > 0.01
              ? trade.priceImpact.toFixed(2) + '%'
              : '< 0.01%'}
          </TYPE.black>
        </RowBetween>

        {feeConfig && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Referral Fee</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Commission fee to be paid directly to your referrer`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {formattedFeeAmountUsd}
            </TYPE.black>
          </RowBetween>
        )}
      </ContentWrapper>
    </AutoColumn>
  )
}

const TradeSummary = () => {
  const hasTrade = useSelector((state: AppState) => !!state.swap.routeSummary)
  return (
    <Wrapper show={hasTrade}>
      <SummaryContent />
    </Wrapper>
  )
}

export default TradeSummary
