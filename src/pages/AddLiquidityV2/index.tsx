import { TransactionResponse } from '@ethersproject/providers'
import { ONE } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Repeat } from 'react-feather'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ArrowWrapper } from 'components/ArrowRotate'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { OutlineCard, WarningCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import FeeSelector from 'components/FeeSelector'
import HoverInlineText from 'components/HoverInlineText'
import { Swap as SwapIcon } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'
import RangeSelector from 'components/RangeSelector'
import Rating from 'components/Rating'
import Row, { RowBetween, RowFit, RowFixed } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { TutorialType } from 'components/Tutorial'
import { Dots } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useWalletModalToggle } from 'state/application/hooks'
import {
  useProAmmDerivedAllMintInfo,
  useProAmmDerivedMintInfo,
  useProAmmMintActionHandlers,
  useProAmmMintState,
  useRangeHopCallbacks,
} from 'state/mint/proamm/hooks'
import { Bound, Field } from 'state/mint/proamm/type'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { HideMedium, MEDIA_WIDTHS, MediumOnly, StyledInternalLink, TYPE } from 'theme'
import { basisPointsToPercent, calculateGasMargin, formattedNum } from 'utils'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { unwrappedToken } from 'utils/wrappedCurrency'

import Tabs from './Tab'
import { RANGE_LIST, rangeData } from './constants'
import {
  BorderedHideMedium,
  ChartContainer,
  Container,
  DynamicSection,
  FlexLeft,
  PageWrapper,
  RangeBtn,
  RightContainer,
  StackedContainer,
  StackedItem,
  StyledInput,
} from './styled'

export default function AddLiquidity() {
  const { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl } = useParams()
  const navigate = useNavigate()
  const [rotate, setRotate] = useState(false)
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const [expertMode] = useExpertModeManager()
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()
  const [showChart, setShowChart] = useState(false)
  const [positionIndex, setPositionIndex] = useState(0)

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : FeeAmount.MEDIUM
  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  const baseCurrencyIsETHER = Boolean(baseCurrency?.isNative)
  const baseCurrencyIsWETH = Boolean(baseCurrency?.equals(WETH[chainId]))
  const quoteCurrencyIsETHER = Boolean(quoteCurrency?.isNative)
  const quoteCurrencyIsWETH = Boolean(quoteCurrency?.equals(WETH[chainId]))

  const tokenA = baseCurrency?.wrapped
  const tokenB = quoteCurrency?.wrapped
  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  // mint state
  const { positions, startPriceTypedValue, positionCount } = useProAmmMintState()
  const { independentField, typedValue } = positions[positionIndex]

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    // errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
    amount0Unlock,
    amount1Unlock,
    riskPoint,
    profitPoint,
    activeRange,
  } = useProAmmDerivedMintInfo(
    positionIndex,
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
  )
  const { errorMessage } = useProAmmDerivedAllMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
  )

  const { [Field.CURRENCY_A]: currencies_A, [Field.CURRENCY_B]: currencies_B } = currencies
  const { [Field.CURRENCY_A]: currencyBalanceA, [Field.CURRENCY_B]: currencyBalanceB } = currencyBalances
  const { [Field.CURRENCY_A]: parsedAmounts_A, [Field.CURRENCY_B]: parsedAmounts_B } = parsedAmounts
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const poolAddress = useProAmmPoolInfo(baseCurrency, currencyB, feeAmount)
  const previousTicks =
    // : number[] = []
    useProAmmPreviousTicks(pool, position)
  const {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
    onResetMintState,
    onAddPosition,
    onRemovePosition,
  } = useProAmmMintActionHandlers(noLiquidity, positionIndex)

  useEffect(() => {
    onResetMintState()
  }, [onResetMintState])

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // capital efficiency warning
  const [showCapitalEfficiencyWarning, setShowCapitalEfficiencyWarning] = useState(false)

  useEffect(() => setShowCapitalEfficiencyWarning(false), [baseCurrency, quoteCurrency, feeAmount])

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toExact() ?? '',
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      let maxAmount = maxAmountSpend(currencyBalances[field])
      let amountUnlock = JSBI.BigInt('0')
      if (maxAmount && currencies[field] && noLiquidity && tokenA && tokenB) {
        if (
          (!invertPrice && tokenA.equals(currencies[field] as Currency)) ||
          (invertPrice && tokenB.equals(currencies[field] as Currency))
        ) {
          amountUnlock = amount0Unlock
        } else {
          amountUnlock = amount1Unlock
        }
        maxAmount = maxAmount?.subtract(CurrencyAmount.fromRawAmount(currencies[field] as Currency, amountUnlock))
      }
      return {
        ...accumulator,
        [field]: maxAmount,
      }
    },
    {} as { [field in Field]: CurrencyAmount<Currency> },
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    !!currencies_A && depositADisabled && noLiquidity
      ? CurrencyAmount.fromFractionalAmount(currencies_A, ONE, ONE)
      : parsedAmounts_A,
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager : undefined,
  )

  const [approvalB, approveBCallback] = useApproveCallback(
    !!currencies_B && depositBDisabled && noLiquidity
      ? CurrencyAmount.fromFractionalAmount(currencies_B, ONE, ONE)
      : parsedAmounts_B,
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager : undefined,
  )

  const tokens = useMemo(
    () => [currencies_A, currencies_B].map(currency => currency?.wrapped),
    [currencies_A, currencies_B],
  )
  const usdPrices = useTokenPrices(tokens.map(t => t?.wrapped.address || ''))

  const estimatedUsdCurrencyA =
    parsedAmounts_A && usdPrices[tokens[0]?.address || '']
      ? parseFloat(parsedAmounts_A.toExact()) * usdPrices[tokens[0]?.address || '']
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts_B && usdPrices[tokens[1]?.address || '']
      ? parseFloat(parsedAmounts_B.toExact()) * usdPrices[tokens[1]?.address || '']
      : 0

  const [userSlippageTolerance] = useUserSlippageTolerance()

  const onAdd = useCallback(
    async function () {
      if (!isEVM || !library || !account) return

      if (!positionManager || !baseCurrency || !quoteCurrency) {
        return
      }

      if (!previousTicks || previousTicks.length !== 2) {
        return
      }
      if (position && account && deadline) {
        const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

        const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, previousTicks, {
          slippageTolerance: basisPointsToPercent(userSlippageTolerance),
          recipient: account,
          deadline: deadline.toString(),
          useNative,
          createPool: noLiquidity,
        })

        //0.00283161
        const txn: { to: string; data: string; value: string } = {
          to: (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
          data: calldata,
          value,
        }

        setAttemptingTxn(true)
        library
          .getSigner()
          .estimateGas(txn)
          .then((estimate: BigNumber) => {
            const newTxn = {
              ...txn,
              gasLimit: calculateGasMargin(estimate),
            }
            //calculateGasMargin = 0x0827f6

            return library
              .getSigner()
              .sendTransaction(newTxn)
              .then((response: TransactionResponse) => {
                setAttemptingTxn(false)
                if (noLiquidity) {
                  addTransactionWithType({
                    hash: response.hash,
                    type: TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
                    summary: `${parsedAmounts_A?.toSignificant(6) ?? '0'} ${baseCurrency.symbol} and ${
                      parsedAmounts_B?.toSignificant(6) ?? '0'
                    } ${quoteCurrency.symbol} `,
                    arbitrary: {
                      token_1: baseCurrency.symbol,
                      token_2: quoteCurrency.symbol,
                    },
                  })
                } else {
                  addTransactionWithType({
                    hash: response.hash,
                    type: TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
                    summary: `${parsedAmounts_A?.toSignificant(6) ?? '0'} ${baseCurrency.symbol} and ${
                      parsedAmounts_B?.toSignificant(6) ?? '0'
                    } ${quoteCurrency.symbol} `,
                    arbitrary: {
                      poolAddress: poolAddress,
                      token_1: baseCurrency.symbol,
                      token_2: quoteCurrency.symbol,
                    },
                  })
                }

                setTxHash(response.hash)
              })
          })
          .catch((error: any) => {
            console.error('Failed to send transaction', error)
            setAttemptingTxn(false)
            // we only care if the error is something _other_ than the user rejected the tx
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      } else {
        return
      }
    },
    [
      account,
      addTransactionWithType,
      userSlippageTolerance,
      baseCurrency,
      deadline,
      isEVM,
      library,
      networkInfo,
      noLiquidity,
      parsedAmounts_A,
      parsedAmounts_B,
      poolAddress,
      position,
      positionManager,
      previousTicks,
      quoteCurrency,
    ],
  )

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew, chainId)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew = currencyNew.isNative || (chainId && currencyIdNew === WETH[chainId]?.address)
        const isETHOrWETHOther =
          !!currencyIdOther &&
          ((chainId && currencyIdOther === NativeCurrencies[chainId].symbol) ||
            (chainId && currencyIdOther === WETH[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId],
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/elastic/add/${idA}`)
      } else {
        navigate(`/elastic/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/elastic/add/${idB}`)
      } else {
        navigate(`/elastic/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate],
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      navigate(`/elastic/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      navigate('/myPools?tab=elastic')
    }
    setTxHash('')
  }, [navigate, onFieldAInput, txHash])

  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetRange } =
    useRangeHopCallbacks(
      baseCurrency ?? undefined,
      quoteCurrency ?? undefined,
      feeAmount,
      tickLower,
      tickUpper,
      positionIndex,
      pool,
      price,
    )
  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA = approvalA !== ApprovalState.APPROVED && (noLiquidity ? true : !!parsedAmounts_A)
  const showApprovalB = approvalB !== ApprovalState.APPROVED && (noLiquidity ? true : !!parsedAmounts_B)

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts_A?.toSignificant(10) : ''} ${
    !depositADisabled ? currencies_A?.symbol : ''
  } ${!depositADisabled && !depositBDisabled ? 'and' : ''} ${
    !depositBDisabled ? parsedAmounts_B?.toSignificant(10) : ''
  } ${!depositBDisabled ? currencies_B?.symbol : ''}`

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  const Buttons = () =>
    !account ? (
      <ButtonLight onClick={toggleWalletModal} width={upToMedium ? '100%' : 'fit-content'} minWidth="164px !important">
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    ) : (
      <>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={upToMedium ? '100%' : 'fit-content'}
                  minWidth="150px"
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies_A?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies_A?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={upToMedium ? '100%' : 'fit-content'}
                  minWidth="150px"
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies_B?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies_B?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
            </>
          )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={
            !isValid ||
            (approvalA !== ApprovalState.APPROVED && (!depositADisabled || noLiquidity)) ||
            (approvalB !== ApprovalState.APPROVED && (!depositBDisabled || noLiquidity))
          }
          error={!isValid && !!parsedAmounts_A && !!parsedAmounts_B && false}
          minWidth="164px"
          width={upToMedium ? '100%' : 'fit-content'}
        >
          <Text fontWeight={500}>
            {errorMessage ? errorMessage : expertMode ? <Trans>Supply</Trans> : <Trans>Preview</Trans>}
          </Text>
        </ButtonError>
      </>
    )

  const warning = (
    <>
      {outOfRange ? (
        <WarningCard padding="10px 16px">
          <Flex alignItems="center">
            <AlertTriangle stroke={theme.warning} size="16px" />
            <TYPE.warning ml="12px" fontSize="12px" flex={1}>
              <Trans>
                Your position will not earn fees until the market price of the pool moves into your price range.
              </Trans>
            </TYPE.warning>
          </Flex>
        </WarningCard>
      ) : null}

      {invalidRange ? (
        <WarningCard padding="10px 16px">
          <Flex alignItems="center">
            <AlertTriangle stroke={theme.warning} size="16px" />
            <TYPE.warning ml="12px" fontSize="12px" flex={1}>
              <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
            </TYPE.warning>
          </Flex>
        </WarningCard>
      ) : null}
    </>
  )

  const disableFeeSelect = !currencyIdA || !currencyIdB
  const disableRangeSelect = !feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)
  const hasTab = !noLiquidity && !disableRangeSelect
  const disableAmountSelect = disableRangeSelect || tickLower === undefined || tickUpper === undefined || invalidRange
  const chart = (
    <>
      {hasTab && (
        <Tabs
          tabsCount={positionCount}
          selectedTab={positionIndex}
          onChangedTab={index => setPositionIndex(index)}
          onAddTab={onAddPosition}
          onRemoveTab={onRemovePosition}
          onToggleChart={() => setShowChart(showChart => !showChart)}
        />
      )}
      <ChartContainer hasTab={hasTab}>
        {showChart ? (
          'pro-chart'
        ) : (
          <>
            <DynamicSection gap="md" disabled={disableRangeSelect}>
              <Text fontWeight="500" style={{ display: 'flex' }} fontSize={12}>
                <Trans>Select Range</Trans>
                <InfoHelper
                  size={14}
                  text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
                />
              </Text>
              {(() => {
                const gap = '16px'
                const buttonColumn = upToLarge ? (upToXXSmall ? 2 : 3) : 4
                const buttonWidth = `calc((100% - ${gap} * (${buttonColumn} - 1)) / ${buttonColumn})`
                return (
                  <Row gap={gap} flexWrap="wrap">
                    {RANGE_LIST.map(range => (
                      <Flex key={rangeData[range].title} width={buttonWidth}>
                        <MouseoverTooltip text={rangeData[range].tooltip} containerStyle={{ width: '100%' }}>
                          <RangeBtn onClick={() => getSetRange(range)} isSelected={range === activeRange}>
                            {rangeData[range].title}
                          </RangeBtn>
                        </MouseoverTooltip>
                      </Flex>
                    ))}
                  </Row>
                )
              })()}

              <RowFit gap={upToMedium ? '12px' : '24px'} flexDirection={upToMedium ? 'column' : 'row'} align="unset">
                <RowFit gap="8px">
                  <Text fontSize={12} color={theme.red}>
                    <Trans>Estimated Risk</Trans>
                  </Text>
                  <Rating point={riskPoint} color={theme.red} />
                </RowFit>
                <RowFit gap="8px">
                  <Text fontSize={12} color={theme.primary}>
                    <Trans>Estimated Profit</Trans>
                  </Text>
                  <Rating point={profitPoint} color={theme.primary} />
                </RowFit>
              </RowFit>
              {price && baseCurrency && quoteCurrency && !noLiquidity && (
                <Flex justifyContent="center" marginTop="0.5rem" sx={{ gap: '0.25rem' }}>
                  <Text fontWeight={500} textAlign="center" color={theme.subText} fontSize={12}>
                    <Trans>Current Price</Trans>
                  </Text>
                  <Text fontWeight={500} textAlign="center" fontSize={12}>
                    <HoverInlineText
                      maxCharacters={20}
                      text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                    />
                  </Text>
                  <Text fontSize={12}>
                    {quoteCurrency?.symbol} per {baseCurrency.symbol}
                  </Text>
                </Flex>
              )}
              <LiquidityChartRangeInput
                currencyA={baseCurrency ?? undefined}
                currencyB={quoteCurrency ?? undefined}
                feeAmount={feeAmount}
                ticksAtLimit={ticksAtLimit}
                price={price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined}
                leftPrice={leftPrice}
                rightPrice={rightPrice}
                onLeftRangeInput={onLeftRangeInput}
                onRightRangeInput={onRightRangeInput}
                interactive
              />
              <DynamicSection gap="md" disabled={disableRangeSelect}>
                <StackedContainer>
                  <StackedItem style={{ opacity: showCapitalEfficiencyWarning ? '0.05' : 1 }}>
                    <RangeSelector
                      priceLower={priceLower}
                      priceUpper={priceUpper}
                      getDecrementLower={getDecrementLower}
                      getIncrementLower={getIncrementLower}
                      getDecrementUpper={getDecrementUpper}
                      getIncrementUpper={getIncrementUpper}
                      onLeftRangeInput={onLeftRangeInput}
                      onRightRangeInput={onRightRangeInput}
                      currencyA={baseCurrency}
                      currencyB={quoteCurrency}
                      feeAmount={feeAmount}
                      ticksAtLimit={ticksAtLimit}
                    />
                  </StackedItem>
                </StackedContainer>

                <MediumOnly>{warning}</MediumOnly>
              </DynamicSection>
            </DynamicSection>
            <DynamicSection style={{ marginTop: '16px' }} gap="12px" disabled={disableAmountSelect}>
              <Text fontWeight={500} fontSize="12px">
                <Trans>Deposit Amounts</Trans>
              </Text>
              <Flex sx={{ gap: '16px' }} flexDirection={upToLarge ? 'column' : 'row'}>
                <Flex width="100%">
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onMax={() => {
                      onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                    }}
                    onHalf={() => {
                      onFieldAInput(currencyBalanceA?.divide(2).toExact() ?? '')
                    }}
                    currency={currencies_A ?? null}
                    id="add-liquidity-input-tokena"
                    showCommonBases
                    positionMax="top"
                    locked={depositADisabled}
                    estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                    disableCurrencySelect={!baseCurrencyIsETHER && !baseCurrencyIsWETH}
                    isSwitchMode={baseCurrencyIsETHER || baseCurrencyIsWETH}
                    onSwitchCurrency={() => {
                      chainId &&
                        navigate(
                          `/elastic/add/${
                            baseCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                          }/${currencyIdB}/${feeAmount}`,
                          { replace: true },
                        )
                    }}
                    outline
                  />
                </Flex>
                <Flex width="100%">
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onFieldBInput}
                    onMax={() => {
                      onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                    }}
                    onHalf={() => {
                      onFieldBInput(currencyBalanceB?.divide(2).toExact() ?? '')
                    }}
                    currency={currencies_B ?? null}
                    id="add-liquidity-input-tokenb"
                    showCommonBases
                    positionMax="top"
                    locked={depositBDisabled}
                    estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                    disableCurrencySelect={!quoteCurrencyIsETHER && !quoteCurrencyIsWETH}
                    isSwitchMode={quoteCurrencyIsETHER || quoteCurrencyIsWETH}
                    onSwitchCurrency={() => {
                      chainId &&
                        navigate(
                          `/elastic/add/${currencyIdA}/${
                            quoteCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                          }/${feeAmount}`,
                          { replace: true },
                        )
                    }}
                    outline
                  />
                </Flex>
              </Flex>
            </DynamicSection>
          </>
        )}
      </ChartContainer>
    </>
  )

  if (!isEVM) return <Navigate to="/" />
  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={!!noLiquidity ? t`Create a new pool` : t`Add Liquidity`}
            onDismiss={handleDismissConfirmation}
            topContent={() =>
              position && (
                // <PositionPreview
                //   position={position}
                //   title={<Trans>Selected Range</Trans>}
                //   inRange={!outOfRange}
                //   ticksAtLimit={ticksAtLimit}
                // />
                <div style={{ marginTop: '1rem' }}>
                  <ProAmmPoolInfo position={position} />
                  <ProAmmPooledTokens
                    liquidityValue0={CurrencyAmount.fromRawAmount(
                      unwrappedToken(position.pool.token0),
                      position.amount0.quotient,
                    )}
                    liquidityValue1={CurrencyAmount.fromRawAmount(
                      unwrappedToken(position.pool.token1),
                      position.amount1.quotient,
                    )}
                    title={t`New Liquidity Amount`}
                  />
                  <ProAmmPriceRange position={position} ticksAtLimit={ticksAtLimit} hideChart />
                </div>
              )
            }
            bottomContent={() => (
              <ButtonPrimary onClick={onAdd}>
                <Text fontWeight={500}>
                  <Trans>Supply</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
        pendingText={pendingText}
      />
      <PageWrapper>
        <AddRemoveTabs
          hideShare
          alignTitle="left"
          action={!!noLiquidity ? LiquidityAction.CREATE : LiquidityAction.ADD}
          showTooltip={true}
          onCleared={() => {
            onFieldAInput('0')
            onFieldBInput('0')
            navigate('/elastic/add')
          }}
          onBack={() => {
            navigate(`/pools/${networkInfo.route}?tab=elastic`)
          }}
          tutorialType={TutorialType.ELASTIC_ADD_LIQUIDITY}
        />
        <Container>
          <Flex paddingBottom={32}>
            <FlexLeft>
              <RowBetween>
                <Text fontSize={20}>
                  <Trans>Choose pool</Trans>
                </Text>
                <div>
                  <ButtonLight padding="2px 8px" as={Link} to={APP_PATHS.SWAP + '/' + networkInfo.route}>
                    <Repeat size={16} />
                    <Text marginLeft="4px">
                      <Trans>Swap</Trans>
                    </Text>
                  </ButtonLight>
                </div>
              </RowBetween>
              <RowBetween style={{ gap: '20px' }} flexDirection={upToXXSmall ? 'column' : 'row'}>
                <CurrencyInputPanel
                  hideBalance
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onUserInput={onFieldAInput}
                  hideInput={true}
                  onMax={null}
                  onHalf={null}
                  onCurrencySelect={handleCurrencyASelect}
                  currency={currencies_A ?? null}
                  id="add-liquidity-input-tokena"
                  showCommonBases
                  estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                  maxCurrencySymbolLength={6}
                />

                <ArrowWrapper
                  isVertical
                  rotated={rotate}
                  onClick={() => {
                    if (!!rightPrice) {
                      onLeftRangeInput(rightPrice?.invert().toString())
                    }
                    if (!!leftPrice) {
                      onRightRangeInput(leftPrice?.invert().toString())
                    }
                    setRotate(prev => !prev)
                  }}
                >
                  {!currencyIdA && !currencyIdB ? (
                    <SwapIcon size={24} color={theme.subText} />
                  ) : (
                    <StyledInternalLink
                      replace
                      to={`/elastic/add/${currencyIdB}/${currencyIdA}/${feeAmount}`}
                      style={{ color: 'inherit', display: 'flex' }}
                    >
                      <SwapIcon size={24} color={theme.subText} />
                    </StyledInternalLink>
                  )}
                </ArrowWrapper>

                <CurrencyInputPanel
                  hideBalance
                  value={formattedAmounts[Field.CURRENCY_B]}
                  hideInput={true}
                  onUserInput={onFieldBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onMax={null}
                  onHalf={null}
                  positionMax="top"
                  currency={currencies_B ?? null}
                  id="add-liquidity-input-tokenb"
                  showCommonBases
                  estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                  maxCurrencySymbolLength={6}
                />
              </RowBetween>
              <DynamicSection disabled={disableFeeSelect} gap="md">
                <Text fontWeight={500} fontSize="12px">
                  <Trans>Select fee tier</Trans>
                </Text>
                <FeeSelector
                  feeAmount={feeAmount}
                  onChange={handleFeePoolSelect}
                  currencyA={currencies_A}
                  currencyB={currencies_B}
                />
              </DynamicSection>

              {noLiquidity ? (
                <AutoColumn gap="1rem">
                  <AutoColumn gap="12px">
                    <RowBetween>
                      <Text fontWeight="500">
                        <Trans>Set Starting Price</Trans>
                      </Text>
                    </RowBetween>
                    <Flex
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <TYPE.body fontSize={12} textAlign="left" color={theme.subText} lineHeight="16px">
                        <Trans>
                          To initialize this pool, select a starting price for the pool then enter your liquidity price
                          range. Gas fees will be higher than usual due to initialization of the pool.
                        </Trans>
                      </TYPE.body>
                    </Flex>
                  </AutoColumn>
                  <AutoColumn gap="8px">
                    <OutlineCard
                      padding="12px 16px"
                      style={{ borderRadius: '999px', backgroundColor: theme.buttonBlack, border: 'none' }}
                    >
                      <StyledInput
                        className="start-price-input"
                        value={startPriceTypedValue}
                        onUserInput={onStartPriceInput}
                      />
                    </OutlineCard>
                    <RowBetween>
                      <Text
                        fontWeight="500"
                        color={theme.subText}
                        style={{ textTransform: 'uppercase' }}
                        fontSize="12px"
                      >
                        <Trans>Current Price</Trans>
                      </Text>
                      <TYPE.main>
                        {price ? (
                          <TYPE.main>
                            <RowFixed>
                              <HoverInlineText
                                maxCharacters={20}
                                text={`1 ${baseCurrency?.symbol} = ${
                                  invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)
                                } ${quoteCurrency?.symbol}`}
                              />
                            </RowFixed>
                          </TYPE.main>
                        ) : (
                          '-'
                        )}
                      </TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                </AutoColumn>
              ) : null}
              <MediumOnly>{chart}</MediumOnly>
            </FlexLeft>
            <BorderedHideMedium>
              <RightContainer gap="lg">{chart}</RightContainer>
            </BorderedHideMedium>
          </Flex>
          <RowBetween flexDirection={upToMedium ? 'column' : 'row'}>
            <div />
            <Flex
              sx={{ gap: '16px' }}
              flexDirection={upToMedium ? 'column' : 'row'}
              width={upToMedium ? '100%' : 'initial'}
            >
              <HideMedium>{warning}</HideMedium>
              <Buttons />
            </Flex>
          </RowBetween>
        </Container>
      </PageWrapper>
    </>
  )
}
