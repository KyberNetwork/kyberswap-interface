import { ChainId, Currency, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { isAddress } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import MultichainLogoDark from 'assets/images/multichain_black.png'
import MultichainLogoLight from 'assets/images/multichain_white.png'
import { ReactComponent as ArrowUp } from 'assets/svg/arrow_up.svg'
import { ButtonConfirmed, ButtonError, ButtonLight } from 'components/Button'
import Column from 'components/Column/index'
import { CurrencyInputPanelBridge } from 'components/CurrencyInputPanel'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import Tooltip from 'components/Tooltip'
import { AdvancedSwapDetailsDropdownBridge } from 'components/swapv2/AdvancedSwapDetailsDropdown'
import { ArrowWrapper, BottomGrouping, SwapFormWrapper, Wrapper } from 'components/swapv2/styleds'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { BodyWrapper } from 'pages/AppBody'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { useBridgeState, useBridgeStateHandler, useOutputValue } from 'state/bridge/hooks'
import { usePoolBridge } from 'state/bridge/pool'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { tryParseAmount } from 'state/swap/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { formattedNum } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import AmountWarning from './AmountWarning'
import PoolInfo from './PoolInfo'
import ReviewModal from './ReviewModal'
import SelectNetwork from './SelectNetwork'
import { useBridgeCallback, useCrossBridgeCallback } from './useBridgeCallback'

const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  z-index: ${Z_INDEXS.SWAP_FORM};
  padding: 16px 16px 24px;
  margin-top: 0;
`

const formatPoolValue = (amount: string, decimals: number) =>
  Number(amount) ? new Fraction(amount, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals ?? 18))).toFixed(3) : 0

export default function SwapForm() {
  const { account, chainId } = useActiveWeb3React()
  const [{ listChainIn }] = useBridgeState()
  const [{ tokenIn, tokenOut, chainIdOut, currencyIn, currencyOut, listTokenOut }] = useBridgeState()
  const { resetBridgeState, setBridgeState } = useBridgeStateHandler()
  const toggleWalletModal = useWalletModalToggle()
  const isDark = useIsDarkMode()

  const [inputAmount, setInputAmount] = useState('0')
  const [showComfirm, setShowConfirm] = useState(false)
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const [poolValue, setPoolValue] = useState<{
    poolValueIn: string | number
    poolShareIn: string | number
    poolValueOut: string | number
    poolShareOut: string | number
  }>({
    poolValueIn: 0,
    poolShareIn: 0,
    poolValueOut: 0,
    poolShareOut: 0,
  })
  // todo  chưa tính được usd out in (aaev)
  const theme = useTheme()

  const destChainInfo = useMemo(() => tokenIn?.destChains || {}, [tokenIn])
  const listDestChainIds = useMemo(() => {
    return (Object.keys(destChainInfo).map(Number) as ChainId[]).filter(id => SUPPORTED_NETWORKS.includes(id))
  }, [destChainInfo])

  const pair = useMemo(() => [currencyIn, currencyOut], [currencyIn, currencyOut])
  const balances = useCurrencyBalances(account || undefined, pair)
  const usdPrices = useTokensPrice(pair)

  const outputInfo = useOutputValue(inputAmount)

  const estimatedUsdIn =
    currencyIn && usdPrices[0] && Number(inputAmount)
      ? parseFloat(tryParseAmount(inputAmount, currencyIn)?.toSignificant(6) || '0') * usdPrices[0]
      : ''
  const estimatedUsdOut =
    currencyOut && usdPrices[1] && Number(outputInfo.outputAmount)
      ? parseFloat(tryParseAmount(outputInfo.outputAmount.toString(), currencyOut)?.toSignificant(6) || '0') *
        usdPrices[1]
      : ''

  const maxAmountInput: CurrencyAmount<Currency> | undefined = maxAmountSpend(balances[0])

  const anyToken = tokenOut?.fromanytoken

  const poolData = usePoolBridge(
    chainId,
    tokenOut?.isFromLiquidity && tokenOut?.isLiquidity ? anyToken?.address : undefined,
    tokenIn?.address,
  )

  const poolDataOut = usePoolBridge(
    chainIdOut,
    tokenOut?.isLiquidity ? tokenOut?.anytoken?.address : undefined,
    tokenOut?.underlying?.address,
  )

  useEffect(() => {
    const chainIds = Object.keys(tokenIn?.destChains ?? {})
    setBridgeState({ chainIdOut: Number(chainIds[0]) as ChainId })
  }, [setBridgeState, tokenIn?.destChains])

  useEffect(() => {
    setBridgeState({ tokenOut: listTokenOut[0] })
  }, [setBridgeState, listTokenOut])

  useEffect(() => {
    setInputAmount('0')
  }, [tokenIn, chainId])

  useEffect(() => {
    resetBridgeState()
  }, [chainId, resetBridgeState])

  useEffect(() => {
    const address = anyToken?.address
    let poolValueIn: string | number = 0,
      poolShareIn: string | number = 0
    if (address && poolData?.balanceOf) {
      poolValueIn = formatPoolValue(poolData?.balanceOf, anyToken?.decimals)
      poolShareIn = formatPoolValue(poolData?.balance, anyToken?.decimals)
    }
    setPoolValue(poolValue => ({ ...poolValue, poolValueIn, poolShareIn }))
  }, [poolData, anyToken])

  useEffect(() => {
    const anytoken = tokenOut?.anytoken
    const address = anytoken?.address
    let poolValueOut: string | number = 0,
      poolShareOut: string | number = 0
    if (address && poolDataOut?.balanceOf) {
      poolValueOut = formatPoolValue(poolDataOut?.balanceOf, anytoken?.decimals)
      poolShareOut = formatPoolValue(poolDataOut?.balance, anytoken?.decimals)
    }
    setPoolValue(poolValue => ({ ...poolValue, poolValueOut, poolShareOut }))
  }, [poolDataOut, tokenOut])

  const useSwapMethods = tokenOut?.routerABI
  const routerToken = tokenOut?.router && isAddress(tokenOut?.router) ? tokenOut?.router : undefined

  const { execute: onWrapBridge, inputError: wrapInputErrorBridge } = useBridgeCallback(
    routerToken,
    anyToken?.address,
    inputAmount,
    tokenIn?.tokenType === 'NATIVE' || !!useSwapMethods?.includes('anySwapOutNative'),
  )

  const { execute: onWrapCrossBridge, inputError: wrapInputErrorCrossBridge } = useCrossBridgeCallback(
    tokenOut?.type === 'swapin' ? tokenOut?.DepositAddress : account,
    anyToken?.address,
    inputAmount,
  )

  const inputError = useMemo(() => {
    if (!tokenIn || !chainIdOut || !tokenOut || inputAmount === '0') {
      return
    }
    const inputNumber = Number(inputAmount)
    if (isNaN(inputNumber)) {
      return {
        state: 'error',
        tip: t`Input amount is not valid`,
      }
    }
    const isWrapInputError =
      wrapInputErrorBridge || wrapInputErrorCrossBridge ? t`Insufficient ${tokenIn?.symbol} balance` : ''
    if (isWrapInputError) {
      return {
        state: 'error',
        tip: isWrapInputError,
      }
    }
    if (inputNumber < Number(tokenOut.MinimumSwap)) {
      return {
        state: 'error',
        tip: t`The crosschain amount must be greater than ${formattedNum(tokenOut.MinimumSwap, false, 5)} ${
          tokenIn.symbol
        }`,
      }
    }
    if (inputNumber > Number(tokenOut.MaximumSwap)) {
      return {
        state: 'error',
        tip: t`The crosschain amount must be less than ${formattedNum(tokenOut.MaximumSwap)} ${tokenIn.symbol}`,
      }
    }
    if (tokenOut.isLiquidity && tokenOut.underlying && inputNumber > Number(poolValue.poolValueOut)) {
      return {
        state: 'error',
        tip: t`The bridge amount must be less than the current available amount of the pool.`,
      }
    }
    if (inputNumber > 0.7 * Number(tokenOut.MaximumSwap)) {
      return {
        state: 'warn',
        tip: t`Note: Your transfer amount (${formattedNum(inputAmount, false, 5)} ${
          tokenIn.symbol
        }) is more than 70% of the available liquidity (${poolValue.poolValueOut} ${tokenOut.symbol})!`,
      }
    }
    return
  }, [
    tokenIn,
    chainIdOut,
    wrapInputErrorBridge,
    wrapInputErrorCrossBridge,
    inputAmount,
    tokenOut,
    poolValue.poolValueOut,
  ])

  const handleTypeInput = useCallback(
    (value: string) => {
      if (tokenIn) setInputAmount(value)
    },
    [tokenIn],
  )

  const onClear = () => {
    setInputAmount('0')
    setShowConfirm(false)
  }

  const showPreview = () => {
    setShowConfirm(true)
  }
  // todo do when failed/ popup failed
  // todo interval 5s txs

  const handleSwap = useCallback(() => {
    if (!useSwapMethods) return
    if (
      useSwapMethods.includes('transfer') ||
      useSwapMethods.includes('sendTransaction') ||
      useSwapMethods.includes('Swapout')
    ) {
      onWrapCrossBridge?.().then(() => {
        onClear()
      })
      return
    }
    onWrapBridge?.(useSwapMethods).then(() => {
      onClear()
    })
  }, [useSwapMethods, onWrapCrossBridge, onWrapBridge])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && setInputAmount(maxAmountInput.toExact())
  }, [maxAmountInput])

  const handleHalfInput = useCallback(() => {
    setInputAmount(balances[0]?.divide(2).toExact() || '')
  }, [balances])

  const approveSpender = (() => {
    const isRouter = !['swapin', 'swapout'].includes(tokenOut?.type ?? '')
    if (tokenOut?.isApprove) {
      return isRouter ? tokenOut.spender : tokenOut?.fromanytoken?.address
    }
    return undefined
  })()

  const formatInputBridgeValue = tryParseAmount(inputAmount, currencyIn && tokenOut?.isApprove ? currencyIn : undefined)
  const [approval, approveCallback] = useApproveCallback(
    formatInputBridgeValue && tokenOut?.isApprove ? formatInputBridgeValue : undefined,
    approveSpender,
  )

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const onCurrencySelect = useCallback(
    (tokenIn: WrappedTokenInfo) => {
      setBridgeState({ tokenIn })
    },
    [setBridgeState],
  )
  const onCurrencySelectDest = useCallback(
    (tokenOut: WrappedTokenInfo) => {
      setBridgeState({ tokenOut })
    },
    [setBridgeState],
  )
  const onSelectDestNetwork = (chainId: ChainId) => {
    setBridgeState({ chainIdOut: chainId })
  }

  const showApproveFlow =
    !inputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved = approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!inputError

  return (
    <>
      <SwapFormWrapper
        isShowTutorial={false}
        style={{ justifyContent: 'flex-start', marginLeft: 'auto', marginRight: 'auto' }}
      >
        <AppBodyWrapped>
          <Wrapper>
            <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
              <SelectNetwork chainIds={listChainIn} onSelectNetwork={onSelectDestNetwork} selectedChainId={chainId} />
              <Tooltip text={inputError?.tip} show={inputError?.state === 'error'} placement="top">
                <CurrencyInputPanelBridge
                  error={inputError?.state === 'error'}
                  value={inputAmount}
                  showMaxButton
                  onUserInput={handleTypeInput}
                  onMax={handleMaxInput}
                  onHalf={handleHalfInput}
                  onCurrencySelect={onCurrencySelect}
                  id="swap-currency-input"
                  estimatedUsd={formattedNum(estimatedUsdIn.toString(), true) || undefined}
                />
              </Tooltip>
              <PoolInfo
                chainId={chainId}
                tokenIn={tokenIn}
                poolValue={poolValue.poolValueIn}
                poolShare={poolValue.poolShareIn}
              />
              <Flex justifyContent={'space-between'}>
                <SelectNetwork
                  chainIds={listDestChainIds}
                  onSelectNetwork={onSelectDestNetwork}
                  selectedChainId={chainIdOut}
                />
                <ArrowWrapper>
                  <ArrowUp width={24} fill={theme.subText} style={{ cursor: 'default' }} />
                </ArrowWrapper>
              </Flex>

              <Box sx={{ position: 'relative' }}>
                <CurrencyInputPanelBridge
                  isOutput
                  disabledInput
                  value={outputInfo.outputAmount.toString()}
                  showMaxButton={false}
                  onCurrencySelect={onCurrencySelectDest}
                  id="swap-currency-output"
                  estimatedUsd={formattedNum(estimatedUsdOut.toString(), true) || undefined}
                />
              </Box>
              <PoolInfo
                chainId={chainIdOut}
                tokenIn={tokenIn}
                poolValue={poolValue.poolValueOut}
                poolShare={poolValue.poolShareOut}
              />
              {inputError?.state === 'warn' && <AmountWarning title={inputError?.tip} />}
            </Flex>

            <BottomGrouping>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              ) : (
                showApproveFlow && (
                  <>
                    <RowBetween>
                      <ButtonConfirmed
                        onClick={approveCallback}
                        disabled={disableBtnApproved}
                        width="48%"
                        altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                        confirmed={approval === ApprovalState.APPROVED}
                      >
                        {approval === ApprovalState.PENDING ? (
                          <AutoRow gap="6px" justify="center">
                            <Trans>Approving</Trans> <Loader stroke="white" />
                          </AutoRow>
                        ) : (
                          <Flex alignContent={'center'}>
                            <InfoHelper
                              color={disableBtnApproved ? theme.border : theme.darkText}
                              size={18}
                              text="You would need to first allow Multichain smart contract to use your KNC. This has to be done only once for each token."
                            />
                            <Text marginLeft={'5px'}>
                              <Trans>Approve {tokenIn?.symbol}</Trans>
                            </Text>
                          </Flex>
                        )}
                      </ButtonConfirmed>
                      <ButtonError
                        width="48%"
                        id="swap-button"
                        disabled={approval !== ApprovalState.APPROVED}
                        onClick={showPreview}
                      >
                        <Text fontSize={16} fontWeight={500}>
                          {t`Review transfer`}
                        </Text>
                      </ButtonError>
                    </RowBetween>
                    <Column style={{ marginTop: '1rem' }}>
                      <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                    </Column>
                  </>
                )
              )}
              {!showApproveFlow && account && (
                <ButtonError onClick={showPreview} disabled={!!inputError || approval !== ApprovalState.APPROVED}>
                  <Text fontWeight={500}>{t`Review Transfer`}</Text>
                </ButtonError>
              )}
              <br />
              <Flex justifyContent={'flex-end'}>
                <Flex alignItems={'center'} style={{ gap: 6 }}>
                  <Text color={theme.subText} fontSize={12}>
                    Powered by
                  </Text>
                  <img
                    src={isDark ? MultichainLogoLight : MultichainLogoDark}
                    alt="kyberswap with multichain"
                    height={13}
                  />
                </Flex>
              </Flex>
            </BottomGrouping>
          </Wrapper>
        </AppBodyWrapped>

        <AdvancedSwapDetailsDropdownBridge outputInfo={outputInfo} />
      </SwapFormWrapper>

      <ReviewModal
        isOpen={showComfirm}
        onDismiss={() => setShowConfirm(false)}
        onSwap={handleSwap}
        outputInfo={outputInfo}
      />
    </>
  )
}
