import { Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { AlertTriangle, Info } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import AutoSizer from 'react-virtualized-auto-sizer'

import Column from 'components/Column'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { CurrencyRow } from 'components/SearchModal/CurrencyList'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useNativeBalance } from 'state/wallet/hooks'
import { currencyId } from 'utils/currencyId'

const tokenItemStyle = { paddingLeft: 8, paddingRight: 8 }

const WRAPPER_CLASS =
  'w-full flex-1 grow overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1'

export default function MyAssets({
  tokens,
  loadingTokens,
  usdBalances,
  currencyBalances,
  hasNetworkIssue,
  hideBalance,
}: {
  tokens: Currency[]
  loadingTokens: boolean
  hasNetworkIssue: boolean
  usdBalances: { [address: string]: number }
  currencyBalances: { [address: string]: TokenAmount | undefined }
  hideBalance: boolean
}) {
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const [modalOpen, setModalOpen] = useState(false)
  const showModal = () => {
    setModalOpen(true)
    trackingHandler(TRACKING_EVENT_TYPE.WUI_IMPORT_TOKEN_CLICK)
    trackingHandler(TRACKING_EVENT_TYPE.WALLET_IMPORT_TOKENS_CLICKED, {
      wallet_address: account,
      visible_token_count: tokens.length,
      chain: NETWORKS_INFO[chainId]?.name,
    })
  }
  const hideModal = () => setModalOpen(false)
  const nativeBalance = useNativeBalance()
  const navigate = useNavigate()
  const qs = useParsedQueryString()
  const { chainId, account } = useActiveWeb3React()

  if (hasNetworkIssue)
    return (
      <div className={WRAPPER_CLASS}>
        <Column style={{ gap: '12px', alignItems: 'center', marginTop: '16px' }}>
          <AlertTriangle className="text-warning" />
          <span className="text-warning">Network is slow. Please try again later</span>
        </Column>
      </div>
    )

  if (loadingTokens) {
    return (
      <div className={WRAPPER_CLASS}>
        <Row gap="6px" justify="center" marginTop="16px">
          <Loader /> <span className="text-subText">Loading tokens...</span>
        </Row>
      </div>
    )
  }

  return (
    <div className={WRAPPER_CLASS}>
      <AutoSizer>
        {({ height, width }) => (
          <div style={{ height, width }}>
            {tokens.map(token => {
              const address = token.wrapped.address
              const currencyBalance = token.isNative ? nativeBalance : currencyBalances[address]
              const usdBalance =
                currencyBalance && usdBalances[address]
                  ? usdBalances[address] * parseFloat(currencyBalance.toExact())
                  : undefined
              return (
                <CurrencyRow
                  onSelect={() => {
                    trackingHandler(TRACKING_EVENT_TYPE.WALLET_TOKEN_CLICKED, {
                      token_symbol: token.symbol,
                      token_address: address,
                      token_balance: currencyBalance?.toExact(),
                      token_balance_usd: usdBalance,
                      chain: NETWORKS_INFO[chainId]?.name,
                      wallet_address: account,
                    })
                    navigate({
                      search: new URLSearchParams({ ...qs, inputCurrency: currencyId(token, chainId) }).toString(),
                    })
                  }}
                  isSelected={false}
                  key={address + token.symbol}
                  style={tokenItemStyle}
                  currency={token}
                  currencyBalance={currencyBalance as CurrencyAmount<Currency>}
                  hideBalance={hideBalance}
                  showFavoriteIcon={false}
                  usdBalance={usdBalance}
                  hoverColor={theme.bg3}
                />
              )
            })}
            <Column
              gap="6px"
              style={{
                alignItems: 'center',
                borderTop: tokens.length ? `1px solid ${theme.border}` : 'none',
                padding: '12px 0',
                marginTop: tokens.length ? 8 : 0,
                fontSize: 14,
              }}
            >
              <Info className="text-subText" />
              <span className="text-subText">
                <Trans>Don&apos;t see your tokens</Trans>
              </span>
              <span className="cursor-pointer text-primary" onClick={showModal}>
                <Trans>Import Tokens</Trans>
              </span>
            </Column>
          </div>
        )}
      </AutoSizer>
      <CurrencySearchModal
        title={t`Import Tokens`}
        tooltip={
          <span>
            <Trans>
              Find a token by searching for name, symbol or address.
              <br />
              You can select and import any token on KyberSwap.
            </Trans>
          </span>
        }
        isOpen={modalOpen}
        onDismiss={hideModal}
        onCurrencySelect={hideModal}
        showCommonBases
        onCurrencyImport={(token: Token) => {
          trackingHandler(TRACKING_EVENT_TYPE.WUI_IMPORT_TOKEN_BUTTON_CLICK, { token_name: token.symbol })
          trackingHandler(TRACKING_EVENT_TYPE.WALLET_TOKEN_IMPORTED, {
            token_symbol: token.symbol,
            token_address: token.address,
            chain: NETWORKS_INFO[chainId]?.name,
            wallet_address: account,
          })
        }}
      />
    </div>
  )
}
