import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ZERO } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMedia, usePrevious } from 'react-use'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import { BlackCard, OutlineCard, WarningCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Loader'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import ProAmmFee from 'components/ProAmm/ProAmmFee'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import { RowBetween } from 'components/Row'
import Slider from 'components/Slider'
import { SLIPPAGE_EXPLANATION_URL } from 'components/SlippageWarningNote'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { TutorialType } from 'components/Tutorial'
import FarmV21ABI from 'constants/abis/v2/farmv2.1.json'
import FarmV2ABI from 'constants/abis/v2/farmv2.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import {
  useProAmmNFTPositionManagerReadingContract,
  useProMMFarmSigningContract,
  useSigningContract,
} from 'hooks/useContract'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { MaxButton as MaxBtn } from 'pages/RemoveLiquidity/styled'
import { useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/burn/proamm/actions'
import { useBurnProAmmActionHandlers, useBurnProAmmState, useDerivedProAmmBurnInfo } from 'state/burn/proamm/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { basisPointsToPercent, buildFlagsForFarmV21, calculateGasMargin, formattedNum, isAddressString } from 'utils'
import { cn } from 'utils/cn'
import { formatDollarAmount } from 'utils/numbers'
import { SLIPPAGE_STATUS, checkRangeSlippage, checkWarningSlippage, formatSlippage } from 'utils/slippage'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'

import {
  AmoutToRemoveContent,
  Container,
  Content,
  FirstColumn,
  GridColumn,
  SecondColumn,
  TokenId,
  TokenInputWrapper,
} from './styled'

const TextUnderlineColor = ({
  children,
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { as?: 'a' }) => (
  <a
    className={cn('inline w-fit cursor-pointer border-b border-solid border-text font-medium text-text', className)}
    {...rest}
  >
    {children}
  </a>
)

const TextUnderlineTransparent = ({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-[0.5ch] inline w-fit border-b border-solid border-transparent', className)} {...rest}>
    {children}
  </span>
)

const MaxButton = ({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <MaxBtn
    className={cn(
      'm-0 size-max flex-none border-border bg-transparent px-3 py-1.5 text-sm font-medium text-subText max-sm:flex-1 max-sm:px-2 max-sm:py-1 max-sm:text-xs',
      className,
    )}
    {...rest}
  >
    {children}
  </MaxBtn>
)

export default function RemoveLiquidityProAmm() {
  const { tokenId } = useParams()

  const location = useLocation()
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Navigate to={{ ...location, pathname: '/myPools' }} />
  }
  return <Remove tokenId={parsedTokenId} />
}

function Remove({ tokenId }: { tokenId: BigNumber }) {
  const { position } = useProAmmPositionsFromTokenId(tokenId)
  const positionManager = useProAmmNFTPositionManagerReadingContract()
  const theme = useTheme()
  const [claimFee, _setIsClaimFee] = useState(false)

  const { networkInfo, account, chainId } = useActiveWeb3React()

  const { library } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [removeLiquidityError, setRemoveLiquidityError] = useState<string>('')

  const owner = useSingleCallResult(!!tokenId ? positionManager : null, 'ownerOf', [tokenId.toNumber()]).result?.[0]
  const isFarmV2 = networkInfo.elastic.farmV2S?.map(item => item.toLowerCase()).includes(owner?.toLowerCase())
  const isFarmV21 = networkInfo.elastic['farmV2.1S']?.map(item => item.toLowerCase()).includes(owner?.toLowerCase())
  const isDynamicFarm = networkInfo.elastic.farms.flat().includes(isAddressString(owner))

  const ownByFarm = isDynamicFarm || isFarmV2 || isFarmV21

  const ownsNFT = owner === account || ownByFarm

  const navigate = useNavigate()
  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!!chainId && !!prevChainId && chainId !== prevChainId) {
      navigate('/myPools')
    }
  }, [chainId, prevChainId, navigate])
  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)

  // burn state
  const { independentField, typedValue } = useBurnProAmmState()
  const {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    pooledAmount0,
    pooledAmount1,
    feeValue0,
    feeValue1,
    loadingFee,
    outOfRange,
    error,
    parsedAmounts,
  } = useDerivedProAmmBurnInfo(position, receiveWETH, isDynamicFarm)

  const currency0IsETHER = !!(chainId && liquidityValue0?.currency.isNative)
  const currency0IsWETH = !!(chainId && liquidityValue0?.currency.equals(WETH[chainId]))
  const currency1IsETHER = !!(chainId && liquidityValue1?.currency.isNative)
  const currency1IsWETH = !!(chainId && liquidityValue1?.currency.equals(WETH[chainId]))
  const { onUserInput } = useBurnProAmmActionHandlers()
  const removed = position?.liquidity?.eq(0)

  const poolAddress = useProAmmPoolInfo(
    positionSDK?.pool?.token0,
    positionSDK?.pool?.token1,
    positionSDK?.pool?.fee as FeeAmount,
  )
  // boilerplate for the slider
  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput],
  )

  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback,
    0,
  )
  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  }
  const address0 = pooledAmount0?.currency.wrapped.address || ''
  const address1 = pooledAmount1?.currency.wrapped.address || ''

  const usdPrices = useTokenPrices([address0, address1])

  const totalPooledUSD =
    parseFloat(pooledAmount0?.toExact() || '0') * usdPrices[address0] +
    parseFloat(pooledAmount1?.toExact() || '0') * usdPrices[address1]

  const totalFeeRewardUSD =
    parseFloat(feeValue0?.toExact() || '0') * usdPrices[address0] +
    parseFloat(feeValue1?.toExact() || '0') * usdPrices[address1]

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[address0]
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[address0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[address1]
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[address1]
      : 0

  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance()
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransactionWithType = useTransactionAdder()

  const farmV1Contract = useProMMFarmSigningContract(owner)

  const farmV2Address = isFarmV2 ? owner : undefined
  const farmV2Contract = useSigningContract(farmV2Address, FarmV2ABI)
  const farmV21Contract = useSigningContract(isFarmV21 ? owner : undefined, FarmV21ABI)

  const handleBroadcastRemoveSuccess = (response: TransactionResponse) => {
    setAttemptingTxn(false)
    const tokenAmountIn = liquidityValue0?.toSignificant(6)
    const tokenAmountOut = liquidityValue1?.toSignificant(6)
    const tokenSymbolIn = liquidityValue0?.currency.symbol ?? ''
    const tokenSymbolOut = liquidityValue1?.currency.symbol ?? ''
    addTransactionWithType({
      hash: response.hash,
      type: TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
      extraInfo: {
        tokenAmountIn,
        tokenAmountOut,
        tokenSymbolIn,
        tokenSymbolOut,
        tokenAddressIn: liquidityValue0?.currency.wrapped.address,
        tokenAddressOut: liquidityValue1?.currency.wrapped.address,
        contract: poolAddress,
        nftId: tokenId.toString(),
      },
    })
    setTxnHash(response.hash)
  }

  const burnFromFarm = async () => {
    const contract = isFarmV21 ? farmV21Contract : isFarmV2 ? farmV2Contract : farmV1Contract

    if (!contract || !liquidityValue0 || !liquidityValue1 || !deadline || !positionSDK || !liquidityPercentage) {
      return
    }

    try {
      const amount0Min = liquidityValue0?.subtract(liquidityValue0.multiply(basisPointsToPercent(allowedSlippage)))
      const amount1Min = liquidityValue1?.subtract(liquidityValue1.multiply(basisPointsToPercent(allowedSlippage)))

      const params = isFarmV21
        ? [
            tokenId.toString(),
            liquidityPercentage.multiply(positionSDK.liquidity).quotient.toString(),
            amount0Min.quotient.toString(),
            amount1Min.quotient.toString(),
            deadline.toString(),
            buildFlagsForFarmV21({
              isClaimFee: false,
              isSyncFee: false,
              isClaimReward: false,
              isReceiveNative: !receiveWETH,
            }),
          ]
        : isFarmV2
        ? [
            tokenId.toString(),
            liquidityPercentage.multiply(positionSDK.liquidity).quotient.toString(),
            amount0Min.quotient.toString(),
            amount1Min.quotient.toString(),
            deadline.toString(),
            false, // isClaimFee
            !receiveWETH,
          ]
        : [
            tokenId.toString(),
            liquidityPercentage.multiply(positionSDK.liquidity).quotient.toString(),
            amount0Min.quotient.toString(),
            amount1Min.quotient.toString(),
            deadline.toString(),
            !receiveWETH,
            [false, false],
          ]

      const gasEstimation = await contract.estimateGas.removeLiquidity(...params)

      const tx = await contract.removeLiquidity(...params, {
        gasLimit: calculateGasMargin(gasEstimation),
      })

      handleBroadcastRemoveSuccess(tx)
    } catch (e) {
      setAttemptingTxn(false)
      setRemoveLiquidityError(e?.message || JSON.stringify(e))
    }
  }

  const burn = async () => {
    setAttemptingTxn(true)
    if (
      !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      !deadline ||
      !account ||
      !chainId ||
      !feeValue0 ||
      !feeValue1 ||
      !positionSDK ||
      !liquidityPercentage ||
      !library
    ) {
      setAttemptingTxn(false)
      setRemoveLiquidityError('Some things went wrong')
      return
    }

    if (ownByFarm) {
      return burnFromFarm()
    }

    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(positionSDK, {
      tokenId: tokenId.toString(),
      liquidityPercentage,
      slippageTolerance: basisPointsToPercent(allowedSlippage),
      deadline: deadline.toString(),
      collectOptions: {
        expectedCurrencyOwed0: feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage))),
        expectedCurrencyOwed1: feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage))),
        recipient: account,
        deadline: deadline.toString(),
        isRemovingLiquid: true,
        havingFee: claimFee && !(feeValue0.equalTo(JSBI.BigInt('0')) && feeValue1.equalTo(JSBI.BigInt('0'))),
      },
    })
    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then(async (estimate: BigNumber) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            handleBroadcastRemoveSuccess(response)
          })
      })
      .catch((error: any) => {
        console.log('error', error)
        setAttemptingTxn(false)
        setRemoveLiquidityError(error?.message || JSON.stringify(error))
      })
  }

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txnHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setAttemptingTxn(false)
    setTxnHash('')
    setRemoveLiquidityError('')
  }, [onUserInput, txnHash])

  const pendingText = (
    <Trans>
      Removing {liquidityValue0?.toSignificant(6)} {liquidityValue0?.currency?.symbol} and{' '}
      {liquidityValue1?.toSignificant(6)} {liquidityValue1?.currency?.symbol}
      {claimFee && (feeValue0?.greaterThan(ZERO) || feeValue1?.greaterThan(ZERO)) ? <br /> : ''}
      {claimFee && (feeValue0?.greaterThan(ZERO) || feeValue1?.greaterThan(ZERO))
        ? `Collecting fee of ${feeValue0?.toSignificant(6)} ${
            feeValue0?.currency?.symbol
          } and ${feeValue1?.toSignificant(6)} ${feeValue1?.currency?.symbol}`
        : ''}
    </Trans>
  )

  function modalFooter() {
    return (
      <ButtonPrimary className="mt-4" onClick={burn}>
        <Trans>Remove</Trans>
      </ButtonPrimary>
    )
  }
  const onCurrencyAInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue),
    [onUserInput],
  )
  const onCurrencyBInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue),
    [onUserInput],
  )

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const isWarningSlippage = checkWarningSlippage(allowedSlippage, undefined)
  const slippageStatus = checkRangeSlippage(allowedSlippage, undefined)

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash}
        content={() =>
          removeLiquidityError ? (
            <TransactionErrorContent onDismiss={handleDismissConfirmation} message={removeLiquidityError} />
          ) : (
            <ConfirmationModalContent
              title={t`Remove Liquidity`}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <>
                  <div className="mt-6" />
                  {positionSDK && <ProAmmPoolInfo position={positionSDK} tokenId={tokenId.toString()} />}
                  <ProAmmPooledTokens
                    liquidityValue0={liquidityValue0}
                    liquidityValue1={liquidityValue1}
                    title={t`Remove Amount`}
                  />
                  {positionSDK ? (
                    claimFee ? (
                      <ProAmmFee
                        totalFeeRewardUSD={totalFeeRewardUSD}
                        feeValue0={feeValue0}
                        feeValue1={feeValue1}
                        position={positionSDK}
                        tokenId={tokenId}
                      />
                    ) : null
                  ) : (
                    <Loader />
                  )}

                  <OutlineCard className="mt-4 p-4">
                    <AutoColumn className="gap-3">
                      <div className="text-xs font-medium">
                        <Trans>More Information</Trans>
                      </div>
                      <Divider />
                      <RowBetween>
                        <TextDashed fontSize={12} fontWeight={500} className="text-subText" minWidth="max-content">
                          <MouseoverTooltip
                            width="200px"
                            text={
                              <div>
                                <Trans>
                                  During your swap if the price changes by more than this %, your transaction will
                                  revert. Read more{' '}
                                  <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                                    here ↗
                                  </ExternalLink>
                                </Trans>
                              </div>
                            }
                            placement="auto"
                          >
                            <Trans>Max Slippage</Trans>
                          </MouseoverTooltip>
                        </TextDashed>
                        <div className={cn('text-xs text-text', isWarningSlippage && 'text-warning')}>
                          {formatSlippage(allowedSlippage)}
                        </div>
                      </RowBetween>
                    </AutoColumn>
                  </OutlineCard>

                  {slippageStatus === SLIPPAGE_STATUS.HIGH && (
                    <WarningCard className="mt-5 px-4 py-2.5">
                      <div className="flex items-center">
                        <AlertTriangle size="16px" className="text-warning" />
                        <div className="ml-3 flex-1 text-xs text-text">
                          <Trans>
                            <TextUnderlineColor
                              style={{ minWidth: 'max-content' }}
                              href={SLIPPAGE_EXPLANATION_URL}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Slippage
                            </TextUnderlineColor>
                            <TextUnderlineTransparent>
                              is high. Your transaction may be front-run
                            </TextUnderlineTransparent>
                          </Trans>
                        </div>
                      </div>
                    </WarningCard>
                  )}
                </>
              )}
              bottomContent={modalFooter}
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
          action={LiquidityAction.REMOVE}
          showTooltip={false}
          tutorialType={TutorialType.ELASTIC_REMOVE_LIQUIDITY}
          owner={owner}
          showOwner={owner && account && !ownsNFT}
        />

        <Content>
          {position ? (
            <AutoColumn className="gap-3 text-left">
              <GridColumn>
                <FirstColumn>
                  {positionSDK ? (
                    <ProAmmPoolInfo position={positionSDK} tokenId={tokenId.toString()} showRangeInfo={false} />
                  ) : (
                    <Loader />
                  )}

                  <BlackCard className="rounded-2xl p-4">
                    <div className="flex items-center gap-1">
                      <TokenId color={removed ? theme.red : outOfRange ? theme.warning : theme.primary}>
                        #{tokenId.toString()}
                      </TokenId>
                      <RangeBadge removed={removed} inRange={!outOfRange} hideText size={14} />
                    </div>

                    <div className="mb-3 mt-4 flex justify-between text-xs font-medium">
                      <span>
                        <Trans>My Liquidity</Trans>
                      </span>
                      <span>{formatDollarAmount(totalPooledUSD)}</span>
                    </div>

                    <Divider />

                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-subText">Pooled {pooledAmount0?.currency.symbol}</span>
                      <div className="flex items-center">
                        <CurrencyLogo currency={pooledAmount0?.currency} size="16px" />
                        <span className="ml-1 font-medium">
                          {pooledAmount0 && <FormattedCurrencyAmount currencyAmount={pooledAmount0} />}{' '}
                          {pooledAmount0?.currency?.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-subText">Pooled {pooledAmount1?.currency.symbol}</span>
                      <div className="flex items-center">
                        <CurrencyLogo currency={pooledAmount1?.currency} size="16px" />
                        <span className="ml-1 font-medium">
                          {pooledAmount1?.toSignificant(10)} {pooledAmount1?.currency.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 mt-5 flex justify-between text-xs font-medium">
                      <span>My Fee Earnings</span>
                      {loadingFee && !feeValue0 ? <Loader /> : <span>{formatDollarAmount(totalFeeRewardUSD)}</span>}
                    </div>

                    <Divider />

                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-subText">{feeValue0?.currency.symbol} Fee Earned</span>
                      <div className="flex items-center">
                        <CurrencyLogo currency={feeValue0?.currency} size="16px" />
                        <span className="ml-1 font-medium">
                          {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}{' '}
                          {feeValue0?.currency?.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-subText">{feeValue1?.currency.symbol} Fee Earned</span>
                      <div className="flex items-center">
                        <CurrencyLogo currency={feeValue1?.currency} size="16px" />
                        <span className="ml-1 font-medium">
                          {feeValue1?.toSignificant(10)} {feeValue1?.currency.symbol}
                        </span>
                      </div>
                    </div>
                  </BlackCard>
                </FirstColumn>

                <SecondColumn>
                  <AmoutToRemoveContent>
                    <div className="text-xs font-medium text-subText">
                      <Trans>Amount to remove</Trans>
                    </div>

                    <BlackCard className="mt-4 rounded-2xl border border-border p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-medium max-sm:!min-w-[72px] max-sm:!text-[28px]">
                          {percentForSlider}%
                        </span>

                        <div className="flex flex-1 justify-end gap-2 max-sm:gap-1">
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>
                            <Trans>25%</Trans>
                          </MaxButton>
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>
                            <Trans>50%</Trans>
                          </MaxButton>
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>
                            <Trans>75%</Trans>
                          </MaxButton>
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>
                            <Trans>Max</Trans>
                          </MaxButton>
                        </div>
                      </div>

                      <Slider
                        value={percentForSlider}
                        onChange={onPercentSelectForSlider}
                        size={16}
                        style={{ width: '100%', margin: '1rem 0 0', padding: '0.75rem 0' }}
                      />
                    </BlackCard>

                    <TokenInputWrapper>
                      <div className="flex-1 rounded-2xl border border-solid border-border">
                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onUserInput={onCurrencyAInput}
                          onMax={null}
                          onHalf={null}
                          currency={liquidityValue0?.currency}
                          onCurrencySelect={() => null}
                          id="remove-liquidity-tokena"
                          estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                          disableCurrencySelect={!currency0IsETHER && !currency0IsWETH}
                          isSwitchMode={currency0IsETHER || currency0IsWETH}
                          onSwitchCurrency={() => setReceiveWETH(prev => !prev)}
                        />
                      </div>

                      <div className="flex-1 rounded-2xl border border-solid border-border">
                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_B]}
                          onUserInput={onCurrencyBInput}
                          onMax={null}
                          onHalf={null}
                          currency={liquidityValue1?.currency}
                          onCurrencySelect={() => null}
                          id="remove-liquidity-tokenb"
                          estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                          disableCurrencySelect={!currency1IsETHER && !currency1IsWETH}
                          isSwitchMode={currency1IsETHER || currency1IsWETH}
                          onSwitchCurrency={() => setReceiveWETH(prev => !prev)}
                        />
                      </div>
                    </TokenInputWrapper>
                  </AmoutToRemoveContent>

                  {slippageStatus === SLIPPAGE_STATUS.HIGH && (
                    <WarningCard className="mt-6 px-4 py-2.5">
                      <div className="flex items-center">
                        <AlertTriangle size="16px" className="text-warning" />
                        <div className="ml-3 flex-1 text-xs text-text">
                          <Trans>
                            <TextUnderlineColor
                              style={{ minWidth: 'max-content' }}
                              href={SLIPPAGE_EXPLANATION_URL}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Slippage
                            </TextUnderlineColor>
                            <TextUnderlineTransparent>
                              is high. Your transaction may be front-run
                            </TextUnderlineTransparent>
                          </Trans>
                        </div>
                      </div>
                    </WarningCard>
                  )}

                  <div className="flex justify-end">
                    <ButtonConfirmed
                      style={{ marginTop: '16px', width: upToMedium ? '100%' : 'fit-content', minWidth: '164px' }}
                      confirmed={false}
                      disabled={
                        removed ||
                        (loadingFee && !feeValue0) ||
                        liquidityPercentage?.equalTo(new Percent(0, 100)) ||
                        !liquidityValue0 ||
                        (!!owner && !!account && !ownsNFT)
                      }
                      onClick={() => {
                        if (!account) {
                          toggleWalletModal()
                        } else setShowConfirm(true)
                      }}
                    >
                      {removed ? <Trans>Closed</Trans> : error ?? <Trans>Preview</Trans>}
                    </ButtonConfirmed>
                  </div>
                </SecondColumn>
              </GridColumn>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Content>
      </Container>
    </>
  )
}
