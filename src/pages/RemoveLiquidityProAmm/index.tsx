import React, { useCallback, useState } from 'react'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId, WETH } from '@vutien/sdk-core'
import { Flex, Text } from 'rebass'
import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks'
import { useBurnProAmmActionHandlers, useBurnProAmmState, useDerivedProAmmBurnInfo } from 'state/burn/proamm/hooks'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { NonfungiblePositionManager, Position, toHex } from '@vutien/dmm-v3-sdk'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import { Trans, t } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import AppBody from 'pages/AppBody'
import { Wrapper } from 'components/swapv2/styleds'
import Loader from 'components/Loader'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { TYPE } from 'theme'
import { LightCard, BlackCard, OutlineCard } from 'components/Card'
import { MaxButton as MaxBtn } from 'pages/RemoveLiquidity/styled'
import Slider from 'components/Slider'
import CurrencyLogo from 'components/CurrencyLogo'
import { formatJSBIValue } from 'utils/formatBalance'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Toggle from 'components/Toggle'
import { AddRemoveTabs } from 'components/NavigationTabs'

import styled from 'styled-components/macro'
import Divider from 'components/Divider'
import RangeBadge from 'components/Badge/RangeBadge'

const Container = styled.div`
  width: calc(100% - 24px);
  margin: 24px auto 12px;
  max-width: 480px;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.background};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);

  padding: 0 20px 28px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0 16px 24px;
  `};
`

const MaxButton = styled(MaxBtn)`
  margin: 0;
  flex: unset;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  height: max-content;
  width: max-content;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    flex: 1;
  `}
`

const MaxButtonGroup = styled(Flex)`
  gap: 0.5rem;
  justify-content: flex-end;
  flex: 1;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 0.25rem
  `}
`

const PercentText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 28px !important;
    min-width: 72px !important;
  `}
`

export default function RemoveLiquidityProAmm({
  location,
  match: {
    params: { tokenId }
  }
}: RouteComponentProps<{ tokenId: string }>) {
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Redirect to={{ ...location, pathname: '/proamm/pool' }} />
  }
  return <Remove tokenId={parsedTokenId} />
}

function Remove({ tokenId }: { tokenId: BigNumber }) {
  const { position } = useProAmmPositionsFromTokenId(tokenId)
  const theme = useTheme()
  const { account, chainId, library } = useActiveWeb3React()

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)

  // burn state
  const { percent } = useBurnProAmmState()
  const {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0,
    feeValue1,
    outOfRange,
    error
  } = useDerivedProAmmBurnInfo(position, receiveWETH)
  const { onPercentSelect } = useBurnProAmmActionHandlers()
  const removed = position?.liquidity?.eq(0)

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)
  const deadline = useTransactionDeadline() // custom from users settings
  const allowedSlippage = useUserSlippageTolerance()
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()
  const addTransactionWithType = useTransactionAdder()

  console.log('=====aa', liquidityValue0?.toSignificant(100), liquidityValue1?.toSignificant(100))
  const burn = useCallback(async () => {
    setAttemptingTxn(true)
    if (
      !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      !deadline ||
      !account ||
      !chainId ||
      //   !feeValue0 ||
      //   !feeValue1 ||
      !positionSDK ||
      !liquidityPercentage ||
      !library
    ) {
      return
    }
    const partialPosition = new Position({
      pool: positionSDK.pool,
      liquidity: liquidityPercentage.multiply(positionSDK.liquidity).quotient,
      tickLower: positionSDK.tickLower,
      tickUpper: positionSDK.tickUpper
    })
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(positionSDK, {
      tokenId: tokenId.toString(),
      liquidityPercentage,
      slippageTolerance: basisPointsToPercent(allowedSlippage[0]),
      deadline: deadline.toString()
    })
    const txn = {
      to: positionManager.address,
      data: calldata,
      value
    }
    library
      .getSigner()
      .estimateGas(txn)
      .then(estimate => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate)
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setAttemptingTxn(false)

            addTransactionWithType(response, {
              type: 'Remove liquidity',
              summary:
                liquidityValue0?.toSignificant(6) +
                ' ' +
                liquidityValue0?.currency.symbol +
                ' and ' +
                liquidityValue1?.toSignificant(6) +
                ' ' +
                liquidityValue1?.currency.symbol
            })
            setTxnHash(response.hash)
          })
      })
      .catch(error => {
        setAttemptingTxn(false)
        console.error(error)
      })
  }, [
    positionManager,
    liquidityValue0,
    liquidityValue1,
    deadline,
    account,
    chainId,
    feeValue0,
    feeValue1,
    positionSDK,
    liquidityPercentage,
    library,
    tokenId,
    allowedSlippage,
    addTransaction
  ])
  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txnHash) {
      onPercentSelectForSlider(0)
    }
    setAttemptingTxn(false)
    setTxnHash('')
  }, [onPercentSelectForSlider, txnHash])

  const pendingText = t`Removing ${liquidityValue0?.toSignificant(6)} ${
    liquidityValue0?.currency?.symbol
  } and ${liquidityValue1?.toSignificant(6)} ${liquidityValue1?.currency?.symbol}`

  function modalHeader() {
    return (
      <AutoColumn gap={'sm'} style={{ padding: '16px' }}>
        burn info missing
        <ButtonPrimary mt="16px" onClick={burn}>
          <Trans>Remove</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }
  function modalFooter() {
    return <></>
  }
  const showCollectAsWeth = Boolean(
    liquidityValue0?.currency &&
      liquidityValue1?.currency &&
      (liquidityValue0.currency.isNative ||
        liquidityValue1.currency.isNative ||
        liquidityValue0.currency.wrapped.equals(WETH[liquidityValue0.currency.chainId as ChainId]) ||
        liquidityValue1.currency.wrapped.equals(WETH[liquidityValue1.currency.chainId as ChainId]))
  )
  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash}
        content={() => (
          <ConfirmationModalContent
            title={t`Remove Liquidity`}
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
            bottomContent={modalFooter}
          />
        )}
        pendingText={pendingText}
      />
      <Container>
        <AddRemoveTabs creating={false} adding={false} hideShare showTooltip={false} />
        <Divider />

        {position ? (
          <>
            <Flex marginTop="1.25rem" justifyContent="space-between" alignItems="center">
              <Flex alignItems="center">
                <DoubleCurrencyLogo
                  currency0={liquidityValue0?.currency}
                  currency1={liquidityValue1?.currency}
                  size={20}
                />
                <Text fontSize="16px" fontWeight="500" color={theme.subText}>
                  {liquidityValue0?.currency?.symbol} - {liquidityValue1?.currency?.symbol} | {position.fee / 100}%
                </Text>
              </Flex>
              <RangeBadge removed={removed} inRange={!outOfRange} />
            </Flex>

            <BlackCard padding="1rem" marginTop="1rem">
              <Text fontSize={12} color={theme.subText} fontWeight="500">
                <Trans>Amount</Trans>
              </Text>

              <Flex marginTop="0.5rem" sx={{ gap: '1rem' }} alignItems="center">
                <PercentText fontSize={36} fontWeight="500">
                  {percentForSlider}%
                </PercentText>

                <MaxButtonGroup>
                  <MaxButton onClick={() => onPercentSelect(25)}>
                    <Trans>25%</Trans>
                  </MaxButton>
                  <MaxButton onClick={() => onPercentSelect(50)}>
                    <Trans>50%</Trans>
                  </MaxButton>
                  <MaxButton onClick={() => onPercentSelect(75)}>
                    <Trans>75%</Trans>
                  </MaxButton>
                  <MaxButton onClick={() => onPercentSelect(100)}>
                    <Trans>Max</Trans>
                  </MaxButton>
                </MaxButtonGroup>
              </Flex>

              <Slider
                value={percentForSlider}
                onChange={onPercentSelectForSlider}
                size={16}
                style={{ width: '100%', margin: '1rem 0 0', padding: '0.75rem 0' }}
              />
            </BlackCard>

            {showCollectAsWeth && (
              <Flex justifyContent="flex-end" marginTop="0.75rem">
                <Text
                  color={theme.primary}
                  role="button"
                  onClick={() => setReceiveWETH(prev => !prev)}
                  fontSize={14}
                  fontWeight="500"
                  sx={{ cursor: 'pointer' }}
                >
                  {!receiveWETH ? <Trans>Receive Wrapped Token</Trans> : <Trans>Receive Native Token</Trans>}
                </Text>
              </Flex>
            )}

            <OutlineCard marginTop="1.25rem" padding="1rem">
              <AutoColumn gap="md">
                <RowBetween>
                  <Text fontSize={12} fontWeight={500} color={theme.subText}>
                    <Trans>POOLED {liquidityValue0?.currency?.symbol}:</Trans>
                  </Text>
                  <RowFixed>
                    <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                    <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                      {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                      {liquidityValue0?.currency.symbol}
                    </Text>
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <Text fontSize={12} fontWeight={500} color={theme.subText}>
                    <Trans>POOLED {liquidityValue1?.currency?.symbol}:</Trans>
                  </Text>
                  <RowFixed>
                    <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                    <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                      {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                      {liquidityValue1?.currency.symbol}
                    </Text>
                  </RowFixed>
                </RowBetween>

                {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
                  <>
                    <RowBetween>
                      <Text fontSize={16} fontWeight={500}>
                        <Trans>{feeValue0?.currency?.symbol} Fees Earned:</Trans>
                      </Text>
                      <RowFixed>
                        <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                          {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                        </Text>
                        <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue0?.currency} />
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <Text fontSize={16} fontWeight={500}>
                        <Trans>{feeValue1?.currency?.symbol} Fees Earned:</Trans>
                      </Text>
                      <RowFixed>
                        <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                          {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                        </Text>
                        <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue1?.currency} />
                      </RowFixed>
                    </RowBetween>
                  </>
                ) : null}
              </AutoColumn>
            </OutlineCard>

            <ButtonConfirmed
              style={{ marginTop: '28px' }}
              confirmed={false}
              disabled={removed || percent === 0 || !liquidityValue0}
              onClick={() => setShowConfirm(true)}
            >
              {removed ? <Trans>Closed</Trans> : error ?? <Trans>Remove</Trans>}
            </ButtonConfirmed>
          </>
        ) : (
          <Loader />
        )}
      </Container>
    </>
  )
}
