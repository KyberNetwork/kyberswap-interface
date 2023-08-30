import { CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { ReactElement, useMemo, useState } from 'react'
import { Zap } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { abi } from 'constants/abis/v2/ProAmmPoolState.json'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { useZapInAction, useZapInPoolResult } from 'hooks/elasticZap'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useContract, useProAmmTickReader } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { RANGE_LIST } from 'pages/AddLiquidityV2/constants'
import { useWalletModalToggle } from 'state/application/hooks'
import { RANGE } from 'state/mint/proamm/type'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { StyledInternalLink } from 'theme'
import { formatDollarAmount } from 'utils/numbers'
import { checkPriceImpact } from 'utils/prices'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

import RangeSelector, { useTicksFromRange } from './RangeSelector'

const QuickZapButtonWrapper = styled(ButtonOutlined)<{ size: 'small' | 'medium' }>`
  padding: 0;
  width: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  max-width: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  height: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.subText};

  border: 1px solid ${({ theme }) => rgba(theme.subText, 0.2)};

  &:active {
    box-shadow: none;
  }

  &:focus {
    box-shadow: none;
  }
`

const Content = styled.div`
  padding: 1rem;
  width: 100%;
`

const Detail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 1rem;
  padding: 12px;
  margin-top: 20px;
`

export const QuickZapButton = ({ onClick, size = 'medium' }: { onClick: () => void; size?: 'small' | 'medium' }) => {
  return (
    <MouseoverTooltip text={<Trans>Quickly zap and add liquidity using only one token</Trans>}>
      <QuickZapButtonWrapper onClick={onClick} size={size}>
        <Zap size={size === 'small' ? 16 : 20} />
      </QuickZapButtonWrapper>
    </MouseoverTooltip>
  )
}

type Props = {
  poolAddress: string
  tokenId?: string | number | BigNumber
  isOpen: boolean
  onDismiss: () => void
}

export default function QuickZap(props: Props) {
  if (!props.isOpen) return null

  return <QuickZapModal {...props} />
}

function QuickZapModal({ isOpen, onDismiss, poolAddress, tokenId }: Props) {
  const { chainId, networkInfo, account } = useActiveWeb3React()
  const zapInContractAddress = (networkInfo as EVMNetworkInfo).elastic.zap?.zapIn
  const theme = useTheme()
  const [selectedRange, setSelectedRange] = useState<RANGE>(RANGE_LIST[1])

  const toggleWalletModal = useWalletModalToggle()
  const poolContract = useContract(poolAddress, abi)

  const { loading: loadingPos, position: positionDetail } = useProAmmPositionsFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined,
  )

  const { loading: loadingPoolState, result: poolStateRes } = useSingleCallResult(poolContract, 'getPoolState')
  const { loading: loadingToken0, result: token0Res } = useSingleCallResult(
    poolContract,
    'token0',
    undefined,
    NEVER_RELOAD,
  )
  const { loading: loadingToken1, result: token1Res } = useSingleCallResult(
    poolContract,
    'token1',
    undefined,
    NEVER_RELOAD,
  )
  const { loading: loadingFee, result: feeRes } = useSingleCallResult(
    poolContract,
    'swapFeeUnits',
    undefined,
    NEVER_RELOAD,
  )

  const { loading: loadingLiqState, result: liqStateRes } = useSingleCallResult(poolContract, 'getLiquidityState')

  const token0 = useToken(token0Res?.[0])
  const token1 = useToken(token1Res?.[0])

  const currency0 = token0 ? unwrappedToken(token0.wrapped) : undefined
  const currency1 = token1 ? unwrappedToken(token1.wrapped) : undefined

  const pool = useMemo(() => {
    const fee = feeRes?.[0]
    if (!liqStateRes || !poolStateRes || !token0 || !token1 || !fee) return null

    return new Pool(
      token0.wrapped,
      token1.wrapped,
      fee as FeeAmount,
      poolStateRes.sqrtP,
      liqStateRes.baseL,
      liqStateRes.reinvestL,
      poolStateRes.currentTick,
    )
  }, [token0, token1, poolStateRes, liqStateRes, feeRes])

  const position = useMemo(() => {
    if (!positionDetail || !pool) return null
    return new Position({
      pool,
      tickLower: positionDetail.tickLower,
      tickUpper: positionDetail.tickUpper,
      liquidity: positionDetail.liquidity.toString(),
    })
  }, [positionDetail, pool])

  const loading = loadingPoolState || loadingLiqState || loadingToken0 || loadingToken1 || loadingFee || loadingPos

  const outOfRange =
    !!position && (position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent >= position.tickUpper)

  const currencies = useMemo(() => [currency0, currency1], [currency0, currency1])
  const balances = useCurrencyBalances(currencies)

  const prices = useTokenPrices(
    [WETH[chainId].address, currency0?.wrapped.address, currency1?.wrapped.address].filter(Boolean) as string[],
  )

  const [isReverse, setIsReverse] = useState(false)

  const selectedCurrency = useMemo(() => {
    return isReverse ? currency1 : currency0
  }, [isReverse, currency0, currency1])

  const [typedValue, setTypedValue] = useState('')
  const debouncedValue = useDebounce(typedValue, 300)

  const amountIn = useParsedAmount(selectedCurrency, debouncedValue)

  const [tickLower, tickUpper] = useTicksFromRange(selectedRange, pool || undefined)
  const tickReader = useProAmmTickReader()

  const results = useSingleContractMultipleData(tickReader, 'getNearestInitializedTicks', [
    [poolAddress, tickLower],
    [poolAddress, tickUpper],
  ])

  const tickPrevious = useMemo(() => {
    return results.map(call => call.result?.previous)
  }, [results])

  const params = useMemo(() => {
    return amountIn?.greaterThan('0') && selectedCurrency
      ? {
          poolAddress,
          tokenIn: selectedCurrency.wrapped.address,
          amountIn,
          tickLower: position?.tickLower || tickLower,
          tickUpper: position?.tickUpper || tickUpper,
        }
      : undefined
  }, [amountIn, position, poolAddress, selectedCurrency, tickLower, tickUpper])

  const { loading: zapLoading, result } = useZapInPoolResult(params)

  const [approvalState, approve] = useApproveCallback(amountIn, zapInContractAddress)

  const { zapInPoolToAddLiquidity, zapInPoolToMint } = useZapInAction()

  let error: ReactElement | null = null
  if (!typedValue || (typedValue && !amountIn)) error = <Trans>Invalid Input</Trans>
  else if (amountIn?.greaterThan(balances[isReverse ? 1 : 0])) error = <Trans>Insufficient Balance</Trans>

  const renderActionName = () => {
    if (error) return error
    if (approvalState === ApprovalState.PENDING)
      return (
        <Dots>
          <Trans>Approving</Trans>
        </Dots>
      )
    if (approvalState !== ApprovalState.APPROVED) return <Trans>Approve</Trans>

    if (zapLoading)
      return (
        <Dots>
          <Trans>Loading</Trans>
        </Dots>
      )
    if (!!position) return <Trans>Increase Liquidity</Trans>
    return <Trans>Add Liquidity</Trans>
  }

  const usedAmount0 = token0 && CurrencyAmount.fromRawAmount(token0, result?.usedAmount0.toString() || '0')
  const usedAmount1 = token1 && CurrencyAmount.fromRawAmount(token1, result?.usedAmount1.toString() || '0')

  let newPooledAmount0 = usedAmount0
  if (position && newPooledAmount0) newPooledAmount0 = newPooledAmount0.add(position.amount0)

  let newPooledAmount1 = usedAmount1
  if (position && newPooledAmount1) newPooledAmount1 = newPooledAmount1.add(position.amount1)

  const symbol0 = getTokenSymbolWithHardcode(chainId, token0?.wrapped.address, currency0?.symbol)
  const symbol1 = getTokenSymbolWithHardcode(chainId, token1?.wrapped.address, currency1?.symbol)

  const oldUsdValue =
    +(position?.amount0.toExact() || '0') * (prices[currency0?.wrapped.address || ''] || 0) +
    +(position?.amount1.toExact() || '0') * (prices[currency1?.wrapped.address || ''] || 0)

  const newUsdValue =
    +(newPooledAmount0?.toExact() || '0') * (prices[currency0?.wrapped?.address || ''] || 0) +
    +(newPooledAmount1?.toExact() || '0') * (prices[currency1?.wrapped?.address || ''] || 0)

  const totalAmount0 = BigNumber.from(result?.usedAmount0 || '0').add(BigNumber.from(result?.remainingAmount0 || '0'))
  const totalAmount1 = BigNumber.from(result?.usedAmount1 || '0').add(BigNumber.from(result?.remainingAmount1 || '0'))

  const amountInUsd = +(amountIn?.toExact() || '0') * (prices[selectedCurrency?.wrapped.address || ''] || 0)
  const amountUSDAfterSwap =
    currency0 && currency1
      ? +CurrencyAmount.fromRawAmount(currency0, totalAmount0.toString()).toExact() *
          (prices[currency0.wrapped.address] || 0) +
        +CurrencyAmount.fromRawAmount(currency1, totalAmount1.toString()).toExact() *
          (prices[currency1.wrapped.address] || 0)
      : 0

  const priceImpact = ((amountInUsd - amountUSDAfterSwap) * 100) / amountInUsd
  const priceImpactRes = checkPriceImpact(priceImpact)

  const skeleton = (width?: number) => (
    <Skeleton
      height="13px"
      width={`${width || 169}px`}
      baseColor={theme.border}
      highlightColor={theme.buttonGray}
      borderRadius="999px"
    />
  )

  const [attempingTx, setAttempingTx] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [errorMsg, setError] = useState('')
  const addTransactionWithType = useTransactionAdder()

  const handleClick = async () => {
    if (approvalState === ApprovalState.NOT_APPROVED) {
      approve()
      return
    }
    console.log(tickPrevious)

    if (selectedCurrency && (tokenId || tickPrevious.every(Boolean)) && result && amountIn?.quotient) {
      try {
        setAttempingTx(true)
        const txHash = await (tokenId
          ? zapInPoolToAddLiquidity({
              pool: poolAddress,
              tokenIn: selectedCurrency.wrapped.address,
              positionId: tokenId.toString(),
              amount: amountIn.quotient.toString(),
              zapResult: result,
            })
          : zapInPoolToMint({
              pool: poolAddress,
              tokenIn: selectedCurrency.wrapped.address,
              previousTicks: [tickPrevious[0], tickPrevious[1]],
              amount: amountIn.quotient.toString(),
              zapResult: result,
              tickLower,
              tickUpper,
            }))

        setTxHash(txHash)
        addTransactionWithType({
          hash: txHash,
          type: TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
          extraInfo: {
            tokenSymbolIn: symbol0 ?? '',
            tokenSymbolOut: symbol1 ?? '',
            tokenAmountIn: usedAmount0?.toSignificant(6) || '0',
            tokenAmountOut: usedAmount1?.toSignificant(6) || '0',
            tokenAddressIn: currency0?.wrapped.address || '',
            tokenAddressOut: currency1?.wrapped.address || '',
          },
        })

        setAttempingTx(false)
      } catch (e) {
        setAttempingTx(false)
        setError(e?.message || JSON.stringify(e))
      }
    }
  }

  return (
    <Modal isOpen={isOpen}>
      {attempingTx ? (
        <ConfirmationPendingContent
          onDismiss={() => {
            setAttempingTx(false)
          }}
          pendingText={
            <Trans>
              Adding {usedAmount0?.toSignificant(6)} {symbol0} and {usedAmount1?.toSignificant(6)} {symbol1}
            </Trans>
          }
        />
      ) : errorMsg ? (
        <TransactionErrorContent
          onDismiss={() => {
            setError('')
            setAttempingTx(false)
          }}
          message={errorMsg}
        />
      ) : txHash ? (
        <TransactionSubmittedContent chainId={chainId} hash={txHash} onDismiss={onDismiss} />
      ) : (
        <Content>
          {loading ? (
            <LocalLoader />
          ) : (
            <>
              <Flex justifyContent="space-between">
                <Flex>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
                  <Text>
                    {symbol0} - {symbol1}
                  </Text>
                </Flex>

                {!!position && (
                  <Text fontSize={12} fontWeight="500" color={outOfRange ? theme.warning : theme.primary}>
                    #{tokenId?.toString()}
                  </Text>
                )}
              </Flex>

              <Text marginTop="12px" color={theme.subText} fontSize={12}>
                <Trans>Add liquidity to the pool using a single token</Trans>
              </Text>

              {!!position ? (
                <Text fontWeight="500" fontSize={14} marginTop="20px" marginBottom="12px">
                  <Trans>Increase Liquidity</Trans>
                </Text>
              ) : (
                <Text fontWeight="500" fontSize={14} marginTop="20px" marginBottom="12px">
                  <Trans>Step 1. Deposit Your Liquidity</Trans>
                </Text>
              )}

              <CurrencyInputPanel
                id="quick-zap"
                value={typedValue}
                onUserInput={v => {
                  setTypedValue(v)
                }}
                onMax={() => {
                  setTypedValue(balances[isReverse ? 1 : 0].toExact())
                }}
                onHalf={() => {
                  setTypedValue(balances[isReverse ? 1 : 0].divide('2').toExact())
                }}
                currency={selectedCurrency}
                positionMax="top"
                showCommonBases
                estimatedUsd=""
                isSwitchMode
                onSwitchCurrency={() => {
                  setIsReverse(prev => !prev)
                }}
              />

              {!position && pool && (
                <>
                  <Flex justifyContent="space-between" alignItems="center" marginTop="20px" marginBottom="12px">
                    <Text fontWeight="500" fontSize={14}>
                      <Trans>Step 2. Choose Price Range</Trans>
                    </Text>

                    <StyledInternalLink
                      to={`/${networkInfo.route}${APP_PATHS.ELASTIC_CREATE_POOL}/${
                        currency0?.isNative ? currency0.symbol : currency0?.wrapped.address || ''
                      }/${currency1?.isNative ? currency1.symbol : currency1?.wrapped.address || ''}/${pool?.fee}`}
                    >
                      <Text fontSize="12px" fontWeight="500">
                        <Trans>Set a Custom Range</Trans> ↗
                      </Text>
                    </StyledInternalLink>
                  </Flex>

                  <RangeSelector
                    pool={pool}
                    selectedRange={selectedRange}
                    onChange={range => setSelectedRange(range)}
                  />
                </>
              )}

              <div style={{ margin: '20px -8px 0' }}>
                <SlippageSettingGroup isWrapOrUnwrap={false} isStablePairSwap={false} />
              </div>

              <Detail>
                <Flex justifyContent="space-between">
                  <Flex>
                    <Text fontWeight="500">
                      {symbol0} - {symbol1}
                    </Text>
                    <FeeTag>FEE {((pool?.fee || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
                  </Flex>
                </Flex>

                <Divider />

                <Flex justifyContent="space-between" fontSize={12}>
                  <Text color={theme.subText}>Pooled {symbol0}</Text>

                  {zapLoading ? (
                    skeleton()
                  ) : !result ? (
                    '--'
                  ) : (
                    <Flex fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                      {position && (
                        <>
                          <CurrencyLogo currency={currency0} size="14px" />
                          <Text color={theme.subText}>{position.amount0.toSignificant(6)} →</Text>
                        </>
                      )}
                      <Text>
                        {newPooledAmount0?.toSignificant(6) || '--'} {symbol0}
                      </Text>
                    </Flex>
                  )}
                </Flex>

                <Flex justifyContent="space-between" fontSize={12}>
                  <Text color={theme.subText}>Pooled {symbol1}</Text>

                  {zapLoading ? (
                    skeleton()
                  ) : !result ? (
                    '--'
                  ) : (
                    <Flex fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                      {position && (
                        <>
                          <CurrencyLogo currency={currency0} size="14px" />
                          <Text color={theme.subText}>{position.amount1.toSignificant(6)} →</Text>
                        </>
                      )}
                      <Text>
                        {newPooledAmount1?.toSignificant(6) || '--'} {symbol1}
                      </Text>
                    </Flex>
                  )}
                </Flex>

                <Flex justifyContent="space-between" fontSize={12}>
                  <Text color={theme.subText}>Liquidity Balance</Text>
                  {zapLoading ? (
                    skeleton(120)
                  ) : !result ? (
                    '--'
                  ) : (
                    <Flex sx={{ gap: '4px' }}>
                      {position && <Text color={theme.subText}>{formatDollarAmount(oldUsdValue)} →</Text>}
                      <Text>{formatDollarAmount(newUsdValue)}</Text>
                    </Flex>
                  )}
                </Flex>

                <Flex justifyContent="space-between" fontSize={12}>
                  <Text color={theme.subText}>Price Impact</Text>
                  {zapLoading ? (
                    skeleton(40)
                  ) : (
                    <Text
                      fontWeight="500"
                      color={priceImpactRes.isVeryHigh ? theme.red : priceImpactRes.isHigh ? theme.warning : theme.text}
                    >
                      {priceImpactRes.isInvalid ? '--' : priceImpact < 0.01 ? '<0.01%' : priceImpact.toFixed(2) + '%'}
                    </Text>
                  )}
                </Flex>

                <Flex justifyContent="space-between" fontSize={12}>
                  <Text color={theme.subText}>Zap Fee</Text>
                  <Text fontWeight="500" color={theme.primary}>
                    Free
                  </Text>
                </Flex>
              </Detail>

              <Flex sx={{ gap: '1rem' }} marginTop="1.25rem">
                <ButtonOutlined onClick={onDismiss}>
                  <Trans>Cancel</Trans>
                </ButtonOutlined>
                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                ) : (
                  <ButtonPrimary
                    onClick={handleClick}
                    disabled={!!error || approvalState === ApprovalState.PENDING || zapLoading}
                  >
                    {renderActionName()}
                  </ButtonPrimary>
                )}
              </Flex>
            </>
          )}
        </Content>
      )}
    </Modal>
  )
}
