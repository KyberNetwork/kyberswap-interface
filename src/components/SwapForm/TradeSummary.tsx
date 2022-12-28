import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
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
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { TYPE } from 'theme'
import { FeeConfig } from 'types/metaAggregator'
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

type Props = {
  feeConfig: FeeConfig | undefined
  slippage: number
  amountInUsd: string | undefined
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  priceImpact: number | undefined
  gasUsd: string | undefined
}

const TradeSummary: React.FC<Props> = ({ feeConfig, slippage, amountInUsd, parsedAmountOut, priceImpact, gasUsd }) => {
  const hasTrade = useSelector((state: AppState) => !!state.swap.routeSummary)
  const theme = useTheme()
  const [show, setShow] = useState(feeConfig ? true : false)

  const formattedFeeAmountUsd = amountInUsd ? getFormattedFeeAmountUsd(Number(amountInUsd), feeConfig?.feeAmount) : 0
  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined

  return (
    <Wrapper show={hasTrade}>
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
                <Trans>Minimum Received</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Minimum amount you will receive or your transaction will revert`} />
            </RowFixed>
            <RowFixed>
              <TYPE.black color={theme.text} fontSize={12}>
                {minimumAmountOut
                  ? `${formattedNum(minimumAmountOut.toSignificant(10) || '0')} ${minimumAmountOut.currency.symbol}`
                  : '--'}
              </TYPE.black>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Gas Fee</Trans>
              </TYPE.black>

              <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {gasUsd ? formattedNum(gasUsd, true) : '--'}
            </TYPE.black>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Price Impact</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Estimated change in price due to the size of your transaction`} />
            </RowFixed>
            <TYPE.black
              fontSize={12}
              color={
                priceImpact ? (priceImpact > 15 ? theme.red : priceImpact > 5 ? theme.warning : theme.text) : theme.text
              }
            >
              {priceImpact === -1 || !priceImpact
                ? '--'
                : priceImpact > 0.01
                ? priceImpact.toFixed(2) + '%'
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
    </Wrapper>
  )
}

export default TradeSummary
