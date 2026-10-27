import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { lazy, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'
import { useGetTipLinkQuery } from 'services/tipLink'

import { DEFAULT_TIP, TIP_LINK_CLIENT_ID, isCreatorNameValid } from 'components/TipLinkGeneratorModal/shared'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { DEFAULT_OUTPUT_TOKENS, NativeCurrencies } from 'constants/tokens'
import { MAX_FEE_IN_BIPS } from 'constants/trade'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/useTokens'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import SwapPage from 'pages/Swap/SwapPage'
import { TAB, isSettingTab } from 'pages/Swap/layout/Tabs'
import Updater from 'state/customizeDexes/updater'
import { ChargeFeeBy } from 'types/route'
import { isAddress } from 'utils/address'
import { getEmbeddedSwapPair, isCrossChainPair } from 'utils/swapFlow'

const LimitPage = lazy(() => import('pages/Swap/LimitPage'))

const getSupportedChainId = (chainId?: string | null) => {
  const parsed = Number(chainId)
  return SUPPORTED_NETWORKS.includes(parsed) ? parsed : undefined
}

const getTipCurrencyParam = (currency: string | undefined, chainId: number) => {
  if (!currency) return currency
  const native = NativeCurrencies[chainId as ChainId]
  const wrappedNative = WETH[chainId as ChainId]
  return wrappedNative?.address?.toLowerCase() === currency.toLowerCase() ? native.symbol || currency : currency
}

const getFeeAmountFallback = (feeAmount: string | null) => {
  const trimmedFeeAmount = feeAmount?.trim()
  const parsedFeeAmount = Number(trimmedFeeAmount)
  const isFeeAmountNumber =
    !!trimmedFeeAmount && /^\d+$/.test(trimmedFeeAmount) && Number.isSafeInteger(parsedFeeAmount)

  if (!isFeeAmountNumber) return '0'
  if (parsedFeeAmount > MAX_FEE_IN_BIPS) return String(MAX_FEE_IN_BIPS)

  return null
}

type Props = {
  mode?: 'partner' | 'user'
}

const PartnerSwap = ({ mode = 'partner' }: Props) => {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tipsId = '' } = useParams()

  const isUserSwap = mode === 'user'

  const { data: tipConfig } = useGetTipLinkQuery(tipsId, { skip: !isUserSwap || !tipsId })
  const appliedTipRef = useRef('')

  const clientId = searchParams.get('clientId')
  const tabFromUrl = searchParams.get('tab') as TAB | null
  const currentMainTab =
    tabFromUrl && isSettingTab(tabFromUrl) ? undefined : tabFromUrl === TAB.LIMIT ? TAB.LIMIT : TAB.SWAP
  const previousMainTab = usePreviousDistinct(currentMainTab)
  const mainTab = currentMainTab || previousMainTab || TAB.SWAP

  const chainIdFromUrl = getSupportedChainId(searchParams.get('chainId'))
  const chainIdFromTip = isUserSwap ? getSupportedChainId(tipConfig?.chainId) : undefined
  const tipChainId = chainIdFromUrl || chainIdFromTip || ChainId.MAINNET
  const pair = getEmbeddedSwapPair(searchParams)
  const isCrossChain = isCrossChainPair(pair.fromChain, pair.toChain)
  const swapChainId =
    typeof pair.fromChain === 'number'
      ? pair.fromChain
      : typeof pair.toChain === 'number'
      ? pair.toChain
      : ChainId.MAINNET

  const tipInputCurrency = isUserSwap ? getTipCurrencyParam(tipConfig?.inputCurrency, tipChainId) : undefined
  const tipOutputCurrency = isUserSwap ? getTipCurrencyParam(tipConfig?.outputCurrency, tipChainId) : undefined

  const currencyIn = useCurrencyV2(pair.tokenIn, swapChainId) || NativeCurrencies[swapChainId]
  const currencyOut = useCurrencyV2(pair.tokenOut, swapChainId) || DEFAULT_OUTPUT_TOKENS[swapChainId]

  const isInvalidFeeConfig = useMemo(() => {
    const feeAmount = searchParams.get('feeAmount')
    const feeReceiver = searchParams.get('feeReceiver')
    const chargeFeeBy = searchParams.get('chargeFeeBy') || ChargeFeeBy.CURRENCY_OUT
    const hasFeeConfig = Boolean(
      searchParams.get('enableTip') || searchParams.get('isInBps') || feeAmount || feeReceiver,
    )
    if (!hasFeeConfig) return false

    const isValidFeeReceiver = Boolean(feeReceiver && isAddress(swapChainId, feeReceiver))
    const isValidChargeFeeBy = chargeFeeBy === ChargeFeeBy.CURRENCY_IN || chargeFeeBy === ChargeFeeBy.CURRENCY_OUT

    return !isValidFeeReceiver || !isValidChargeFeeBy
  }, [searchParams, swapChainId])

  // Hydrate short tip-link configs into regular swap URL params once. The swap form
  // only reads fee/token attribution from the URL, so keep this as the bridge between
  // the persisted tip-link payload and quote/build params.
  useEffect(() => {
    if (!isUserSwap || !tipsId || !tipConfig || appliedTipRef.current === tipsId) return

    const nextSearchParams = new URLSearchParams(searchParams)
    for (const key of ['from', 'to', 'tokenIn', 'tokenOut', 'toChain']) nextSearchParams.delete(key)
    nextSearchParams.set('chainId', String(tipChainId))
    nextSearchParams.set('inputCurrency', tipInputCurrency || '')
    nextSearchParams.set('outputCurrency', tipOutputCurrency || '')
    nextSearchParams.set('enableTip', 'true')
    nextSearchParams.set('feeReceiver', tipConfig.tipReceiver)
    nextSearchParams.set('clientId', TIP_LINK_CLIENT_ID)
    const creatorName = tipConfig.creatorName?.trim()
    if (creatorName && isCreatorNameValid(creatorName)) nextSearchParams.set('creatorName', creatorName)
    else nextSearchParams.delete('creatorName')
    if (!nextSearchParams.get('feeAmount')) {
      nextSearchParams.set('feeAmount', String(DEFAULT_TIP))
    }
    if (!nextSearchParams.get('chargeFeeBy')) nextSearchParams.set('chargeFeeBy', ChargeFeeBy.CURRENCY_OUT)

    appliedTipRef.current = tipsId
    setSearchParams(nextSearchParams, { replace: true })
  }, [isUserSwap, searchParams, setSearchParams, tipChainId, tipConfig, tipInputCurrency, tipOutputCurrency, tipsId])

  // Normalize recoverable tip params in place, then reject configs that cannot produce
  // a valid fee receiver/charge target. Partner swap also requires clientId so regular
  // users do not accidentally enter this route without attribution.
  useEffect(() => {
    const feeAmount = searchParams.get('feeAmount')
    const feeReceiver = searchParams.get('feeReceiver')
    const creatorName = searchParams.get('creatorName')
    const hasFeeConfig = Boolean(
      searchParams.get('enableTip') || searchParams.get('isInBps') || feeAmount || feeReceiver,
    )
    const fallbackFeeAmount = hasFeeConfig ? getFeeAmountFallback(feeAmount) : null
    const shouldRemoveCreatorName = Boolean(creatorName && !isCreatorNameValid(creatorName))

    if (shouldRemoveCreatorName || fallbackFeeAmount !== null) {
      const nextSearchParams = new URLSearchParams(searchParams)
      if (shouldRemoveCreatorName) nextSearchParams.delete('creatorName')
      if (fallbackFeeAmount !== null) nextSearchParams.set('feeAmount', fallbackFeeAmount)
      setSearchParams(nextSearchParams, { replace: true })
      return
    }

    if (isInvalidFeeConfig || (!isUserSwap && !clientId)) {
      navigate('/', { replace: true })
    }
  }, [clientId, isInvalidFeeConfig, isUserSwap, navigate, searchParams, setSearchParams])

  // Sync form chainId and wallet chainId when disconnected
  useEffect(() => {
    if (!isCrossChain && !account && walletChainId !== swapChainId) {
      changeNetwork(swapChainId)
    }
  }, [isCrossChain, account, walletChainId, swapChainId, changeNetwork])

  return (
    <>
      {mainTab === TAB.LIMIT ? (
        <LimitPage customChainId={swapChainId} currencyIn={currencyIn} currencyOut={currencyOut} />
      ) : (
        <SwapPage />
      )}
      {!isCrossChain && <Updater customChainId={swapChainId} />}
    </>
  )
}

export default PartnerSwap
