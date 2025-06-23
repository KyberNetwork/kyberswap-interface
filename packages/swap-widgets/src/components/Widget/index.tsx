import { ReactNode, StrictMode, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { defaultTheme, Theme } from '../../theme'
import SettingIcon from '../../assets/setting.svg'
import WalletIcon from '../../assets/wallet.svg'
import DropdownIcon from '../../assets/dropdown.svg'
import SwitchIcon from '../../assets/switch.svg'
import SwapIcon from '../../assets/swap.svg'
import BackIcon from '../../assets/back1.svg'
import KyberSwapLogo from '../../assets/kyberswap.svg'
import AlertIcon from '../../assets/alert.svg'
import Expand from '../../assets/expand.svg'
import questionImg from '../../assets/question.svg?url'

import useTheme from '../../hooks/useTheme'

import {
  AccountBalance,
  BalanceRow,
  Input,
  InputRow,
  InputWrapper,
  MaxHalfBtn,
  MiddleRow,
  SelectTokenBtn,
  SettingBtn,
  SwitchBtn,
  Title,
  Wrapper,
  Button,
  Dots,
  Rate,
  MiddleLeft,
  Detail,
  DetailTitle,
  Divider,
  DetailRow,
  DetailLabel,
  DetailRight,
  ModalHeader,
  ModalTitle,
  ViewRouteTitle,
} from './styled'

import { NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS, SUPPORTED_NETWORKS, TokenInfo, ZIndex } from '../../constants'
import SelectCurrency from '../SelectCurrency'
import { Web3Provider, useActiveWeb3 } from '../../hooks/useWeb3Provider'
import useSwap from '../../hooks/useSwap'
import useTokenBalances from '../../hooks/useTokenBalances'
import useApproval, { APPROVAL_STATE } from '../../hooks/useApproval'
import Settings from '../Settings'
import { TokenListProvider, useTokens } from '../../hooks/useTokens'
import RefreshBtn from '../RefreshBtn'
import Confirmation from '../Confirmation'
import DexesSetting from '../DexesSetting'
import ImportModal from '../ImportModal'
import InfoHelper from '../InfoHelper'
import TradeRouting from '../TradeRouting'
import Slippage from '../Slippage'
import { formatUnits } from '@kyber/utils/crypto'
import Select from '../Select'

export const DialogWrapper = styled.div`
  background-color: ${({ theme }) => theme.dialog};
  border-radius: ${({ theme }) => theme.borderRadius};
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  padding: 1rem;
  overflow: hidden;
  z-index: ${ZIndex.DIALOG};
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @supports (overflow: clip) {
    overflow: clip;
  }

  transition: 0.25s ease-in-out;

  &.open {
    transform: translateX(0);
  }

  &.close {
    transform: translateX(100%);
  }
`
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
  }
`

const SelectTokenText = styled.span`
  font-size: 16px;
  width: max-content;
`

const PoweredBy = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  margin-top: 1rem;
`

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  a {
    color: ${({ theme }) => theme.subText};
    font-size: 12px;
    margin-top: 1rem;
    text-decoration: none;

    :hover {
      color: ${({ theme }) => theme.text};
    }
  }
`

enum ModalType {
  SETTING = 'setting',
  CURRENCY_IN = 'currency_in',
  CURRENCY_OUT = 'currency_out',
  REVIEW = 'review',
  DEXES_SETTING = 'dexes_setting',
  IMPORT_TOKEN = 'import_token',
  TRADE_ROUTE = 'trade_route',
}

export interface TxData {
  from: string
  to: string
  value: string
  data: string
  gasLimit: string
}

interface FeeSetting {
  chargeFeeBy: 'currency_in' | 'currency_out'
  feeReceiver: string
  // BPS: 10_000
  // 10 means 0.1%
  feeAmount: number
  isInBps: boolean
}

export interface WidgetProps {
  client: string
  enableRoute?: boolean
  tokenList?: TokenInfo[]
  theme?: Theme
  defaultTokenIn?: string
  defaultTokenOut?: string
  defaultSlippage?: number
  defaultAmountIn?: string
  feeSetting?: FeeSetting
  onSubmitTx: (data: TxData) => Promise<string>
  enableDexes?: string
  title?: string | ReactNode
  onSourceTokenChange?: (token: TokenInfo) => void
  onAmountInChange?: (amount: string) => void
  onDestinationTokenChange?: (token: TokenInfo) => void
  onError?: (e: any) => void
  showRate?: boolean
  showDetail?: boolean
  width?: number

  rpcUrl?: string
  chainId: number
  connectedAccount: {
    address?: string
    chainId: number
  }
  onSwitchChain?: () => void
}

enum AllowanceType {
  INFINITE = 'infinite',
  EXACT = 'exact',
}

const Widget = ({
  defaultTokenIn,
  defaultTokenOut,
  defaultSlippage,
  defaultAmountIn,
  feeSetting,
  client,
  enableRoute,
  enableDexes,
  title,
  onSourceTokenChange,
  onAmountInChange,
  onDestinationTokenChange,
  onError,
  showRate,
  showDetail,
  width,
  onSwitchChain,
}: {
  defaultTokenIn?: string
  defaultTokenOut?: string
  defaultAmountIn?: string
  feeSetting?: FeeSetting
  client: string
  enableRoute: boolean
  enableDexes?: string
  title?: string | ReactNode
  defaultSlippage?: number
  onSourceTokenChange?: (token: any) => void
  onAmountInChange?: (value: string) => void
  onDestinationTokenChange?: (token: any) => void
  onError?: (e: any) => void
  showRate?: boolean
  showDetail?: boolean
  width?: number
  onSwitchChain?: () => void
}) => {
  const { chainId, connectedAccount } = useActiveWeb3()
  const wrongNetwork = chainId !== connectedAccount.chainId

  const [showModal, setShowModal] = useState<ModalType | null>(null)
  const isUnsupported = !SUPPORTED_NETWORKS.includes(chainId.toString())

  const tokens = useTokens()
  const {
    loading,
    error,
    tokenIn,
    tokenOut,
    setTokenIn,
    setTokenOut,
    inputAmout,
    setInputAmount,
    trade: routeTrade,
    slippage,
    setSlippage,
    getRate,
    deadline,
    setDeadline,
    allDexes,
    excludedDexes,
    setExcludedDexes,
    setTrade,
    isWrap,
    isUnwrap,
  } = useSwap({
    defaultTokenIn,
    defaultTokenOut,
    defaultAmountIn,
    defaultSlippage,
    feeSetting,
    enableDexes,
    client,
  })

  const trade = isUnsupported ? null : routeTrade

  const [inverseRate, setInverseRate] = useState(false)

  const { balances, refetch } = useTokenBalances(tokens.map(item => item.address))

  const tokenInInfo =
    tokenIn === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : tokens.find(item => item.address.toLowerCase() === tokenIn.toLowerCase())

  const tokenOutInfo =
    tokenOut === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : tokens.find(item => item.address.toLowerCase() === tokenOut.toLowerCase())

  const amountOut =
    isWrap || isUnwrap
      ? inputAmout
      : trade?.routeSummary?.amountOut
      ? formatUnits(trade.routeSummary.amountOut, tokenOutInfo?.decimals).toString()
      : ''

  let minAmountOut = ''

  if (amountOut) {
    minAmountOut =
      isWrap || isUnwrap
        ? parseFloat((+amountOut).toPrecision(8)).toString()
        : (Number(amountOut) * (1 - slippage / 10_000)).toPrecision(8).toString()
  }

  const tokenInBalance = balances[tokenIn] || 0n
  const tokenOutBalance = balances[tokenOut] || 0n

  const tokenInWithUnit = formatUnits(tokenInBalance.toString(), tokenInInfo?.decimals || 18)
  const tokenOutWithUnit = formatUnits(tokenOutBalance.toString(), tokenOutInfo?.decimals || 18)

  const rate =
    isWrap || isUnwrap
      ? 1
      : trade?.routeSummary?.amountIn &&
        trade?.routeSummary?.amountOut &&
        parseFloat(formatUnits(trade.routeSummary.amountOut, tokenOutInfo?.decimals || 18)) / parseFloat(inputAmout)

  const formattedTokenInBalance = parseFloat(parseFloat(tokenInWithUnit).toPrecision(10))

  const formattedTokenOutBalance = parseFloat(parseFloat(tokenOutWithUnit).toPrecision(10))

  const theme = useTheme()

  const priceImpact = !trade?.routeSummary.amountOutUsd
    ? -1
    : ((+trade.routeSummary.amountInUsd - +trade.routeSummary.amountOutUsd) * 100) / +trade.routeSummary.amountInUsd

  const modalTitle = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return 'Settings'
      case ModalType.CURRENCY_IN:
        return 'Select a token'
      case ModalType.CURRENCY_OUT:
        return 'Select a token'
      case ModalType.DEXES_SETTING:
        return 'Liquidity Sources'
      case ModalType.IMPORT_TOKEN:
        return 'Import Token'
      case ModalType.TRADE_ROUTE:
        return 'Your Trade Route'

      default:
        return null
    }
  })()

  const [tokenToImport, setTokenToImport] = useState<TokenInfo | null>(null)
  const [importType, setImportType] = useState<'in' | 'out'>('in')

  const modalContent = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return (
          <Settings
            slippage={slippage}
            setSlippage={setSlippage}
            deadline={deadline}
            setDeadline={setDeadline}
            allDexes={allDexes}
            excludedDexes={excludedDexes}
            onShowSource={() => setShowModal(ModalType.DEXES_SETTING)}
          />
        )
      case ModalType.TRADE_ROUTE:
        if (enableRoute) return <TradeRouting trade={trade} currencyIn={tokenInInfo} currencyOut={tokenOutInfo} />
        return null
      case ModalType.CURRENCY_IN:
        return (
          <SelectCurrency
            selectedToken={tokenIn}
            onChange={token => {
              if (token.address === tokenOut) setTokenOut(tokenIn)
              setTokenIn(token.address)
              setShowModal(null)
              onSourceTokenChange?.(token)
            }}
            onImport={(token: TokenInfo) => {
              setTokenToImport(token)
              setShowModal(ModalType.IMPORT_TOKEN)
              setImportType('in')
            }}
          />
        )
      case ModalType.CURRENCY_OUT:
        return (
          <SelectCurrency
            selectedToken={tokenOut}
            onChange={token => {
              if (token.address === tokenIn) setTokenIn(tokenOut)
              setTokenOut(token.address)
              setShowModal(null)
              onDestinationTokenChange?.(token)
            }}
            onImport={(token: TokenInfo) => {
              setTokenToImport(token)
              setShowModal(ModalType.IMPORT_TOKEN)
              setImportType('out')
            }}
          />
        )
      case ModalType.REVIEW:
        if (rate && tokenInInfo && trade && tokenOutInfo)
          return (
            <Confirmation
              trade={trade}
              tokenInInfo={tokenInInfo}
              amountIn={inputAmout}
              tokenOutInfo={tokenOutInfo}
              amountOut={amountOut}
              rate={rate}
              priceImpact={priceImpact}
              slippage={slippage}
              deadline={deadline}
              client={client}
              onClose={() => {
                setShowModal(null)
                refetch()
              }}
              onError={onError}
              showDetail={showDetail}
            />
          )
        return null
      case ModalType.DEXES_SETTING:
        return <DexesSetting allDexes={allDexes} excludedDexes={excludedDexes} setExcludedDexes={setExcludedDexes} />

      case ModalType.IMPORT_TOKEN:
        if (tokenToImport)
          return (
            <ImportModal
              token={tokenToImport}
              onImport={() => {
                if (importType === 'in') {
                  setTokenIn(tokenToImport.address)
                  setShowModal(null)
                } else {
                  setTokenOut(tokenToImport.address)
                  setShowModal(null)
                }
              }}
            />
          )
        return null
      default:
        return null
    }
  })()

  const {
    loading: checkingAllowance,
    approve,
    approvalState,
  } = useApproval(trade?.routeSummary?.amountIn || '0', tokenIn, trade?.routerAddress || '')

  const [approvalType, setApprovalType] = useState(AllowanceType.INFINITE)

  return (
    <Wrapper width={width}>
      <DialogWrapper className={showModal ? 'open' : 'close'}>
        {showModal !== ModalType.REVIEW && (
          <ModalHeader>
            <ModalTitle
              onClick={() =>
                showModal === ModalType.DEXES_SETTING ? setShowModal(ModalType.SETTING) : setShowModal(null)
              }
              role="button"
            >
              <BackIcon style={{ color: theme.subText }} />
              {modalTitle}
            </ModalTitle>
          </ModalHeader>
        )}
        <ContentWrapper>{modalContent}</ContentWrapper>
        <Footer>
          <PoweredBy style={{ marginTop: '0' }}>
            Powered By
            <KyberSwapLogo />
          </PoweredBy>
          <a
            href="https://discord.com/channels/608934314960224276/1192426056183972010"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support
          </a>
        </Footer>
      </DialogWrapper>
      <Title>
        {title || 'Swap'}
        <SettingBtn onClick={() => setShowModal(ModalType.SETTING)}>
          <SettingIcon />
        </SettingBtn>
      </Title>
      <InputWrapper>
        <BalanceRow>
          <div>
            <MaxHalfBtn onClick={() => setInputAmount(tokenInWithUnit)}>Max</MaxHalfBtn>
            {/* <MaxHalfBtn>Half</MaxHalfBtn> */}
          </div>
          <AccountBalance>
            <WalletIcon />
            {formattedTokenInBalance}
          </AccountBalance>
        </BalanceRow>

        <InputRow>
          <Input
            value={inputAmout}
            onChange={e => {
              const value = e.target.value.replace(/,/g, '.')
              const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
              if (value === '' || inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
                setInputAmount(value)
              }
              onAmountInChange?.(value)
            }}
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0.0"
            minLength={1}
            maxLength={79}
            spellCheck="false"
          />

          {!!trade?.routeSummary?.amountInUsd && (
            <span
              style={{
                fontSize: '12px',
                marginRight: '4px',
                color: theme.subText,
              }}
            >
              ~
              {(+trade.routeSummary.amountInUsd).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          )}

          <SelectTokenBtn onClick={() => !isUnsupported && setShowModal(ModalType.CURRENCY_IN)}>
            {tokenInInfo ? (
              <>
                <img
                  width="20"
                  height="20"
                  alt="tokenIn"
                  src={tokenInInfo?.logoURI}
                  style={{ borderRadius: '50%' }}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null // prevents looping
                    currentTarget.src = questionImg
                  }}
                />
                <div style={{ marginLeft: '0.375rem' }}>{tokenInInfo?.symbol}</div>
              </>
            ) : (
              <SelectTokenText>Select a token</SelectTokenText>
            )}
            <DropdownIcon />
          </SelectTokenBtn>
        </InputRow>
      </InputWrapper>

      {showRate && (
        <MiddleRow>
          <MiddleLeft>
            <RefreshBtn
              loading={loading}
              onRefresh={() => {
                getRate()
              }}
              trade={trade}
            />
            <Rate>
              {(() => {
                if (!rate) return '--'
                return !inverseRate
                  ? `1 ${tokenInInfo?.symbol} = ${+rate.toPrecision(10)} ${tokenOutInfo?.symbol}`
                  : `1 ${tokenOutInfo?.symbol} = ${+(1 / rate).toPrecision(10)} ${tokenInInfo?.symbol}`
              })()}
            </Rate>

            {!!rate && (
              <SettingBtn onClick={() => setInverseRate(prev => !prev)}>
                <SwapIcon />
              </SettingBtn>
            )}
          </MiddleLeft>

          <SwitchBtn
            onClick={() => {
              setTrade(null)
              setTokenIn(tokenOut)
              setTokenOut(tokenIn)
            }}
          >
            <SwitchIcon />
          </SwitchBtn>
        </MiddleRow>
      )}

      <InputWrapper>
        <BalanceRow>
          <div />
          <AccountBalance>
            <WalletIcon />
            {formattedTokenOutBalance}
          </AccountBalance>
        </BalanceRow>

        <InputRow>
          <Input disabled value={isWrap || isUnwrap ? +amountOut : (+amountOut).toPrecision(8)} />

          {!!trade?.routeSummary?.amountOutUsd && (
            <span
              style={{
                fontSize: '12px',
                marginRight: '4px',
                color: theme.subText,
              }}
            >
              ~
              {(+trade.routeSummary.amountOutUsd).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          )}
          <SelectTokenBtn onClick={() => !isUnsupported && setShowModal(ModalType.CURRENCY_OUT)}>
            {tokenOutInfo ? (
              <>
                <img
                  width="20"
                  height="20"
                  alt="tokenOut"
                  src={tokenOutInfo?.logoURI}
                  style={{ borderRadius: '50%' }}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null // prevents looping
                    currentTarget.src = questionImg
                  }}
                />
                <div style={{ marginLeft: '0.375rem' }}>{tokenOutInfo?.symbol}</div>
              </>
            ) : (
              <SelectTokenText>Select a token</SelectTokenText>
            )}
            <DropdownIcon />
          </SelectTokenBtn>
        </InputRow>
      </InputWrapper>

      <Slippage slippage={slippage} setSlippage={setSlippage} />

      {showDetail && (
        <Detail style={{ marginTop: '1rem' }}>
          <Row>
            <DetailTitle>More information</DetailTitle>
            {enableRoute && !(isWrap || isUnwrap) && (
              <ViewRouteTitle onClick={() => setShowModal(ModalType.TRADE_ROUTE)}>
                View Routes <Expand style={{ width: 12, height: 12 }} />
              </ViewRouteTitle>
            )}
          </Row>
          <Divider />
          <DetailRow>
            <DetailLabel>
              Minimum Received
              <InfoHelper text={`Minimum amount you will receive or your transaction will revert`} />
            </DetailLabel>
            <DetailRight>{minAmountOut ? `${minAmountOut} ${tokenOutInfo?.symbol}` : '--'}</DetailRight>
          </DetailRow>

          <DetailRow>
            <DetailLabel>
              Gas Fee <InfoHelper text="Estimated network fee for your transaction" />
            </DetailLabel>
            <DetailRight>
              {trade?.routeSummary?.gasUsd ? '$' + (+trade.routeSummary.gasUsd).toPrecision(4) : '--'}
            </DetailRight>
          </DetailRow>

          <DetailRow>
            <DetailLabel>
              Price Impact
              <InfoHelper text="Estimated change in price due to the size of your transaction" />
            </DetailLabel>
            <DetailRight
              style={{
                color: priceImpact > 15 ? theme.error : priceImpact > 5 ? theme.warning : theme.text,
              }}
            >
              {priceImpact === -1 ? '--' : priceImpact > 0.01 ? priceImpact.toFixed(3) + '%' : '< 0.01%'}
            </DetailRight>
          </DetailRow>
        </Detail>
      )}

      <Button
        disabled={!!error || loading || checkingAllowance || approvalState === APPROVAL_STATE.PENDING || isUnsupported}
        onClick={async () => {
          if (wrongNetwork && onSwitchChain) {
            onSwitchChain()
            return
          }

          if (approvalState === APPROVAL_STATE.NOT_APPROVED && !isWrap && !isUnwrap) {
            approve(approvalType === AllowanceType.INFINITE ? undefined : BigInt(trade?.routeSummary?.amountIn || '0'))
          } else {
            setShowModal(ModalType.REVIEW)
          }
        }}
      >
        {isUnsupported ? (
          <PoweredBy style={{ fontSize: '16px', marginTop: '0' }}>
            <AlertIcon style={{ width: '24px', height: '24px' }} />
            Unsupported network
          </PoweredBy>
        ) : loading ? (
          <Dots>Calculate best route</Dots>
        ) : error ? (
          error
        ) : wrongNetwork ? (
          onSwitchChain ? (
            'Switch Network'
          ) : (
            'Wrong Network'
          )
        ) : isWrap ? (
          'Wrap'
        ) : isUnwrap ? (
          'Unwrap'
        ) : checkingAllowance ? (
          <Dots>Checking Allowance</Dots>
        ) : approvalState === APPROVAL_STATE.NOT_APPROVED ? (
          'Approve'
        ) : approvalState === APPROVAL_STATE.PENDING ? (
          <Dots>Approving</Dots>
        ) : (
          'Swap'
        )}
      </Button>
      {approvalState === APPROVAL_STATE.NOT_APPROVED && !isWrap && !isUnwrap && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div />
          <Select
            value={approvalType}
            style={{ marginTop: '1rem', fontSize: '14px', padding: 0, background: 'transparent' }}
            optionStyle={{ fontSize: '14px' }}
            options={[
              {
                value: AllowanceType.INFINITE,
                label: 'Infinite Allowance',
                onSelect: () => setApprovalType(AllowanceType.INFINITE),
              },
              {
                value: AllowanceType.EXACT,
                label: 'Exact Allowance',
                onSelect: () => setApprovalType(AllowanceType.EXACT),
              },
            ]}
            activeRender={selected =>
              selected ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {selected.label}{' '}
                  <InfoHelper
                    text={
                      selected.value === AllowanceType.EXACT
                        ? 'You wish to give KyberSwap permission to use the exact allowance token amount as the amount in for this transaction, Subsequent transactions will require your permission again.'
                        : 'You wish to give KyberSwap permission to use the selected token for transactions without any limit. You do not need to give permission again unless revoke.'
                    }
                  />
                </div>
              ) : null
            }
          />
        </div>
      )}

      <Footer>
        <PoweredBy>
          Powered By
          <KyberSwapLogo />
        </PoweredBy>

        <a
          href="https://discord.com/channels/608934314960224276/1192426056183972010"
          target="_blank"
          rel="noopener noreferrer"
        >
          Support
        </a>
      </Footer>
    </Wrapper>
  )
}

export default function SwapWidget({
  rpcUrl,
  tokenList,
  theme,
  defaultTokenIn,
  defaultTokenOut,
  defaultAmountIn,
  defaultSlippage,
  feeSetting,
  client,
  onSubmitTx,
  enableRoute = true,
  enableDexes,
  title,
  onSourceTokenChange,
  onAmountInChange,
  onDestinationTokenChange,
  onError,
  showRate = true,
  showDetail = true,
  width,
  chainId,
  connectedAccount,
  onSwitchChain,
}: WidgetProps) {
  return (
    <StrictMode>
      <ThemeProvider theme={theme || defaultTheme}>
        <Web3Provider chainId={chainId} connectedAccount={connectedAccount} rpcUrl={rpcUrl} onSubmitTx={onSubmitTx}>
          <TokenListProvider tokenList={tokenList}>
            <Widget
              defaultTokenIn={defaultTokenIn}
              defaultAmountIn={defaultAmountIn}
              defaultTokenOut={defaultTokenOut}
              defaultSlippage={defaultSlippage}
              feeSetting={feeSetting}
              client={client}
              onSourceTokenChange={onSourceTokenChange}
              onAmountInChange={onAmountInChange}
              onDestinationTokenChange={onDestinationTokenChange}
              onError={onError}
              enableRoute={enableRoute}
              enableDexes={enableDexes}
              title={title}
              showRate={showRate}
              showDetail={showDetail}
              width={width}
              onSwitchChain={onSwitchChain}
            />
          </TokenListProvider>
        </Web3Provider>
      </ThemeProvider>
    </StrictMode>
  )
}
