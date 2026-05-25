import { BigNumber } from '@ethersproject/bignumber'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import {
  Currency,
  CurrencyAmount,
  Fraction,
  Percent,
  Token,
  TokenAmount,
  WETH,
  computePriceImpact,
} from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrentPrice from 'components/CurrentPrice'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Loader'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import Slider from 'components/Slider'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import ZapError from 'components/ZapError'
import FormattedPriceImpact from 'components/swapv2/FormattedPriceImpact'
import { didUserReject } from 'constants/connectors/utils'
import { APP_PATHS, EIP712Domain } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { usePairContract } from 'hooks/useContract'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { Wrapper } from 'pages/MyPool/styleds'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/burn/actions'
import { useBurnState, useDerivedZapOutInfo, useZapOutActionHandlers } from 'state/burn/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useDegenModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { StyledInternalLink, UppercaseText } from 'theme'
import { calculateGasMargin, formattedNum } from 'utils'
import { currencyId } from 'utils/currencyId'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { friendlyError } from 'utils/errorMessage'
import { formatJSBIValue } from 'utils/formatBalance'
import { getZapContract } from 'utils/getContract'
import { formatDisplayNumber } from 'utils/numbers'
import { computePriceImpactWithoutFee, warningSeverity } from 'utils/prices'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'

import {
  CurrentPriceWrapper,
  DetailBox,
  DetailWrapper,
  FirstColumn,
  GridColumn,
  MaxButton,
  ModalDetailWrapper,
  SecondColumn,
  TokenWrapper,
} from './styled'

export default function ZapOut({
  currencyIdA,
  currencyIdB,
  pairAddress,
}: {
  currencyIdA: string
  currencyIdB: string
  pairAddress: string
}) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()

  const nativeA = useCurrencyConvertedToNative(currencyA as Currency)
  const nativeB = useCurrencyConvertedToNative(currencyB as Currency)
  const [tokenA, tokenB] = useMemo(() => [currencyA?.wrapped, currencyB?.wrapped], [currencyA, currencyB])

  const theme = useTheme()

  const [isDegenMode] = useDegenModeManager()
  const notify = useNotify()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, independentTokenField, typedValue } = useBurnState()
  const {
    dependentTokenField,
    currencies,
    pair,
    userLiquidity,
    noZapAmounts,
    parsedAmounts,
    amountsMin,
    insufficientLiquidity,
    price,
    error,
    isStaticFeePair,
    isOldStaticFeeContract,
  } = useDerivedZapOutInfo(currencyA ?? undefined, currencyB ?? undefined, pairAddress)
  const { onUserInput: _onUserInput, onSwitchField } = useZapOutActionHandlers()

  const amp = pair?.amp || JSBI.BigInt(0)

  const selectedCurrencyIsETHER = !!(
    chainId &&
    currencies[independentTokenField] &&
    currencies[independentTokenField]?.isNative
  )

  const selectedCurrencyIsWETH = !!(
    chainId &&
    currencies[independentTokenField] &&
    currencies[independentTokenField]?.equals(WETH[chainId])
  )

  const independentToken =
    nativeA && nativeB ? (independentTokenField === Field.CURRENCY_A ? nativeA : nativeB) : undefined

  const isValid = !error && !insufficientLiquidity

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  const [zapOutError, setZapOutError] = useState<string>('')

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  }

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(
    parsedAmounts[Field.LIQUIDITY],
    isStaticFeePair
      ? isOldStaticFeeContract
        ? networkInfo.classic.oldStatic?.zap
        : networkInfo.classic.static.zap
      : networkInfo.classic.dynamic?.zap,
  )

  // if user liquidity change => remove signature
  useEffect(() => {
    setSignatureData(null)
    // eslint-disable-next-line
  }, [userLiquidity?.toExact()])

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove() {
    if (!chainId) throw new Error('missing chain')
    if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet) {
      return approveCallback()
    }

    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account)

    const domain = {
      name: isStaticFeePair ? 'KyberSwap LP' : 'KyberDMM LP',
      version: '1',
      chainId: chainId,
      verifyingContract: pair.liquidityToken.address,
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]
    const message = {
      owner: account,
      spender: isStaticFeePair
        ? isOldStaticFeeContract
          ? networkInfo.classic.oldStatic?.zap
          : networkInfo.classic.static.zap
        : networkInfo.classic.dynamic?.zap,
      value: liquidityAmount.quotient.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber(),
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: 'Permit',
      message,
    })

    try {
      await library
        .send('eth_signTypedData_v4', [account, data])
        .then(splitSignature)
        .then(signature => {
          setSignatureData({
            v: signature.v,
            r: signature.r,
            s: signature.s,
            deadline: deadline.toNumber(),
          })
        })
    } catch (error) {
      if (didUserReject(error)) {
        notify(
          {
            title: t`Approve failed`,
            summary: friendlyError(error),
            type: NotificationType.ERROR,
          },
          8000,
        )
      } else {
        approveCallback()
      }
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSignatureData(null)
      return _onUserInput(field, typedValue)
    },
    [_onUserInput],
  )

  const onLiquidityInput = useCallback(
    (typedValue: string): void => onUserInput(Field.LIQUIDITY, typedValue),
    [onUserInput],
  )

  const onCurrencyInput = useCallback(
    (typedValue: string): void => onUserInput(independentTokenField, typedValue),
    [independentTokenField, onUserInput],
  )

  // tx sending
  const addTransactionWithType = useTransactionAdder()
  async function onRemove() {
    if (!library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const zapContract = getZapContract(chainId, library, account, isStaticFeePair, isOldStaticFeeContract)

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB.isNative

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // zapOutEth
      if (selectedCurrencyIsETHER) {
        methodNames = ['zapOutEth']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          pairAddress,
          account,
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          deadline.toHexString(),
        ]
      }
      // zapOut
      else {
        methodNames = ['zapOut']
        args = [
          independentTokenField === Field.CURRENCY_A ? tokenB.address : tokenA.address,
          independentTokenField === Field.CURRENCY_A ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          pairAddress,
          account,
          independentTokenField === Field.CURRENCY_A
            ? amountsMin[Field.CURRENCY_A].toString()
            : amountsMin[Field.CURRENCY_B].toString(),
          deadline.toHexString(),
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // zapOutEthPermit
      if (selectedCurrencyIsETHER) {
        methodNames = ['zapOutEthPermit']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          pairAddress,
          account,
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
      // zapOutPermit
      else {
        methodNames = ['zapOutPermit']
        args = [
          independentTokenField === Field.CURRENCY_A ? tokenB.address : tokenA.address,
          independentTokenField === Field.CURRENCY_A ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          pairAddress,
          account,
          independentTokenField === Field.CURRENCY_A
            ? amountsMin[Field.CURRENCY_A].toString()
            : amountsMin[Field.CURRENCY_B].toString(),
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    // All methods of new zap static fee contract include factory address as first arg
    if (isStaticFeePair && !isOldStaticFeeContract) {
      args.unshift(networkInfo.classic.static.factory)
    }
    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map(methodName =>
        zapContract.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch(err => {
            // we only care if the error is something other than the user rejected the tx
            if (!didUserReject(err)) {
              console.error(`estimateGas failed`, methodName, args, err)
            }

            if (
              err.message.includes('INSUFFICIENT_OUTPUT_AMOUNT') ||
              err?.data?.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT')
            ) {
              setZapOutError(t`Insufficient Liquidity in the Liquidity Pool to Swap`)
            } else {
              setZapOutError(err?.message)
            }

            return undefined
          }),
      ),
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
      BigNumber.isBigNumber(safeGasEstimate),
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await zapContract[methodName](...args, {
        gasLimit: safeGasEstimate,
      })
        .then((response: TransactionResponse) => {
          if (currencyA && currencyB) {
            setAttemptingTxn(false)
            const tokenAmount = parsedAmounts[independentTokenField]
            const tokenAmountStr = tokenAmount?.toSignificant(6)
            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
              extraInfo: {
                tokenAddressIn: currencyA.wrapped.address,
                tokenAddressOut: currencyB.wrapped.address,
                tokenSymbolIn: currencyA.symbol,
                tokenSymbolOut: currencyB.symbol,
                [(tokenAmount as TokenAmount)?.currency?.address === currencyA?.wrapped.address
                  ? 'tokenAmountIn'
                  : 'tokenAmountOut']: tokenAmountStr,
                contract: pairAddress,
                arbitrary: {
                  poolAddress: pairAddress,
                  token_1: currencyA.symbol,
                  token_2: currencyB.symbol,
                  remove_liquidity_method: 'single token',
                  amp: new Fraction(amp).divide(JSBI.BigInt(10000)).toSignificant(5),
                },
              },
            })

            setTxHash(response.hash)
          }
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)

          const message = error.message.includes('INSUFFICIENT')
            ? t`Insufficient liquidity available. Please reload page or increase max slippage and try again!`
            : error.message

          setZapOutError(message)

          if (!didUserReject(error)) {
            console.error('Remove Classic Liquidity Error:', { message, error })
          }
        })
    }
  }

  const pendingText = `Removing ${parsedAmounts[independentTokenField]?.toSignificant(6)} ${independentToken?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
    setZapOutError('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback,
  )

  const handleSwitchCurrency = useCallback(() => {
    onSwitchField()
  }, [onSwitchField])

  const priceToSwap = price ? (independentTokenField === Field.CURRENCY_A ? price.invert() : price) : undefined

  const amountOut =
    parsedAmounts[independentTokenField] &&
    noZapAmounts[independentTokenField] &&
    !(parsedAmounts[independentTokenField] as TokenAmount).lessThan(noZapAmounts[independentTokenField] as TokenAmount)
      ? (parsedAmounts[independentTokenField] as TokenAmount).subtract(
          noZapAmounts[independentTokenField] as TokenAmount,
        )
      : undefined

  const tokenAddresses: string[] = useMemo(
    () => [tokenA, tokenB].map(token => token?.address as string).filter(item => !!item),
    [tokenA, tokenB],
  )
  const marketPriceMap = useTokenPrices(tokenAddresses)
  const usdPrices = [tokenA, tokenB].map(item => marketPriceMap[item?.address || ''] || 0)

  const independentTokenPrice = independentTokenField === Field.CURRENCY_A ? usdPrices[0] : usdPrices[1]

  const estimatedUsd =
    parsedAmounts[independentTokenField] && independentTokenPrice
      ? parseFloat((parsedAmounts[independentTokenField] as TokenAmount).toSignificant(6)) * independentTokenPrice
      : 0
  const noZapDependentAmount = noZapAmounts[dependentTokenField]
  const priceImpact =
    priceToSwap &&
    noZapDependentAmount &&
    amountOut &&
    !priceToSwap.equalTo(0) &&
    !noZapDependentAmount.equalTo(0) &&
    computePriceImpact(priceToSwap, noZapDependentAmount, amountOut as CurrencyAmount<Currency>)

  const priceImpactWithoutFee = pair && priceImpact ? computePriceImpactWithoutFee([pair], priceImpact) : undefined

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  function modalHeader() {
    const displaySlp = allowedSlippage / 100

    return (
      <AutoColumn className="mt-5 gap-3">
        <AutoRow className="gap-1">
          <CurrencyLogo currency={currencies[independentTokenField]} size={'24px'} />
          <span className="text-[24px] font-medium leading-[normal]">
            {parsedAmounts[independentTokenField]?.toSignificant(6)}
          </span>
          <span className="text-[24px] font-medium leading-[normal]">{independentToken?.symbol}</span>
          {estimatedUsd && (
            <span className="ml-1 text-[18px] font-medium leading-[normal] text-subText">
              (~{formattedNum(estimatedUsd.toString(), true) || undefined})
            </span>
          )}
        </AutoRow>

        <p className="m-0 text-left text-[12px] font-normal italic leading-[normal] text-subText">
          {t`Output is estimated. If the price changes by more than ${displaySlp}% your transaction will revert.`}
        </p>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <ModalDetailWrapper>
          {pair && (
            <>
              <CurrentPriceWrapper className="pb-2">
                <p className="m-0 text-sm font-normal leading-[normal] text-subText">
                  <Trans>Current Price</Trans>
                </p>
                <p className="m-0 text-sm font-normal leading-[normal] text-text">
                  <CurrentPrice price={price} />
                </p>
              </CurrentPriceWrapper>

              <RowBetween className="pb-3">
                <p className="m-0 text-sm font-normal leading-[normal] text-subText">
                  <Trans>Price Impact</Trans>
                </p>
                <p className="m-0 text-sm font-normal leading-[normal] text-text">
                  <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
                </p>
              </RowBetween>

              <RowBetween className="pb-3">
                <span className="text-[14px] leading-[normal] text-subText">
                  <Trans>LP Tokens Removed</Trans>
                </span>

                <RowFixed>
                  <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
                  <span className="text-[14px] leading-[normal] text-text">
                    {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
                  </span>
                </RowFixed>
              </RowBetween>

              {amountsMin && (
                <>
                  <RowBetween className="pb-3">
                    <p className="m-0 text-sm font-normal leading-[normal] text-subText">
                      <Trans>Minimum Received</Trans>
                    </p>

                    <TokenWrapper>
                      <CurrencyLogo currency={independentToken} size="16px" />
                      <p className="m-0 text-sm font-normal leading-[normal] text-text">
                        {formatJSBIValue(
                          independentTokenField === Field.CURRENCY_A
                            ? amountsMin[Field.CURRENCY_A]
                            : amountsMin[Field.CURRENCY_B],
                          independentToken?.decimals,
                        )}{' '}
                        {independentToken?.symbol}
                      </p>
                    </TokenWrapper>
                  </RowBetween>
                </>
              )}
            </>
          )}
        </ModalDetailWrapper>

        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <span className="text-[16px] font-medium leading-[normal]">
            <Trans>Confirm</Trans>
          </span>
        </ButtonPrimary>
      </>
    )
  }

  const lpToken = useMemo(() => {
    return (
      pair && new Token(chainId, pair.liquidityToken?.address, pair.liquidityToken?.decimals, `LP Tokens`, `LP Tokens`)
    )
  }, [chainId, pair])

  return (
    <>
      <Wrapper>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash ? txHash : ''}
          content={() =>
            zapOutError ? (
              <TransactionErrorContent onDismiss={handleDismissConfirmation} message={zapOutError} />
            ) : (
              <ConfirmationModalContent
                title={t`You will receive`}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )
          }
          pendingText={pendingText}
        />
        <AutoColumn className="gap-3">
          <GridColumn>
            <FirstColumn>
              <BlackCard className="rounded p-4">
                <AutoColumn className="gap-4">
                  <RowBetween>
                    <span className="text-[12px] font-medium leading-[normal]">
                      <Trans>Amount</Trans>
                    </span>

                    <span className="text-[12px] font-medium leading-[normal]">
                      <Trans>Balance</Trans>:{' '}
                      {!userLiquidity ? (
                        <Loader />
                      ) : (
                        formatDisplayNumber(userLiquidity, { style: 'decimal', significantDigits: 6 })
                      )}{' '}
                      {t`LP Tokens`}
                    </span>
                  </RowBetween>
                  <Row className="items-end">
                    <span className="text-[72px] font-medium leading-[normal]">
                      {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                    </span>
                  </Row>

                  <>
                    <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} size={18} />
                    <RowBetween className="gap-1">
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>25%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>50%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>75%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>
                        <Trans>Max</Trans>
                      </MaxButton>
                    </RowBetween>
                  </>
                </AutoColumn>
              </BlackCard>

              {chainId && pair && (
                <CurrencyInputPanel
                  hideBalance
                  hideLogo
                  value={formattedAmounts[Field.LIQUIDITY]}
                  onUserInput={onLiquidityInput}
                  onMax={null}
                  onHalf={null}
                  disableCurrencySelect
                  currency={lpToken}
                  id="liquidity-amount"
                />
              )}
            </FirstColumn>

            <SecondColumn>
              <div>
                <CurrencyInputPanel
                  disabledInput
                  value={formattedAmounts[independentTokenField]}
                  onUserInput={onCurrencyInput}
                  onSwitchCurrency={handleSwitchCurrency}
                  onMax={null}
                  onHalf={null}
                  currency={currencies[independentTokenField]}
                  id="zap-out-input"
                  label={t`Output`}
                  disableCurrencySelect={false}
                  showCommonBases
                  positionMax="top"
                  isSwitchMode
                  estimatedUsd={formattedNum(estimatedUsd.toString(), true) || undefined}
                />
                <div className="mt-2 flex items-center justify-end">
                  {pairAddress &&
                    chainId &&
                    (selectedCurrencyIsETHER || selectedCurrencyIsWETH) &&
                    currencies[dependentTokenField] && (
                      <StyledInternalLink
                        replace
                        to={
                          independentTokenField === Field.CURRENCY_A
                            ? `/${networkInfo.route}${APP_PATHS.CLASSIC_REMOVE_POOL}/${
                                selectedCurrencyIsETHER
                                  ? currencyId(WETH[chainId], chainId)
                                  : currencyId(NativeCurrencies[chainId], chainId)
                              }/${currencyId(currencies[dependentTokenField] as Currency, chainId)}/${pairAddress}`
                            : `/${networkInfo.route}${APP_PATHS.CLASSIC_REMOVE_POOL}/${currencyId(
                                currencies[dependentTokenField] as Currency,
                                chainId,
                              )}/${
                                selectedCurrencyIsETHER
                                  ? currencyId(WETH[chainId], chainId)
                                  : currencyId(NativeCurrencies[chainId], chainId)
                              }/${pairAddress}`
                        }
                      >
                        {selectedCurrencyIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                </div>
              </div>

              {pair && (
                <DetailWrapper>
                  <DetailBox style={{ paddingBottom: '12px', borderBottom: `1px dashed ${theme.border}` }}>
                    <AutoColumn className="gap-2">
                      <p className="m-0 text-[12px] font-medium leading-[normal] text-subText">
                        <UppercaseText>
                          <Trans>Price Impact</Trans>
                        </UppercaseText>
                      </p>
                      <p className="m-0 text-sm font-normal leading-[normal] text-text">
                        <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
                      </p>
                    </AutoColumn>

                    {amountsMin && (
                      <AutoColumn className="gap-2">
                        <p className="m-0 text-[12px] font-medium leading-[normal] text-subText">
                          <UppercaseText>
                            <Trans>Minimum Received</Trans>
                          </UppercaseText>
                        </p>

                        <TokenWrapper>
                          <CurrencyLogo
                            currency={independentTokenField === Field.CURRENCY_A ? currencyA : currencyB}
                            size="16px"
                          />
                          <p className="m-0 text-sm font-normal leading-[normal] text-text">
                            {formatJSBIValue(
                              independentTokenField === Field.CURRENCY_A
                                ? amountsMin[Field.CURRENCY_A]
                                : amountsMin[Field.CURRENCY_B],
                              independentToken?.decimals,
                            )}{' '}
                            {independentToken?.symbol}
                          </p>
                        </TokenWrapper>
                      </AutoColumn>
                    )}
                  </DetailBox>

                  <DetailBox className="pt-3">
                    <p className="m-0 flex items-center text-[12px] font-medium leading-[normal] text-subText">
                      <UppercaseText>
                        <Trans>Current Price</Trans>
                      </UppercaseText>
                    </p>
                    <p className="m-0 text-sm font-normal leading-[normal] text-text">
                      <CurrentPrice price={price} />
                    </p>
                  </DetailBox>
                </DetailWrapper>
              )}

              {insufficientLiquidity ? (
                <ZapError message={t`Insufficient Liquidity in the Liquidity Pool to Swap`} warning={false} />
              ) : priceImpactSeverity > 3 ? (
                <ZapError message={t`Price impact is too high`} warning={false} />
              ) : priceImpactSeverity > 2 ? (
                <ZapError message={t`Price impact is high`} warning={true} />
              ) : null}

              <div className="relative">
                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect</Trans>
                  </ButtonLight>
                ) : (
                  <RowBetween>
                    <ButtonConfirmed
                      onClick={onAttemptToApprove}
                      confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                      disabled={
                        !isValid ||
                        approval !== ApprovalState.NOT_APPROVED ||
                        signatureData !== null ||
                        !userLiquidity ||
                        userLiquidity.equalTo('0') ||
                        (priceImpactSeverity > 3 && !isDegenMode)
                      }
                      className="mr-4 p-4 text-base font-medium"
                    >
                      {approval === ApprovalState.PENDING ? (
                        <Dots>
                          <Trans>Approving</Trans>
                        </Dots>
                      ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                        t`Approved`
                      ) : (
                        t`Approve`
                      )}
                    </ButtonConfirmed>
                    <ButtonError
                      padding="16px 6px"
                      onClick={() => {
                        setShowConfirm(true)
                      }}
                      disabled={
                        !isValid ||
                        (signatureData === null && approval !== ApprovalState.APPROVED) ||
                        (priceImpactSeverity > 3 && !isDegenMode)
                      }
                      error={
                        !!parsedAmounts[Field.CURRENCY_A] &&
                        !!parsedAmounts[Field.CURRENCY_B] &&
                        (!isValid || priceImpactSeverity > 2)
                      }
                    >
                      <span className="text-[16px] font-medium leading-[normal]">
                        {error
                          ? error
                          : priceImpactSeverity > 3 && !isDegenMode
                          ? t`Remove`
                          : priceImpactSeverity > 2
                          ? t`Remove Anyway`
                          : t`Remove`}
                      </span>
                    </ButtonError>
                  </RowBetween>
                )}
              </div>
            </SecondColumn>
          </GridColumn>
        </AutoColumn>
      </Wrapper>
    </>
  )
}
