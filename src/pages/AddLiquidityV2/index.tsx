import { TransactionResponse } from '@ethersproject/providers'
import { t, Trans } from '@lingui/macro'
import { FeeAmount, NonfungiblePositionManager } from '@vutien/dmm-v3-sdk'
import { Currency, CurrencyAmount, WETH } from '@vutien/sdk-core'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonWarning } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { ArrowWrapper, Dots } from 'components/swapv2/styleds'
import { PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import { Bound, Field } from 'state/mint/proamm/actions'
import {
  useProAmmDerivedMintInfo,
  useProAmmMintActionHandlers,
  useProAmmMintState,
  useRangeHopCallbacks,
} from 'state/mint/proamm/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useIsExpertMode } from 'state/user/hooks'
import { ThemeContext } from 'styled-components'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { Text, Flex } from 'rebass'
import {
  DynamicSection,
  HideMedium,
  MediumOnly,
  PageWrapper,
  ResponsiveTwoColumns,
  RightContainer,
  StackedContainer,
  StackedItem,
  StyledInput,
  Container,
  FlexLeft,
} from './styled'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import PresetsButtons from 'components/RangeSelector/PresetsButtons'
import { BlueCard, OutlineCard, WarningCard } from 'components/Card'
import { AlertTriangle } from 'react-feather'
import { StyledInternalLink, TYPE } from 'theme'
import RangeSelector from 'components/RangeSelector'
import HoverInlineText from 'components/HoverInlineText'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import JSBI from 'jsbi'
import { nativeOnChain } from 'constants/tokens'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import FeeSelector from 'components/FeeSelector'
import { useProAmmBestTrade } from 'hooks/useProAmmBestTrade'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import { Swap as SwapIcon } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import { unwrappedToken } from 'utils/wrappedCurrency'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'

// const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const [rotate, setRotate] = useState(false)
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()

  // check for existing position if tokenId in url
  // const { position: existingPositionDetails, loading: positionLoading } = useProAmmPositionsFromTokenId(
  //   tokenId ? BigNumber.from(tokenId) : undefined
  // )
  // const hasExistingPosition = !!existingPositionDetails && !positionLoading

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined
  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  const baseCurrencyIsETHER = !!(chainId && baseCurrency && baseCurrency.isNative)
  const baseCurrencyIsWETH = !!(chainId && baseCurrency && baseCurrency.equals(WETH[chainId]))
  const quoteCurrencyIsETHER = !!(chainId && quoteCurrency && quoteCurrency.isNative)
  const quoteCurrencyIsWETH = !!(chainId && quoteCurrency && quoteCurrency.equals(WETH[chainId]))
  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useProAmmMintState()

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
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
  } = useProAmmDerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
  )

  const previousTicks =
    // : number[] = []
    useProAmmPreviousTicks(pool, position)
  const {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
  } = useProAmmMintActionHandlers(noLiquidity)

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
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }
  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {},
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_A],
    chainId ? PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined,
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    chainId ? PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined,
  )

  const allowedSlippage = useUserSlippageTolerance()

  async function onAdd() {
    if (!chainId || !library || !account) return

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (!previousTicks || previousTicks.length !== 2) {
      return
    }
    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, previousTicks, {
        slippageTolerance: basisPointsToPercent(allowedSlippage[0]),
        recipient: account,
        deadline: deadline.toString(),
        useNative,
        createPool: noLiquidity,
      })

      //0.00283161
      const txn: { to: string; data: string; value: string } = {
        to: PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value,
      }

      setAttemptingTxn(true)
      library
        .getSigner()
        .estimateGas(txn)
        .then(estimate => {
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
              addTransactionWithType(response, {
                type: 'Add liquidity',
                summary: `${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '0'} ${
                  baseCurrency.symbol
                } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '0'} ${quoteCurrency.symbol} `,
              })
              setTxHash(response.hash)
            })
        })
        .catch(error => {
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
  }

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
          ((chainId && currencyIdOther === nativeOnChain(chainId).symbol) ||
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
        history.push(`/proamm/add/${idA}`)
      } else {
        history.push(`/proamm/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, history],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        history.push(`/proamm/add/${idB}`)
      } else {
        history.push(`/proamm/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, history],
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      history.push(`/proamm/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, history, onLeftRangeInput, onRightRangeInput],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      history.push('/myPools')
    }
    setTxHash('')
  }, [history, onFieldAInput, txHash])

  const addIsUnsupported = false

  // const clearAll = useCallback(() => {
  //   onFieldAInput('')
  //   onFieldBInput('')
  //   onLeftRangeInput('')
  //   onRightRangeInput('')
  //   history.push(`/add`)
  // }, [history, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const {
    getDecrementLower,
    getIncrementLower,
    getDecrementUpper,
    getIncrementUpper,
    getSetFullRange,
  } = useRangeHopCallbacks(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    tickLower,
    tickUpper,
    pool,
    price,
  )
  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA = approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB = approvalB !== ApprovalState.APPROVED && (noLiquidity ? true : !!parsedAmounts[Field.CURRENCY_B])

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${
    !depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
  }`

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true}>
        <Trans>Unsupported Asset</Trans>
      </ButtonPrimary>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    ) : (
      <Flex sx={{ gap: '16px' }} flexDirection={isValid && showApprovalA && showApprovalB ? 'column' : 'row'}>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <RowBetween>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={showApprovalA ? '48%' : '100%'}
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
            </RowBetween>
          )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={
            !isValid ||
            (approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
        >
          <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Supply</Trans>}</Text>
        </ButtonError>
      </Flex>
    )

  //disable = !feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)
  useProAmmBestTrade(
    0,
    position && CurrencyAmount.fromRawAmount(position?.pool.token0, JSBI.BigInt('10000000000000')),
    position?.pool.token1,
  )

  const chart = (
    <>
      <DynamicSection gap="md" disabled={!feeAmount || invalidPool}>
        {!noLiquidity ? (
          <>
            <Text fontWeight="500" style={{ display: 'flex' }}>
              <Trans>Set Your Price Range</Trans>
              <InfoHelper
                size={14}
                text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
              />
            </Text>

            {price && baseCurrency && quoteCurrency && !noLiquidity && (
              <Flex justifyContent="center" marginTop="0.5rem" sx={{ gap: '0.25rem' }}>
                <Text fontWeight={500} textAlign="center" color={theme.subText} fontSize={12}>
                  <Trans>Current Price:</Trans>
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
              priceLower={priceLower}
              priceUpper={priceUpper}
              onLeftRangeInput={onLeftRangeInput}
              onRightRangeInput={onRightRangeInput}
              interactive
            />
          </>
        ) : (
          <AutoColumn gap="md">
            <RowBetween>
              <Text fontWeight="500">
                <Trans>Set Starting Price</Trans>
              </Text>
            </RowBetween>
            {noLiquidity && (
              <BlueCard
                style={{
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '1rem 1rem',
                }}
              >
                <TYPE.body
                  fontSize={14}
                  style={{ fontWeight: 500 }}
                  textAlign="left"
                  color={theme.text}
                  lineHeight="20px"
                >
                  <Trans>
                    To initialize this pool, select a starting price for the pool then enter your liquidity price range.
                    Gas fees will be higher than usual due to initialization of the pool.
                  </Trans>
                </TYPE.body>
              </BlueCard>
            )}
            <OutlineCard
              padding="12px 16px"
              style={{ borderRadius: '8px', backgroundColor: theme.buttonBlack, border: 'none' }}
            >
              <StyledInput className="start-price-input" value={startPriceTypedValue} onUserInput={onStartPriceInput} />
            </OutlineCard>
            <RowBetween>
              <Text fontWeight="500" color={theme.subText} style={{ textTransform: 'uppercase' }} fontSize="12px">
                <Trans>Current {baseCurrency?.symbol} Price:</Trans>
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
        )}
        <DynamicSection gap="md" disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}>
          <StackedContainer>
            <StackedItem style={{ opacity: showCapitalEfficiencyWarning ? '0.05' : 1 }}>
              <AutoColumn gap="md">
                {noLiquidity && (
                  <RowBetween>
                    <Text fontWeight="500" style={{ display: 'flex' }}>
                      <Trans>Set Your Price Range</Trans>
                      <InfoHelper
                        text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
                        placement={'right'}
                      />
                    </Text>
                  </RowBetween>
                )}
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
                {!noLiquidity && (
                  <PresetsButtons
                    setFullRange={() => {
                      setShowCapitalEfficiencyWarning(true)
                    }}
                  />
                )}
              </AutoColumn>
            </StackedItem>

            {showCapitalEfficiencyWarning && (
              <StackedItem zIndex={1}>
                <WarningCard padding="15px">
                  <AutoColumn gap="8px" style={{ height: '100%' }}>
                    <RowFixed>
                      <AlertTriangle stroke={theme.warning} size="16px" />
                      <TYPE.warning ml="12px" fontSize="15px">
                        <Trans>Efficiency Comparison</Trans>
                      </TYPE.warning>
                    </RowFixed>
                    <RowFixed>
                      <TYPE.warning ml="12px" fontSize="13px" margin={0} fontWeight={400}>
                        <Trans>Full range positions may earn less fees than concentrated positions.</Trans>
                      </TYPE.warning>
                    </RowFixed>
                    <Row>
                      <ButtonWarning
                        padding="8px"
                        marginRight="8px"
                        width="100%"
                        onClick={() => {
                          setShowCapitalEfficiencyWarning(false)
                          getSetFullRange()
                        }}
                      >
                        <TYPE.black fontSize={13}>
                          <Trans>I understand</Trans>
                        </TYPE.black>
                      </ButtonWarning>
                    </Row>
                  </AutoColumn>
                </WarningCard>
              </StackedItem>
            )}
          </StackedContainer>

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
        </DynamicSection>
      </DynamicSection>
    </>
  )

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
                  />
                  <ProAmmPriceRange position={position} ticksAtLimit={ticksAtLimit} />
                </div>
              )
            }
            bottomContent={() => (
              <ButtonPrimary onClick={onAdd}>
                <Text fontWeight={500} fontSize={20}>
                  <Trans>Add</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
        pendingText={pendingText}
      />
      <PageWrapper>
        <Container>
          <AddRemoveTabs
            hideShare
            action={!!noLiquidity ? LiquidityAction.CREATE : LiquidityAction.ADD}
            showTooltip={true}
          />
          <ResponsiveTwoColumns>
            <FlexLeft>
              <RowBetween style={{ gap: '12px' }}>
                <CurrencyInputPanel
                  hideBalance
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onUserInput={onFieldAInput}
                  hideInput={true}
                  onMax={() => {}}
                  showMaxButton={false}
                  onCurrencySelect={handleCurrencyASelect}
                  currency={currencies[Field.CURRENCY_A] ?? null}
                  id="add-liquidity-input-tokena"
                  showCommonBases
                  borderRadius={24}
                />

                <ArrowWrapper
                  clickable
                  rotated={rotate}
                  onClick={() => {
                    setRotate(prev => !prev)
                  }}
                >
                  <StyledInternalLink
                    replace
                    to={`/proamm/add/${currencyIdB}/${currencyIdA}/${feeAmount}`}
                    style={{ color: 'inherit' }}
                  >
                    <SwapIcon size={22} rotate={90} />
                  </StyledInternalLink>
                </ArrowWrapper>

                <CurrencyInputPanel
                  hideBalance
                  value={formattedAmounts[Field.CURRENCY_B]}
                  hideInput={true}
                  onUserInput={onFieldBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onMax={() => {}}
                  showMaxButton={false}
                  positionMax="top"
                  currency={currencies[Field.CURRENCY_B] ?? null}
                  id="add-liquidity-input-tokenb"
                  showCommonBases
                  borderRadius={24}
                />
              </RowBetween>

              <DynamicSection disabled={!currencyIdA || !currencyIdB} gap="md">
                <Text fontWeight={500}>
                  <Trans>Select Fee</Trans>
                </Text>
                <FeeSelector feeAmount={feeAmount} onChange={handleFeePoolSelect} />
              </DynamicSection>
              <DynamicSection
                disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
              >
                <AutoColumn gap="lg">
                  <HideMedium>{chart}</HideMedium>
                  <AutoColumn gap="md">
                    <Text fontWeight={500}>
                      <Trans>Deposit Amounts</Trans>
                    </Text>

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      showMaxButton
                      currency={currencies[Field.CURRENCY_A] ?? null}
                      id="add-liquidity-input-tokena"
                      showCommonBases
                      positionMax="top"
                      locked={depositADisabled}
                      disableCurrencySelect
                      borderRadius={24}
                    />

                    {chainId && (baseCurrencyIsETHER || baseCurrencyIsWETH) && (
                      <StyledInternalLink
                        replace
                        to={`/proamm/add/${
                          baseCurrencyIsETHER ? WETH[chainId].address : nativeOnChain(chainId).symbol
                        }/${currencyIdB}/${feeAmount}`}
                        style={{ fontSize: '14px', textAlign: 'right' }}
                      >
                        {baseCurrencyIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                  </AutoColumn>
                  <AutoColumn gap="md">
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      disableCurrencySelect
                      onUserInput={onFieldBInput}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      showMaxButton
                      currency={currencies[Field.CURRENCY_B] ?? null}
                      id="add-liquidity-input-tokenb"
                      showCommonBases
                      positionMax="top"
                      locked={depositBDisabled}
                      borderRadius={24}
                    />

                    {chainId && (quoteCurrencyIsETHER || quoteCurrencyIsWETH) && (
                      <StyledInternalLink
                        replace
                        to={`/proamm/add/${currencyIdA}/${
                          quoteCurrencyIsETHER ? WETH[chainId].address : nativeOnChain(chainId).symbol
                        }/${feeAmount}`}
                        style={{ fontSize: '14px', textAlign: 'right' }}
                      >
                        {quoteCurrencyIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                  </AutoColumn>
                </AutoColumn>
              </DynamicSection>
            </FlexLeft>
            <HideMedium>
              <Buttons />
            </HideMedium>
            <RightContainer gap="lg">
              <MediumOnly>{chart}</MediumOnly>
              <MediumOnly>
                <Buttons />
              </MediumOnly>
            </RightContainer>
          </ResponsiveTwoColumns>
        </Container>
      </PageWrapper>
    </>
  )
}
