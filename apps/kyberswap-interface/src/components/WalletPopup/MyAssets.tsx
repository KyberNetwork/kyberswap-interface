import { Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Plural, Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { AlertTriangle, Info } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import AutoSizer from 'react-virtualized-auto-sizer'

import Column from 'components/Column'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import TokenSelectorModal from 'components/TokenSelectorModal'
import { ImportTokenView } from 'components/TokenSelectorModal/ImportTokenView'
import { TokenRow } from 'components/TokenSelectorModal/TokenList'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useBalanceWait } from 'hooks/useBalanceWait'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useNativeBalance } from 'state/wallet/hooks'
import { useEnsureTokenMetadata } from 'state/walletInventory/hooks'
import { cn } from 'utils/cn'
import { currencyId } from 'utils/currencyId'

const tokenItemStyle = { paddingLeft: 8, paddingRight: 8 }

// Hidden rows are not virtualized (the list is plain flow inside a scrolling wrapper), and a spam-heavy
// wallet can hold hundreds of them; mounting those in pages keeps the popup instant.
const HIDDEN_PAGE_SIZE = 50

const WRAPPER_CLASS =
  'w-full flex-1 grow overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1'

export default function MyAssets({
  tokens,
  loadingTokens,
  usdBalances,
  currencyBalances,
  hasNetworkIssue,
  hideBalance,
  hiddenTokens,
  impersonators,
}: {
  tokens: Currency[]
  loadingTokens: boolean
  hasNetworkIssue: boolean
  usdBalances: { [address: string]: number }
  currencyBalances: { [address: string]: TokenAmount | undefined }
  hideBalance: boolean
  /** Held tokens that are neither whitelisted nor imported; listed after the vetted ones, not totalled. */
  hiddenTokens: WrappedTokenInfo[]
  /** Hidden tokens whose symbol belongs to a whitelisted token at another address. */
  impersonators: Set<string>
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
  // Unvetted holdings follow the vetted list as dimmed rows; clicking one imports it. Importing goes
  // through the same warning screen the token selector uses, and the import itself moves the token
  // into the vetted list above.
  const [hiddenShown, setHiddenShown] = useState(HIDDEN_PAGE_SIZE)
  const { chainId, account } = useActiveWeb3React()
  // Catalog names and logos are fetched for the hidden rows on screen, not for a spam-heavy wallet's
  // whole hidden list.
  const visibleHidden = useMemo(() => hiddenTokens.slice(0, hiddenShown), [hiddenTokens, hiddenShown])
  useEnsureTokenMetadata(chainId, visibleHidden)
  const [importTarget, setImportTarget] = useState<Token | null>(null)
  const closeImport = () => setImportTarget(null)
  const nativeBalance = useNativeBalance()
  // The native row is displayed off the live per-block read; bound the wait so a read that never
  // lands leaves the row reading as unknown rather than on a loader for good.
  const waitingForNative = useBalanceWait(nativeBalance, !!account)
  const navigate = useNavigate()
  const qs = useParsedQueryString()

  if (hasNetworkIssue)
    return (
      <div className={WRAPPER_CLASS}>
        <Column className="mt-4 items-center gap-3">
          <AlertTriangle className="text-warning" />
          <span className="text-warning">Network is slow. Please try again later</span>
        </Column>
      </div>
    )

  if (loadingTokens) {
    return (
      <div className={WRAPPER_CLASS}>
        <Row className="mt-4 justify-center gap-1.5">
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
                <TokenRow
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
                  // The native row is listed off the inventory but displayed off the live per-block
                  // read; until that first read lands it shows a skeleton, not a false zero.
                  showLoading={token.isNative && !nativeBalance && waitingForNative}
                  balanceUnknown={token.isNative}
                  showFavoriteIcon={false}
                  usdBalance={usdBalance}
                  hoverColor={theme.bg3}
                  // An imported token is vetted by the user, not by the whitelist — one squatting on
                  // a verified symbol still deserves its warning here, not only in the hidden section.
                  impersonator={!token.isNative && impersonators.has(address)}
                />
              )
            })}
            {visibleHidden.map(token => (
              <TokenRow
                key={token.address}
                isSelected={false}
                style={tokenItemStyle}
                currency={token}
                currencyBalance={currencyBalances[token.address]}
                usdBalance={
                  currencyBalances[token.address] && usdBalances[token.address]
                    ? usdBalances[token.address] * parseFloat(currencyBalances[token.address]?.toExact() ?? '0')
                    : undefined
                }
                hideBalance={hideBalance}
                showFavoriteIcon={false}
                showLoading
                hoverColor={theme.bg3}
                importOnClick
                onImportToken={setImportTarget}
                impersonator={impersonators.has(token.address)}
              />
            ))}
            {hiddenTokens.length > hiddenShown && (
              <button
                type="button"
                onClick={() => setHiddenShown(count => count + HIDDEN_PAGE_SIZE)}
                data-testid="wallet-hidden-tokens-more"
                className="mx-auto mt-1 flex cursor-pointer text-xs font-medium text-primary hover:brightness-110"
              >
                <Plural value={hiddenTokens.length - hiddenShown} one="Show # more" other="Show # more" />
              </button>
            )}
            <Column
              className={cn(
                'items-center gap-1.5 py-3 text-sm',
                tokens.length || hiddenTokens.length ? 'mt-2 border-t border-border' : 'mt-0',
              )}
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
      {importTarget && (
        <Modal isOpen onDismiss={closeImport} maxWidth="480px" bgColor="var(--ks-background)">
          <ImportTokenView
            tokens={[importTarget]}
            onBack={closeImport}
            onDismiss={closeImport}
            onCurrencySelect={() => {
              trackingHandler(TRACKING_EVENT_TYPE.WALLET_TOKEN_IMPORTED, {
                token_symbol: importTarget.symbol,
                token_address: importTarget.address,
                chain: NETWORKS_INFO[chainId]?.name,
                wallet_address: account,
              })
              closeImport()
            }}
          />
        </Modal>
      )}
      <TokenSelectorModal
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
        showPinnedTokens
        showDiscoveryTabs={false}
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
