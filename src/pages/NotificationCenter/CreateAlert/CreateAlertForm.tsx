import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useCreatePriceAlertMutation } from 'services/priceAlert'
import { CSSProperties } from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import CheckBox from 'components/CheckBox'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Clock } from 'components/Icons'
import { NetworkLogo } from 'components/Logo'
import Row, { RowBetween } from 'components/Row'
import RefreshButton from 'components/SwapForm/RefreshButton'
import { MouseoverTooltip } from 'components/Tooltip'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import { useActiveWeb3React } from 'hooks'
import useBaseTradeInfo from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'
import {
  ActionGroup,
  ButtonCancel,
  ButtonConnectWallet,
  ButtonSubmit,
  Form,
  FormControl,
  Label,
  LeftColumn,
  MiniLabel,
  RightColumn,
  StyledInput,
  StyledInputNumber,
  StyledSelect,
} from 'pages/NotificationCenter/CreateAlert/styleds'
import useCurrencyHandler from 'pages/NotificationCenter/CreateAlert/useCurrencyHandler'
import {
  COOLDOWN_OPTIONS,
  ConfirmAlertModalData,
  NETWORK_OPTIONS,
  PriceAlert,
  PriceAlertStat,
  PriceAlertType,
  TYPE_OPTIONS,
} from 'pages/NotificationCenter/const'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

const defaultInput = {
  tokenInAmount: '1',
  threshold: '',
  note: '',
}

export default function CreateAlert({
  showModalConfirm,
  priceAlertStat,
  refreshStat,
}: {
  showModalConfirm: (data: ConfirmAlertModalData) => void
  priceAlertStat: PriceAlertStat
  refreshStat: () => void
}) {
  const { account, chainId } = useActiveWeb3React()
  const [createAlert] = useCreatePriceAlertMutation()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()
  const [selectedChain, setSelectedChain] = useState(chainId)

  const { currencyIn, currencyOut, onChangeCurrencyIn, onChangeCurrencyOut } = useCurrencyHandler(selectedChain)

  const [formInput, setFormInput] = useState<{ tokenInAmount: string; threshold: string; note: string }>(defaultInput)
  const [disableAfterTrigger, setDisableAfterTrigger] = useState(false)
  const [cooldown, setCooldown] = useState(COOLDOWN_OPTIONS[0].value)
  const [alertType, setAlertType] = useState<PriceAlertType>(PriceAlertType.ABOVE)

  const { maxActiveAlerts, totalActiveAlerts } = priceAlertStat

  const { loading, tradeInfo, refresh: refreshMarketPrice } = useBaseTradeInfo(currencyIn, currencyOut, selectedChain)

  const onChangeInput = (name: string, val: string) => {
    if (name === 'threshold' && val.includes('.')) {
      const numPrecision = val.split('.').pop()?.length || 0
      if (numPrecision > 6) return
    }
    setFormInput({ ...formInput, [name]: val })
  }

  const theme = useTheme()

  const styleCurrencySelect: CSSProperties = {
    border: `1px solid ${theme.border}`,
    borderRadius: 44,
    width: 132,
    height: 36,
    fontSize: 14,
    color: theme.text,
  }

  const resetForm = () => {
    setFormInput(defaultInput)
    setCooldown(COOLDOWN_OPTIONS[0].value)
    setAlertType(PriceAlertType.ABOVE)
    setDisableAfterTrigger(false)
  }

  const isInputValid = () => {
    return Boolean(account && currencyIn && currencyOut && formInput.tokenInAmount && formInput.threshold)
  }

  const onSubmitAlert = async () => {
    try {
      if (!isInputValid()) return
      const alert: PriceAlert = {
        walletAddress: account ?? '',
        chainId: selectedChain.toString(),
        tokenInAddress: currencyIn?.wrapped.address ?? '',
        tokenOutAddress: currencyOut?.wrapped.address ?? '',
        type: alertType,
        isEnabled: totalActiveAlerts < maxActiveAlerts,
        disableAfterTrigger,
        cooldown,
        ...formInput,
      }
      const { data, error }: any = await createAlert(alert)
      if (error) throw error
      alert.id = data?.data?.id
      refreshStat()
      showModalConfirm({
        alert,
        currencyIn,
        currencyOut,
      })
      resetForm()
    } catch (error) {
      console.error('create alert err', error)
      const msg = error?.data?.code === 40011 ? t`Exceed max active alerts` : t`Create price alert failed`
      notify({
        title: msg,
        type: NotificationType.ERROR,
      })
    }
  }

  useEffect(() => {
    setSelectedChain(chainId)
  }, [chainId])

  return (
    <>
      <Form>
        <LeftColumn>
          <Label>
            <Trans>Alert Conditions</Trans>
          </Label>
          <FormControl>
            <MiniLabel>
              <Trans>Send me an alert when on</Trans>
            </MiniLabel>
            <StyledSelect
              value={selectedChain}
              arrowColor={theme.subText}
              options={NETWORK_OPTIONS}
              onChange={setSelectedChain}
              menuStyle={{ height: 250, overflow: 'scroll' }}
              activeRender={item => (
                <Flex alignItems="center" style={{ gap: 6 }}>
                  <NetworkLogo style={{ width: 20, height: 20 }} chainId={item?.value as ChainId} />
                  <Text fontSize={14} fontWeight="500">
                    {item?.label}
                  </Text>
                </Flex>
              )}
            />
            <MiniLabel>
              <Trans>the price of</Trans>
            </MiniLabel>
            <StyledInputNumber
              value={formInput.tokenInAmount}
              onUserInput={val => onChangeInput('tokenInAmount', val)}
            />

            <div>
              <CurrencyInputPanel
                hideInput
                value={''}
                currency={currencyIn}
                hideBalance
                onMax={null}
                onHalf={null}
                onCurrencySelect={onChangeCurrencyIn}
                otherCurrency={currencyOut}
                id="alert-currency-input"
                showCommonBases={true}
                styleSelect={styleCurrencySelect}
                fontSize={'14px'}
                customChainId={selectedChain}
              />
            </div>

            <MiniLabel>
              <Trans>to</Trans>
            </MiniLabel>

            <div>
              <CurrencyInputPanel
                hideInput
                value={''}
                currency={currencyOut}
                hideBalance
                onMax={null}
                onHalf={null}
                styleSelect={styleCurrencySelect}
                onCurrencySelect={onChangeCurrencyOut}
                otherCurrency={currencyIn}
                id="alert-currency-out"
                showCommonBases={true}
                fontSize={'14px'}
                customChainId={selectedChain}
              />
            </div>

            <MiniLabel>
              <Trans>goes</Trans>
            </MiniLabel>

            <StyledSelect
              arrowColor={theme.subText}
              options={TYPE_OPTIONS}
              value={alertType}
              onChange={setAlertType}
              activeRender={item => {
                const isAbove = item?.value === PriceAlertType.ABOVE
                return (
                  <Flex alignItems="center" style={{ gap: 6 }} color={isAbove ? theme.primary : theme.red}>
                    {isAbove ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                    <Text fontSize={14} fontWeight="500">
                      {item?.label}
                    </Text>
                  </Flex>
                )
              }}
            />

            <MiniLabel>
              <Trans>the price of</Trans>
            </MiniLabel>
            <StyledInputNumber value={formInput.threshold} onUserInput={val => onChangeInput('threshold', val)} />

            <MiniLabel>
              <Trans>per token</Trans>
            </MiniLabel>
          </FormControl>

          <TradePrice
            price={tradeInfo}
            style={{ width: 'fit-content', fontStyle: 'italic' }}
            color={theme.text}
            label={t`Note: The current price is `}
            loading={loading}
            symbolIn={currencyIn?.symbol}
            symbolOut={currencyOut?.symbol}
            icon={<RefreshButton shouldDisable={!tradeInfo} callback={refreshMarketPrice} size={16} skipFirst />}
          />
        </LeftColumn>

        <RightColumn>
          <Label>
            <Trans>Additional Options</Trans>
          </Label>
          <RowBetween>
            <MouseoverTooltip text={t`To specify the amount of time that must pass before the alert can be fire again`}>
              <MiniLabel style={{ borderBottom: `1px dotted ${theme.border}` }}>
                <Trans>Cooldown</Trans>
              </MiniLabel>
            </MouseoverTooltip>
            <StyledSelect
              value={cooldown}
              options={COOLDOWN_OPTIONS}
              onChange={setCooldown}
              arrowColor={theme.subText}
              activeRender={item => (
                <Flex alignItems="center" style={{ gap: 6 }}>
                  <Clock size={20} color={theme.text} />
                  <Text fontSize={14} fontWeight="500">
                    {item?.label}
                  </Text>
                </Flex>
              )}
            />
          </RowBetween>
          <RowBetween>
            <MiniLabel>
              <Trans>Note</Trans>
            </MiniLabel>
            <StyledInput
              maxLength={32}
              style={{ width: '200px' }}
              placeholder={t`Add a note`}
              value={formInput.note}
              onChange={e => onChangeInput('note', e.currentTarget.value)}
            />
          </RowBetween>
          <Row gap="8px">
            <CheckBox
              checked={disableAfterTrigger}
              id="disable-trigger"
              borderStyle
              style={{ width: 15, height: 15 }}
              onChange={() => setDisableAfterTrigger(v => !v)}
            />
            <Text as="label" fontSize="14px" color={theme.text} htmlFor="disable-trigger">
              <Trans>Disable the alert after it triggers once</Trans>
            </Text>
          </Row>
        </RightColumn>
      </Form>

      <ActionGroup>
        {account ? (
          <>
            <ButtonCancel onClick={resetForm}>
              <Trans>Cancel</Trans>
            </ButtonCancel>
            <ButtonSubmit onClick={onSubmitAlert} disabled={!isInputValid()}>
              <Trans>Create Alert</Trans>
            </ButtonSubmit>
          </>
        ) : (
          <ButtonConnectWallet onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonConnectWallet>
        )}
      </ActionGroup>
    </>
  )
}
//
