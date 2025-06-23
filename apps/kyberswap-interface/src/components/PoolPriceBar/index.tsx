import { Pair } from '@kyberswap/ks-sdk-classic'
import { Currency, Fraction, Percent, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import QuestionHelper from 'components/QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { ONE_BIPS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/mint/actions'
import { TYPE } from 'theme'
import { priceRangeCalc, priceRangeCalcByPair, useCurrencyConvertedToNative } from 'utils/dmm'

const DEFAULT_MIN_PRICE = '0.00'
const DEFAULT_MAX_PRICE = '♾️'

const Section = styled(Card)`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
`

const OutlineCard3 = styled(Section)`
  text-align: left;
`

const ChevronUp2 = styled(ChevronUp)`
  color: ${({ theme }) => theme.text};
`
const ChevronDown2 = styled(ChevronDown)`
  color: ${({ theme }) => theme.text};
`

const PoolPriceBarWrapper = styled.div<{ isAdd?: boolean }>`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 8px;

  @media only screen and (min-width: 1000px) {
    flex-direction: row;
  }
`

const PoolPriceBarItem = styled.div<{ isAdd?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media only screen and (min-width: 1000px) {
    justify-content: flex-end;
    flex-direction: ${({ isAdd }) => (isAdd ? 'row' : 'column-reverse')};
    flex: ${({ isAdd }) => (isAdd ? 1 : 'unset')};
  }
`

const DefaultPriceRange = () => {
  return (
    <>
      <TYPE.black fontWeight={400}>Max: {DEFAULT_MAX_PRICE}</TYPE.black>
      <TYPE.black fontWeight={400}>Min: {DEFAULT_MIN_PRICE}</TYPE.black>
    </>
  )
}

const InvalidAMPPriceRange = () => {
  return (
    <>
      <TYPE.black>-</TYPE.black>
      <TYPE.black>-</TYPE.black>
    </>
  )
}

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price,
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Price<Currency, Currency>
  pair: Pair | null | undefined
}) {
  const theme = useTheme()
  const above768 = useMedia('(min-width: 768px)')
  const nativeA = useCurrencyConvertedToNative(currencies[Field.CURRENCY_A] as Currency)
  const nativeB = useCurrencyConvertedToNative(currencies[Field.CURRENCY_B] as Currency)

  return (
    <PoolPriceBarWrapper isAdd={!noLiquidity}>
      {noLiquidity && (
        <>
          <PoolPriceBarItem>
            <Text fontWeight={400} fontSize={14} color={theme.subText} pt={1} textAlign="center">
              {nativeB?.symbol} <Trans>per</Trans> {nativeA?.symbol}
            </Text>
            <TYPE.black fontWeight={400} fontSize={14} color={theme.text}>
              {price?.toSignificant(10) ?? '-'}
            </TYPE.black>
          </PoolPriceBarItem>

          <PoolPriceBarItem>
            <Text fontWeight={400} fontSize={14} color={theme.subText} pt={1} textAlign="center">
              {nativeA?.symbol} <Trans>per</Trans> {nativeB?.symbol}
            </Text>
            <TYPE.black fontWeight={400} fontSize={14} color={theme.text}>
              {price?.invert()?.toSignificant(10) ?? '-'}
            </TYPE.black>
          </PoolPriceBarItem>
        </>
      )}

      <PoolPriceBarItem isAdd={!noLiquidity}>
        <Text fontWeight={400} fontSize={14} color={theme.subText} pt={noLiquidity ? 1 : 0} style={{ flex: 1 }}>
          {noLiquidity ? <Trans>Share of Pool</Trans> : <Trans>Your Share of Pool</Trans>}
        </Text>
        <TYPE.black
          fontWeight={400}
          color={theme.text}
          fontSize={14}
          style={{ flex: noLiquidity ? 'none' : 1 }}
          textAlign={above768 ? 'left' : 'right'}
        >
          {noLiquidity && price
            ? '100'
            : poolTokenPercentage && poolTokenPercentage.greaterThan('0')
            ? poolTokenPercentage?.lessThan(ONE_BIPS)
              ? '<0.01'
              : poolTokenPercentage?.toFixed(2)
            : '0'}
          %
        </TYPE.black>
      </PoolPriceBarItem>
    </PoolPriceBarWrapper>
  )
}

export function ToggleComponent({
  children,
  title = '',
  question = '',
}: {
  children: ReactNode
  title: string
  question?: string
}) {
  const theme = useTheme()
  const [showDetails, setShowDetails] = useState(true)
  return (
    <>
      <RowBetween style={{ paddingBottom: '14px', borderBottom: `1px solid ${theme.border}` }}>
        <AutoRow>
          <Text fontWeight={500} fontSize={16} color={theme.text}>
            {title}
          </Text>
          {question && <QuestionHelper text={question} />}
        </AutoRow>
        <RowFixed gap="8px">
          <ButtonEmpty
            padding="6px 8px"
            borderRadius="12px"
            width="fit-content"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronUp2 size="20" style={{ marginLeft: '10px' }} />
            ) : (
              <ChevronDown2 size="20" style={{ marginLeft: '10px' }} />
            )}
          </ButtonEmpty>
        </RowFixed>
      </RowBetween>
      {showDetails && <>{children}</>}
    </>
  )
}

export function PoolPriceRangeBarToggle({
  currencies,
  price,
  pair,
  amplification,
}: {
  currencies: { [field in Field]?: Currency }
  price?: Price<Currency, Currency> | Fraction
  pair: Pair | null | undefined
  amplification?: Fraction
}) {
  return (
    <OutlineCard3>
      <ToggleComponent
        title={t`Active Price Range`}
        question={t`Tradable token pair price range for this pool based on AMP. If the price goes below or above this range, the pool may become inactive.`}
      >
        <PoolPriceRangeBar currencies={currencies} price={price} pair={pair} amplification={amplification} />
      </ToggleComponent>
    </OutlineCard3>
  )
}

export function PoolPriceRangeBar({
  currencies,
  price,
  pair,
  amplification,
}: {
  currencies: { [field in Field]?: Currency }
  price?: Price<Currency, Currency> | Fraction
  pair: Pair | null | undefined
  amplification?: Fraction
}) {
  const theme = useTheme()
  const nativeA = useCurrencyConvertedToNative(currencies[Field.CURRENCY_A] as Currency)
  const nativeB = useCurrencyConvertedToNative(currencies[Field.CURRENCY_B] as Currency)

  const wrappedA = nativeA?.wrapped

  const existedPriceRange = () => {
    const amp = amplification?.divide(JSBI.BigInt(10000))
    const show = !!pair && !!priceRangeCalcByPair(pair)[0][0]
    return (
      <AutoColumn gap="md">
        <AutoRow justify="space-between" gap="4px">
          <AutoColumn gap="4px">
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {nativeB?.symbol} <Trans>Per</Trans> {nativeA?.symbol}
            </Text>
            {!amp || amp.lessThan('1') ? (
              <InvalidAMPPriceRange />
            ) : show && !!pair ? (
              <>
                <TYPE.black color={theme.text} fontWeight={400}>
                  Max:{' '}
                  {priceRangeCalcByPair(pair)[wrappedA?.symbol === pair.token0.symbol ? 0 : 1][1]?.toSignificant(6) ??
                    '-'}
                </TYPE.black>
                <TYPE.black color={theme.text} fontWeight={400}>
                  Min:{' '}
                  {priceRangeCalcByPair(pair)[wrappedA?.symbol === pair.token0.symbol ? 0 : 1][0]?.toSignificant(6) ??
                    '-'}
                </TYPE.black>
              </>
            ) : (
              <DefaultPriceRange />
            )}
          </AutoColumn>
          <AutoColumn gap="4px" justify="end">
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {nativeA?.symbol} <Trans>Per</Trans> {nativeB?.symbol}
            </Text>
            {!amp || amp.lessThan('1') ? (
              <InvalidAMPPriceRange />
            ) : show && !!pair ? (
              <>
                <TYPE.black color={theme.text} fontWeight={400}>
                  Max:{' '}
                  {priceRangeCalcByPair(pair)[wrappedA?.symbol === pair.token0.symbol ? 1 : 0][1]?.toSignificant(6) ??
                    '-'}
                </TYPE.black>
                <TYPE.black color={theme.text} fontWeight={400}>
                  Min:{' '}
                  {priceRangeCalcByPair(pair)[wrappedA?.symbol === pair.token0.symbol ? 1 : 0][0]?.toSignificant(6) ??
                    '-'}
                </TYPE.black>
              </>
            ) : (
              <DefaultPriceRange />
            )}
          </AutoColumn>
        </AutoRow>
      </AutoColumn>
    )
  }

  const newPriceRange = () => {
    const amp = amplification?.divide(JSBI.BigInt(10000))
    const show = !!priceRangeCalc(price, amp)[0]
    return (
      <AutoColumn gap="md">
        <AutoRow justify="space-between" gap="4px">
          <AutoColumn gap="sm">
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {nativeB?.symbol} <Trans>Per</Trans> {nativeA?.symbol}
            </Text>
            {!amp || amp.lessThan('1') ? (
              <InvalidAMPPriceRange />
            ) : show ? (
              <>
                <TYPE.black color={theme.text}>
                  Max: {priceRangeCalc(price, amp)[0]?.toSignificant(6) ?? '-'}
                </TYPE.black>
                <TYPE.black color={theme.text}>
                  Min: {priceRangeCalc(price, amp)[1]?.toSignificant(6) ?? '-'}
                </TYPE.black>
              </>
            ) : (
              <DefaultPriceRange />
            )}
          </AutoColumn>
          <AutoColumn gap="sm" justify="end">
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {nativeA?.symbol} <Trans>Per</Trans> {nativeB?.symbol}
            </Text>
            {!amp || amp.lessThan('1') ? (
              <InvalidAMPPriceRange />
            ) : show ? (
              <>
                <TYPE.black color={theme.text}>
                  Max: {priceRangeCalc(price?.invert(), amp)[0]?.toSignificant(6) ?? '-'}
                </TYPE.black>
                <TYPE.black color={theme.text}>
                  Min: {priceRangeCalc(price?.invert(), amp)[1]?.toSignificant(6) ?? '-'}
                </TYPE.black>
              </>
            ) : (
              <DefaultPriceRange />
            )}
          </AutoColumn>
        </AutoRow>
      </AutoColumn>
    )
  }

  return <>{!!pair ? existedPriceRange() : newPriceRange()}</>
}
