import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { isAddress } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { usePrevious } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import MultichainLogoLight from 'assets/images/multichain_white.png'
import { ReactComponent as ArrowUp } from 'assets/svg/arrow_up.svg'
import { ButtonApprove, ButtonError, ButtonLight } from 'components/Button'
import CurrencyInputPanelBridge from 'components/CurrencyInputPanel/CurrencyInputPanelBridge'
import ProgressSteps from 'components/ProgressSteps'
import { RowBetween } from 'components/Row'
import Tooltip from 'components/Tooltip'
import { AdvancedSwapDetailsDropdownBridge } from 'components/swapv2/AdvancedSwapDetailsDropdown'
import { SwapFormWrapper } from 'components/swapv2/styleds'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useBridgeCallback from 'hooks/bridge/useBridgeCallback'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { BodyWrapper } from 'pages/AppBody'
import useGetPool from 'pages/Bridge/useGetPool'
import { useWalletModalToggle } from 'state/application/hooks'
import { useBridgeOutputValue, useBridgeState, useBridgeStateHandler } from 'state/crossChain/hooks'
import { PoolBridgeValue, PoolValueOutMap } from 'state/crossChain/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { formattedNum } from 'utils'

import ComfirmBridgeModal from './ConfirmBridgeModal'
import ErrorWarningPanel from './ErrorWarning'
import PoolInfo from './PoolInfo'
import { formatPoolValue } from './helpers'

const CustomAdvancedSwapDetailsDropdownBridge = styled(AdvancedSwapDetailsDropdownBridge)`
  background: ${({ theme }) => theme.buttonBlack};
  border: none;
`

const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  padding: 20px 16px;
  margin-top: 0;
`
const ArrowWrapper = styled.div`
  width: 20px;
  height: 20px;

  display: flex;
  justify-content: center;
  align-items: center;

  background: ${({ theme }) => theme.buttonGray};
  border-radius: 999px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16));
`

const Footer = () => {
  const theme = useTheme()
  return (
    <Flex justifyContent={'space-between'}>
      <Flex alignItems={'center'} style={{ gap: 6 }}>
        <Text color={theme.subText} fontSize={12} fontWeight={500} opacity={0.5}>
          Powered by
        </Text>
        <ExternalLink href="https://multichain.org/">
          <img
            src={MultichainLogoLight}
            alt="KyberSwap with multichain"
            height={13}
            style={{
              opacity: '0.3',
            }}
          />
        </ExternalLink>
      </Flex>

      <ExternalLink
        style={{
          fontSize: '12px',
        }}
        href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/bridge-your-assets-across-multiple-chains"
      >
        Guide
      </ExternalLink>
    </Flex>
  )
}

const calcPoolValue = (amount: string | null, decimals: number) => {
  try {
    if (amount !== null && amount !== undefined)
      return new Fraction(amount, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals ?? 18))).toFixed(5)
  } catch (error) {}
  return amount
}

type PoolValueType = {
  poolValueIn: PoolBridgeValue // undefined: unlimited, null: loading
  poolValueOut: PoolBridgeValue
}

export default function SwapForm() {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [
    {
      tokenInfoIn,
      tokenInfoOut,
      chainIdOut,
      currencyIn,
      currencyOut,
      listTokenOut,
      listTokenIn,
      listChainIn,
      loadingToken,
      poolValueOutMap,
    },
  ] = useBridgeState()
  const { resetBridgeState, setBridgeState, setBridgePoolInfo } = useBridgeStateHandler()
  const toggleWalletModal = useWalletModalToggle()

  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const [inputAmount, setInputAmount] = useState('')
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)
  const [poolValue, setPoolValue] = useState<PoolValueType>({
    poolValueIn: null,
    poolValueOut: null,
  })

  // modal and loading
  const [swapState, setSwapState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const listChainOut = useMemo(() => {
    const destChainInfo = tokenInfoIn?.destChains || {}
    return (Object.keys(destChainInfo).map(Number) as ChainId[]).filter(id => SUPPORTED_NETWORKS.includes(id))
  }, [tokenInfoIn])

  const outputInfo = useBridgeOutputValue(inputAmount)

  const anyToken = tokenInfoOut?.fromanytoken

  const { poolDataOut, poolDataIn } = useGetPool()

  useEffect(() => {
    const address = anyToken?.address
    let poolValueIn: PoolBridgeValue
    if (!poolDataIn) {
      poolValueIn = null
    } else if (address && poolDataIn?.[address]) {
      poolValueIn = calcPoolValue(poolDataIn[address], anyToken?.decimals)
    }
    setPoolValue(poolValue => ({ ...poolValue, poolValueIn }))
  }, [poolDataIn, anyToken])

  useEffect(() => {
    const poolValueOutMap: PoolValueOutMap = {}
    let poolValueOut: PoolBridgeValue
    let tokenWithMaxPool
    let maxPoolValue = -1
    let hasUnlimitedPool = false

    if (poolDataOut && listTokenOut.length) {
      listTokenOut.forEach(token => {
        const anytoken = token.multichainInfo?.anytoken
        const anytokenAddress = anytoken?.address ?? ''
        const poolInfo = poolDataOut?.[anytokenAddress]
        if (poolInfo === undefined) {
          tokenWithMaxPool = token
          hasUnlimitedPool = true
          return
        }

        if (!poolInfo || !anytoken?.decimals) return
        const calcValue = calcPoolValue(poolInfo, anytoken?.decimals)
        poolValueOutMap[anytokenAddress] = calcValue
        if (Number(calcValue) > maxPoolValue && !hasUnlimitedPool) {
          tokenWithMaxPool = token
          maxPoolValue = Number(calcValue)
        }
      })
    }
    const tokenOut = tokenWithMaxPool || listTokenOut[0] || null
    const anyTokenOut = tokenOut?.multichainInfo?.anytoken?.address
    if (anyTokenOut && poolValueOutMap[anyTokenOut]) {
      poolValueOut = poolValueOutMap[anyTokenOut]
    }
    setBridgeState({ tokenOut })
    setPoolValue(poolValue => ({ ...poolValue, poolValueOut: poolDataOut ? poolValueOut : null }))
    setBridgePoolInfo({ poolValueOutMap })
  }, [poolDataOut, listTokenOut, setBridgePoolInfo, setBridgeState])

  useEffect(() => {
    if (!listChainOut.find(el => el === chainIdOut)) setBridgeState({ chainIdOut: listChainOut[0] })
  }, [setBridgeState, listChainOut, chainIdOut])

  useEffect(() => {
    setInputAmount('')
  }, [tokenInfoIn, chainId])

  const prevChain = usePrevious(chainId)
  useEffect(() => {
    if (chainId !== prevChain && prevChain) {
      resetBridgeState()
    }
  }, [chainId, prevChain, resetBridgeState])

  const useSwapMethods = tokenInfoOut?.routerABI
  const routerToken = tokenInfoOut?.router && isAddress(tokenInfoOut?.router) ? tokenInfoOut?.router : undefined

  const { execute: onWrap, inputError: wrapInputError } = useBridgeCallback(
    inputAmount,
    anyToken?.address,
    routerToken,
    tokenInfoIn?.tokenType === 'NATIVE' || !!useSwapMethods?.includes('anySwapOutNative'),
    tokenInfoOut?.type === 'swapin' ? tokenInfoOut?.DepositAddress : account,
  )

  const inputError: string | undefined | { state: 'warn' | 'error'; tip: string; desc?: ReactNode } = useMemo(() => {
    if (!listTokenOut.length && !listTokenIn.length && !loadingToken) {
      return { state: 'error', tip: t`Cannot get token info. Please try again later.` }
    }

    const inputNumber = Number(inputAmount)

    if (!tokenInfoIn || !chainIdOut || !tokenInfoOut || inputNumber === 0) return

    if (isNaN(inputNumber)) return t`Input amount is not valid.`

    if (inputNumber < Number(tokenInfoOut.MinimumSwap)) {
      const amount = formattedNum(tokenInfoOut.MinimumSwap, false, 5)
      const symbol = tokenInfoIn.symbol
      return t`The amount to bridge must be more than ${amount} ${symbol}.`
    }
    if (inputNumber > Number(tokenInfoOut.MaximumSwap)) {
      const amount = formattedNum(tokenInfoOut.MaximumSwap)
      const symbol = tokenInfoIn.symbol
      return t`The amount to bridge must be less than ${amount} ${symbol}.`
    }

    const tokenOutSymbol = tokenInfoOut.symbol
    const tokenInSymbol = tokenInfoIn?.symbol
    if (tokenInfoOut.isLiquidity && tokenInfoOut.underlying) {
      const poolLiquidity = formatPoolValue(poolValue.poolValueOut)
      if (inputNumber > Number(poolValue.poolValueOut))
        return t`The bridge amount must be less than the current available amount of the pool which is ${poolLiquidity} ${tokenOutSymbol}.`

      const ratio = 0.7
      if (inputNumber > ratio * Number(poolValue.poolValueOut)) {
        const amount = formattedNum(inputAmount, false, 5)
        const r = 100 * ratio

        return {
          state: 'warn',
          tip: t`Note: Your transfer amount (${amount} ${tokenInSymbol}) is more than ${r}% of the available liquidity (${poolLiquidity} ${tokenOutSymbol})!`,
          desc: (
            <>
              <Text as="p" fontSize={12} lineHeight={'16px'} marginTop={'5px'}>
                <Trans>
                  There is a chance that during your transfer another high volume transaction utilizes the available
                  liquidity. As a result, for the unavailable liquidity, you may receive &apos;anyToken&apos; from
                  Multichain. You can exchange your &apos;anyToken&apos; when the Multichain pool has sufficient
                  liquidity.
                </Trans>
              </Text>
              <ExternalLink
                style={{ fontSize: 12 }}
                href="https://multichain.zendesk.com/hc/en-us/articles/4410379722639-Redeem-Remove-Pool-Token-Anyassets-e-g-anyUSDC-anyUSDT-anyDAI-anyETH-anyFTM-etc-into-Native-Token-Tutorial"
              >
                See here ↗
              </ExternalLink>
            </>
          ),
        }
      }
    }
    if (!tryParseAmount(inputAmount, currencyIn)) {
      return t`Your amount is invalid.`
    }

    const isWrapInputError = wrapInputError && inputNumber > 0
    const symbol = tokenInfoIn?.symbol
    if (isWrapInputError) return t`Insufficient ${symbol} balance`
    return
  }, [
    tokenInfoIn,
    chainIdOut,
    wrapInputError,
    inputAmount,
    tokenInfoOut,
    poolValue.poolValueOut,
    loadingToken,
    listTokenOut,
    listTokenIn,
    currencyIn,
  ])

  const handleTypeInput = useCallback(
    (value: string) => {
      if (tokenInfoIn) setInputAmount(value)
    },
    [tokenInfoIn],
  )

  const showPreview = () => {
    setSwapState(state => ({ ...state, showConfirm: true, errorMessage: '', txHash: '' }))
    if (chainId && chainIdOut) {
      mixpanelHandler(MIXPANEL_TYPE.BRIDGE_CLICK_REVIEW_TRANSFER, {
        from_network: NETWORKS_INFO[chainId].name,
        to_network: NETWORKS_INFO[chainIdOut].name,
      })
    }
  }

  const hidePreview = useCallback(() => {
    setSwapState(state => ({ ...state, showConfirm: false }))
  }, [])

  const handleSwap = useCallback(async () => {
    try {
      if (!useSwapMethods) return
      setSwapState(state => ({ ...state, attemptingTxn: true }))
      if (chainId && chainIdOut) {
        mixpanelHandler(MIXPANEL_TYPE.BRIDGE_CLICK_TRANSFER, {
          from_token: tokenInfoIn?.symbol,
          to_token: tokenInfoOut?.symbol,
          bridge_fee: outputInfo.fee,
          from_network: NETWORKS_INFO[chainId].name,
          to_network: NETWORKS_INFO[chainIdOut].name,
          trade_qty: inputAmount,
        })
      }
      const txHash = await onWrap(useSwapMethods)
      setInputAmount('')
      setSwapState(state => ({ ...state, attemptingTxn: false, txHash }))
    } catch (error) {
      console.error(error)
      setSwapState(state => ({ ...state, attemptingTxn: false, errorMessage: error?.message || error }))
    }
  }, [
    useSwapMethods,
    onWrap,
    chainId,
    chainIdOut,
    inputAmount,
    outputInfo.fee,
    mixpanelHandler,
    tokenInfoIn?.symbol,
    tokenInfoOut?.symbol,
  ])

  const maxAmountInput = useCurrencyBalance(currencyIn)?.toExact()
  const handleMaxInput = useCallback(() => {
    maxAmountInput && setInputAmount(maxAmountInput)
  }, [maxAmountInput])

  const approveSpender = (() => {
    const isRouter = !['swapin', 'swapout'].includes(tokenInfoOut?.type ?? '')
    if (tokenInfoOut?.isApprove) {
      return isRouter ? tokenInfoOut.spender : anyToken?.address
    }
    return undefined
  })()

  const formatInputBridgeValue = tryParseAmount(
    inputAmount,
    currencyIn && tokenInfoOut?.isApprove ? currencyIn : undefined,
  )
  const [approval, approveCallback] = useApproveCallback(
    formatInputBridgeValue && tokenInfoOut?.isApprove ? formatInputBridgeValue : undefined,
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
      const anyToken = tokenOut?.multichainInfo?.anytoken?.address ?? ''
      setPoolValue(state => ({ ...state, poolValueOut: poolValueOutMap[anyToken] }))
    },
    [setBridgeState, poolValueOutMap],
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
  const disableBtnReviewTransfer =
    !!inputError ||
    [inputAmount, tokenInfoIn, tokenInfoOut, chainIdOut].some(e => !e) ||
    (approval !== ApprovalState.APPROVED && tokenInfoOut?.isApprove)

  const tokenInSymbol = tokenInfoIn?.symbol

  return (
    <>
      <Flex style={{ position: 'relative', flexDirection: 'column', gap: 22, alignItems: 'center' }}>
        <SwapFormWrapper style={{ position: 'unset' }}>
          <AppBodyWrapped style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Flex
              flexDirection={'column'}
              sx={{
                gap: '8px',
              }}
            >
              <Tooltip
                text={typeof inputError === 'string' ? inputError : ''}
                show={typeof inputError === 'string'}
                placement="top"
                width="fit-content"
                style={{ maxWidth: '230px' }}
              >
                <CurrencyInputPanelBridge
                  loadingToken={loadingToken}
                  tokens={listTokenIn}
                  currency={currencyIn}
                  chainIds={listChainIn}
                  selectedChainId={chainId}
                  onSelectNetwork={changeNetwork}
                  error={typeof inputError === 'string'}
                  value={inputAmount}
                  onUserInput={handleTypeInput}
                  onMax={handleMaxInput}
                  onCurrencySelect={onCurrencySelect}
                  id="swap-currency-input"
                />
              </Tooltip>

              <PoolInfo chainId={chainId} tokenIn={tokenInfoIn} poolValue={poolValue.poolValueIn} />
            </Flex>

            <Flex width="100%" alignItems="center" justifyContent="center">
              <ArrowWrapper>
                <ArrowUp width={14} height={14} fill={theme.subText} />
              </ArrowWrapper>
            </Flex>

            <Flex
              flexDirection={'column'}
              sx={{
                gap: '8px',
              }}
            >
              <CurrencyInputPanelBridge
                loadingToken={loadingToken}
                tokens={listTokenOut}
                currency={currencyOut}
                chainIds={listChainOut}
                onSelectNetwork={onSelectDestNetwork}
                selectedChainId={chainIdOut}
                isOutput
                value={outputInfo.outputAmount.toString()}
                onCurrencySelect={onCurrencySelectDest}
                id="swap-currency-output"
              />
              <PoolInfo chainId={chainIdOut} tokenIn={tokenInfoIn} poolValue={poolValue.poolValueOut} />
            </Flex>

            {typeof inputError !== 'string' && inputError?.state && (
              <ErrorWarningPanel title={inputError?.tip} type={inputError?.state} desc={inputError?.desc} />
            )}
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>
                <Trans>Connect</Trans>
              </ButtonLight>
            ) : (
              showApproveFlow && (
                <>
                  <RowBetween>
                    <ButtonApprove
                      approveCallback={approveCallback}
                      disabled={disableBtnApproved}
                      tooltipMsg={t`You would need to first allow Multichain smart contract to use your ${tokenInSymbol}. This has to be done only once for each token.`}
                      tokenSymbol={tokenInfoIn?.symbol}
                      approval={approval}
                    />
                    <ButtonError width="48%" id="swap-button" disabled={disableBtnReviewTransfer} onClick={showPreview}>
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
              <ButtonError id="review-transfer-button" onClick={showPreview} disabled={disableBtnReviewTransfer}>
                <Text fontWeight={500}>
                  <Trans>Review Transfer</Trans>
                </Text>
              </ButtonError>
            )}

            <CustomAdvancedSwapDetailsDropdownBridge outputInfo={outputInfo} />

            <Footer />
          </AppBodyWrapped>
        </SwapFormWrapper>
      </Flex>

      <ComfirmBridgeModal swapState={swapState} onDismiss={hidePreview} onSwap={handleSwap} outputInfo={outputInfo} />
    </>
  )
}
