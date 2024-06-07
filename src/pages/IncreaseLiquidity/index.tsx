import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import mixpanel from 'mixpanel-browser'
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMedia, usePrevious } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlackCard, WarningCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { useZapDetail } from 'components/ElasticZap/ZapDetail'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Loader'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmPriceRangeConfirm from 'components/ProAmm/ProAmmPriceRangeConfirm'
import Rating from 'components/Rating'
import { RowBetween } from 'components/Row'
import { SLIPPAGE_EXPLANATION_URL } from 'components/SlippageWarningNote'
import PriceImpactNote, { ZapHighPriceImpact } from 'components/SwapForm/PriceImpactNote'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { TutorialType } from 'components/Tutorial'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { didUserReject } from 'constants/connectors/utils'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useZapInAction, useZapInPoolResult } from 'hooks/elasticZap'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerReadingContract } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { useProAmmDerivedPositionInfo } from 'hooks/useProAmmDerivedPositionInfo'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { MethodSelector } from 'pages/AddLiquidityV2/styled'
import {
  Container,
  Content,
  FirstColumn,
  GridColumn,
  SecondColumn,
  TokenId,
  TokenInputWrapper,
} from 'pages/RemoveLiquidityProAmm/styled'
import { useNetworkModalToggle, useWalletModalToggle } from 'state/application/hooks'
import { useProAmmDerivedMintInfo, useProAmmMintActionHandlers, useProAmmMintState } from 'state/mint/proamm/hooks'
import { Field } from 'state/mint/proamm/type'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useDegenModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { MEDIA_WIDTHS, TYPE } from 'theme'
import { calculateGasMargin, formattedNum, isAddressString, shortenAddress } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { formatDollarAmount } from 'utils/numbers'
import { SLIPPAGE_STATUS, checkRangeSlippage, formatSlippage } from 'utils/slippage'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

import Chart from './Chart'

const TextUnderlineColor = styled(Text)`
  border-bottom: 1px solid ${({ theme }) => theme.text};
  width: fit-content;
  display: inline;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const TextUnderlineTransparent = styled(Text)`
  border-bottom: 1px solid transparent;
  width: fit-content;
  display: inline;
`

export default function IncreaseLiquidity() {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const [method, setMethod] = useState<'pair' | 'zap'>('pair')
  const isZapAvailable = !!networkInfo.elastic.zap
  useEffect(() => {
    if (!isZapAvailable) {
      setMethod('pair')
    }
  }, [isZapAvailable])

  const { currencyIdB, currencyIdA, feeAmount: feeAmountFromUrl, tokenId } = useParams()
  const { library } = useWeb3React()
  const navigate = useNavigate()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const toggleNetworkModal = useNetworkModalToggle()
  const [isDegenMode] = useDegenModeManager()
  const addTransactionWithType = useTransactionAdder()

  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!!chainId && !!prevChainId && chainId !== prevChainId) {
      navigate(APP_PATHS.MY_POOLS)
    }
  }, [chainId, prevChainId, navigate])

  const positionManager = useProAmmNFTPositionManagerReadingContract()

  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: loadingPosition } = useProAmmPositionsFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined,
  )

  const removed = existingPositionDetails?.liquidity?.eq(0)

  const owner = useSingleCallResult(!!tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]

  const ownsNFT = owner === account || existingPositionDetails?.operator === account
  const ownByFarm =
    networkInfo.elastic.farms.flat().includes(isAddressString(owner)) ||
    networkInfo.elastic.farmV2S?.map(item => item.toLowerCase()).includes(owner?.toLowerCase())

  const { position: existingPosition, loading: loadingInfo } = useProAmmDerivedPositionInfo(existingPositionDetails)

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

  // mint state
  const { positions } = useProAmmMintState()
  const { independentField, typedValue } = positions[0]
  const {
    pool,
    // ticks,
    dependentField,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    // invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    ticksAtLimit,
    riskPoint,
    profitPoint,
  } = useProAmmDerivedMintInfo(
    0,
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition,
  )

  const baseCurrencyIsETHER = !!(chainId && baseCurrency && baseCurrency.isNative)
  const baseCurrencyIsWETH = !!(chainId && baseCurrency && baseCurrency.equals(WETH[chainId]))
  const quoteCurrencyIsETHER = !!(chainId && quoteCurrency && quoteCurrency.isNative)
  const quoteCurrencyIsWETH = !!(chainId && quoteCurrency && quoteCurrency.equals(WETH[chainId]))

  const address0 = baseCurrency?.wrapped.address || ''
  const address1 = quoteCurrency?.wrapped.address || ''
  const usdPrices = useTokenPrices([address0, address1])

  const poolAddress = useProAmmPoolInfo(
    existingPosition?.pool.token0,
    existingPosition?.pool.token1,
    existingPosition?.pool.fee as FeeAmount,
  )

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[address0]
      ? parseFloat(parsedAmounts[Field.CURRENCY_A]?.toExact() || '0') * usdPrices[address0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[address1]
      ? parseFloat(parsedAmounts[Field.CURRENCY_B]?.toExact() || '0') * usdPrices[address1]
      : 0
  const pooledAmount0 =
    existingPosition &&
    CurrencyAmount.fromRawAmount(unwrappedToken(existingPosition.pool.token0), existingPosition.amount0.quotient)
  const pooledAmount1 =
    existingPosition &&
    CurrencyAmount.fromRawAmount(unwrappedToken(existingPosition.pool.token1), existingPosition.amount1.quotient)

  const totalPooledUSD =
    parseFloat(pooledAmount0?.toExact() || '0') * usdPrices[pooledAmount0?.currency?.wrapped.address || ''] +
    parseFloat(pooledAmount1?.toExact() || '0') * usdPrices[pooledAmount1?.currency?.wrapped.address || '']

  const previousTicks =
    // : number[] = []
    useProAmmPreviousTicks(pool, existingPosition)
  const { onFieldAInput, onFieldBInput, onResetMintState } = useProAmmMintActionHandlers(noLiquidity, 0)

  useEffect(() => {
    onResetMintState()
  }, [onResetMintState])

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

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
    networkInfo.elastic.nonfungiblePositionManager,
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    networkInfo.elastic.nonfungiblePositionManager,
  )

  const [allowedSlippage] = useUserSlippageTolerance()

  const [transactionError, setTransactionError] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!showConfirm) setTransactionError(undefined)
  }, [showConfirm])

  async function onAdd() {
    if (!library || !account || !tokenId) {
      return
    }

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (!previousTicks || previousTicks.length !== 2) {
      return
    }

    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, previousTicks, {
        slippageTolerance: new Percent(allowedSlippage, 10000),
        deadline: deadline.toString(),
        useNative,
        tokenId: JSBI.BigInt(tokenId),
      })

      //0.00283161
      const txn: { to: string; data: string; value: string } = {
        to: networkInfo.elastic.nonfungiblePositionManager,
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

          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) || '0'
              const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) || '0'
              const tokenSymbolIn = baseCurrency?.symbol ?? ''
              const tokenSymbolOut = quoteCurrency?.symbol ?? ''
              addTransactionWithType({
                hash: response.hash,
                type: TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
                extraInfo: {
                  tokenAmountIn,
                  tokenAmountOut,
                  tokenAddressIn: baseCurrency.wrapped.address,
                  tokenAddressOut: quoteCurrency.wrapped.address,
                  tokenSymbolIn,
                  tokenSymbolOut,
                  arbitrary: {
                    token_1: tokenSymbolIn,
                    token_2: tokenSymbolOut,
                  },
                },
              })
              setTxHash(response.hash)
            })
        })
        .catch((error: any) => {
          console.error('Failed to send transaction', error)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (!didUserReject(error)) {
            console.error(error)
          }
          setTransactionError(error.message)
        })
    } else {
      return
    }
  }

  const handleDismissConfirmation = useCallback(() => {
    if (method === 'zap') setShowZapConfirmation(false)
    else setShowConfirm(false)
    setZapError('')
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      navigate('/myPools')
    }
    setTxHash('')
  }, [navigate, onFieldAInput, txHash, method])

  const addIsUnsupported = false

  // get value and prices at ticks
  // const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA = approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB = approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!depositADisabled && !depositBDisabled ? 'and' : ''} ${
    !depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''
  } ${!depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''}`

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true}>
        <Trans>Unsupported Asset</Trans>
      </ButtonPrimary>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect</Trans>
      </ButtonLight>
    ) : (
      <>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <Flex sx={{ gap: '16px' }} flexDirection={isValid && showApprovalA && showApprovalB ? 'column' : 'row'}>
              <RowBetween>
                {showApprovalA && (
                  <ButtonPrimary
                    onClick={() => approveACallback()}
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
                    onClick={() => approveBCallback()}
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
            </Flex>
          )}
        <ButtonError
          style={{ width: upToMedium ? '100%' : 'fit-content', minWidth: '164px' }}
          onClick={() => {
            isDegenMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={
            !isValid ||
            (approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B] && false}
        >
          <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </>
    )

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const slippageStatus = checkRangeSlippage(allowedSlippage, false, false)

  // ZAP STATE
  const [value, setValue] = useState('')
  const [isReverse, setIsReverse] = useState(false)
  const [useWrapped, setUseWrapped] = useState(false)

  const selectedCurrency = useMemo(() => {
    const currency = isReverse ? currencies[Field.CURRENCY_B] : currencies[Field.CURRENCY_A]
    if (useWrapped) return currency?.wrapped
    return currency ? unwrappedToken(currency) : currency
  }, [isReverse, currencies, useWrapped])

  const quoteZapCurrency = useMemo(() => {
    return isReverse ? currencies[Field.CURRENCY_A] : currencies[Field.CURRENCY_B]
  }, [isReverse, currencies])

  const debouncedValue = useDebounce(value, 300)
  const amountIn = useParsedAmount(selectedCurrency, debouncedValue)

  useEffect(() => {
    if (amountIn?.toExact()) {
      mixpanel.track('Zap - Input detailed', {
        token0: selectedCurrency?.symbol,
        token1: quoteCurrency?.symbol,
        zap_token: selectedCurrency?.symbol,
        token_amount: amountIn.toExact(),
        source: 'increase_liquidity_page',
      })
    }
    // eslint-disable-next-line
  }, [amountIn?.toExact(), selectedCurrency])

  const equivalentQuoteAmount =
    amountIn && pool && selectedCurrency && amountIn.multiply(pool.priceOf(selectedCurrency.wrapped))

  const tickLower = existingPosition?.tickLower
  const tickUpper = existingPosition?.tickUpper

  const params = useMemo(() => {
    return poolAddress &&
      amountIn?.greaterThan('0') &&
      selectedCurrency &&
      quoteZapCurrency &&
      tickLower !== undefined &&
      tickUpper !== undefined
      ? {
          poolAddress,
          tokenIn: selectedCurrency.wrapped.address,
          tokenOut: quoteZapCurrency.wrapped.address,
          amountIn,
          tickLower,
          tickUpper,
        }
      : undefined
  }, [amountIn, poolAddress, selectedCurrency, quoteZapCurrency, tickLower, tickUpper])

  const { loading: zapLoading, result: zapResult, aggregatorData } = useZapInPoolResult(params)
  const zapInContractAddress = networkInfo.elastic.zap?.router
  const [zapApprovalState, zapApprove] = useApproveCallback(amountIn, zapInContractAddress)
  const { zapIn } = useZapInAction()
  const [showZapConfirmation, setShowZapConfirmation] = useState(false)
  const [zapError, setZapError] = useState('')

  const zapBalances = useCurrencyBalances(
    useMemo(
      () => [
        currencies[Field.CURRENCY_A]
          ? unwrappedToken(currencies[Field.CURRENCY_A] as Currency)
          : currencies[Field.CURRENCY_A],
        currencies[Field.CURRENCY_B]
          ? unwrappedToken(currencies[Field.CURRENCY_B] as Currency)
          : currencies[Field.CURRENCY_B],
        currencies[Field.CURRENCY_A]?.wrapped,
        currencies[Field.CURRENCY_B]?.wrapped,
      ],
      [currencies],
    ),
  )

  const balanceIndex = useWrapped ? (isReverse ? 3 : 2) : isReverse ? 1 : 0
  const balance = zapBalances[balanceIndex]
  let error: ReactElement | null = null
  if (!value) error = <Trans>Enter an amount</Trans>
  else if (!amountIn) error = <Trans>Invalid Input</Trans>
  else if (balance && amountIn?.greaterThan(balance)) error = <Trans>Insufficient Balance</Trans>

  const zapDetail = useZapDetail({
    pool: existingPosition?.pool,
    position: existingPosition,
    tokenIn: selectedCurrency?.wrapped.address,
    tokenId,
    amountIn,
    zapResult,
    poolAddress,
    tickLower: existingPosition?.tickLower,
    tickUpper: existingPosition?.tickUpper,
    previousTicks: previousTicks,
    aggregatorRoute: aggregatorData,
  })

  const handleZap = async () => {
    if (zapApprovalState === ApprovalState.NOT_APPROVED) {
      zapApprove()
      return
    }

    if (selectedCurrency && tokenId && zapResult && amountIn?.quotient && existingPosition && previousTicks?.length) {
      try {
        setAttemptingTxn(true)
        const { hash: txHash } = await zapIn(
          {
            tokenId: tokenId.toString(),
            tokenIn: selectedCurrency.wrapped.address,
            amountIn: amountIn.quotient.toString(),
            equivalentQuoteAmount: equivalentQuoteAmount?.quotient.toString() || '0',
            poolAddress,
            tickLower: existingPosition.tickLower,
            tickUpper: existingPosition.tickUpper,
            tickPrevious: [previousTicks[0], previousTicks[1]],
            poolInfo: {
              token0: existingPosition.pool.token0.wrapped.address,
              fee: existingPosition.pool.fee,
              token1: existingPosition.pool.token1.wrapped.address,
            },
            liquidity: zapResult.liquidity.toString(),
            aggregatorRoute: aggregatorData,
          },
          {
            zapWithNative: selectedCurrency.isNative,
          },
        )

        setTxHash(txHash)
        setAttemptingTxn(false)
        const tokenSymbolIn = zapDetail.newPosDraft ? unwrappedToken(zapDetail.newPosDraft.amount0.currency).symbol : ''
        const tokenSymbolOut = zapDetail.newPosDraft
          ? unwrappedToken(zapDetail.newPosDraft?.amount1.currency).symbol
          : ''
        addTransactionWithType({
          hash: txHash,
          type: TRANSACTION_TYPE.ELASTIC_ZAP_IN_LIQUIDITY,
          extraInfo: {
            zapAmountIn: amountIn.toSignificant(6) || '0',
            zapSymbolIn: selectedCurrency?.symbol || '',
            tokenAmountIn: zapDetail.newPosDraft?.amount0.toSignificant(6) || '',
            tokenAmountOut: zapDetail.newPosDraft?.amount1.toSignificant(6) || '',
            tokenAddressIn: zapDetail.newPosDraft?.amount0.currency.wrapped.address || '',
            tokenAddressOut: zapDetail.newPosDraft?.amount1.currency.wrapped.address || '',
            tokenSymbolIn,
            tokenSymbolOut,
            nftId: tokenId,
            arbitrary: {
              token_1: tokenSymbolIn,
              token_2: tokenSymbolOut,
            },
          },
        })

        mixpanel.track('Zap - Confirmed', {
          token0: selectedCurrency?.symbol,
          token1: quoteCurrency?.symbol,
          zap_token: selectedCurrency?.symbol,
          token_amount: amountIn.toExact(),
          source: 'increase_liquidity_page',
        })
      } catch (e) {
        console.error('zap error', e)
        setAttemptingTxn(false)
        setZapError(e?.message || JSON.stringify(e))
      }
    }
  }

  const ZapButton = (
    <ButtonPrimary
      onClick={() => {
        if (zapApprovalState === ApprovalState.NOT_APPROVED) {
          zapApprove()
          return
        }

        setShowZapConfirmation(true)
      }}
      backgroundColor={
        zapApprovalState !== ApprovalState.APPROVED
          ? undefined
          : zapDetail.priceImpact.isVeryHigh
          ? theme.red
          : zapDetail.priceImpact.isHigh
          ? theme.warning
          : undefined
      }
      disabled={
        !!error ||
        zapApprovalState === ApprovalState.PENDING ||
        zapLoading ||
        (zapApprovalState === ApprovalState.APPROVED && !isDegenMode && zapDetail.priceImpact?.isVeryHigh)
      }
      style={{ width: upToMedium ? '100%' : 'fit-content', minWidth: '164px' }}
    >
      {(() => {
        if (error) return error
        if (zapApprovalState === ApprovalState.PENDING)
          return (
            <Dots>
              <Trans>Approving</Trans>
            </Dots>
          )
        if (zapApprovalState !== ApprovalState.APPROVED) return <Trans>Approve</Trans>

        if (zapLoading)
          return (
            <Dots>
              <Trans>Loading</Trans>
            </Dots>
          )
        return <Trans>Preview</Trans>
      })()}
    </ButtonPrimary>
  )

  const inputAmountStyle = {
    flex: 1,
    border: `1px solid ${theme.border}`,
    borderRadius: '1rem',
    overflow: 'hidden',
  }

  const handleSwitch = (isQuote?: boolean) => {
    const param1 = isQuote
      ? currencyIdA
      : baseCurrencyIsETHER
      ? WETH[chainId].address
      : NativeCurrencies[chainId].symbol
    const param2 = isQuote
      ? quoteCurrencyIsETHER
        ? WETH[chainId].address
        : NativeCurrencies[chainId].symbol
      : currencyIdB
    return (
      chainId &&
      navigate(`/${networkInfo.route}${APP_PATHS.ELASTIC_INCREASE_LIQ}/${param1}/${param2}/${feeAmount}/${tokenId}`, {
        replace: true,
      })
    )
  }

  const handleDissmissZap = () => {
    setShowZapConfirmation(false)
    setTxHash('')
    setZapError('')
    setAttemptingTxn(false)
  }

  const token0 = existingPosition?.pool.token0
  const token1 = existingPosition?.pool.token1

  const symbol0 = getTokenSymbolWithHardcode(
    chainId,
    token0?.wrapped.address,
    useWrapped ? token0?.wrapped.symbol : (token0 ? unwrappedToken(token0) : token0)?.symbol,
  )
  const symbol1 = getTokenSymbolWithHardcode(
    chainId,
    token1?.wrapped.address,
    useWrapped ? token1?.wrapped.symbol : (token1 ? unwrappedToken(token1) : token1)?.symbol,
  )

  const zapPriceImpactNote = method === 'zap' &&
    !!(zapDetail.priceImpact?.isVeryHigh || zapDetail.priceImpact?.isHigh || zapDetail.priceImpact?.isInvalid) &&
    zapResult &&
    !zapLoading && (
      <>
        {zapDetail.priceImpact.isVeryHigh ? (
          <ZapHighPriceImpact showInPopup={showZapConfirmation} />
        ) : (
          <PriceImpactNote priceImpact={zapDetail.priceImpact.value} />
        )}
        <div style={{ marginBottom: '1rem' }} />
      </>
    )

  const token0IsNative =
    selectedCurrency?.isNative && selectedCurrency?.wrapped.address.toLowerCase() === pool?.token0.address.toLowerCase()
  const zapSymbol0 = token0IsNative ? selectedCurrency.symbol : pool?.token0.symbol
  const token1IsNative =
    selectedCurrency?.isNative && selectedCurrency?.wrapped.address.toLowerCase() === pool?.token1.address.toLowerCase()
  const zapSymbol1 = token1IsNative ? selectedCurrency.symbol : pool?.token1.symbol

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showZapConfirmation}
        onDismiss={handleDismissConfirmation}
        hash={txHash}
        attemptingTxn={attemptingTxn}
        pendingText={
          <Trans>
            Zapping {amountIn?.toSignificant(6)} {selectedCurrency?.symbol} into{' '}
            {zapDetail.newPosDraft?.amount0.toSignificant(6)} {symbol0} and{' '}
            {zapDetail.newPosDraft?.amount1.toSignificant(6)} {symbol1} of liquidity to the pool
          </Trans>
        }
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {zapError ? (
              <TransactionErrorContent onDismiss={handleDissmissZap} message={zapError} />
            ) : (
              <ConfirmationModalContent
                title={t`Increase Liquidity`}
                onDismiss={handleDissmissZap}
                topContent={() => (
                  <div style={{ marginTop: '1rem' }}>
                    {!!zapDetail.newPosDraft && <ProAmmPoolInfo position={zapDetail.newPosDraft} />}
                    <ProAmmPooledTokens
                      liquidityValue0={
                        selectedCurrency?.isNative
                          ? CurrencyAmount.fromRawAmount(
                              selectedCurrency,
                              zapDetail.newPooledAmount0?.quotient.toString() || 0,
                            )
                          : zapDetail.newPooledAmount0
                      }
                      liquidityValue1={zapDetail.newPooledAmount1}
                      title={t`New Liquidity Amount`}
                    />
                    {!!zapDetail.newPosDraft && (
                      <ProAmmPriceRangeConfirm
                        position={zapDetail.newPosDraft}
                        ticksAtLimit={ticksAtLimit}
                        zapDetail={zapDetail}
                      />
                    )}
                  </div>
                )}
                showGridListOption={false}
                bottomContent={() => (
                  <Flex flexDirection="column" sx={{ gap: '12px' }}>
                    {zapPriceImpactNote}
                    <ButtonError
                      error={zapDetail.priceImpact.isVeryHigh}
                      warning={zapDetail.priceImpact.isHigh}
                      id="btnSupply"
                      onClick={handleZap}
                    >
                      <Text fontWeight={500}>
                        <Trans>Supply</Trans>
                      </Text>
                    </ButtonError>
                  </Flex>
                )}
              />
            )}
          </Flex>
        )}
      />

      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() =>
          transactionError ? (
            <TransactionErrorContent onDismiss={handleDismissConfirmation} message={transactionError} />
          ) : (
            <ConfirmationModalContent
              title={t`Increase Liquidity`}
              onDismiss={handleDismissConfirmation}
              topContent={() =>
                existingPosition && (
                  <div style={{ marginTop: '1rem' }}>
                    <ProAmmPoolInfo position={existingPosition} tokenId={tokenId} showRemoved={false} />
                    <ProAmmPooledTokens
                      liquidityValue0={parsedAmounts[Field.CURRENCY_A]}
                      liquidityValue1={parsedAmounts[Field.CURRENCY_B]}
                      title={t`Increase Amount`}
                    />
                    <ProAmmPriceRangeConfirm position={existingPosition} ticksAtLimit={ticksAtLimit} />
                  </div>
                )
              }
              bottomContent={() => (
                <>
                  {slippageStatus === SLIPPAGE_STATUS.HIGH && (
                    <WarningCard padding="10px 16px" m="0 0 20px">
                      <Flex alignItems="center">
                        <AlertTriangle stroke={theme.warning} size="16px" />
                        <TYPE.black ml="12px" fontSize="12px" flex={1}>
                          <Trans>
                            <TextUnderlineColor
                              style={{ minWidth: 'max-content' }}
                              as="a"
                              href={SLIPPAGE_EXPLANATION_URL}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Slippage
                            </TextUnderlineColor>
                            <TextUnderlineTransparent sx={{ ml: '0.5ch' }}>
                              is high. Your transaction may be front-run
                            </TextUnderlineTransparent>
                          </Trans>
                        </TYPE.black>
                      </Flex>
                    </WarningCard>
                  )}
                  <ButtonPrimary id="btnSupply" onClick={onAdd}>
                    <Text fontWeight={500}>
                      <Trans>Supply</Trans>
                    </Text>
                  </ButtonPrimary>
                </>
              )}
            />
          )
        }
        pendingText={pendingText}
      />
      <Container>
        <AddRemoveTabs
          hideShare
          isElastic
          alignTitle="left"
          action={LiquidityAction.INCREASE}
          showTooltip={false}
          tutorialType={TutorialType.ELASTIC_INCREASE_LIQUIDITY}
          owner={owner}
          showOwner={owner && account && !ownsNFT && !ownByFarm}
        />

        <Content>
          {existingPosition ? (
            <AutoColumn gap="md" style={{ textAlign: 'left' }}>
              <GridColumn>
                <FirstColumn style={{ height: 'calc(100% - 56px)' }}>
                  <Flex justifyContent="space-between" alignItems="center" color={theme.subText} lineHeight="28px">
                    <Flex flex={1} alignItems="center">
                      <DoubleCurrencyLogo
                        currency0={unwrappedToken(existingPosition.pool.token0)}
                        currency1={unwrappedToken(existingPosition.pool.token1)}
                        size={20}
                      />
                      <Text
                        fontSize="16px"
                        fontWeight="500"
                        color={theme.text}
                        maxWidth="fit-content"
                        flex={1}
                        sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {unwrappedToken(existingPosition.pool.token0).symbol} -{' '}
                        {unwrappedToken(existingPosition.pool.token1).symbol}
                      </Text>
                      <FeeTag>FEE {(existingPosition?.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}% </FeeTag>
                    </Flex>
                    <Copy
                      toCopy={poolAddress}
                      text={
                        <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                          {shortenAddress(chainId, poolAddress)}{' '}
                        </Text>
                      }
                    />
                  </Flex>

                  <BlackCard style={{ borderRadius: '1rem', padding: '1rem' }}>
                    <Flex alignItems="center" sx={{ gap: '4px' }}>
                      <TokenId color={removed ? theme.red : outOfRange ? theme.warning : theme.primary}>
                        #{tokenId?.toString()}
                      </TokenId>
                      {/* dont show removed when increasing liquidity*/}
                      <RangeBadge removed={removed} inRange={!outOfRange} hideText size={14} />
                    </Flex>

                    <Flex
                      justifyContent="space-between"
                      fontSize="12px"
                      fontWeight="500"
                      marginTop="1rem"
                      marginBottom="0.75rem"
                    >
                      <Text>
                        <Trans>My Liquidity</Trans>
                      </Text>
                      <Text>{formatDollarAmount(totalPooledUSD)}</Text>
                    </Flex>

                    <Divider />

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>Pooled {unwrappedToken(existingPosition.pool.token0).symbol}</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={unwrappedToken(existingPosition.pool.token0)} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          <FormattedCurrencyAmount
                            currencyAmount={CurrencyAmount.fromRawAmount(
                              unwrappedToken(existingPosition.pool.token0),
                              existingPosition.amount0.quotient,
                            )}
                          />{' '}
                          {unwrappedToken(existingPosition.pool.token0).symbol}
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>Pooled {existingPosition.pool.token1.symbol}</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={existingPosition.pool.token1} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          <FormattedCurrencyAmount
                            currencyAmount={CurrencyAmount.fromRawAmount(
                              unwrappedToken(existingPosition.pool.token1),
                              existingPosition.amount1.quotient,
                            )}
                          />{' '}
                          {existingPosition.pool.token1.symbol}
                        </Text>
                      </Flex>
                    </Flex>
                  </BlackCard>
                </FirstColumn>

                <SecondColumn>
                  <MethodSelector method={method} setMethod={setMethod} />
                  <BlackCard style={{ marginBottom: '24px' }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridGap: upToMedium ? '12px' : '24px',
                        gridTemplateColumns: `repeat(${upToMedium ? 1 : 2} , fit-content(100%) fit-content(100%))`,
                      }}
                    >
                      <Text fontSize={12} color={theme.red}>
                        <Trans>Estimated Risk</Trans>
                      </Text>
                      <Rating point={riskPoint} color={theme.red} />
                      <Text fontSize={12} color={theme.primary}>
                        <Trans>Estimated Profit</Trans>
                      </Text>
                      <Rating point={profitPoint} color={theme.primary} />
                    </Box>
                    <Flex marginTop="1rem" />
                    <Chart position={existingPosition} ticksAtLimit={ticksAtLimit} />

                    <TokenInputWrapper>
                      {method === 'pair' ? (
                        <>
                          <div style={inputAmountStyle}>
                            <CurrencyInputPanel
                              value={formattedAmounts[Field.CURRENCY_A]}
                              onUserInput={onFieldAInput}
                              onMax={() => {
                                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                              }}
                              onHalf={() => {
                                onFieldAInput(currencyBalances[Field.CURRENCY_A]?.divide(2)?.toExact() ?? '')
                              }}
                              currency={currencies[Field.CURRENCY_A] ?? null}
                              id="add-liquidity-input-tokena"
                              showCommonBases
                              positionMax="top"
                              locked={depositADisabled}
                              estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                              disableCurrencySelect={!baseCurrencyIsETHER && !baseCurrencyIsWETH}
                              isSwitchMode={baseCurrencyIsETHER || baseCurrencyIsWETH}
                              onSwitchCurrency={() => handleSwitch(false)}
                            />
                          </div>

                          <div style={inputAmountStyle}>
                            <CurrencyInputPanel
                              value={formattedAmounts[Field.CURRENCY_B]}
                              onUserInput={onFieldBInput}
                              onMax={() => {
                                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                              }}
                              onHalf={() => {
                                onFieldBInput(currencyBalances[Field.CURRENCY_B]?.divide(2).toExact() ?? '')
                              }}
                              currency={currencies[Field.CURRENCY_B] ?? null}
                              id="add-liquidity-input-tokenb"
                              showCommonBases
                              positionMax="top"
                              locked={depositBDisabled}
                              estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                              disableCurrencySelect={!quoteCurrencyIsETHER && !quoteCurrencyIsWETH}
                              isSwitchMode={quoteCurrencyIsETHER || quoteCurrencyIsWETH}
                              onSwitchCurrency={() => handleSwitch(true)}
                            />
                          </div>
                        </>
                      ) : (
                        <Flex sx={{ gap: '1rem', width: '100%' }} flexDirection={upToMedium ? 'column' : 'row'}>
                          <div style={inputAmountStyle}>
                            <CurrencyInputPanel
                              id="zap-increase-liquidity"
                              value={value}
                              onUserInput={v => {
                                setValue(v)
                              }}
                              onMax={() => {
                                const amount = zapBalances[balanceIndex]
                                if (amount) setValue(maxAmountSpend(amount)?.toExact() || '')
                              }}
                              onHalf={() => {
                                setValue(zapBalances[balanceIndex]?.divide('2').toExact() || '')
                              }}
                              currency={selectedCurrency}
                              positionMax="top"
                              showCommonBases
                              estimatedUsd={formattedNum(zapDetail.amountInUsd, true)}
                              isSwitchMode
                              onSwitchCurrency={() => {
                                if (selectedCurrency?.isNative) {
                                  setUseWrapped(true)
                                } else {
                                  setUseWrapped(false)
                                  setIsReverse(prev => !prev)
                                }
                              }}
                            />
                          </div>
                          <Flex
                            flex={1}
                            flexDirection="column"
                            justifyContent="space-between"
                            fontSize="12px"
                            fontWeight="500"
                          >
                            <Flex justifyContent="space-between">
                              <Text color={theme.subText}>Est. Pooled {zapSymbol0}</Text>
                              {zapLoading ? (
                                zapDetail.skeleton()
                              ) : !zapResult || !pool ? (
                                '--'
                              ) : (
                                <Flex fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                                  <CurrencyLogo
                                    currency={token0IsNative ? unwrappedToken(pool.token0) : pool.token0}
                                    size="14px"
                                  />
                                  <Text>
                                    {zapDetail.newPosDraft?.amount0?.toSignificant(10)} {zapSymbol0}
                                  </Text>
                                </Flex>
                              )}
                            </Flex>

                            <Flex justifyContent="space-between">
                              <Text color={theme.subText}>Est. Pooled {zapSymbol1}</Text>
                              {zapLoading ? (
                                zapDetail.skeleton()
                              ) : !zapResult || !pool ? (
                                '--'
                              ) : (
                                <Flex fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                                  <CurrencyLogo
                                    currency={token1IsNative ? unwrappedToken(pool.token1) : pool.token1}
                                    size="14px"
                                  />
                                  <Text>
                                    {zapDetail.newPosDraft?.amount1?.toSignificant(10)} {zapSymbol1}
                                  </Text>
                                </Flex>
                              )}
                            </Flex>

                            <Flex justifyContent="space-between">
                              <Text color={theme.subText}>Max Slippage</Text>
                              <Text> {formatSlippage(allowedSlippage)}</Text>
                            </Flex>

                            <Flex justifyContent="space-between">
                              <Text color={theme.subText}>Price Impact</Text>
                              {zapLoading ? (
                                zapDetail.skeleton(40)
                              ) : !zapResult ? (
                                '--'
                              ) : (
                                <Text
                                  fontWeight="500"
                                  color={
                                    zapDetail.priceImpact.isVeryHigh
                                      ? theme.red
                                      : zapDetail.priceImpact.isHigh
                                      ? theme.warning
                                      : theme.text
                                  }
                                >
                                  {zapDetail.priceImpact.isInvalid
                                    ? '--'
                                    : zapDetail.priceImpact.value < 0.01
                                    ? '<0.01%'
                                    : zapDetail.priceImpact.value.toFixed(2) + '%'}
                                </Text>
                              )}
                            </Flex>
                          </Flex>
                        </Flex>
                      )}
                    </TokenInputWrapper>
                  </BlackCard>

                  {slippageStatus === SLIPPAGE_STATUS.HIGH && (
                    <WarningCard padding="10px 16px" mb="16px">
                      <Flex alignItems="center">
                        <AlertTriangle stroke={theme.warning} size="16px" />
                        <TYPE.black ml="12px" fontSize="12px" flex={1}>
                          <Trans>
                            <TextUnderlineColor
                              style={{ minWidth: 'max-content' }}
                              as="a"
                              href={SLIPPAGE_EXPLANATION_URL}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Slippage
                            </TextUnderlineColor>
                            <TextUnderlineTransparent sx={{ ml: '0.5ch' }}>
                              is high. Your transaction may be front-run
                            </TextUnderlineTransparent>
                          </Trans>
                        </TYPE.black>
                      </Flex>
                    </WarningCard>
                  )}

                  {zapPriceImpactNote}

                  <Flex justifyContent="flex-end">{method === 'pair' || !account ? <Buttons /> : ZapButton}</Flex>
                </SecondColumn>
              </GridColumn>
            </AutoColumn>
          ) : loadingPosition || loadingInfo ? (
            <Loader />
          ) : (
            <Flex flexDirection="column" sx={{ gap: '16px' }}>
              <Text fontSize="48px" fontWeight="500">
                <Trans>404</Trans>
              </Text>
              <Text>
                <Trans>
                  Position {tokenId} does not exist on {networkInfo.name}
                </Trans>
              </Text>
              <Text>
                <Link to="#" onClick={toggleNetworkModal}>
                  Switch chain
                </Link>{' '}
                or <Link to={APP_PATHS.MY_POOLS}>Go back to My Pools</Link>
              </Text>
            </Flex>
          )}
        </Content>
      </Container>
    </>
  )
}
