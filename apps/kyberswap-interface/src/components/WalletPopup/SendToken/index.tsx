import { Currency, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Clipboard } from 'react-feather'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import CurrencyListHasBalance from 'components/WalletPopup/SendToken/CurrencyListSelect'
import WarningBrave from 'components/WalletPopup/SendToken/WarningBrave'
import useSendToken from 'components/WalletPopup/SendToken/useSendToken'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { tryParseAmount } from 'state/swap/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { formatDisplayNumber } from 'utils/numbers'

const TRANSACTION_STATE_DEFAULT: TransactionFlowState = {
  showConfirm: false,
  attemptingTxn: false,
  errorMessage: '',
  txHash: undefined,
  pendingText: '',
}

const Label = ({
  className,
  color,
  style,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement> & { color?: string }) => (
  <label
    {...rest}
    className={cn('text-xs font-medium leading-4 text-subText', className)}
    style={color ? { color, ...style } : style}
  />
)

export default function SendToken({
  loadingTokens,
  currencies,
  currencyBalances,
}: {
  loadingTokens: boolean
  currencies: Currency[]
  currencyBalances: { [address: string]: TokenAmount | undefined }
}) {
  const [recipient, setRecipient] = useState('')
  const [displayRecipient, setDisplayRecipient] = useState('')

  const [currencyIn, setCurrency] = useState<Currency>()
  const [inputAmount, setInputAmount] = useState<string>('')
  const [showListToken, setShowListToken] = useState(false)
  const { account, chainId } = useActiveWeb3React()
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const { trackingHandler } = useTracking()
  const balance = useCurrencyBalance(currencyIn)
  const maxAmountInput = maxAmountSpend(balance)

  const handleMaxInput = useCallback(() => {
    if (!maxAmountInput) return
    setInputAmount(maxAmountInput?.toExact())
  }, [maxAmountInput])

  const handleHalfInput = useCallback(() => {
    if (!balance) return
    setInputAmount(balance?.divide(2).toExact() || '')
  }, [balance])

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn)

  const { address, loading } = useENS(recipient)

  const recipientError =
    recipient && ((!loading && !address) || !recipient.startsWith('0x'))
      ? t`Invalid wallet address`
      : recipient.toLowerCase() === account?.toLowerCase()
      ? t`You can’t use your own address as a receiver`
      : ''

  const inSymbol = currencyIn?.symbol
  const inputError = useMemo(() => {
    if (!inputAmount) return
    if (parseFloat(inputAmount) === 0 || !parseInputAmount) {
      return t`Your input amount is invalid.`
    }
    if (balance && parseInputAmount?.greaterThan(balance)) {
      return t`Insufficient ${inSymbol} balance`
    }
    return
  }, [balance, inputAmount, parseInputAmount, inSymbol])

  const hasError = inputError || recipientError

  const { sendToken, isSending, estimateGas } = useSendToken(currencyIn, address ?? '', inputAmount)
  const hideModalConfirm = () => {
    setFlowState(TRANSACTION_STATE_DEFAULT)
  }

  const onSendToken = async () => {
    try {
      setFlowState(state => ({
        ...state,
        attemptingTxn: true,
        showConfirm: true,
        pendingText: t`Sending ${inputAmount} ${inSymbol} to ${recipient}`,
      }))
      trackingHandler(TRACKING_EVENT_TYPE.WALLET_SEND_INITIATED, {
        token_symbol: inSymbol,
        token_address: currencyIn?.wrapped.address,
        amount: inputAmount,
        amount_usd: estimateUsd,
        recipient_address: recipient,
        chain: NETWORKS_INFO[chainId]?.name,
        wallet_address: account,
      })
      await sendToken()
      hideModalConfirm()
      setInputAmount('')
      onChangeRecipient('')
    } catch (error) {
      console.error(error)
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: friendlyError(error),
      }))
    }
  }
  const disableButtonSend = isSending || !inputAmount || !currencyIn || !recipient || !!hasError

  const isInit = useRef(false)
  useEffect(() => {
    if (!loadingTokens && !isInit.current && currencies[0]) {
      setCurrency(currencies[0])
      isInit.current = true
    }
  }, [loadingTokens, currencies])

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChangeRecipient(text)
    } catch (error) {}
  }

  const ref = useRef(null)
  useOnClickOutside(ref, () => {
    setShowListToken(false)
  })

  const confirmationContent = () => {
    return (
      <div className="flex w-full flex-col">
        <div>
          {flowState.errorMessage ? (
            <TransactionErrorContent onDismiss={hideModalConfirm} message={flowState.errorMessage} />
          ) : null}
        </div>
      </div>
    )
  }

  const addressParam = useMemo(
    () => [WETH[chainId].wrapped.address, currencyIn?.wrapped.address].filter(Boolean) as string[],
    [chainId, currencyIn],
  )

  const tokensPrices = useTokenPrices(addressParam)

  const usdPriceNative = tokensPrices[WETH[chainId].wrapped.address] ?? 0
  const usdPriceCurrencyIn = currencyIn ? tokensPrices[currencyIn.wrapped.address] : 0

  const estimateUsd = usdPriceCurrencyIn * parseFloat(inputAmount)

  const formatRecipient = (val: string) => {
    try {
      setDisplayRecipient(shortenAddress(chainId, val, isMobile ? 14 : 16))
    } catch {
      setDisplayRecipient(val)
    }
  }

  const onChangeRecipient = (val: string) => {
    setRecipient(val)
    formatRecipient(val)
  }

  const onFocus = () => {
    setDisplayRecipient(recipient)
  }

  const onBlur = () => {
    formatRecipient(recipient)
  }

  return (
    <div
      className="ks-scrollbar flex flex-1 basis-full flex-col justify-between gap-3.5 overflow-y-scroll"
      style={{ '--ks-scrollbar-thumb': 'var(--ks-disableText)' } as CSSProperties}
    >
      <div className="flex flex-col gap-[18px]">
        <Label>
          <Trans>Recipient</Trans>
        </Label>

        <div>
          <AddressInput
            inputClassName="!text-subText [text-overflow:unset]"
            error={!!recipientError}
            onChange={e => onChangeRecipient(e.currentTarget.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            value={displayRecipient}
            placeholder="0x..."
            icon={
              <MouseoverTooltip text={t`Paste from clipboard`} width="150px">
                <Clipboard size={20} cursor="pointer" className="text-subText" onClick={onPaste} />
              </MouseoverTooltip>
            }
          />
          <Label className="text-red" style={{ opacity: recipientError ? 1 : 0, transition: '0.3s' }}>
            {recipientError}
          </Label>
        </div>

        <div ref={ref} className="relative flex flex-col">
          <CurrencyInputPanel
            id="send-token-wallet-ui"
            error={!!inputError}
            maxLength={16}
            value={inputAmount}
            positionMax="top"
            currency={currencyIn}
            onUserInput={setInputAmount}
            onMax={handleMaxInput}
            onHalf={handleHalfInput}
            onClickSelect={() => setShowListToken(!showListToken)}
            loadingText={loadingTokens ? t`Loading token...` : undefined}
            estimatedUsd={
              estimateUsd ? formatDisplayNumber(estimateUsd, { style: 'currency', significantDigits: 6 }) : undefined
            }
          />

          {showListToken && (
            <CurrencyListHasBalance
              loading={loadingTokens}
              currencies={currencies}
              currencyBalances={currencyBalances}
              selectedCurrency={currencyIn}
              onCurrencySelect={currency => {
                setCurrency(currency)
                setShowListToken(false)
              }}
            />
          )}
        </div>

        <WarningBrave token={currencyIn} />

        <RowBetween>
          <Label>
            <Trans>Gas Fee</Trans>
          </Label>
          <Label className="text-text">
            {estimateGas && usdPriceNative
              ? `~ ${formatDisplayNumber(estimateGas * usdPriceNative, {
                  style: 'currency',
                  significantDigits: 6,
                })} `
              : '-'}
          </Label>
        </RowBetween>
      </div>
      <ButtonPrimary height="44px" onClick={onSendToken} disabled={disableButtonSend}>
        {inputError ? inputError : isSending ? <Trans>Sending token</Trans> : <Trans>Send</Trans>}
      </ButtonPrimary>

      <TransactionConfirmationModal
        hash={flowState.txHash}
        isOpen={flowState.showConfirm}
        onDismiss={hideModalConfirm}
        attemptingTxn={flowState.attemptingTxn}
        content={confirmationContent}
        pendingText={flowState.pendingText}
      />
    </div>
  )
}
