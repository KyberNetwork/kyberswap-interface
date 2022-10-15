import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { isAddress } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import MultichainLogoDark from 'assets/images/multichain_black.png'
import MultichainLogoLight from 'assets/images/multichain_white.png'
import { ReactComponent as ArrowUp } from 'assets/svg/arrow_up.svg'
import { ButtonConfirmed, ButtonError, ButtonLight } from 'components/Button'
import { CurrencyInputPanelBridge } from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import Tooltip, { MouseoverTooltip } from 'components/Tooltip'
import { AdvancedSwapDetailsDropdownBridge } from 'components/swapv2/AdvancedSwapDetailsDropdown'
import { SwapFormWrapper } from 'components/swapv2/styleds'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import { useMultichainPool } from 'hooks/bridge'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import usePrevious from 'hooks/usePrevious'
import useTheme from 'hooks/useTheme'
import { BodyWrapper } from 'pages/AppBody'
import { useWalletModalToggle } from 'state/application/hooks'
import { useBridgeState, useBridgeStateHandler, useOutputValue } from 'state/bridge/hooks'
import { PoolValueOutMap } from 'state/bridge/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { tryParseAmount } from 'state/swap/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { formatNumberWithPrecisionRange, formattedNum } from 'utils'

import AmountWarning from './AmountWarning'
import ComfirmBridgeModal from './ComfirmBridgeModal'
import PoolInfo from './PoolInfo'
import { BridgeSwapState } from './type'
import { useBridgeCallback, useBridgeRouterCallback } from './useBridgeCallback'

const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  z-index: ${Z_INDEXS.SWAP_FORM};
  padding: 20px 16px;
  margin-top: 0;
`
const ArrowWrapper = styled.div`
  padding: 8px 10px;
  background: ${({ theme }) => theme.buttonBlack};
  height: fit-content;
  width: fit-content;
  border-radius: 999px;
  margin-bottom: 0.75rem;
`

const Label = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  margin-bottom: 0.75rem;
`
const formatPoolValue = (amount: string, decimals: number) => {
  try {
    if (Number(amount))
      return formatNumberWithPrecisionRange(
        parseFloat(new Fraction(amount, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals ?? 18))).toFixed(5)),
        0,
        2,
      )
  } catch (error) {}
  return 0
}

type PoolValueType = {
  poolValueIn: string | number
  poolValueOut: string | number
}

export default function SwapForm() {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useActiveNetwork()
  const [{ tokenIn, tokenOut, chainIdOut, currencyIn, listTokenOut, listChainIn }] = useBridgeState()
  const { resetBridgeState, setBridgeState, setBridgePoolInfo } = useBridgeStateHandler()
  const toggleWalletModal = useWalletModalToggle()
  const isDark = useIsDarkMode()
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const [inputAmount, setInputAmount] = useState('0')
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)
  const [poolValue, setPoolValue] = useState<PoolValueType>({
    poolValueIn: 0,
    poolValueOut: 0,
  })

  // modal and loading
  const [swapState, setSwapState] = useState<BridgeSwapState>({
    showConfirm: false,
    attemptingTxn: false,
    swapErrorMessage: '',
    txHash: undefined,
  })

  const listDestChainIds = useMemo(() => {
    const destChainInfo = tokenIn?.destChains || {}
    return (Object.keys(destChainInfo).map(Number) as ChainId[]).filter(id => SUPPORTED_NETWORKS.includes(id))
  }, [tokenIn])

  const outputInfo = useOutputValue(inputAmount)

  const maxAmountInput = useCurrencyBalance(account || undefined, currencyIn)

  const anyToken = tokenOut?.fromanytoken

  const poolParamIn = useMemo(() => {
    const anytoken = tokenOut?.isFromLiquidity && tokenOut?.isLiquidity ? anyToken?.address : undefined
    const underlying = tokenIn?.address
    return anytoken && underlying ? [{ anytoken, underlying }] : []
  }, [anyToken?.address, tokenIn?.address, tokenOut?.isFromLiquidity, tokenOut?.isLiquidity])

  const poolData = useMultichainPool(chainId, poolParamIn)

  const poolParamOut = useMemo(() => {
    return listTokenOut
      .map(({ multichainInfo: token }) => ({
        anytoken: token?.isLiquidity ? token?.anytoken?.address : undefined,
        underlying: token?.underlying?.address,
      }))
      .filter(e => e.anytoken && e.underlying) as { anytoken: string; underlying: string }[]
  }, [listTokenOut])
  // todo clean this file
  const poolDataOut = useMultichainPool(chainIdOut, poolParamOut)
  // todo memo các thứ, check api có call hay k
  useEffect(() => {
    if (poolDataOut) {
      const poolValueOutMap: PoolValueOutMap = {}
      let poolValueOut: string | number = 0
      Object.keys(poolDataOut).forEach(anytokenAddress => {
        const poolInfo = poolDataOut?.[anytokenAddress]
        const token = listTokenOut.find(e => e.multichainInfo?.anytoken?.address === anytokenAddress)
        if (poolInfo?.balanceOf && token?.multichainInfo?.anytoken?.decimals) {
          if (anytokenAddress === tokenOut?.anytoken?.address) {
            poolValueOut = formatPoolValue(poolInfo?.balanceOf, tokenOut?.anytoken?.decimals)
          }
          poolValueOutMap[anytokenAddress] = formatPoolValue(
            poolInfo?.balanceOf,
            token?.multichainInfo?.anytoken?.decimals,
          )
        }
      })
      setPoolValue(poolValue => ({ ...poolValue, poolValueOut }))
      setBridgePoolInfo({ poolValueOut: poolValueOutMap })
    } else {
      setPoolValue(poolValue => ({ ...poolValue, poolValueOut: 0, poolShareOut: 0, poolValueOutMap: {} }))
    }
  }, [poolDataOut, listTokenOut, tokenOut, setBridgePoolInfo])

  useEffect(() => {
    const chainIds = Object.keys(tokenIn?.destChains ?? {})
    setBridgeState({ chainIdOut: Number(chainIds[0]) as ChainId })
  }, [setBridgeState, tokenIn?.destChains])

  useEffect(() => {
    setBridgeState({ tokenOut: listTokenOut[0] || null })
  }, [setBridgeState, listTokenOut])

  useEffect(() => {
    setInputAmount('0')
  }, [tokenIn, chainId])

  const prevChain = usePrevious(chainId)
  useEffect(() => {
    if (chainId !== prevChain && prevChain) {
      resetBridgeState()
    }
  }, [chainId, prevChain, resetBridgeState])

  useEffect(() => {
    const address = anyToken?.address
    let poolValueIn: string | number = 0,
      poolShareIn: string | number = 0
    if (address && poolData?.[address]?.balanceOf) {
      poolValueIn = formatPoolValue(poolData[address]?.balanceOf, anyToken?.decimals)
      poolShareIn = formatPoolValue(poolData[address]?.balance, anyToken?.decimals)
    }
    setPoolValue(poolValue => ({ ...poolValue, poolValueIn, poolShareIn }))
  }, [poolData, anyToken])

  const useSwapMethods = tokenOut?.routerABI
  const routerToken = tokenOut?.router && isAddress(tokenOut?.router) ? tokenOut?.router : undefined

  const { execute: onWrapBridgeRouter, inputError: wrapInputErrorBridge } = useBridgeRouterCallback(
    routerToken,
    anyToken?.address,
    inputAmount,
    tokenIn?.tokenType === 'NATIVE' || !!useSwapMethods?.includes('anySwapOutNative'),
  )

  const { execute: onWrapBridge, inputError: wrapInputErrorCrossBridge } = useBridgeCallback(
    tokenOut?.type === 'swapin' ? tokenOut?.DepositAddress : account,
    anyToken?.address,
    inputAmount,
  )

  const inputError = useMemo(() => {
    const inputNumber = Number(inputAmount)
    if (!tokenIn || !chainIdOut || !tokenOut || inputNumber === 0) return

    if (isNaN(inputNumber)) return { state: 'error', tip: t`Input amount is not valid` }

    if (inputNumber < Number(tokenOut.MinimumSwap)) {
      return {
        state: 'error',
        tip: t`The amount to bridge must be more than ${formattedNum(tokenOut.MinimumSwap, false, 5)} ${
          tokenIn.symbol
        }`,
      }
    }
    if (inputNumber > Number(tokenOut.MaximumSwap)) {
      return {
        state: 'error',
        tip: t`The amount to bridge must be less than ${formattedNum(tokenOut.MaximumSwap)} ${tokenIn.symbol}`,
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
    const isWrapInputError = (wrapInputErrorBridge || wrapInputErrorCrossBridge) && inputNumber > 0
    if (isWrapInputError) return { state: 'error', tip: t`Insufficient ${tokenIn?.symbol} balance` }

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

  const showPreview = () => {
    setSwapState(state => ({ ...state, showConfirm: true, swapErrorMessage: '' }))
    if (chainId && chainIdOut)
      mixpanelHandler(MIXPANEL_TYPE.BRIDGE_CLICK_REVIEW_TRANSFER, {
        from_network: NETWORKS_INFO[chainId].name,
        to_network: NETWORKS_INFO[chainIdOut].name,
      })
  }
  const hidePreview = useCallback(() => {
    setSwapState(state => ({ ...state, showConfirm: false }))
  }, [])

  const handleSwap = useCallback(async () => {
    try {
      if (!useSwapMethods) return
      setSwapState(state => ({ ...state, attemptingTxn: true }))
      const isBridge =
        useSwapMethods.includes('transfer') ||
        useSwapMethods.includes('sendTransaction') ||
        useSwapMethods.includes('Swapout')
      if (chainId && chainIdOut) {
        mixpanelHandler(MIXPANEL_TYPE.BRIDGE_CLICK_TRANSFER, {
          from_token: tokenIn?.symbol,
          to_token: tokenOut?.symbol,
          bridge_fee: outputInfo.fee,
          from_network: NETWORKS_INFO[chainId].name,
          to_network: NETWORKS_INFO[chainIdOut].name,
          trade_qty: inputAmount,
        })
      }
      const txHash = await (isBridge ? onWrapBridge() : onWrapBridgeRouter(useSwapMethods))
      setInputAmount('0')
      setSwapState(state => ({ ...state, attemptingTxn: false, txHash }))
    } catch (error) {
      console.error(error)
      setSwapState(state => ({ ...state, attemptingTxn: false, swapErrorMessage: error?.message || error }))
    }
  }, [
    useSwapMethods,
    onWrapBridge,
    chainId,
    chainIdOut,
    inputAmount,
    outputInfo.fee,
    onWrapBridgeRouter,
    mixpanelHandler,
    tokenIn?.symbol,
    tokenOut?.symbol,
  ])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && setInputAmount(maxAmountInput.toExact())
  }, [maxAmountInput])

  const approveSpender = (() => {
    const isRouter = !['swapin', 'swapout'].includes(tokenOut?.type ?? '')
    if (tokenOut?.isApprove) {
      return isRouter ? tokenOut.spender : anyToken?.address
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
  const onSelectDestNetwork = useCallback(
    (chainId: ChainId) => {
      setBridgeState({ chainIdOut: chainId })
    },
    [setBridgeState],
  )

  const showApproveFlow =
    !inputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved = approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!inputError

  return (
    <>
      <Flex style={{ position: 'relative', flexDirection: 'column', gap: 22, alignItems: 'center' }}>
        <SwapFormWrapper>
          <AppBodyWrapped style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Flex flexDirection={'column'}>
              <Label>
                <Trans>You Transfer</Trans>
              </Label>
              <Tooltip text={inputError?.tip} show={inputError?.state === 'error'} placement="top">
                <CurrencyInputPanelBridge
                  chainIds={listChainIn}
                  selectedChainId={chainId}
                  onSelectNetwork={changeNetwork}
                  error={inputError?.state === 'error'}
                  value={inputAmount}
                  onUserInput={handleTypeInput}
                  onMax={handleMaxInput}
                  onCurrencySelect={onCurrencySelect}
                  id="swap-currency-input"
                />
              </Tooltip>
            </Flex>

            <PoolInfo chainId={chainId} tokenIn={tokenIn} poolValue={poolValue.poolValueIn} />

            <div>
              <Flex alignItems={'flex-end'} justifyContent="space-between">
                <Label>
                  <Trans>You Receive</Trans>
                </Label>
                <ArrowWrapper>
                  <ArrowUp width={24} fill={theme.subText} style={{ cursor: 'default' }} />
                </ArrowWrapper>
              </Flex>
              <CurrencyInputPanelBridge
                chainIds={listDestChainIds}
                onSelectNetwork={onSelectDestNetwork}
                selectedChainId={chainIdOut}
                isOutput
                value={outputInfo.outputAmount.toString()}
                onCurrencySelect={onCurrencySelectDest}
                id="swap-currency-output"
              />
            </div>

            <PoolInfo chainId={chainIdOut} tokenIn={tokenIn} poolValue={poolValue.poolValueOut} />

            {inputError?.state === 'warn' && <AmountWarning title={inputError?.tip} />}
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
                          <MouseoverTooltip
                            width="300px"
                            text={t`You would need to first allow Multichain smart contract to use your KNC. This has to be done only once for each token.`}
                          >
                            <Info size={18} />
                          </MouseoverTooltip>
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
                  <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                </>
              )
            )}
            {!showApproveFlow && account && (
              <ButtonError onClick={showPreview} disabled={!!inputError || approval !== ApprovalState.APPROVED}>
                <Text fontWeight={500}>{t`Review Transfer`}</Text>
              </ButtonError>
            )}
            <Flex justifyContent={'flex-end'}>
              <Flex alignItems={'center'} style={{ gap: 6 }}>
                <Text color={theme.subText} fontSize={12}>
                  Powered by
                </Text>
                <ExternalLink href="https://multichain.org/">
                  <img
                    src={isDark ? MultichainLogoLight : MultichainLogoDark}
                    alt="kyberswap with multichain"
                    height={13}
                  />
                </ExternalLink>
              </Flex>
            </Flex>
          </AppBodyWrapped>
        </SwapFormWrapper>

        <AdvancedSwapDetailsDropdownBridge outputInfo={outputInfo} />
      </Flex>

      <ComfirmBridgeModal swapState={swapState} onDismiss={hidePreview} onSwap={handleSwap} outputInfo={outputInfo} />
    </>
  )
}
