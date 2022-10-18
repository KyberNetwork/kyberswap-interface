import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonError, ButtonLight } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Swap as SwapIcon } from 'components/Icons'
import Loader from 'components/Loader'
import NumericalInput from 'components/NumericalInput'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import Select from 'components/Select'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'

import { ArrowWrapper } from './styleds'

const EXPIRED_OPTIONS = [
  { label: '5 Minutes', value: 5 * 60 },
  { label: '10 Minutes', value: 10 * 60 },
  { label: '1 Hour', value: 1 * 3600 },
  { label: '3 Days', value: 3 * 86400 },
  { label: '7 Days', value: 7 * 86400 },
  { label: '30 Days', value: 30 * 86400 },
  { label: 'Custom', value: 'custom' },
]

const Label = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  margin-bottom: 0.5rem;
`

const Set2Market = styled(Label)`
  border-radius: 24px;
  background: ${({ theme }) => theme.tabActive};
  padding: 4px 8px;
  cursor: pointer;
  margin-bottom: 0;
`
export default function LimitOrderForm() {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const [currencyIn, setCurrencyIn] = useState<Currency>()
  const [currencyOut, setCurrencyOut] = useState<Currency>()

  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOuputAmount] = useState('')
  const [priceRate, setPriceRate] = useState('')

  const handleMaxInput = () => {
    //
  }
  const handleHalfInput = () => {
    //
  }
  const handleInputSelect = (currency: Currency) => {
    setCurrencyIn(currency)
  }
  const handleOutputSelect = (currency: Currency) => {
    setCurrencyOut(currency)
  }

  const [rotate, setRotate] = useState(false)
  const handleRotateClick = () => {
    setRotate(prev => !prev)
  }

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const formatInputBridgeValue = tryParseAmount(inputAmount, currencyIn)

  const [approval, approveCallback] = useApproveCallback(formatInputBridgeValue, undefined)

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const inputError = {}

  const showApproveFlow =
    !inputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved = approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!inputError

  const showPreview = () => {
    // setSwapState(state => ({ ...state, showConfirm: true, swapErrorMessage: '' }))
  }

  return (
    <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
      <div>
        <Label>
          <Trans>You Pay</Trans>
        </Label>
        <CurrencyInputPanel
          value={inputAmount}
          showMaxButton
          positionMax="top"
          currency={currencyIn}
          onUserInput={setInputAmount}
          onMax={handleMaxInput}
          onHalf={handleHalfInput}
          onCurrencySelect={handleInputSelect}
          otherCurrency={currencyOut}
          id="swap-currency-input"
          showCommonBases={true}
          estimatedUsd={undefined}
          // estimatedUsd={trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined}
        />
      </div>

      <Flex justifyContent={'space-between'} alignItems="center" style={{ gap: '1rem' }}>
        <Flex flexDirection={'column'} flex={1} style={{ gap: '0.75rem' }}>
          <Flex justifyContent={'space-between'} alignItems="flex-end">
            <Label style={{ marginBottom: 0, display: 'flex' }}>
              <Trans>
                xxx Price <Text color={theme.apr}>(+xxx %)</Text>
              </Trans>
            </Label>
            <Set2Market>
              <Trans>Set to Market</Trans>
            </Set2Market>
          </Flex>
          <NumericalInput
            style={{ width: '100%', borderRadius: 12, padding: '10px 12px' }}
            value={priceRate}
            onUserInput={setPriceRate}
          />
          <Label>0.000242275 ETH = 1 KNC</Label>
        </Flex>
        <ArrowWrapper rotated={rotate} onClick={handleRotateClick}>
          <SwapIcon size={24} color={theme.subText} />
        </ArrowWrapper>
      </Flex>

      {/* <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
      <TradePrice price={trade?.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} /> */}

      <div>
        <Label>
          <Trans>You Receive</Trans>
        </Label>
        <CurrencyInputPanel
          value={outputAmount}
          showMaxButton={false}
          currency={currencyOut}
          onUserInput={setOuputAmount}
          onCurrencySelect={handleOutputSelect}
          otherCurrency={currencyOut}
          id="swap-currency-output"
          showCommonBases={true}
          estimatedUsd={undefined}
          // estimatedUsd={trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined}
        />
      </div>

      <Select
        style={{ width: '100%', height: 48 }}
        options={EXPIRED_OPTIONS}
        activeRender={item => (
          <Flex justifyContent={'space-between'}>
            <Text>{t`Expires In`}</Text>
            <Text>{item?.label}</Text>
          </Flex>
        )}
      />

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
                      text={t`You would need to first allow Multichain smart contract to use your ${currencyIn?.symbol}. This has to be done only once for each token.`}
                    >
                      <Info size={18} />
                    </MouseoverTooltip>
                    <Text marginLeft={'5px'}>{t`Approve ${currencyIn?.symbol}`}</Text>
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
                  {t`Review Order`}
                </Text>
              </ButtonError>
            </RowBetween>
            <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
          </>
        )
      )}
      {!showApproveFlow && account && (
        <ButtonError onClick={showPreview} disabled={!!inputError || approval !== ApprovalState.APPROVED}>
          <Text fontWeight={500}>{t`Review Order`}</Text>
        </ButtonError>
      )}
    </Flex>
  )
}
