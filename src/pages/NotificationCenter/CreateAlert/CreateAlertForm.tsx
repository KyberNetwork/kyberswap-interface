import { ChainId, Currency, getChainType } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useCreatePriceAlertMutation } from 'services/priceAlert'
import { parseGetRouteResponse } from 'services/route/utils'
import { CSSProperties } from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import CheckBox from 'components/CheckBox'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Clock } from 'components/Icons'
import { NetworkLogo } from 'components/Logo'
import Row, { RowBetween } from 'components/Row'
import RefreshButton from 'components/SwapForm/RefreshButton'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import { MouseoverTooltip } from 'components/Tooltip'
import TradePrice from 'components/swapv2/TradePrice'
import { ETHER_ADDRESS, ETHER_ADDRESS_SOLANA } from 'constants/index'
import { isEVM as isEvmChain } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
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
  CreatePriceAlertPayload,
  DEFAULT_ALERT_COOLDOWN,
  NETWORK_OPTIONS,
  PriceAlertStat,
  PriceAlertType,
  TYPE_OPTIONS,
} from 'pages/NotificationCenter/const'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'

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
  const { account, chainId } = useActiveWeb3React()
  const [createAlert] = useCreatePriceAlertMutation()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()
  const [selectedChain, setSelectedChain] = useState(chainId)

  const { currencyIn, currencyOut, onChangeCurrencyIn, onChangeCurrencyOut } = useCurrencyHandler(selectedChain)

  const [formInput, setFormInput] = useState<{ tokenInAmount: string; threshold: string; note: string }>(defaultInput)
  const [disableAfterTrigger, setDisableAfterTrigger] = useState(false)
  const [cooldown, setCooldown] = useState(DEFAULT_ALERT_COOLDOWN)
  const [alertType, setAlertType] = useState<PriceAlertType>(PriceAlertType.ABOVE)

  const { maxActiveAlerts, totalActiveAlerts, totalAlerts, maxAlerts } = priceAlertStat

  const parsedAmount = useMemo(
    () => tryParseAmount(formInput.tokenInAmount, currencyIn),
    [formInput.tokenInAmount, currencyIn],
  )
  const { fetcher: getRoute, result } = useGetRoute({
    currencyIn,
    currencyOut,
    parsedAmount,
    isSaveGas: false,
    feeConfig: undefined,
    customChain: selectedChain,
  })

  useEffect(() => {
    getRoute()
  }, [getRoute])

  const executionPrice = useMemo(() => {
    if (!result?.data?.data || result.error) {
      return undefined
    }
    return parseGetRouteResponse(result.data.data, currencyIn, currencyOut)?.routeSummary?.executionPrice
  }, [currencyIn, currencyOut, result])

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
    setCooldown(DEFAULT_ALERT_COOLDOWN)
    setAlertType(PriceAlertType.ABOVE)
    setDisableAfterTrigger(false)
  }

  const isMaxQuota = totalAlerts >= maxAlerts

  const isInputValid = () => {
    const fillAllInput = Boolean(
      account && currencyIn && currencyOut && formInput.tokenInAmount && formInput.threshold && !isMaxQuota,
    )
    if (!fillAllInput) return false
    if (!parsedAmount) return false
    return true
  }

  const getTokenAddress = (currency: Currency) =>
    currency.isNative
      ? isEvmChain(selectedChain)
        ? ETHER_ADDRESS
        : ETHER_ADDRESS_SOLANA
      : currency?.wrapped.address ?? ''

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
      const { data, error }: any = await createAlert(alert)
      if (error || typeof data?.data?.id !== 'number') throw error
      showModalConfirm({
        alert: {
          ...alert,
          id: data.data.id as number,
        },
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
              menuStyle={{ height: 250, overflow: 'scroll', width: '100%' }}
              optionStyle={{ padding: 0 }}
              optionRender={item => {
                const isDiffChainType = getChainType(chainId) !== getChainType(item?.value as ChainId)
                return (
                  <Text
                    onClick={
                      isDiffChainType
                        ? e => {
                            e.preventDefault()
                            e.stopPropagation()
                          }
                        : undefined
                    }
                    style={{
                      padding: '10px 18px',
                      cursor: isDiffChainType ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {item?.label}
                  </Text>
                )
              }}
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
              menuStyle={{ width: '100%' }}
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
            style={{ width: 'fit-content', fontStyle: 'italic' }}
            label={t`Note: The current price is `}
            price={executionPrice}
            color={theme.text}
            icon={<RefreshButton shouldDisable={!executionPrice} callback={getRoute} size={16} />}
          />
        </LeftColumn>

        <RightColumn>
          <Label>
            <Trans>Additional Options</Trans>
          </Label>
          <RowBetween>
            <MouseoverTooltip
              placement="top"
              text={t`To specify the amount of time that must pass before the alert can be fire again`}
            >
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
              contentEditable
              placeholder={t`Add a note`}
              onPaste={e => e.preventDefault()}
              onKeyDown={e => {
                const { innerHTML = '' } = e.target as HTMLSpanElement
                const key = e.keyCode || e.charCode
                if (innerHTML.length >= 32 && key !== 8) {
                  e.preventDefault()
                }
              }}
              onKeyUp={e => onChangeInput('note', (e.target as HTMLSpanElement).innerHTML)}
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
              {isMaxQuota && (
                <MouseoverTooltip text={`You have created the maximum number of alerts allowed`}>
                  <Info size={16} />
                </MouseoverTooltip>
              )}
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
