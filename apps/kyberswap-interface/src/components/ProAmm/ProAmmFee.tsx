import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { NonfungiblePositionManager, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'

import { ButtonLight } from 'components/Button'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Row'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerReadingContract } from 'hooks/useContract'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { basisPointsToPercent, calculateGasMargin, formattedNumLong } from 'utils'

export default function ProAmmFee({
  tokenId,
  position,
  // legacy props... layout means not collect fee
  layout = 0,
  text = '',
  feeValue0,
  feeValue1,
  totalFeeRewardUSD,
}: {
  totalFeeRewardUSD: number
  tokenId: BigNumber
  position: Position
  layout?: number
  text?: string
  feeValue0: CurrencyAmount<Currency> | undefined
  feeValue1: CurrencyAmount<Currency> | undefined
}) {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const token0Shown = feeValue0?.currency || position.pool.token0
  const token1Shown = feeValue1?.currency || position.pool.token1
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerReadingContract()
  const deadline = useTransactionDeadline() // custom from users settings
  const { trackingHandler } = useTracking()

  const [allowedSlippage] = useUserSlippageTolerance()

  const liquidity = position.liquidity.toString()

  const [collectFeeError, setCollectFeeError] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const [showPendingModal, setShowPendingModal] = useState(false)

  const handleDismiss = () => {
    setShowPendingModal(false)
    setTxnHash('')
    setAttemptingTxn(false)
    setCollectFeeError('')
  }

  const handleBroadcastClaimSuccess = (response: TransactionResponse) => {
    const tokenAmountIn = feeValue0?.toSignificant(6)
    const tokenAmountOut = feeValue1?.toSignificant(6)
    const tokenSymbolIn = feeValue0?.currency.symbol ?? ''
    const tokenSymbolOut = feeValue1?.currency.symbol ?? ''
    addTransactionWithType({
      hash: response.hash,
      type: TRANSACTION_TYPE.COLLECT_FEE,
      extraInfo: {
        tokenAmountIn,
        tokenAmountOut,
        tokenAddressIn: feeValue0?.currency.wrapped.address,
        tokenAddressOut: feeValue1?.currency.wrapped.address,
        tokenSymbolIn,
        tokenSymbolOut,
        arbitrary: {
          token_1: token0Shown?.symbol,
          token_2: token1Shown?.symbol,
          token_1_amount: tokenAmountIn,
          token_2_amount: tokenAmountOut,
        },
      },
    })
    setAttemptingTxn(false)
    setTxnHash(response.hash)
  }

  const collect = async () => {
    setShowPendingModal(true)
    setAttemptingTxn(true)

    if (!feeValue0 || !feeValue1 || !positionManager || !account || !tokenId || !library || !deadline || !layout) {
      setAttemptingTxn(false)
      setCollectFeeError('Something went wrong!')
      return
    }
    // setCollecting(true)
    trackingHandler(TRACKING_EVENT_TYPE.ELASTIC_COLLECT_FEES_INITIATED, {
      token_1: token0Shown?.symbol,
      token_2: token1Shown?.symbol,
    })

    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage))),
      expectedCurrencyOwed1: feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage))),
      recipient: account,
      deadline: deadline.toString(),
      havingFee: true,
      isPositionClosed: liquidity === '0',
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    try {
      await library
        .getSigner()
        .estimateGas(txn)
        .then((estimate: BigNumber) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }
          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              handleBroadcastClaimSuccess(response)
            })
        })
    } catch (error: any) {
      setShowPendingModal(true)
      setAttemptingTxn(false)
      setCollectFeeError(error?.message || JSON.stringify(error))
      console.error(error)
    }
  }
  const hasNoFeeToCollect = !(feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0))

  if (layout === 0) {
    return (
      <OutlineCard className="mt-4 p-4">
        <AutoColumn className="gap-3">
          <span className="text-xs font-medium">Your Fee Earnings</span>
          {text && <span className="text-xs text-subText">{text}</span>}

          <Divider />
          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>Total Fees Earned</Trans>
            </span>
            <RowFixed>
              <span className="ml-1.5 text-xs font-medium">{formattedNumLong(totalFeeRewardUSD, true)}</span>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>{token0Shown.symbol} Fees Earned</Trans>
            </span>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
              <span className="ml-1.5 text-xs font-medium">
                {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />} {token0Shown.symbol}
              </span>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>{token1Shown.symbol} Fees Earned</Trans>
            </span>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
              <span className="ml-1.5 text-xs font-medium">
                {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />} {token1Shown.symbol}
              </span>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
    )
  }

  return (
    <OutlineCard className="mt-4 p-4">
      <AutoColumn className="gap-3">
        <RowBetween>
          <div className="flex">
            <span className="text-xs font-medium text-subText">
              <Trans>Total Fees Earned</Trans>
            </span>
          </div>
          <RowFixed>
            <span className="text-xs font-medium">{formattedNumLong(totalFeeRewardUSD, true)}</span>
          </RowFixed>
        </RowBetween>

        <RowBetween>
          <div className="flex">
            <span className="text-xs font-medium text-subText">
              <Trans>{token0Shown.symbol} Fees Earned</Trans>
            </span>
            <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
          </div>
          <RowFixed>
            <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
            <span className="ml-1.5 text-xs font-medium">
              {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />} {token0Shown.symbol}
            </span>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <div className="flex">
            <span className="text-xs font-medium text-subText">
              <Trans>{token1Shown.symbol} Fees Earned</Trans>
            </span>
            <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
          </div>
          <RowFixed>
            <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
            <span className="ml-1.5 text-xs font-medium">
              {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />} {token1Shown.symbol}
            </span>
          </RowFixed>
        </RowBetween>
        <ButtonLight disabled={hasNoFeeToCollect} onClick={collect} style={{ padding: '10px', fontSize: '14px' }}>
          <div className="flex items-center gap-2">
            <QuestionHelper
              placement="top"
              size={16}
              text={
                hasNoFeeToCollect
                  ? t`You don't have any fees to collect`
                  : t`By collecting, you will receive 100% of your fee earnings`
              }
              useCurrentColor
            />
            <Trans>Collect Fees</Trans>
          </div>
        </ButtonLight>
      </AutoColumn>

      <TransactionConfirmationModal
        isOpen={showPendingModal}
        onDismiss={handleDismiss}
        hash={txnHash}
        attemptingTxn={attemptingTxn}
        pendingText={`Collecting fee reward`}
        content={() => (
          <div className="flex w-full flex-col">
            {collectFeeError ? <TransactionErrorContent onDismiss={handleDismiss} message={collectFeeError} /> : null}
          </div>
        )}
      />
    </OutlineCard>
  )
}
