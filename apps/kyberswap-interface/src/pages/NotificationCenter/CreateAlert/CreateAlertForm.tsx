import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useCreatePriceAlertMutation } from 'services/priceAlert'

import { NotificationType } from 'components/Announcement/type'
import CheckBox from 'components/CheckBox'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Clock } from 'components/Icons'
import { NetworkLogo } from 'components/Logo'
import Row, { RowBetween } from 'components/Row'
import RefreshButton from 'components/SwapForm/RefreshButton'
import { MouseoverTooltip } from 'components/Tooltip'
import TradePrice from 'components/swapv2/TradePrice'
import { PRICE_ALERT_TOPIC_ID } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { useBaseTradeInfoWithAggregator } from 'hooks/useBaseTradeInfo'
import useNotification from 'hooks/useNotification'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import InputNote from 'pages/NotificationCenter/CreateAlert/InputNote'
import {
  ActionGroup,
  ButtonSubmit,
  Form,
  FormControl,
  Label,
  LeftColumn,
  MiniLabel,
  RightColumn,
  StyledInputNumber,
  StyledSelect,
} from 'pages/NotificationCenter/CreateAlert/styleds'
import useCurrencyHandler from 'pages/NotificationCenter/CreateAlert/useCurrencyHandler'
import {
  ConfirmAlertModalData,
  CreatePriceAlertPayload,
  DEFAULT_ALERT_COOLDOWN,
  NETWORK_OPTIONS,
  PriceAlertStat,
  PriceAlertType,
  TYPE_OPTIONS,
  getCoolDownOptions,
} from 'pages/NotificationCenter/const'
import { useNotify } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { formatTimeDuration } from 'utils/time'
import { getTokenAddress } from 'utils/tokenInfo'

const defaultInput = {
  tokenInAmount: '1',
  threshold: '',
  note: '',
}

export default function CreateAlert({
  showModalConfirm,
  priceAlertStat,
}: {
  showModalConfirm: (data: ConfirmAlertModalData) => void
  priceAlertStat: PriceAlertStat
}) {
  const { account, chainId: currentChain } = useActiveWeb3React()
  const { chainId: chainIdParams } = useParsedQueryString()
  const chainId = chainIdParams ? +chainIdParams || currentChain : currentChain

  const [createAlert] = useCreatePriceAlertMutation()
  const notify = useNotify()

  const [selectedChain, setSelectedChain] = useState(chainId)

  const { currencyIn, currencyOut, onChangeCurrencyIn, onChangeCurrencyOut, inputAmount } =
    useCurrencyHandler(selectedChain)

  useEffect(() => {
    setSelectedChain(chainId)
  }, [chainId])

  const [formInput, setFormInput] = useState<{ tokenInAmount: string; threshold: string; note: string }>({
    ...defaultInput,
    tokenInAmount: inputAmount,
  })
  const [disableAfterTrigger, setDisableAfterTrigger] = useState(false)
  const [cooldown, setCooldown] = useState(DEFAULT_ALERT_COOLDOWN)
  const [alertType, setAlertType] = useState<PriceAlertType>(PriceAlertType.ABOVE)

  const { subscribeOne } = useNotification()

  const { maxActiveAlerts, totalActiveAlerts, totalAlerts, maxAlerts } = priceAlertStat

  const parsedAmount = useMemo(
    () => tryParseAmount(formInput.tokenInAmount, currencyIn),
    [formInput.tokenInAmount, currencyIn],
  )
  const { fetcher: getRoute, result: executionPrice } = useBaseTradeInfoWithAggregator({
    currencyIn,
    currencyOut,
    parsedAmount,
    customChain: selectedChain,
  })

  const onChangeInput = (name: string, val: string) => {
    if (name === 'threshold' && val.length > 60) {
      return
    }
    setFormInput({ ...formInput, [name]: val })
  }

  const theme = useTheme()

  const currencySelectClassName = '!w-[132px] !h-9 !rounded-[44px] !border !border-border !text-sm !text-text'

  const resetForm = () => {
    setFormInput(defaultInput)
    setCooldown(DEFAULT_ALERT_COOLDOWN)
    setAlertType(PriceAlertType.ABOVE)
    setDisableAfterTrigger(false)
  }

  const isMaxQuota = totalAlerts >= maxAlerts

  const isInputValid = () => {
    const fillAllInput = Boolean(
      currencyIn && currencyOut && formInput.tokenInAmount && formInput.threshold && !isMaxQuota,
    )
    if (!fillAllInput || !parsedAmount) return false
    return true
  }
  const { trackingHandler } = useTracking()
  const onSubmitAlert = async () => {
    try {
      if (!isInputValid()) return
      const alert: CreatePriceAlertPayload = {
        walletAddress: account ?? '',
        chainId: selectedChain.toString(),
        tokenInAddress: getTokenAddress(currencyIn),
        tokenOutAddress: getTokenAddress(currencyOut),
        type: alertType,
        isEnabled: totalActiveAlerts < maxActiveAlerts,
        disableAfterTrigger,
        cooldown,
        ...formInput,
        tokenInAmount: parsedAmount?.quotient?.toString() ?? '',
      }
      const data = await createAlert(alert).unwrap()
      const id = data?.data?.id
      if (!id) throw new Error('Missing id')
      showModalConfirm({
        alert: { ...alert, id },
        currencyIn,
        currencyOut,
      })

      resetForm()
      trackingHandler(TRACKING_EVENT_TYPE.PA_CREATE_SUCCESS, {
        input_token: currencyIn.symbol,
        output_token: currencyOut.symbol,
        goes: alertType,
        cooldown: formatTimeDuration(cooldown),
        disable_the_alert: disableAfterTrigger ? 'yes' : 'no',
      })
      subscribeOne(+PRICE_ALERT_TOPIC_ID)
    } catch (error) {
      console.error('create alert err', error)
      const msg = error?.data?.message || t`Error occur, please try again`
      notify({ title: t`Create Alert Failed`, summary: msg, type: NotificationType.ERROR })
    }
  }

  const navigate = useNavigate()

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
              onChange={chain => {
                setSelectedChain(chain)
                navigate({ search: '' }, { replace: true })
              }}
              menuStyle={{ height: 250, overflow: 'scroll', width: '100%' }}
              optionStyle={{ padding: 0 }}
              activeRender={item => (
                <div className="flex items-center gap-1.5">
                  <NetworkLogo style={{ width: 20, height: 20 }} chainId={item?.value as ChainId} />
                  <span className="text-sm font-medium">{item?.label}</span>
                </div>
              )}
              optionRender={item => {
                return (
                  <MouseoverTooltip text="">
                    <span className="cursor-pointer px-[18px] py-2.5">{item?.label}</span>
                  </MouseoverTooltip>
                )
              }}
            />

            <div className="flex gap-3">
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
                  onCurrencySelect={onChangeCurrencyIn}
                  otherCurrency={currencyOut}
                  id="alert-currency-input"
                  showCommonBases={true}
                  selectClassName={currencySelectClassName}
                  fontSize={'14px'}
                  customChainId={selectedChain}
                />
              </div>
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
                selectClassName={currencySelectClassName}
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
              menuStyle={{ width: '100%' }}
              arrowColor={theme.subText}
              options={TYPE_OPTIONS()}
              value={alertType}
              onChange={setAlertType}
              optionStyle={{ padding: '10px 12px' }}
              optionRender={item => (
                <div className="flex items-center gap-1.5">
                  {item?.value === PriceAlertType.ABOVE ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {item?.label}
                </div>
              )}
              activeRender={item => {
                const isAbove = item?.value === PriceAlertType.ABOVE
                return (
                  <div className="flex items-center gap-1.5" style={{ color: isAbove ? theme.primary : theme.red }}>
                    {isAbove ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                    <span className="text-sm font-medium">{item?.label}</span>
                  </div>
                )
              }}
            />

            <MiniLabel>
              <Trans>the price of</Trans>
            </MiniLabel>
            <StyledInputNumber value={formInput.threshold} onUserInput={val => onChangeInput('threshold', val)} />
          </FormControl>

          <TradePrice
            label={t`Note: The current price is `}
            price={executionPrice}
            className="w-fit italic text-text"
            icon={<RefreshButton shouldDisable={!executionPrice} callback={getRoute} size={16} skipFirst />}
          />
        </LeftColumn>

        <RightColumn>
          <Label>
            <Trans>Additional Options</Trans>
          </Label>
          <RowBetween>
            <MouseoverTooltip
              placement="top"
              text={t`Specify the amount of time that must pass before the alert can be fired again.`}
            >
              <MiniLabel style={{ borderBottom: `1px dotted ${theme.border}` }}>
                <Trans>Cooldown</Trans>
              </MiniLabel>
            </MouseoverTooltip>
            <StyledSelect
              value={cooldown}
              options={getCoolDownOptions()}
              onChange={setCooldown}
              arrowColor={theme.subText}
              menuStyle={{ height: 250, overflow: 'scroll', width: '100%' }}
              optionStyle={{ textTransform: 'capitalize' }}
              activeRender={item => (
                <div className="flex items-center gap-1.5 capitalize">
                  <Clock size={20} className="text-text" />
                  <span className="text-sm font-medium">{item?.label}</span>
                </div>
              )}
            />
          </RowBetween>
          <RowBetween>
            <MiniLabel>
              <Trans>Note</Trans>
            </MiniLabel>
            <InputNote onChangeInput={val => onChangeInput('note', val)} value={formInput.note} />
          </RowBetween>
          <Row className="gap-2">
            <CheckBox
              checked={disableAfterTrigger}
              id="disable-trigger"
              borderStyle
              className="h-[15px] w-[15px]"
              onChange={() => setDisableAfterTrigger(v => !v)}
            />
            <label className="text-sm text-text" htmlFor="disable-trigger">
              <Trans>Disable the alert after it triggers once</Trans>
            </label>
          </Row>
        </RightColumn>
      </Form>

      <ActionGroup>
        <ButtonSubmit onClick={onSubmitAlert} disabled={!isInputValid()}>
          {isMaxQuota && (
            <MouseoverTooltip text={`You have created the maximum number of alerts allowed.`}>
              <Info size={16} />
            </MouseoverTooltip>
          )}
          <Trans>Create Alert</Trans>
        </ButtonSubmit>
      </ActionGroup>
    </>
  )
}
