import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { memo, useCallback, useMemo } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { Swap as SwapIcon } from 'components/Icons'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { tryParseAmount } from 'state/swap/hooks'
import { shortenAddress } from 'utils'

import TradePrice from '../TradePrice'
import { LimitOrderSwapState } from './type'

const Container = styled.div`
  padding: 25px 30px;
  width: 100%;
`
const Row = styled.div`
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const Value = styled.div`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  display: flex;
  gap: 5px;
  align-items: center;
`
const Label = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`
const formatValue = (amount: string, token: Currency | undefined) =>
  !amount || !token ? '' : tryParseAmount(amount, token)?.toSignificant()
const styleLogo = { width: 20, height: 20 }
export default memo(function Disclaimer({
  onSubmit,
  currencyIn,
  currencyOut,
  onDismiss,
  swapState,
  outputAmount,
  inputAmount,
  expire,
  expectRate,
  marketPrice,
}: {
  onSubmit: () => void
  onDismiss: () => void
  swapState: LimitOrderSwapState
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
  outputAmount: string
  expire: number
  expectRate: string
  marketPrice: Price<Currency, Currency> | undefined
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()

  const listData = useMemo(() => {
    return [
      {
        label: t`I want to pay`,
        content: currencyIn && (
          <Value>
            <CurrencyLogo currency={currencyIn} style={styleLogo} />
            <Text>
              {formatValue(inputAmount, currencyIn)} {currencyIn?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`and receive at least`,
        content: currencyOut && (
          <Value>
            <CurrencyLogo currency={currencyOut} style={styleLogo} />
            <Text>
              {formatValue(outputAmount?.toString(), currencyOut)} {currencyOut?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`when`,
        content: account && (
          <Value style={{ display: 'flex', alignItems: 'center' }}>
            <Text>{`1 ${currencyIn?.symbol} is equal to ${expectRate} ${currencyOut?.symbol}`} </Text>
            <SwapIcon rotate={90} size={19} />
          </Value>
        ),
      },
      {
        label: t`before the order expires on`,
        content: account && (
          <Value>
            <Text>{dayjs(Date.now() + expire).format('DD/MM/YYYY hh:mm')}</Text>
          </Value>
        ),
      },
    ]
  }, [account, currencyIn, currencyOut, inputAmount, outputAmount, expire, expectRate])

  const confirmationContent = useCallback(
    () =>
      swapState.swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapState.swapErrorMessage} />
      ) : (
        <Container>
          <Flex flexDirection={'column'} style={{ gap: 25 }}>
            <Flex justifyContent={'space-between'}>
              <Flex color={theme.text} alignItems="center" style={{ gap: 8 }}>
                <Text fontSize={20}>{t`Review your order`}</Text>
              </Flex>
              <X onClick={onDismiss} style={{ cursor: 'pointer' }} color={theme.subText} />
            </Flex>

            <Flex style={{ gap: 20 }} flexDirection="column">
              {listData.map(item => (
                <Row key={item.label}>
                  <Label>{item.label}</Label>
                  {item.content}
                </Row>
              ))}
            </Flex>

            <Flex
              flexDirection={'column'}
              style={{
                borderRadius: 16,
                padding: '14px 18px',
                border: `1px solid ${theme.border}`,
                gap: 8,
                fontSize: 13,
              }}
            >
              <Row>
                <Label>
                  <Trans>Current Market Price</Trans>
                </Label>
                <Value>
                  <TradePrice price={marketPrice} style={{ color: theme.text }} />
                </Value>
              </Row>
            </Flex>

            <Text fontSize={12} fontStyle="italic" color={theme.subText}>
              <Trans>Note: Your existing order will be automatically cancelled and a new order will be created.</Trans>
            </Text>
            <ButtonPrimary onClick={onSubmit}>
              <Trans>Place Order</Trans>
            </ButtonPrimary>
          </Flex>
        </Container>
      ),
    [onDismiss, swapState.swapErrorMessage, listData, onSubmit, theme, marketPrice],
  )

  return (
    <TransactionConfirmationModal
      hash={swapState.txHash}
      isOpen={swapState.showConfirm}
      onDismiss={onDismiss}
      attemptingTxn={swapState.attemptingTxn}
      content={confirmationContent}
      pendingText={swapState.pendingText || t`Placing order`}
    />
  )
})
