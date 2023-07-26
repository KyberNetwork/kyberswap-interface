import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonLight } from 'components/Button'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Row'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import FarmV2ABI from 'constants/abis/v2/farmv2.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useContract, useProAmmNFTPositionManagerContract, useProMMFarmContract } from 'hooks/useContract'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useElasticFarmsV2 } from 'state/farms/elasticv2/hooks'
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
  hasUserDepositedInFarm,
  feeValue0,
  feeValue1,
  totalFeeRewardUSD,
  farmAddress,
}: {
  totalFeeRewardUSD: number
  tokenId: BigNumber
  position: Position
  layout?: number
  text?: string
  hasUserDepositedInFarm?: boolean
  farmAddress?: string
  feeValue0: CurrencyAmount<Currency> | undefined
  feeValue1: CurrencyAmount<Currency> | undefined
}) {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const theme = useTheme()
  const token0Shown = feeValue0?.currency || position.pool.token0
  const token1Shown = feeValue1?.currency || position.pool.token1
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()
  const deadline = useTransactionDeadline() // custom from users settings
  const { mixpanelHandler } = useMixpanel()

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
      type: TRANSACTION_TYPE.ELASTIC_COLLECT_FEE,
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

  const farmContract = useProMMFarmContract(farmAddress || '')
  const poolAddress = useProAmmPoolInfo(position.pool.token0, position.pool.token1, position.pool.fee as FeeAmount)
  const { userInfo } = useElasticFarmsV2()
  const info = userInfo?.find(item => item.nftId.toString() === tokenId.toString())
  const address = info?.farmAddress
  const farmV2Contract = useContract(address, FarmV2ABI)

  const collectFeeFromFarmContract = async () => {
    const isInFarmV2 = !!info

    const contract = isInFarmV2 ? farmV2Contract : farmContract

    if (!contract || !feeValue0 || !feeValue1) {
      setAttemptingTxn(false)
      setCollectFeeError('Something went wrong!')
      return
    }

    const amount0Min = feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage)))
    const amount1Min = feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage)))
    try {
      const params = isInFarmV2
        ? [
            info.fId,
            [tokenId.toString()],
            amount0Min.quotient.toString(),
            amount1Min.quotient.toString(),
            deadline?.toString(),
            true,
          ]
        : [
            [tokenId.toString()],
            amount0Min.quotient.toString(),
            amount1Min.quotient.toString(),
            poolAddress,
            true,
            deadline?.toString(),
          ]

      const gasEstimation = await contract.estimateGas.claimFee(...params)

      const tx = await contract.claimFee(...params, {
        gasLimit: calculateGasMargin(gasEstimation),
      })

      handleBroadcastClaimSuccess(tx)
    } catch (e) {
      setShowPendingModal(true)
      setAttemptingTxn(false)
      setCollectFeeError(e?.message || JSON.stringify(e))
    }
  }

  const collect = () => {
    setShowPendingModal(true)
    setAttemptingTxn(true)

    if (!feeValue0 || !feeValue1 || !positionManager || !account || !tokenId || !library || !deadline || !layout) {
      setAttemptingTxn(false)
      setCollectFeeError('Something went wrong!')
      return
    }
    // setCollecting(true)
    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_INITIATED, {
      token_1: token0Shown?.symbol,
      token_2: token1Shown?.symbol,
    })

    if (hasUserDepositedInFarm) {
      collectFeeFromFarmContract()
      return
    }

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

    library
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
      .catch((error: any) => {
        setShowPendingModal(true)
        setAttemptingTxn(false)
        setCollectFeeError(error?.message || JSON.stringify(error))
        console.error(error)
      })
  }
  const hasNoFeeToCollect = !(feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0))

  if (layout === 0) {
    return (
      <OutlineCard marginTop="1rem" padding="1rem">
        <AutoColumn gap="md">
          <Text fontSize="12px" fontWeight="500">
            Your Fee Earnings
          </Text>
          {text && (
            <Text color={theme.subText} fontSize="12px">
              {text}
            </Text>
          )}

          <Divider />
          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>Total Fees Earned</Trans>
            </Text>
            <RowFixed>
              <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                {formattedNumLong(totalFeeRewardUSD, true)}
              </Text>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token0Shown.symbol} Fees Earned</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
              <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />} {token0Shown.symbol}
              </Text>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token1Shown.symbol} Fees Earned</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
              <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />} {token1Shown.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
    )
  }

  return (
    <OutlineCard marginTop="1rem" padding="1rem">
      <AutoColumn gap="md">
        <RowBetween>
          <Flex>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>Total Fees Earned</Trans>
            </Text>
          </Flex>
          <RowFixed>
            <Text fontSize={12} fontWeight={500}>
              {formattedNumLong(totalFeeRewardUSD, true)}
            </Text>
          </RowFixed>
        </RowBetween>

        <RowBetween>
          <Flex>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token0Shown.symbol} Fees Earned</Trans>
            </Text>
            <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
          </Flex>
          <RowFixed>
            <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
            <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
              {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />} {token0Shown.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <Flex>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token1Shown.symbol} Fees Earned</Trans>
            </Text>
            <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
          </Flex>
          <RowFixed>
            <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
            <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
              {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />} {token1Shown.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <ButtonLight disabled={hasNoFeeToCollect} onClick={collect} style={{ padding: '10px', fontSize: '14px' }}>
          <Flex alignItems="center" sx={{ gap: '8px' }}>
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
          </Flex>
        </ButtonLight>
      </AutoColumn>

      <TransactionConfirmationModal
        isOpen={showPendingModal}
        onDismiss={handleDismiss}
        hash={txnHash}
        attemptingTxn={attemptingTxn}
        pendingText={`Collecting fee reward`}
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {collectFeeError ? <TransactionErrorContent onDismiss={handleDismiss} message={collectFeeError} /> : null}
          </Flex>
        )}
      />
    </OutlineCard>
  )
}
