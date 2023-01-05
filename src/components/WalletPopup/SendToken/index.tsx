import { Currency, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clipboard } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { RowBetween } from 'components/Row'
import Tooltip from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import CurrencyListHasBalance from 'components/WalletPopup/SendToken/CurrencyListSelect'
import useSendToken from 'components/WalletPopup/SendToken/useSendToken'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'
import { formatNumberWithPrecisionRange } from 'utils'
import { errorFriendly } from 'utils/dmm'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
`
const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`

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
  const [currencyIn, setCurrency] = useState<Currency>()
  const [inputAmount, setInputAmount] = useState<string>('')
  const [showListToken, setShowListToken] = useState(false)
  const { account, chainId } = useActiveWeb3React()
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const theme = useTheme()
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

  const inputError = useMemo(() => {
    if (!inputAmount) return
    if (parseFloat(inputAmount) === 0 || !parseInputAmount) {
      return t`Your input amount is invalid.`
    }
    if (balance && parseInputAmount?.greaterThan(balance)) {
      return t`Insufficient ${currencyIn?.symbol} balance`
    }
    return
  }, [currencyIn, balance, inputAmount, parseInputAmount])

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
        pendingText: t`Sending ${inputAmount} ${currencyIn?.symbol} to ${recipient}`,
      }))
      await sendToken()
      hideModalConfirm()
      setInputAmount('')
      setRecipient('')
    } catch (error) {
      console.error(error)
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: errorFriendly(error?.message ?? 'Error occur, please try again'),
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

  const ref = useRef(null)
  useOnClickOutside(ref, () => {
    setShowListToken(false)
  })

  const confirmationContent = () => {
    return (
      <Flex flexDirection={'column'} width="100%">
        <div>
          {flowState.errorMessage ? (
            <TransactionErrorContent onDismiss={hideModalConfirm} message={flowState.errorMessage} />
          ) : null}
        </div>
      </Flex>
    )
  }

  return (
    <Wrapper>
      <Flex flexDirection={'column'} style={{ gap: 18 }}>
        <Label>
          <Trans>Recipient</Trans>
        </Label>

        <div>
          <AddressInput
            error={!!recipientError}
            onChange={e => setRecipient(e.target.value)}
            value={recipient}
            placeholder="0x..."
            icon={<Clipboard size={20} color={theme.subText} />}
          />
          <Label color={theme.red} style={{ opacity: recipientError ? 1 : 0, transition: '0.3s' }}>
            {recipientError}
          </Label>
        </div>

        <InputWrapper ref={ref}>
          <Tooltip
            text={inputError}
            show={!!inputError}
            placement="top"
            style={{ maxWidth: '250px', zIndex: Z_INDEXS.MODAL }}
            width="fit-content"
          >
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
            />
          </Tooltip>
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
        </InputWrapper>

        {estimateGas && (
          <RowBetween>
            <Label>
              <Trans>Gas Fee</Trans>
            </Label>
            <Label>
              {estimateGas
                ? `~ ${formatNumberWithPrecisionRange(estimateGas, 0, 10)} ${NativeCurrencies[chainId].symbol}`
                : '-'}{' '}
            </Label>
          </RowBetween>
        )}
      </Flex>
      <ButtonPrimary height="44px" onClick={onSendToken} disabled={disableButtonSend}>
        {isSending ? <Trans>Sending token</Trans> : <Trans>Send</Trans>}
      </ButtonPrimary>

      <TransactionConfirmationModal
        hash={flowState.txHash}
        isOpen={flowState.showConfirm}
        onDismiss={hideModalConfirm}
        attemptingTxn={flowState.attemptingTxn}
        content={confirmationContent}
        pendingText={flowState.pendingText}
      />
    </Wrapper>
  )
}
