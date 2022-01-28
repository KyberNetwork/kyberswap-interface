import React, { useCallback, useState } from 'react'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId, Currency, CurrencyAmount, WETH } from '@vutien/sdk-core'
import { Flex, Text } from 'rebass'
import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks'
import { useBurnProAmmActionHandlers, useBurnProAmmState, useDerivedProAmmBurnInfo } from 'state/burn/proamm/hooks'
import { useBurnActionHandlers } from 'state/burn/hooks'
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
import { LightCard } from 'components/Card'
import { MaxButton } from 'pages/RemoveLiquidity/styled'
import Slider from 'components/Slider'
import CurrencyLogo from 'components/CurrencyLogo'
import { formatJSBIValue } from 'utils/formatBalance'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Toggle from 'components/Toggle'
import { ONE } from '@vutien/dmm-v2-sdk'

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
    console.log(
      '=====',
      toHex(positionSDK.liquidity),
      {
        tokenId: tokenId.toString(),
        liquidityPercentage: toHex(partialPosition.liquidity),
        deadline: deadline.toString()
      },
      calldata,
      value
    )
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
              type: 'Remove liquid',
              summary: 'Remove liquid'
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
    <AutoColumn>
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
      <AppBody>
        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">
              <RowBetween>
                <RowFixed>
                  <DoubleCurrencyLogo
                    currency0={feeValue0?.currency}
                    currency1={feeValue1?.currency}
                    size={20}
                    margin={true}
                  />
                  <TYPE.main
                    ml="10px"
                    fontSize="20px"
                  >{`${feeValue0?.currency?.symbol}/${feeValue1?.currency?.symbol}`}</TYPE.main>
                </RowFixed>
              </RowBetween>
              <LightCard>
                <AutoColumn gap="md">
                  <TYPE.main fontWeight={400}>
                    <Trans>Amount</Trans>
                  </TYPE.main>
                  <RowBetween>
                    <Row style={{ alignItems: 'flex-end' }}>
                      <Text fontSize={72} fontWeight={500}>
                        {percentForSlider}
                      </Text>
                    </Row>
                    <AutoRow gap="4px" justify="flex-end">
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
                    </AutoRow>
                  </RowBetween>
                  <Slider value={percentForSlider} onChange={onPercentSelectForSlider} />
                </AutoColumn>
              </LightCard>
              <LightCard>
                <AutoColumn gap="md">
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      <Trans>Pooled {liquidityValue0?.currency?.symbol}:</Trans>
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      <Trans>Pooled {liquidityValue1?.currency?.symbol}:</Trans>
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
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
              </LightCard>
              {showCollectAsWeth && (
                <RowBetween>
                  <TYPE.main>
                    <Trans>Collect as WETH</Trans>
                  </TYPE.main>
                  <Toggle
                    id="receive-as-weth"
                    isActive={receiveWETH}
                    toggle={() => setReceiveWETH(receiveWETH => !receiveWETH)}
                  />
                </RowBetween>
              )}

              <div style={{ display: 'flex' }}>
                <AutoColumn gap="12px" style={{ flex: '1' }}>
                  <ButtonConfirmed
                    confirmed={false}
                    disabled={removed || percent === 0 || !liquidityValue0}
                    onClick={() => setShowConfirm(true)}
                  >
                    {removed ? <Trans>Closed</Trans> : error ?? <Trans>Remove</Trans>}
                  </ButtonConfirmed>
                </AutoColumn>
              </div>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Wrapper>
      </AppBody>
    </AutoColumn>
  )
}
