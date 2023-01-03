import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ethers } from 'ethers'
import { useCallback, useState } from 'react'

import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTokenContract } from 'hooks/useContract'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'

function useSendToken(currency: Currency | undefined, recipient: string, amount: string) {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const tokenContract = useTokenContract(currency?.wrapped.address)
  const addTransactionWithType = useTransactionAdder()
  const [isSending, setIsSending] = useState(false)

  const sendToken = useCallback(async () => {
    if (!account || !tokenContract || !library || !recipient || !currency) return
    const currentGasPrice = await library.getSigner().getGasPrice()
    const gasPrice = ethers.utils.hexlify(currentGasPrice)
    try {
      setIsSending(true)
      let transaction
      if (currency.isNative) {
        const tx = {
          from: account,
          to: recipient,
          value: ethers.utils.parseEther(amount),
          gasPrice,
        }
        transaction = await library.getSigner().sendTransaction(tx)
      } else {
        const numberOfTokens = ethers.utils.parseUnits(amount, currency.decimals)
        transaction = await tokenContract.transfer(recipient, numberOfTokens)
      }
      addTransactionWithType({
        type: TRANSACTION_TYPE.TRANSFER_TOKEN,
        hash: transaction.hash,
        summary: `${amount} ${currency.name} Tokens`,
        extraInfo: {
          tokenAddress: currency.wrapped.address,
          tokenAmount: amount,
          tokenSymbol: currency.symbol ?? '',
          contract: recipient,
        },
      })
    } catch (error) {
      console.log('send error', error)
    } finally {
      setIsSending(false)
    }
  }, [amount, account, currency, library, recipient, tokenContract, addTransactionWithType])

  return { sendToken, isSending }
}

export default function SendToken() {
  const [recipient, setRecipient] = useState('0x23AaaC26137e4E7E145f2a34615396364000164C')
  const [currencyIn, setCurrency] = useState<Currency>()
  const [inputAmount, setInputAmount] = useState<string>('')

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
  const enoughBalance = parseInputAmount && balance?.greaterThan(parseInputAmount)

  const { sendToken, isSending } = useSendToken(currencyIn, recipient, inputAmount)
  const disableButtonSend = isSending || !inputAmount || !currencyIn || !recipient || !enoughBalance

  return (
    <>
      <AddressInputPanel
        value={recipient}
        onChange={val => setRecipient(val !== null ? val : '')}
        showDropdown={false}
      />
      <CurrencyInputPanel
        id="send-token-wallet-ui"
        maxLength={16}
        value={inputAmount}
        positionMax="top"
        currency={currencyIn}
        onUserInput={setInputAmount}
        onMax={handleMaxInput}
        onCurrencySelect={setCurrency}
        onHalf={handleHalfInput}
      />
      <ButtonPrimary onClick={sendToken} disabled={disableButtonSend}>
        {isSending ? <Trans>Sending token</Trans> : <Trans>Send</Trans>}
      </ButtonPrimary>
    </>
  )
}
